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

    # You can now use 'client' to call Gemini models


if __name__ == "__main__":
    main()
