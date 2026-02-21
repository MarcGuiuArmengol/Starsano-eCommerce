class ShopifyClient:
    """Minimal Shopify client stub for local testing.

    Replace with real API calls when ready.
    """
    def __init__(self, config):
        self.config = config

    def search_products(self, query, limit=5):
        # Return mocked product data for testing
        products = []
        for i in range(1, limit + 1):
            products.append({
                'id': f'prod_{i}',
                'title': f'Product {i}',
                'body': f'Short description for product {i}',
                'handle': f'product-{i}'
            })
        return products

    def create_article(self, title, body, tags=None):
        # Mock article creation response
        return {'id': f'article_{title.replace(" ", "_")[:40]}', 'title': title}
