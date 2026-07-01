import subprocess
import os

def run_python_file(
    working_directory: str, file_path: str, args: list[str] | None = None
) -> str:
    try:
        working_dir_abs = os.path.abspath(working_directory)

        absolute_file_path = os.path.abspath(
            os.path.join(working_dir_abs, file_path)
        )

        # 1. Outside working directory check
        if not absolute_file_path.startswith(working_dir_abs):
            return f'Error: Cannot execute "{file_path}" as it is outside the permitted working directory'

        # 2. File existence check
        if not os.path.isfile(absolute_file_path):
            return f'Error: "{file_path}" does not exist or is not a regular file'

        # 3. Python file check
        if not absolute_file_path.endswith(".py"):
            return f'Error: "{file_path}" is not a Python file'

        # 4. Build command
        command = ["python", absolute_file_path]
        if args:
            command.extend(args)

        # 5. Run subprocess
        result = subprocess.run(
            command,
            cwd=working_dir_abs,
            capture_output=True,
            text=True,
            timeout=30
        )

        # 6. Build output (STRICT RULES)
        output_parts = []

        if result.returncode != 0:
            output_parts.append(f"Process exited with code {result.returncode}")

        if result.stdout:
            stdout = result.stdout.strip()
        else:
            stdout = ""

        if result.stderr:
            stderr = result.stderr.strip()
        else:
            stderr = ""

        if stdout:
            output_parts.append(f"STDOUT: {stdout}")

        if stderr:
            output_parts.append(f"STDERR: {stderr}")

        if not stdout and not stderr:
            output_parts.append("No output produced")

        return "\n".join(output_parts)

    except Exception as e:
        return f"Error: executing Python file: {e}"
