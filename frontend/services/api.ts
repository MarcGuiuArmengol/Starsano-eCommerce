// Centralized API service to handle fetching from the backend
const API_BASE_URL = ''; // Use relative paths for Vite proxy
const CHAT_API_URL = '/chat_api'; // We'll update vite.config.ts to proxy this too

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
    chat: async (message: string, sessionId: string, email?: string) => {
        const response = await fetch(`${CHAT_API_URL}/chat`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ message, session_id: sessionId, email }),
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
    },
    // ADMIN - ORDERS
    adminGetOrders: async (token: string) => {
        const response = await fetch(`${API_BASE_URL}/api/admin/orders`, {
            headers: { 'Authorization': `Bearer ${token}` },
        });
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.message || 'Failed to fetch admin orders');
        }
        return response.json();
    },
    updateOrderStatus: async (id: number | string, status: string, token: string) => {
        const response = await fetch(`${API_BASE_URL}/api/admin/orders/${id}/status`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ status }),
        });
        if (!response.ok) throw new Error('Failed to update order status');
        return response.json();
    },
    // ADMIN - CATEGORIES
    getCategories: async () => {
        const response = await fetch(`${API_BASE_URL}/api/categories`);
        if (!response.ok) throw new Error('Failed to fetch categories');
        return response.json();
    },
    createCategory: async (data: any, token: string) => {
        const response = await fetch(`${API_BASE_URL}/api/admin/categories`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(data),
        });
        if (!response.ok) throw new Error('Failed to create category');
        return response.json();
    },
    updateCategory: async (id: number | string, data: any, token: string) => {
        const response = await fetch(`${API_BASE_URL}/api/admin/categories/${id}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(data),
        });
        if (!response.ok) throw new Error('Failed to update category');
        return response.json();
    },
    deleteCategory: async (id: number | string, token: string) => {
        const response = await fetch(`${API_BASE_URL}/api/admin/categories/${id}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` },
        });
        if (!response.ok) throw new Error('Failed to delete category');
        return response.json();
    },
    // ADMIN - ATTRIBUTES
    getAttributes: async () => {
        const response = await fetch(`${API_BASE_URL}/api/attributes`);
        if (!response.ok) throw new Error('Failed to fetch attributes');
        return response.json();
    },
    createAttribute: async (data: any, token: string) => {
        const response = await fetch(`${API_BASE_URL}/api/admin/attributes`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(data),
        });
        if (!response.ok) throw new Error('Failed to create attribute');
        return response.json();
    },
    updateAttribute: async (id: number | string, data: any, token: string) => {
        const response = await fetch(`${API_BASE_URL}/api/admin/attributes/${id}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(data),
        });
        if (!response.ok) throw new Error('Failed to update attribute');
        return response.json();
    },
    deleteAttribute: async (id: number | string, token: string) => {
        const response = await fetch(`${API_BASE_URL}/api/admin/attributes/${id}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` },
        });
        if (!response.ok) throw new Error('Failed to delete attribute');
        return response.json();
    },
    // ADMIN - PRODUCTS
    createProduct: async (data: any, token: string) => {
        const response = await fetch(`${API_BASE_URL}/api/admin/products`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(data),
        });
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.message || 'Failed to create product');
        }
        return response.json();
    },
    updateProduct: async (id: number | string, data: any, token: string) => {
        const response = await fetch(`${API_BASE_URL}/api/admin/products/${id}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(data),
        });
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.message || 'Failed to update product');
        }
        return response.json();
    },
    debugAuth: async (token: string) => {
        const response = await fetch(`${API_BASE_URL}/api/debug-auth`, {
            headers: { 'Authorization': `Bearer ${token}` },
        });
        return {
            status: response.status,
            data: await response.json().catch(() => ({})),
        };
    },
    // REVIEWS
    getProductReviews: async (productId: string | number) => {
        const response = await fetch(`${API_BASE_URL}/api/products/${productId}/reviews`);
        if (!response.ok) throw new Error('Failed to fetch reviews');
        return response.json();
    },
    createReview: async (productId: string | number, data: { rating: number, comment: string }, token: string) => {
        const response = await fetch(`${API_BASE_URL}/api/products/${productId}/reviews`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(data),
        });
        if (!response.ok) throw new Error('Failed to post review');
        return response.json();
    }
};
