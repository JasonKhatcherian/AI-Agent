import os

def get_files_info(working_directory: str, directory: str = ".") -> str:
    try:
        working_dir_abs = os.path.abspath(working_directory)

        target_dir = os.path.normpath(
            os.path.join(working_dir_abs, directory)
        )

        # Security check
        if os.path.commonpath([working_dir_abs, target_dir]) != working_dir_abs:
            return f'Error: Cannot list "{directory}" as it is outside the permitted working directory'

        # Must be a directory
        if not os.path.isdir(target_dir):
            return f'Error: "{directory}" is not a directory'

        results = []

        # List items (1-level deep, includes pkg contents)
        for item in os.listdir(target_dir):
            item_path = os.path.join(target_dir, item)

            if os.path.isdir(item_path):
                # go one level deeper
                for sub_item in os.listdir(item_path):
                    sub_path = os.path.join(item_path, sub_item)

                    results.append({
                        "name": sub_item,
                        "size": os.path.getsize(sub_path),
                        "is_directory": os.path.isdir(sub_path)
                    })
            else:
                results.append({
                    "name": item,
                    "size": os.path.getsize(item_path),
                    "is_directory": False
                })

        # Format output
        output_lines = []
        for item in results:
            output_lines.append(
                f"- {item['name']}: file_size={item['size']} bytes, is_dir={item['is_directory']}"
            )

        return "\n".join(output_lines)

    except Exception as e:
        return f"Error: {str(e)}"
