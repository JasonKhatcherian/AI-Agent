import os
import sqlite3
import json
from dotenv import load_dotenv
from google import genai
from google.genai import types
from flask import Flask, request, jsonify,send_from_directory
from flask_cors import CORS
from functions.call_function import available_functions, call_function
from prompts import system_prompt
app = Flask(__name__, static_folder='frontend')
CORS(app)

load_dotenv()
api_key = os.environ.get("GEMINI_API_KEY")
if not api_key:
    raise ValueError("API key not found!")
client = genai.Client(api_key=api_key)
##
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DB_NAME = os.path.join(BASE_DIR, "chat.db")

def get_db():
    conn = sqlite3.connect(DB_NAME)
    conn.row_factory = sqlite3.Row 
    return conn
def init_db():
    conn = get_db()
    cursor = conn.cursor()
    
    # 1. Create Sessions Table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS sessions (
            id TEXT PRIMARY KEY,
            title TEXT NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    ''')
    
    # 2. Create Messages Table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS messages (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            session_id TEXT NOT NULL,
            role TEXT NOT NULL,
            sender TEXT NOT NULL,
            text TEXT NOT NULL,
            timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (session_id) REFERENCES sessions (id) ON DELETE CASCADE
        )
    ''')
    
    conn.commit()
    conn.close()
init_db()

@app.route('/api/sessions', methods=['GET'])
def get_sessions():
    conn = get_db()
    cursor = conn.cursor()
    sessions = cursor.execute("SELECT * FROM sessions ORDER BY created_at DESC").fetchall()
    
    result = []
    for s in sessions:
        messages = cursor.execute(
            "SELECT role, sender, text FROM messages WHERE session_id = ? ORDER BY timestamp ASC", 
            (s['id'],)
        ).fetchall()
        
        result.append({
            "id": s['id'],
            "title": s['title'],
            "messages": [dict(m) for m in messages]
        })
        
    conn.close()
    return jsonify(result)

@app.route('/api/sessions', methods=['POST'])
def create_session():
    data = request.get_json()
    session_id = data.get('id')
    title = data.get('title', 'New Chat')
    
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute(
        "INSERT OR IGNORE INTO sessions (id, title) VALUES (?, ?)", 
        (session_id, title)
    )
    conn.commit()
    conn.close()
    return jsonify({"status": "success", "id": session_id})

@app.route('/api/sessions/<session_id>/messages', methods=['POST'])
def save_message(session_id):
    data = request.get_json()
    
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute(
        "INSERT INTO messages (session_id, role, sender, text) VALUES (?, ?, ?, ?)",
        (session_id, data['role'], data['sender'], data['text'])
    )
    conn.commit()
    conn.close()
    return jsonify({"status": "success"})

@app.route('/api/sessions/<session_id>/rename', methods=['PUT'])
def rename_session(session_id):
    data = request.get_json()
    new_title = data.get('title')
    
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("UPDATE sessions SET title = ? WHERE id = ?", (new_title, session_id))
    conn.commit()
    conn.close()
    return jsonify({"status": "success", "title": new_title})

@app.route('/api/sessions/<session_id>', methods=['DELETE'])
def delete_session(session_id):
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("DELETE FROM messages WHERE session_id = ?", (session_id,))
    cursor.execute("DELETE FROM sessions WHERE id = ?", (session_id,))
    conn.commit()
    conn.close()
    return jsonify({"status": "success"})
