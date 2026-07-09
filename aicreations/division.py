
def divide_numbers(numerator, denominator):
    if denominator == 0:
        return "Error: Cannot divide by zero!"
    else:
        return numerator / denominator

if __name__ == "__main__":
    try:
        num1 = float(input("Enter the numerator: "))
        num2 = float(input("Enter the denominator: "))
        result = divide_numbers(num1, num2)
        print(f"The result of the division is: {result}")
    except ValueError:
        print("Invalid input. Please enter numbers only.")
