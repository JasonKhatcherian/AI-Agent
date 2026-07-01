import os
from dotenv import load_dotenv
from google import genai

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
    prompts="Why is Boot.dev such a great place to learn backend development? Use one paragraph maximum."
    # You can now use 'client' to call Gemini models
    response = client.models.generate_content(
    model='gemini-2.5-flash', contents=prompts)
    p_token=response.usage_metadata.prompt_token_count
    r_token=response.usage_metadata.candidates_token_count
    print(prompts)
    print("Prompt tokens:",p_token)
    print("Response tokens:",r_token)
    print(response.text)

if __name__ == "__main__":
    main()
