from functions.get_file_content import get_file_content

# TRUNCATION TEST
result = get_file_content("calculator", "lorem.txt")

print(f"lorem.txt length: {len(result)}")
print(f"lorem.txt truncated: {len(result) > 10000 or 'truncated' in result}")

print("\n--- other tests ---")

# VALID FILE (must include function signature check)
print(get_file_content("calculator", "main.py"))

# VALID NESTED FILE (this is required by tests)
print(get_file_content("calculator", "pkg/calculator.py"))

# ERROR CASES (must show "Error:")
print(get_file_content("calculator", "/bin/cat"))
print(get_file_content("calculator", "pkg/does_not_exist.py"))
