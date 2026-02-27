// Centralized API service to handle fetching from the backend
const API_BASE_URL = import.meta.env.VITE_API_URL || '';
const CHAT_API_URL = import.meta.env.VITE_CHAT_API_URL || 'http://localhost:8000';

export const api = {
    getProducts: async () => {
        const response = await fetch(`${API_BASE_URL}/api/products`);
        if (!response.ok) throw new Error('Failed to fetch products');
        return response.json();
    },
    getProductById: async (id: string) => {
        const response = await fetch(`${API_BASE_URL}/api/products/${id}`);
        if (!response.ok) throw new Error('Failed to fetch product');
        return response.json();
    },
    getArticles: async () => {
        const response = await fetch(`${API_BASE_URL}/api/articles`);
        if (!response.ok) throw new Error('Failed to fetch articles');
        return response.json();
    },
    getArticleById: async (id: string) => {
        const response = await fetch(`${API_BASE_URL}/api/articles/${id}`);
        if (!response.ok) throw new Error('Failed to fetch article');
        return response.json();
    },
    chat: async (message: string, sessionId: string) => {
        const response = await fetch(`${CHAT_API_URL}/chat`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ message, session_id: sessionId }),
        });
        if (!response.ok) throw new Error('Failed to fetch chat response');
        return response.json();
    }
};
