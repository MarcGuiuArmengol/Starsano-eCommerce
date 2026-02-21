from .config import load_config
from .clients.shopify import ShopifyClient
from .clients.sheets import SheetsClient
from .clients.openai import OpenAIClient


def run_once(query='best seller'):
    cfg = load_config()
    shopify = ShopifyClient(cfg)
    sheets = SheetsClient(cfg)
    oai = OpenAIClient(cfg)

    print('Fetching products from Shopify (mock)...')
    products = shopify.search_products(query=query, limit=5)
    print(f'Found {len(products)} products.')

    # Build products list text in the required format: "Name -> URL"
    store = cfg.get('SHOPIFY_STORE') or 'https://example-store.test'
    products_lines = []
    for p in products:
        # construct a plausible product URL using handle
        url = f"{store.rstrip('/')}/products/{p.get('handle')}"
        products_lines.append(f"{p.get('title')} -> {url}")
    products_text = '\n'.join(products_lines)
    # Read past titles from the local JSON DB to exclude them (by date)
    weeks_to_avoid = cfg.get('RECENT_WEEKS', 4)
    recent_titles = set(sheets.titles_in_last_weeks(weeks=weeks_to_avoid))

    # Select locally: filter out recent titles and pick randomly from a sample
    print('\nSelecting a product locally (random, filtered by recent DB)...')
    import random

    candidates = [line for line in products_lines if not any(line.startswith(rt) for rt in recent_titles)]
    if not candidates:
        # fallback to all products if everything is recent
        candidates = products_lines.copy()

    # sample a few to emulate a more random selection process, then pick one
    sample_size = min(5, len(candidates))
    sampled = random.sample(candidates, sample_size)
    selected = random.choice(sampled)
    print(f'Selected: {selected}')

    # Extract name and url
    if '->' in selected:
        name, url = [s.strip() for s in selected.split('->', 1)]
    else:
        name = selected.strip()
        url = ''

    # Single LLM call to generate the article HTML
    print('\nGenerating article (single LLM call)...')
    article_html = oai.generate_article(selected_line=selected, products_text=products_text, product_context=name)
    print('Article generated (first 300 chars):')
    print(article_html[:300])

    # Mock create article in Shopify
    created = shopify.create_article(title=f"{name} - SEO Article", body=article_html, tags=[p.get('handle')])
    print(f"Created article (mock): {created.get('id')}")

    # Append to local DB log with timestamp (for weeks-based exclusion)
    sheets.add_recent_title(title=name, article_id=created.get('id'), product_id=products[0].get('id') if products else '')

    print('\nRun complete.')


if __name__ == '__main__':
    run_once()
