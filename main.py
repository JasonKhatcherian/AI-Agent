import os
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