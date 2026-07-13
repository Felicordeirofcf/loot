from flask import Flask, request, jsonify
from flask_cors import CORS
import psycopg2
from psycopg2.extras import RealDictCursor
import re
from datetime import datetime
import os
import traceback

app = Flask(__name__)
CORS(app)

def get_db_connection():
    # Pega a URL que você cadastrou lá na Vercel
    db_url = os.environ.get('DATABASE_URL')
    
    if not db_url:
        raise ValueError("A DATABASE_URL não foi encontrada nas variáveis de ambiente!")
    
    # O Supabase exige SSL quando acessado pela nuvem (Vercel)
    if "?" not in db_url:
        db_url += "?sslmode=require"
    elif "sslmode" not in db_url:
        db_url += "&sslmode=require"
        
    conn = psycopg2.connect(db_url)
    return conn

def init_db():
    conn = get_db_connection()
    cursor = conn.cursor()
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

@app.route('/api/hunts', methods=['GET', 'POST'])
def handle_hunts():
    try:
        # Garante que a tabela existe ANTES de qualquer requisição
        init_db()
        
        if request.method == 'POST':
            data = request.json
            raw_log = data.get('log', '')
            tc_price = int(data.get('tc_price', 40000))
            
            balance_match = re.search(r"Balance:\s*([-\d,]+)", raw_log)
            balance = int(balance_match.group(1).replace(",", "")) if balance_match else 0
            
            session_match = re.search(r"Session:\s*(\d{2}):(\d{2})h", raw_log)
            session_time = f"{session_match.group(1)}:{session_match.group(2)}" if session_match else "00:00"
            
            date_match = re.search(r"From (\d{4}-\d{2}-\d{2})", raw_log)
            session_date = date_match.group(1) if date_match else datetime.today().strftime('%Y-%m-%d')
            
            tc_farmed = balance / tc_price
            brl_value = tc_farmed * (51 / 250)
            
            conn = get_db_connection()
            cursor = conn.cursor()
            cursor.execute('''
                INSERT INTO hunts (session_date, session_time, balance, tc_price, tc_farmed, brl_value)
                VALUES (%s, %s, %s, %s, %s, %s)
            ''', (session_date, session_time, balance, tc_price, tc_farmed, brl_value))
            conn.commit()
            cursor.close()
            conn.close()
                
            return jsonify({"status": "success", "message": "Hunt registrada!"}), 201
            
        elif request.method == 'GET':
            conn = get_db_connection()
            cursor = conn.cursor(cursor_factory=RealDictCursor)
            cursor.execute('SELECT * FROM hunts ORDER BY id DESC')
            rows = cursor.fetchall()
            cursor.close()
            conn.close()
            
            # Converte os resultados pra dicionário puro pro Flask não bugar
            return jsonify([dict(row) for row in rows])

    except Exception as e:
        # Se quebrar, joga o erro na tela para sabermos exatamente o que foi!
        error_msg = traceback.format_exc()
        return jsonify({
            "status": "error", 
            "message": str(e),
            "detalhes": error_msg
        }), 500

@app.route('/api/hunts/<int:hunt_id>', methods=['DELETE'])
def delete_hunt(hunt_id):
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute('DELETE FROM hunts WHERE id = %s', (hunt_id,))
        conn.commit()
        cursor.close()
        conn.close()
        return jsonify({"status": "success"}), 200
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500

if __name__ == '__main__':
    app.run(debug=True, port=5000)