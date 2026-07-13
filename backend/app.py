from flask import Flask, request, jsonify
from flask_cors import CORS
import sqlite3
import re
from datetime import datetime

app = Flask(__name__)
CORS(app)

DB_NAME = "hunts.db"

def init_db():
    with sqlite3.connect(DB_NAME) as conn:
        cursor = conn.cursor()
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS hunts (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                session_date TEXT,
                session_time TEXT,
                balance INTEGER,
                tc_price INTEGER,
                tc_farmed REAL,
                brl_value REAL
            )
        ''')
        conn.commit()

def parse_tibia_log(raw_text):
    # Pega o lucro (balance)
    balance_match = re.search(r"Balance:\s*([-\d,]+)", raw_text)
    balance = int(balance_match.group(1).replace(",", "")) if balance_match else 0
    
    # Pega o tempo da sessão
    session_match = re.search(r"Session:\s*(\d{2}):(\d{2})h", raw_text)
    session_time = f"{session_match.group(1)}:{session_match.group(2)}" if session_match else "00:00"
    
    # Pega a data exata do log (ex: From 2026-07-13)
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
        
        with sqlite3.connect(DB_NAME) as conn:
            cursor = conn.cursor()
            cursor.execute('''
                INSERT INTO hunts (session_date, session_time, balance, tc_price, tc_farmed, brl_value)
                VALUES (?, ?, ?, ?, ?, ?)
            ''', (session_date, session_time, balance, tc_price, tc_farmed, brl_value))
            conn.commit()
            
        return jsonify({"status": "success", "message": "Hunt registrada com sucesso!"}), 201
        
    elif request.method == 'GET':
        with sqlite3.connect(DB_NAME) as conn:
            cursor = conn.cursor()
            cursor.execute('SELECT * FROM hunts ORDER BY id DESC')
            rows = cursor.fetchall()
            hunts = []
            for row in rows:
                hunts.append({
                    "id": row[0], "session_date": row[1], "session_time": row[2],
                    "balance": row[3], "tc_price": row[4], "tc_farmed": row[5],
                    "brl_value": row[6]
                })
        return jsonify(hunts)

# Rota para deletar hunts
@app.route('/api/hunts/<int:hunt_id>', methods=['DELETE'])
def delete_hunt(hunt_id):
    with sqlite3.connect(DB_NAME) as conn:
        cursor = conn.cursor()
        cursor.execute('DELETE FROM hunts WHERE id = ?', (hunt_id,))
        conn.commit()
    return jsonify({"status": "success", "message": "Hunt excluída!"}), 200

if __name__ == '__main__':
    init_db()
    app.run(debug=True, port=5000)