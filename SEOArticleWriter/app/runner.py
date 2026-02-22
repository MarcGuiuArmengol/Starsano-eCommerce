from .config import load_config
from .clients.db_client import DBClient
from .clients.openai import OpenAIClient


def run_once(query=''):
    cfg = load_config()
    db = DBClient(cfg)
    oai = OpenAIClient(cfg)

    print('Fetching products from database...')
    products = db.search_products(query=query, limit=10)
    print(f'Found {len(products)} products.')

    if not products:
        print("No products found to write about.")
        return

    # Build products list text for context: "Name -> URL"
    # Local store URL format
    store_base = "http://localhost:8080/#/product/"
    products_lines = []
    for p in products:
        url = f"{store_base}{p.get('id')}"
        products_lines.append(f"{p.get('title')} -> {url}")
    
    products_text = '\n'.join(products_lines)
    
    # Check recent titles to avoid duplicates (last 4 weeks)
    weeks_to_avoid = cfg.get('RECENT_WEEKS', 4)
    recent_titles = set(db.titles_in_last_weeks(weeks=weeks_to_avoid))

    print('\nSelecting a product localy...')
    import random
    candidates = [p for p in products if p['title'] not in recent_titles]
    if not candidates:
        candidates = products

    selected_product = random.choice(candidates)
    selected_line = f"{selected_product['title']} -> {store_base}{selected_product['id']}"
    
    print(f'Selected: {selected_product["title"]}')

    # Generate the article HTML
    print('\nGenerating article (LLM call)...')
    article_html = oai.generate_article(
        selected_line=selected_line, 
        products_text=products_text, 
        product_context=selected_product['description']
    )
    
    print('Article generated successfully.')

    # Save to database
    # Try to extract the H1 title from the HTML content for a cleaner DB title
    import re
    h1_match = re.search(r'<h1[^>]*>(.*?)</h1>', article_html, re.IGNORECASE | re.DOTALL)
    if h1_match:
        article_title = h1_match.group(1).strip()
    else:
        article_title = f"{selected_product['title']} - Starsano Well-being"

    created = db.create_article(title=article_title, content=article_html)
    
    if created['id'] != 'error':
        print(f"Success! Article created with ID: {created.get('id')}")
    else:
        print("Failed to save article to database.")

    print('\nRun complete.')


if __name__ == '__main__':
    run_once()
