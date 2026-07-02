import os
from dotenv import load_dotenv
from google import genai
from google.genai import types

from functions.call_function import available_functions, call_function
from prompts import system_prompt


def main():
    load_dotenv()
    api_key = os.environ.get("GEMINI_API_KEY")
    if not api_key:
        print("API key not found!")
        return

    client = genai.Client(api_key=api_key)
    messages = []
    while True:
        user_prompt = input("Enter prompt (type 'exit' to quit): ")
        if user_prompt.lower() in ["exit", "quit", "stop"]:
            print("Goodbye!")
            break
        verbose = input("Verbose? (y/n): ").lower() in ["y", "yes", "ye"]
        messages.append(types.Content(role="user", parts=[types.Part(text=user_prompt)]))
        p_token = 0
        r_token = 0
        final_text = ""
        for _ in range(20):
            response = client.models.generate_content(
                model="gemini-2.5-flash",
                contents=messages,
                config=types.GenerateContentConfig(
                    tools=[available_functions],
                    system_instruction=system_prompt,
                ),
            )

            # ---------------- TOKEN TRACKING ----------------
            p_token += response.usage_metadata.prompt_token_count
            r_token += response.usage_metadata.candidates_token_count

            # ---------------- STORE MODEL OUTPUT ----------------
            if response.candidates:
                for c in response.candidates:
                    if c.content:
                        messages.append(c.content)

            # ---------------- TOOL CALLS ----------------
            if response.function_calls:

                tool_parts = []

                for function_call in response.function_calls:

                    if verbose:
                        print(f"Calling function: {function_call.name}({function_call.args})")

                    result = call_function(function_call, verbose=verbose)

                    if not result.parts or not result.parts[0].function_response:
                        raise Exception("Invalid tool response")

                    if verbose:
                        print(f"-> {result.parts[0].function_response.response}")

                    tool_parts.append(result.parts[0])

                # send tool results back to model
                messages.append(
                    types.Content(role="user", parts=tool_parts)
                )

                continue

            # ---------------- FINAL ANSWER ----------------
            final_text = response.text
            break

        # ---------------- SAFETY CHECK ----------------
        if not final_text:
            print("Error: Model did not finish within 20 iterations.")
            exit(1)
        else:
            print(final_text)

        # ---------------- VERBOSE METRICS ----------------
        if verbose:
            print("\n--- VERBOSE METRICS ---")
            print(f'User prompt: "{user_prompt}"')
            print(f"Total Prompt tokens: {p_token}")
            print(f"Total Response tokens: {r_token}")


if __name__ == "__main__":
    main()