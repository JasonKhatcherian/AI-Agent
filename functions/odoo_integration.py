import os
import xmlrpc.client
from dotenv import load_dotenv

load_dotenv()

ODOO_URL = os.getenv("ODOO_URL")
ODOO_DB = os.getenv("ODOO_DB")
ODOO_USERNAME = os.getenv("ODOO_USERNAME")
ODOO_API_KEY = os.getenv("ODOO_API_KEY")

class OdooService:
    def __init__(self):
        self.url = ODOO_URL
        self.db = ODOO_DB
        self.username = ODOO_USERNAME
        self.api_key = ODOO_API_KEY
        self._uid = None

    def _get_uid(self):
        if not self._uid:
            common = xmlrpc.client.ServerProxy(f"{self.url}/xmlrpc/2/common")
            self._uid = common.authenticate(self.db, self.username, self.api_key, {})
            if not self._uid:
                raise ValueError("Odoo authentication failed. Check credentials and API key.")
        return self._uid

    def execute(self, model_name: str, method: str, args: list, kwargs: dict = None):
        uid = self._get_uid()
        models = xmlrpc.client.ServerProxy(f"{self.url}/xmlrpc/2/object")
        kwargs = kwargs or {}
        return models.execute_kw(self.db, uid, self.api_key, model_name, method, args, kwargs)


def fetch_odoo_data(model_name: str, limit: int = 5, **kwargs):
    try:
        service = OdooService()
        data = service.execute(model_name, 'search_read', [[]], {'limit': limit})
        return str(data)
    except Exception as e:
        return f"Error fetching from Odoo: {str(e)}"

def create_odoo_record(model_name: str, values: dict, **kwargs):
    try:
        service = OdooService()
        new_id = service.execute(model_name, 'create', [values])
        return f"Successfully created {model_name} record with ID: {new_id}"
    except Exception as e:
        return f"Error creating record in Odoo: {str(e)}"

def update_odoo_record(model_name: str, record_id: int, values: dict, **kwargs):
    try:
        service = OdooService()
        success = service.execute(model_name, 'write', [[record_id], values])
        return f"Update on {model_name} ID {record_id} status: {success}"
    except Exception as e:
        return f"Error updating record in Odoo: {str(e)}"

def delete_odoo_record(model_name: str, record_id: int, **kwargs):
    try:
        service = OdooService()
        success = service.execute(model_name, 'unlink', [[record_id]])
        return f"Deletion of {model_name} ID {record_id} status: {success}"
    except Exception as e:
        return f"Error deleting record in Odoo: {str(e)}"