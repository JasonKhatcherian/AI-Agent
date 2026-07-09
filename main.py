import os
from dotenv import load_dotenv
from google import genai
from google.genai import types
from flask import Flask, request, jsonify
from flask_cors import CORS
from functions.call_function import available_functions, call_function
from prompts import system_prompt

app = Flask(__name__)
CORS(app)

load_dotenv()
api_key = os.environ.get("GEMINI_API_KEY")
if not api_key:
    raise ValueError("API key not found!")
client = genai.Client(api_key=api_key)

@app.route('/api/chat', methods=['POST'])
def chat():
    data = request.get_json()
    if not data or 'message' not in data:
        return jsonify({"reply": "Error: Missing 'message' in request body."}), 400

    user_prompt = data.get('message')
    frontend_history = data.get('history', [])

    messages = []
    for msg in frontend_history:
        messages.append(types.Content(role=msg.get('role'), parts=[types.Part(text=msg.get('text'))]))
    
    messages.append(types.Content(role="user", parts=[types.Part(text=user_prompt)]))

    final_text = ""
    try:
        for _ in range(20):
            response = client.models.generate_content(
                model="gemini-2.5-flash",
                contents=messages,
                config=types.GenerateContentConfig(
                    tools=[available_functions],
                    system_instruction=system_prompt,
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
        return jsonify({"reply": f"Error: {str(e)}"}), 500

if __name__ == "__main__":
    app.run(host='127.0.0.1', port=5000, debug=True)