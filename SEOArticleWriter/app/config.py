try:
    from dotenv import load_dotenv
except Exception:
    def load_dotenv():
        return None

import os


def load_config():
    # Safe load: if python-dotenv isn't installed, this is a no-op
    try:
        load_dotenv()
    except Exception:
        pass

    return {
        'LOCAL_DB_FILE': os.getenv('LOCAL_DB_FILE', 'local_db.json'),
        'RECENT_WEEKS': int(os.getenv('RECENT_WEEKS', '4')),
        'OPENAI_API_KEY': os.getenv('OPENAI_API_KEY', ''),
        'OPENAI_MODEL': os.getenv('OPENAI_MODEL', 'gpt-4o-mini')
    }
