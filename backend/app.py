from flask import Flask, request, jsonify
from flask_cors import CORS
import psycopg2
from psycopg2.extras import RealDictCursor
import re
from datetime import datetime
import os

app = Flask(__name__)
CORS(app)

# O Vercel vai injetar a URL do Supabase aqui
DATABASE_URL = os.environ.get('DATABASE_URL', 'sua_url_do_supabase_para_teste_local_se_quiser')

def get_db_connection():
    conn = psycopg2.connect(DATABASE_URL)
    return conn

def init_db():
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        # No Postgres, AUTOINCREMENT vira SERIAL
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS hunts (
                id SERIAL PRIMARY KEY,
                session_date TEXT,
                session_time TEXT,
                balance INTEGER,
                tc_price INTEGER,
                tc_farmed REAL,
                brl_value REAL
            )
        ''')
        conn.commit()
        cursor.close()
        conn.close()
    except Exception as e:
        print("Erro ao inicializar o banco:", e)

def parse_tibia_log(raw_text):
    balance_match = re.search(r"Balance:\s*([-\d,]+)", raw_text)
    balance = int(balance_match.group(1).replace(",", "")) if balance_match else 0
    
    session_match = re.search(r"Session:\s*(\d{2}):(\d{2})h", raw_text)
    session_time = f"{session_match.group(1)}:{session_match.group(2)}" if session_match else "00:00"
    
    date_match = re.search(r"From (\d{4}-\d{2}-\d{2})", raw_text)
    session_date = date_match.group(1) if date_match else datetime.today().strftime('%Y-%m-%d')
    
    return {"balance": balance, "session_time": session_time, "session_date": session_date}

@app.route('/api/hunts', methods=['GET', 'POST'])
def handle_hunts():
    if request.method == 'POST':
        data = request.json
        raw_log = data.get('log', '')
        tc_price = int(data.get('tc_price', 40000))
        
        parsed = parse_tibia_log(raw_log)
        balance = parsed['balance']
        session_time = parsed['session_time']
        session_date = parsed['session_date']
        
        tc_farmed = balance / tc_price
        brl_value = tc_farmed * (51 / 250)
        
        conn = get_db_connection()
        cursor = conn.cursor()
        # No Postgres usamos %s ao invés de ?
        cursor.execute('''
            INSERT INTO hunts (session_date, session_time, balance, tc_price, tc_farmed, brl_value)
            VALUES (%s, %s, %s, %s, %s, %s)
        ''', (session_date, session_time, balance, tc_price, tc_farmed, brl_value))
        conn.commit()
        cursor.close()
        conn.close()
            
        return jsonify({"status": "success", "message": "Hunt registrada com sucesso!"}), 201
        
    elif request.method == 'GET':
        conn = get_db_connection()
        cursor = conn.cursor(cursor_factory=RealDictCursor)
        cursor.execute('SELECT * FROM hunts ORDER BY id DESC')
        rows = cursor.fetchall()
        cursor.close()
        conn.close()
        
        # O RealDictCursor já retorna os dados como dicionário
        return jsonify(rows)

@app.route('/api/hunts/<int:hunt_id>', methods=['DELETE'])
def delete_hunt(hunt_id):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute('DELETE FROM hunts WHERE id = %s', (hunt_id,))
    conn.commit()
    cursor.close()
    conn.close()
    return jsonify({"status": "success", "message": "Hunt excluída!"}), 200

# Inicializa as tabelas antes do primeiro request no Vercel
init_db()

if __name__ == '__main__':
    app.run(debug=True, port=5000)