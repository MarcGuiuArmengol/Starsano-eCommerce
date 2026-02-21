def validate_env(config: dict) -> dict:
    """Return a dict with keys 'missing' and 'present' listing important env vars.

    Does NOT abort; only reports so the user can fill `.env`.
    """
    required = [
        'OPENAI_API_KEY',
    ]
    optional = [
        'SHOPIFY_STORE', 'SHOPIFY_API_KEY', 'SHOPIFY_PASSWORD', 'SHOPIFY_ACCESS_TOKEN'
    ]
    missing = [k for k in required if not config.get(k)]
    present = [k for k in required + optional if config.get(k)]
    return {'missing': missing, 'present': present}
