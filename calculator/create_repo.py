import os

try:
    os.makedirs("tmp")
    print("Repository 'tmp' created successfully.")
except FileExistsError:
    print("Repository 'tmp' already exists.")
except Exception as e:
    print(f"Error creating repository: {e}")
