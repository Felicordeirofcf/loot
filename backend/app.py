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
    db_url = os.environ.get('DATABASE_URL')
    if not db_url:
        raise ValueError("A DATABASE_URL não foi encontrada nas variáveis de ambiente!")
    
    # Adiciona o sslmode obrigatório para conexão segura
    if "?" not in db_url:
        db_url += "?sslmode=require"
    elif "sslmode" not in db_url:
        db_url += "&sslmode=require"
        
    return psycopg2.connect(db_url)

@app.route('/api/hunts', methods=['GET', 'POST'])
def handle_hunts():
    try:
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
                
            return jsonify({"status": "success", "message": "Hunt registrada com sucesso!"}), 201
            
        elif request.method == 'GET':
            conn = get_db_connection()
            cursor = conn.cursor(cursor_factory=RealDictCursor)
            cursor.execute('SELECT * FROM hunts ORDER BY id DESC')
            rows = cursor.fetchall()
            cursor.close()
            conn.close()
            
            return jsonify([dict(row) for row in rows])

    except Exception as e:
        return jsonify({
            "status": "error", 
            "message": str(e),
            "detalhes": traceback.format_exc()
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