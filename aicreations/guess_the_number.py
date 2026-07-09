
import random

def guess_the_number_automated():
    secret_number = random.randint(1, 100)
    attempts = 0
    print("Welcome to 'Guess the Number' (Automated Version)!")
    print(f"I'm thinking of a number between 1 and 100. The secret number is {secret_number}.")

    # Simulate guesses
    low = 1
    high = 100
    while True:
        attempts += 1
        guess = random.randint(low, high) # Make a random guess within the current range
        print(f"Attempt {attempts}: Guessed {guess}")

        if guess < secret_number:
            print("Too low!")
            low = guess + 1
        elif guess > secret_number:
            print("Too high!")
            high = guess - 1
        else:
            print(f"Congratulations! You've guessed the number {secret_number} in {attempts} attempts.")
            break

if __name__ == "__main__":
    guess_the_number_automated()
