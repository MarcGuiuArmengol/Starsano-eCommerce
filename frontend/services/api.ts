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
    },
    // AUTH
    login: async (credentials: any) => {
        const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(credentials),
        });
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || 'Login failed');
        }
        return response.json();
    },
    register: async (data: any) => {
        const response = await fetch(`${API_BASE_URL}/api/auth/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data),
        });
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || 'Registration failed');
        }
        return response.json();
    },
    // NEWSLETTER
    subscribeNewsletter: async (email: string) => {
        const response = await fetch(`${API_BASE_URL}/api/newsletter/subscribe`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email }),
        });
        if (!response.ok) throw new Error('Subscription failed');
        return response.json();
    },
    // ORDERS
    createOrder: async (orderData: any, token: string) => {
        const response = await fetch(`${API_BASE_URL}/api/orders`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(orderData),
        });
        if (!response.ok) throw new Error('Failed to create order');
        return response.json();
    },
    getOrderHistory: async (token: string) => {
        const response = await fetch(`${API_BASE_URL}/api/orders/history`, {
            headers: { 'Authorization': `Bearer ${token}` },
        });
        if (!response.ok) throw new Error('Failed to fetch history');
        return response.json();
    }
};
