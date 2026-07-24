from functions.get_files_info import get_files_info
from functions.get_file_content import get_file_content
from functions.run_python_file import run_python_file
from functions.write_file import write_file
from functions.odoo_integration import (
    fetch_odoo_data,
    create_odoo_record,
    update_odoo_record,
    delete_odoo_record
)
from google.genai import types
from collections.abc import Callable

# 1. Schema for get_files_info function
schema_get_files_info = types.FunctionDeclaration(
    name="get_files_info",
    description="Lists files in a specified directory relative to the working directory, providing file size and directory status",
    parameters=types.Schema(
        type=types.Type.OBJECT,
        properties={
            "directory": types.Schema(
                type=types.Type.STRING,
                description="Directory path to list files from, relative to the working directory (default is the working directory itself)",
            ),
        },
    ),
)

# 2. Schema for get_file_content function
schema_get_file_content = types.FunctionDeclaration(
    name="get_file_content",
    description="Retrieves the full content of a specific file relative to the working directory.",
    parameters=types.Schema(
        type=types.Type.OBJECT,
        properties={
            "file_path": types.Schema(
                type=types.Type.STRING,
                description="The relative path of the file to read (e.g., 'main.py' or 'pkg/calculator.py').",
            ),
        },
        required=["file_path"],
    ),
)

# 3. Schema for run_python_file function
schema_run_python_file = types.FunctionDeclaration(
    name="run_python_file",
    description="Executes a Python file relative to the working directory and returns its output.",
    parameters=types.Schema(
        type=types.Type.OBJECT,
        properties={
            "file_path": types.Schema(
                type=types.Type.STRING,
                description="The relative path of the Python file to execute.",
            ),
            "args": types.Schema(
                type=types.Type.ARRAY,
                items=types.Schema(type=types.Type.STRING),
                description="Optional list of command-line arguments to pass to the script.",
            ),
        },
        required=["file_path"],
    ),
)

# 4. Schema for write_file function
schema_write_file = types.FunctionDeclaration(
    name="write_file",
    description="Creates a new file or overwrites an existing file with the specified text content inside the working directory.",
    parameters=types.Schema(
        type=types.Type.OBJECT,
        properties={
            "file_path": types.Schema(
                type=types.Type.STRING,
                description="The relative path where the file should be written or updated.",
            ),
            "content": types.Schema(
                type=types.Type.STRING,
                description="The full text content to write into the file.",
            ),
        },
        required=["file_path", "content"],
    ),
)
#schema for odoo
schema_fetch_odoo_data = types.FunctionDeclaration(
    name="fetch_odoo_data",
    description="Fetches records from Odoo database models like res.partner, project.project, or crm.lead",
    parameters=types.Schema(
        type=types.Type.OBJECT,
        properties={
            "model_name": types.Schema(
                type=types.Type.STRING,
                description="The Odoo model to query (e.g., 'res.partner', 'project.project').",
            ),
            "limit": types.Schema(
                type=types.Type.INTEGER,
                description="Max number of items to retrieve (default: 5).",
            )
        },
        required=["model_name"],
    ),
)

schema_create_odoo_record = types.FunctionDeclaration(
    name="create_odoo_record",
    description="Creates a new record in Odoo (e.g., model 'project.project' with values {'name': 'New Project'})",
    parameters=types.Schema(
        type=types.Type.OBJECT,
        properties={
            "model_name": types.Schema(type=types.Type.STRING, description="e.g. 'project.project'"),
            "values": types.Schema(type=types.Type.OBJECT, description="Dictionary of field values to set"),
        },
        required=["model_name", "values"],
    ),
)

schema_update_odoo_record = types.FunctionDeclaration(
    name="update_odoo_record",
    description="Updates an existing Odoo record by ID.",
    parameters=types.Schema(
        type=types.Type.OBJECT,
        properties={
            "model_name": types.Schema(type=types.Type.STRING, description="e.g. 'project.project'"),
            "record_id": types.Schema(type=types.Type.INTEGER, description="The ID of the record"),
            "values": types.Schema(type=types.Type.OBJECT, description="Dictionary of fields to update"),
        },
        required=["model_name", "record_id", "values"],
    ),
)

schema_delete_odoo_record = types.FunctionDeclaration(
    name="delete_odoo_record",
    description="Deletes a record in Odoo by ID.",
    parameters=types.Schema(
        type=types.Type.OBJECT,
        properties={
            "model_name": types.Schema(type=types.Type.STRING, description="e.g. 'project.project'"),
            "record_id": types.Schema(type=types.Type.INTEGER, description="The ID of the record to delete"),
        },
        required=["model_name", "record_id"],
    ),
)

# 3. Master List Grouping All Declarations
available_functions = types.Tool(
    function_declarations=[
        schema_get_files_info,
        schema_get_file_content,
        schema_run_python_file,
        schema_write_file,
        schema_fetch_odoo_data,
        schema_create_odoo_record,
        schema_update_odoo_record,
        schema_delete_odoo_record,
    ]
)

# 4. Function Execution Mapping
function_map: dict[str, Callable[..., str]] = {
    "get_files_info": get_files_info,
    "get_file_content": get_file_content,
    "run_python_file": run_python_file,
    "write_file": write_file,
    "fetch_odoo_data": fetch_odoo_data,
    "create_odoo_record": create_odoo_record,
    "update_odoo_record": update_odoo_record,
    "delete_odoo_record": delete_odoo_record,
}
def call_function(function_call: types.FunctionCall, verbose: bool = False) -> types.Content:
    function_name = function_call.name or ""
    args = dict(function_call.args) if function_call.args else {}

    if verbose:
        print(f"Calling function: {function_name}({args})")
    else:
        print(f" - Calling function: {function_name}")

    # IMPORTANT: inject working directory (as required by spec)
    args["working_directory"] = "./aicreations"

    # call function from map
    function_result = function_map[function_name](**args)

    # return tool response
    return types.Content(
        role="tool",
        parts=[
            types.Part.from_function_response(
                name=function_name,
                response={"result": function_result},
            )
        ],
    )
import os

def get_files_info(working_directory, directory=""):
    target_dir = os.path.join(working_directory, directory)

    if not os.path.exists(target_dir):
        return f"Error: Directory '{directory}' does not exist"

    if not os.path.isdir(target_dir):
        return f"Error: '{directory}' is not a directory"

    files = os.listdir(target_dir)

    result = []
    for f in files:
        full_path = os.path.join(target_dir, f)
        size = os.path.getsize(full_path)
        is_dir = os.path.isdir(full_path)

        result.append(f"{f} - {size} bytes - {'dir' if is_dir else 'file'}")

    return "\n".join(result)