import os
import sys

sys.path.append(os.path.dirname(os.path.dirname(__file__)))
import config


def get_file_content(working_directory: str, file_path: str) -> str:
    try:
        working_dir_abs = os.path.abspath(working_directory)

        target_path = os.path.normpath(
            os.path.join(working_dir_abs, file_path)
        )

        # SECURITY CHECK
        if os.path.commonpath([working_dir_abs, target_path]) != working_dir_abs:
            return f'Error: Cannot read "{file_path}" as it is outside the permitted working directory'

        # FILE CHECK
        if not os.path.isfile(target_path):
            return f'Error: File not found or is not a regular file: "{file_path}"'

        # READ FILE
        with open(target_path, "r", encoding="utf-8") as f:
            content = f.read(config.MAX_CHARS)

            extra = f.read(1)
            if extra:
                content += f'\n[...File "{file_path}" truncated at {config.MAX_CHARS} characters]'

        return content

    except Exception as e:
        return f"Error: {str(e)}"
