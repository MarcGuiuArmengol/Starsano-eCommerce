import os
import faiss
import numpy as np
import pickle
from typing import List, Dict, Any
from langchain_openai import OpenAIEmbeddings
from .db import db_client

class ProductVectorStore:
    def __init__(self, index_path="data/faiss_index.bin", metadata_path="data/metadata.pkl"):
        self.index_path = index_path
        self.metadata_path = metadata_path
        self.embeddings = OpenAIEmbeddings(api_key=os.environ.get("OPENAI_API_KEY"))
        self.index = None
        self.metadata = []
        
        # Ensure data directory exists
        os.makedirs(os.path.dirname(index_path), exist_ok=True)

    def _create_text_for_embedding(self, product: Dict[str, Any]) -> str:
        # Combine name, category and description for a rich embedding
        return f"Producto: {product['name']}. Categoría: {product['category']}. Descripción: {product['description']}"

    def sync_with_db(self):
        """Fetches all products from DB, generates embeddings and saves the FAISS index."""
        print("Sincronizando vector store con la base de datos...")
        products = db_client.get_all_products_for_indexing()
        
        if not products:
            print("No se encontraron productos para indexar.")
            return

        texts = [self._create_text_for_embedding(p) for p in products]
        vectors = self.embeddings.embed_documents(texts)
        
        vector_np = np.array(vectors).astype('float32')
        dimension = vector_np.shape[1]
        
        self.index = faiss.IndexFlatL2(dimension)
        self.index.add(vector_np)
        self.metadata = products

        # Save to disk
        faiss.write_index(self.index, self.index_path)
        with open(self.metadata_path, 'wb') as f:
            pickle.dump(self.metadata, f)
        
        print(f"Indexación completada: {len(products)} productos procesados.")

    def load_index(self):
        """Loads index from disk or syncs if not exists."""
        if os.path.exists(self.index_path) and os.path.exists(self.metadata_path):
            self.index = faiss.read_index(self.index_path)
            with open(self.metadata_path, 'rb') as f:
                self.metadata = pickle.load(f)
            return True
        else:
            self.sync_with_db()
            return True

    def semantic_search(self, query: str, limit: int = 5) -> List[Dict[str, Any]]:
        """Performs a semantic search using embeddings."""
        if self.index is None:
            if not self.load_index():
                return []

        query_vector = self.embeddings.embed_query(query)
        query_vector_np = np.array([query_vector]).astype('float32')
        
        distances, indices = self.index.search(query_vector_np, limit)
        
        results = []
        for idx in indices[0]:
            if idx != -1 and idx < len(self.metadata):
                results.append(self.metadata[idx])
        
        return results

# Singleton
vector_store = ProductVectorStore()
