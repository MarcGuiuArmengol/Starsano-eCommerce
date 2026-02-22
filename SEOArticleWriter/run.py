from app.runner import run_once
from app.config import load_config
from app.checks import validate_env


if __name__ == '__main__':
    cfg = load_config()
    res = validate_env(cfg)
    if res['missing']:
        print('Warning: missing required env keys (fill .env):', res['missing'])
    else:
        print('All required env keys present for OpenAI.')
    
    print("--- Starting SEO Article Generation ---")
    try:
        run_once()
        print("--- Run Finished Successfully ---")
    except Exception as e:
        print(f"--- Run Failed with Error: {e} ---")
