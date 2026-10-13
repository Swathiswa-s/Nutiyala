"""
Nutiyala Couture - Lightweight Environment Variable Loader
Safely loads key-value pairs from .env using reliable absolute paths
without third-party dependencies, preserving existing OS environment variables.
"""

import os

# Project root determined by the location of this module
PROJECT_ROOT = os.path.dirname(os.path.abspath(__file__))
DEFAULT_ENV_PATH = os.path.join(PROJECT_ROOT, '.env')

def load_dotenv(dotenv_path=None, override=False) -> bool:
    """
    Safely loads key-value pairs from a .env file into os.environ.
    
    - dotenv_path: Absolute or relative path to the .env file (defaults to PROJECT_ROOT/.env).
    - override: If False (default), existing OS environment variables will NOT be overwritten.
    
    Returns True if the file was found and processed, False otherwise.
    Never raises exceptions on missing or malformed files.
    """
    path = os.path.abspath(dotenv_path) if dotenv_path else DEFAULT_ENV_PATH
    
    if not os.path.isfile(path):
        return False

    try:
        with open(path, 'r', encoding='utf-8') as f:
            for line in f:
                line = line.strip()
                # Skip comments and empty lines
                if not line or line.startswith('#'):
                    continue
                if '=' in line:
                    key, val = line.split('=', 1)
                    key = key.strip()
                    val = val.strip()
                    # Strip surrounding single or double quotes
                    if len(val) >= 2 and ((val.startswith('"') and val.endswith('"')) or (val.startswith("'") and val.endswith("'"))):
                        val = val[1:-1]
                    
                    # Only set if key is valid and either override is True or key is not in os.environ
                    if key and (override or key not in os.environ):
                        os.environ[key] = val
        return True
    except Exception:
        # Gracefully handle file read errors without crashing
        return False

# Automatically load .env once when imported
load_dotenv()