##
@app.route('/api/chat-audio', methods=['POST'])
def chat_audio():
    if 'audio' not in request.files:
        return jsonify({"reply": "Error: No audio file uploaded."}), 400

    audio_file = request.files['audio']
    raw_history = request.form.get('history', '[]')
    frontend_history = json.loads(raw_history)

    try:
        audio_bytes = audio_file.read()
        mime_type = audio_file.content_type or 'audio/webm'

        # STEP 1: Transcribe the audio first using Gemini
        transcription_response = client.models.generate_content(
            model="gemini-3.5-flash",
            contents=[
                types.Part.from_bytes(data=audio_bytes, mime_type=mime_type),
                "Transcribe the audio exactly as spoken. Output ONLY the raw transcript text with no extra commentary."
            ]
        )
        
        user_transcript = transcription_response.text.strip() if transcription_response.text else ""

        if not user_transcript:
            return jsonify({
                "transcription": "Could not understand audio",
                "reply": "I couldn't hear or understand any speech in that recording. Could you try speaking again?"
            })

        # STEP 2: Reconstruct message history with the transcribed text
        messages = []
        for msg in frontend_history:
            messages.append(
                types.Content(
                    role=msg.get('role'),
                    parts=[types.Part(text=f"{msg.get('text')}")]
                )
            )

        messages.append(types.Content(role="user", parts=[types.Part(text=user_transcript)]))

        # STEP 3: Run your standard tool-calling loop with the transcribed prompt
        final_text = ""
        for _ in range(20):
            response = client.models.generate_content(
                model="gemini-3.5-flash",
                contents=messages,
                config=types.GenerateContentConfig(
                    tools=[available_functions],
                    system_instruction=system_prompt,
                    thinking_config=types.ThinkingConfig(thinking_budget=0),
                ),
            )

            if response.candidates:
                for c in response.candidates:
                    if c.content:
                        messages.append(c.content)

            if response.function_calls:
                tool_parts = []
                for function_call in response.function_calls:
                    result = call_function(function_call, verbose=False)
                    if not result.parts or not result.parts[0].function_response:
                        raise Exception("Invalid tool response")
                    tool_parts.append(result.parts[0])
                
                messages.append(types.Content(role="user", parts=tool_parts))
                continue

            final_text = response.text
            break

        return jsonify({
            "transcription": user_transcript,
            "reply": final_text or "Sorry, I couldn't process a response."
        })

    except Exception as e:
        print(f"Audio processing error: {e}")
        return jsonify({"reply": f"Error processing audio: {str(e)}"}), 500
def generate_session_title(messages):
    if not messages:
        return "New Chat"
    last_two=messages[-2:]
    history_text = "\n".join([msg.get('text', '')[:150] for msg in last_two])
    print(history_text)
    naming_prompt = f"Summarize the following chat into a short title (max 3 words). Only return the title:\n{history_text}"
    response = client.models.generate_content(
        model="gemini-3.5-flash",
        contents=naming_prompt
    )
    return response.text.strip()
@app.route('/api/rename', methods=['POST'])
def rename():
    data = request.get_json()
    messages = data.get('messages', [])
    
    try:
        new_title = generate_session_title(messages)
        return jsonify({"title": new_title})
    except Exception as e:
        print(f"Error in rename route: {e}")
        return jsonify({"error": str(e)}), 500
@app.route('/api/chat', methods=['POST'])
def chat():
    data = request.get_json()
    if not data or 'message' not in data:
        return jsonify({"reply": "Error: Missing 'message' in request body."}), 400

    user_prompt = data.get('message')
    frontend_history = data.get('history', [])

    messages = []
    for msg in frontend_history:
        messages.append(
            types.Content(
                role=msg.get('role'),
                parts=[
                    types.Part(text=f"{msg.get('text')}")
                ]
            )
        )
    
    last_msg_text = frontend_history[-1].get('text') if frontend_history else None
    if last_msg_text != user_prompt:
        messages.append(types.Content(role="user", parts=[types.Part(text=user_prompt)]))
    final_text = ""
    try:
        for _ in range(20):
            response = client.models.generate_content(
                model="gemini-3.5-flash",
                contents=messages,
                config=types.GenerateContentConfig(
                    tools=[available_functions],
                    system_instruction=system_prompt,
                    thinking_config=types.ThinkingConfig(
                        thinking_budget=0
                    ),
                ),
            )

            if response.candidates:
                for c in response.candidates:
                    if c.content:
                        messages.append(c.content)

            if response.function_calls:
                tool_parts = []
                for function_call in response.function_calls:
                    result = call_function(function_call, verbose=False)
                    if not result.parts or not result.parts[0].function_response:
                        raise Exception("Invalid tool response")
                    tool_parts.append(result.parts[0])
                
                messages.append(types.Content(role="user", parts=tool_parts))
                continue

            final_text = response.text
            break

        if not final_text:
            return jsonify({"reply": "Error: Model did not finish within processing limit."}), 500

        return jsonify({"reply": final_text})

    except Exception as e:
        print(e)
        return jsonify({"reply": f"Error: {str(e)}"}), 500

@app.route('/')
def index():
    return send_from_directory(app.static_folder, 'index.html')

# Catch-All Route: Intercepts browser requests to /session/<id> and gives back index.html
@app.route('/session/<session_id>')
@app.route('/<path:path>')
def catch_all(path=None, session_id=None):
    # If the browser is requesting a real file (like style.css or script.js), let Flask serve it
    if path and os.path.exists(os.path.join(app.static_folder, path)):
        return send_from_directory(app.static_folder, path)
    
    # Otherwise, return your index.html silently so the JS router can display the page
    return send_from_directory(app.static_folder, 'index.html')


if __name__ == "__main__":
    app.run(host='127.0.0.1', port=5000, debug=True)