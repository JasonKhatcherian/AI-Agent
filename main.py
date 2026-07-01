import os
from dotenv import load_dotenv
from google import genai
import argparse
from google.genai import types
def main():
    # Load environment variables from .env file
    load_dotenv()

    # Read API key
    api_key = os.environ.get("GEMINI_API_KEY")

    if not api_key:
        print("API key not found!")
        return

    # Create Gemini client
    client = genai.Client(api_key=api_key)

    print("Gemini client initialized successfully.")
    parser = argparse.ArgumentParser(description="Chatbot")
    parser.add_argument("user_prompt", type=str, help="User prompt")
    parser.add_argument("--verbose", action="store_true", help="Enable verbose output")
    args = parser.parse_args()
    messages: list[types.Content] = [
        types.Content(role="user", parts=[types.Part(text=args.user_prompt)])
    ]

    # Now we can access `args.user_prompt`
    response = client.models.generate_content(
            model='gemini-2.5-flash', contents=messages
    )
    p_token=response.usage_metadata.prompt_token_count
    r_token=response.usage_metadata.candidates_token_count
    print(response.text)
    if args.verbose:
        print(f'User prompt: "{args.user_prompt}"')
        print(f"Prompt tokens: {response.usage_metadata.prompt_token_count}")
        print(f"Response tokens: {response.usage_metadata.candidates_token_count}")
if __name__ == "__main__":
    main()
