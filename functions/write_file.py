import os

def write_file(working_directory: str, file_path: str, content: str) -> str:
    try:
        working_dir_abs = os.path.abspath(working_directory)

        target_path = os.path.normpath(
            os.path.join(working_dir_abs, file_path)
        )

        # 1. Security check
        if os.path.commonpath([working_dir_abs, target_path]) != working_dir_abs:
            return f'Error: Cannot write to "{file_path}" as it is outside the permitted working directory'

        # 2. Directory check
        if os.path.isdir(target_path):
            return f'Error: Cannot write to "{file_path}" as it is a directory'

        # 3. Create missing directories
        parent_dir = os.path.dirname(target_path)
        os.makedirs(parent_dir, exist_ok=True)

        # 4. Write file
        with open(target_path, "w", encoding="utf-8") as f:
            f.write(content)

        # 5. SUCCESS FORMAT (IMPORTANT - must match assignment exactly)
        return f'Successfully wrote to "{file_path}" ({len(content)} characters written)'

    except Exception as e:
        return f"Error: {e}"
