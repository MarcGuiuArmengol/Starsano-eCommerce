import express, { Request, Response } from 'express';
import cors from 'cors';
import { Pool } from 'pg';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import multer from 'multer';
import { parse } from 'csv-parse/sync';
import { exec } from 'child_process';
import { hashPassword, comparePassword, generateToken, verifyToken } from './auth';

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());



const pool = new Pool({
    user: process.env.POSTGRES_USER || 'postgres',
    host: process.env.POSTGRES_HOST || 'localhost',
    database: process.env.POSTGRES_DB || 'starsano',
    password: process.env.POSTGRES_PASSWORD || 'postgres',
    port: 5432,
});

// Multer Configuration for Image Uploads
const uploadDir = path.join(process.cwd(), 'uploads');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir);
}

const storage = multer.diskStorage({
    destination: (req: any, file: any, cb: any) => {
        cb(null, uploadDir);
    },
    filename: (req: any, file: any, cb: any) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, uniqueSuffix + '-' + file.originalname);
    }
});

const upload = multer({ storage: storage });

// Serve uploads static
app.use('/uploads', express.static(uploadDir));

// Auth Middleware
const authenticateToken = (req: Request, res: Response, next: any) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        console.log('[AUTH] Missing token');
        return res.status(401).json({ message: 'Missing token' });
    }

    const user = verifyToken(token);
    if (!user) {
        console.log('[AUTH] Invalid/expired token');
        return res.status(403).json({ message: 'Invalid token' });
    }

    console.log(`[AUTH] User authenticated: ${user.userId} (Role: ${user.role})`);
    (req as any).user = user;
    next();
};

const isAdmin = (req: Request, res: Response, next: any) => {
    const user = (req as any).user;
    if (user?.role !== 'admin') {
        console.log(`[AUTH] Access denied for user ${user?.userId}. Role is ${user?.role}, expected admin.`);
        return res.status(403).json({ message: 'Admin access required' });
    }
    console.log(`[AUTH] Admin access granted for user ${user.userId}`);
    next();
};

// Review Endpoints
app.get('/api/products/:id/reviews', async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const result = await pool.query(
            'SELECT * FROM reviews WHERE product_id = $1 ORDER BY created_at DESC',
            [id]
        );
        res.json(result.rows);
    } catch (err: any) {
        console.error(err);
        res.status(500).json({ message: 'Error fetching reviews' });
    }
});

app.post('/api/products/:id/reviews', authenticateToken, async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { rating, comment } = req.body;
        const { userId } = (req as any).user;

        // Fetch user info for name
        const userRes = await pool.query('SELECT email FROM users WHERE id = $1', [userId]);
        const userName = userRes.rows[0].email.split('@')[0];

        const result = await pool.query(
            `INSERT INTO reviews (product_id, user_id, user_name, rating, comment)
             VALUES ($1, $2, $3, $4, $5) RETURNING *`,
            [id, userId, userName, rating, comment]
        );
        res.status(201).json(result.rows[0]);
    } catch (err: any) {
        console.error(err);
        res.status(500).json({ message: 'Error posting review' });
    }
});

app.get('/api/debug-auth', authenticateToken, (req: Request, res: Response) => {
    res.json({
        user: (req as any).user,
        message: 'Auth debug info'
    });
});

app.get('/', (req: Request, res: Response) => {
    res.send('Starsano API Running');
});

// Health check to verify DB connection
app.get('/health', async (req: Request, res: Response) => {
    try {
        const client = await pool.connect();
        const result = await client.query('SELECT NOW()');
        client.release();
        res.json({ status: 'ok', db_time: result.rows[0].now });
    } catch (err: any) {
        console.error(err);
        res.status(500).json({ status: 'error', message: err.message });
    }
});

// GET /api/products
app.get('/api/products', async (req: Request, res: Response) => {
    try {
        const result = await pool.query(`
            SELECT p.*, c.name as category_name, c.slug as category_slug,
            COALESCE(
                (SELECT json_agg(json_build_object('id', a.id, 'name', a.name, 'icon_url', a.icon_url))
                 FROM attributes a
                 JOIN product_attributes pa ON a.id = pa.attribute_id
                 WHERE pa.product_id = p.id),
                '[]'
            ) as dynamic_attributes,
            COALESCE((SELECT AVG(rating) FROM reviews WHERE product_id = p.id), p.rating) as avg_rating,
            COALESCE((SELECT COUNT(*) FROM reviews WHERE product_id = p.id), 0) as review_count
            FROM products p
            LEFT JOIN categories c ON p.category_id = c.id
            ORDER BY p.id DESC
        `);

        const products = result.rows.map((row: any) => ({
            ...row,
            price: Number(row.price),
            rating: Number(row.avg_rating),
            review_count: Number(row.review_count),
            badges: row.badges || [],
            images: row.images || []
        }));
        res.json(products);
    } catch (err: any) {
        console.error(err);
        res.status(500).json({ message: 'Error fetching products' });
    }
});

// GET /api/products/:id
app.get('/api/products/:id', async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const result = await pool.query(`
            SELECT p.*, c.name as category_name, c.slug as category_slug,
            COALESCE(
                (SELECT json_agg(json_build_object('id', a.id, 'name', a.name, 'icon_url', a.icon_url))
                 FROM attributes a
                 JOIN product_attributes pa ON a.id = pa.attribute_id
                 WHERE pa.product_id = p.id),
                '[]'
            ) as dynamic_attributes,
            COALESCE((SELECT AVG(rating) FROM reviews WHERE product_id = p.id), p.rating) as avg_rating,
            COALESCE((SELECT COUNT(*) FROM reviews WHERE product_id = p.id), 0) as review_count
            FROM products p
            LEFT JOIN categories c ON p.category_id = c.id
            WHERE p.id = $1
        `, [id]);

        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'Product not found' });
        }

        const product = {
            ...result.rows[0],
            price: Number(result.rows[0].price),
            rating: Number(result.rows[0].avg_rating),
            review_count: Number(result.rows[0].review_count),
            badges: result.rows[0].badges || [],
            images: result.rows[0].images || []
        };
        res.json(product);
    } catch (err: any) {
        console.error(err);
        res.status(500).json({ message: 'Error fetching product' });
    }
});

// GET /api/articles
app.get('/api/articles', async (req: Request, res: Response) => {
    try {
        const result = await pool.query('SELECT * FROM articles ORDER BY created_at DESC');
        res.json(result.rows);
    } catch (err: any) {
        console.error(err);
        res.status(500).json({ message: 'Error fetching articles' });
    }
});

// GET /api/articles/:id
app.get('/api/articles/:id', async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const result = await pool.query('SELECT * FROM articles WHERE id = $1', [id]);
        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'Article not found' });
        }
        res.json(result.rows[0]);
    } catch (err: any) {
        console.error(err);
        res.status(500).json({ message: 'Error fetching article' });
    }
});

// POST /api/products/batch
app.post('/api/products/batch', async (req: Request, res: Response) => {
    // Basic Authentication check
    const apiKey = req.headers['x-api-key'];
    const expectedKey = process.env.API_SECRET_KEY || 'default_insecure_key_change_me';

    if (!apiKey || apiKey !== expectedKey) {
        return res.status(401).json({ message: 'Unauthorized: Invalid or missing API key' });
    }

    const client = await pool.connect();
    try {
        const products = req.body;
        if (!Array.isArray(products)) {
            return res.status(400).json({ message: 'Request body must be an array of products' });
        }

        await client.query('BEGIN');
        let importedCount = 0;
        for (const product of products) {
            const { name, price, description, image, category, badges, rating } = product;

            // Basic validation
            if (!name || price === undefined) {
                continue; // Skip invalid products
            }

            await client.query(
                `INSERT INTO products (name, price, description, image, category, badges, rating)
                 VALUES ($1, $2, $3, $4, $5, $6, $7)
                 ON CONFLICT (name) DO UPDATE SET
                    price = EXCLUDED.price,
                    description = EXCLUDED.description,
                    image = EXCLUDED.image,
                    category = EXCLUDED.category,
                    badges = EXCLUDED.badges,
                    rating = EXCLUDED.rating`,
                [name, price, description || '', image || '', category || '', badges || [], rating || 0]
            );
            importedCount++;
        }
        await client.query('COMMIT');
        res.json({ message: `Successfully imported ${importedCount} products` });
    } catch (err: any) {
        await client.query('ROLLBACK');
        console.error('Batch import error:', err.message);
        // Do not leak raw DB error messages to the client
        res.status(500).json({ message: 'Internal server error during product import' });
    } finally {
        client.release();
    }
});

// AUTH ROUTES
app.post('/api/auth/register', async (req: Request, res: Response) => {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ message: 'Email and password required' });

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        return res.status(400).json({ message: 'Invalid email format' });
    }

    // Backend password complexity check
    if (password.length < 8) {
        return res.status(400).json({ message: 'Password must be at least 8 characters long' });
    }

    try {
        const hashedPassword = await hashPassword(password);
        const result = await pool.query(
            'INSERT INTO users (email, password_hash) VALUES ($1, $2) RETURNING id',
            [email, hashedPassword]
        );
        const token = generateToken(result.rows[0].id, 'user');
        res.status(201).json({ token, user: { email, role: 'user' } });
    } catch (err: any) {
        if (err.code === '23505') return res.status(400).json({ message: 'User already exists' });
        console.error(err);
        res.status(500).json({ message: 'Error registering user' });
    }
});

app.post('/api/auth/login', async (req: Request, res: Response) => {
    const { email, password } = req.body;
    const loginEmail = (email || '').trim().toLowerCase();
    console.log(`[DEBUG] Login attempt for email: ${loginEmail}`);
    try {
        const result = await pool.query('SELECT * FROM users WHERE email = $1', [loginEmail]);
        if (result.rows.length === 0) {
            console.log(`[DEBUG] User not found: ${email}`);
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        const user = result.rows[0];
        console.log(`[DEBUG] User found. Role: ${user.role}. Attempting password comparison...`);
        const valid = await comparePassword(password, user.password_hash);
        if (!valid) {
            console.log(`[DEBUG] Password mismatch for: ${email}`);
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        console.log(`[DEBUG] Login successful for: ${email}`);
        const token = generateToken(user.id, user.role);
        res.json({ token, user: { email: user.email, role: user.role } });
    } catch (err) {
        console.error('[ERROR] Login error:', err);
        res.status(500).json({ message: 'Login error' });
    }
});

// NEWSLETTER
app.post('/api/newsletter/subscribe', async (req: Request, res: Response) => {
    const { email } = req.body;
    if (!email) return res.status(400).json({ message: 'Email required' });
    try {
        await pool.query('INSERT INTO newsletter_subscribers (email) VALUES ($1) ON CONFLICT DO NOTHING', [email]);
        res.json({ message: 'Subscribed successfully' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Error subscribing' });
    }
});

// PROFILE & ORDERS
app.get('/api/profile', authenticateToken, async (req: Request, res: Response) => {
    try {
        const { userId } = (req as any).user;
        const result = await pool.query('SELECT id, email, role, created_at FROM users WHERE id = $1', [userId]);
        if (result.rows.length === 0) return res.status(404).json({ message: 'User not found' });
        res.json(result.rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Error fetching profile' });
    }
});

app.post('/api/orders', authenticateToken, async (req: Request, res: Response) => {
    const { items, total } = req.body;
    const { userId } = (req as any).user;
    const client = await pool.connect();
    try {
        await client.query('BEGIN');
        const orderResult = await client.query(
            'INSERT INTO orders (user_id, total, status) VALUES ($1, $2, $3) RETURNING id',
            [userId, total, 'pending']
        );
        const orderId = orderResult.rows[0].id;
        for (const item of items) {
            await client.query(
                'INSERT INTO order_items (order_id, product_id, quantity, price) VALUES ($1, $2, $3, $4)',
                [orderId, item.id, item.quantity, item.price]
            );
        }
        await client.query('COMMIT');
        res.status(201).json({ orderId, message: 'Order created' });
    } catch (err) {
        await client.query('ROLLBACK');
        console.error(err);
        res.status(500).json({ message: 'Error creating order' });
    } finally {
        client.release();
    }
});

app.get('/api/orders/history', authenticateToken, async (req: Request, res: Response) => {
    try {
        const { userId } = (req as any).user;
        const result = await pool.query(
            'SELECT * FROM orders WHERE user_id = $1 ORDER BY created_at DESC',
            [userId]
        );
        res.json(result.rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Error fetching history' });
    }
});

app.get('/api/orders/:id', authenticateToken, async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { userId, role } = (req as any).user;

        const result = await pool.query('SELECT * FROM orders WHERE id = $1', [id]);
        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'Order not found' });
        }

        const order = result.rows[0];

        // Authorization check: User must own the order OR be an admin
        if (order.user_id !== userId && role !== 'admin') {
            return res.status(403).json({ message: 'Unauthorized access to this order' });
        }

        // Fetch order items
        const itemsResult = await pool.query(
            'SELECT oi.*, p.name as product_name FROM order_items oi JOIN products p ON oi.product_id = p.id WHERE oi.order_id = $1',
            [id]
        );

        res.json({ ...order, items: itemsResult.rows });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Error fetching order details' });
    }
});

// ADMIN ROUTES (ORDERS)
app.get('/api/admin/orders', authenticateToken, isAdmin, async (req: Request, res: Response) => {
    try {
        const result = await pool.query(
            'SELECT o.*, u.email FROM orders o JOIN users u ON o.user_id = u.id ORDER BY o.created_at DESC'
        );
        res.json(result.rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Error fetching all orders' });
    }
});

app.patch('/api/admin/orders/:id/status', authenticateToken, isAdmin, async (req: Request, res: Response) => {
    const { id } = req.params;
    const { status } = req.body;
    try {
        const result = await pool.query(
            'UPDATE orders SET status = $1 WHERE id = $2 RETURNING *',
            [status, id]
        );
        if (result.rows.length === 0) return res.status(404).json({ message: 'Order not found' });
        res.json(result.rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Error updating order status' });
    }
});

// ADMIN PRODUCT CRUD
app.post('/api/admin/products', authenticateToken, isAdmin, async (req: Request, res: Response) => {
    const { name, price, description, images, category, badges, rating } = req.body;
    try {
        const result = await pool.query(
            `INSERT INTO products (name, price, description, images, category, badges, rating)
             VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
            [name, price, description, images || [], category || '', badges || [], rating || 0]
        );
        res.status(201).json(result.rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Error creating product' });
    }
});

app.put('/api/admin/products/:id', authenticateToken, isAdmin, async (req: Request, res: Response) => {
    const { id } = req.params;
    const { name, price, description, images, category, badges, rating } = req.body;
    try {
        const result = await pool.query(
            `UPDATE products SET name=$1, price=$2, description=$3, images=$4, category=$5, badges=$6, rating=$7
             WHERE id=$8 RETURNING *`,
            [name, price, description, images || [], category || '', badges || [], rating || 0, id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'Product not found' });
        }

        res.json(result.rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Error updating product' });
    }
});

app.delete('/api/admin/products/:id', authenticateToken, isAdmin, async (req: Request, res: Response) => {
    const { id } = req.params;
    try {
        const result = await pool.query('DELETE FROM products WHERE id = $1 RETURNING id', [id]);
        if (result.rows.length === 0) return res.status(404).json({ message: 'Product not found' });
        res.json({ message: 'Product deleted', id: result.rows[0].id });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Error deleting product' });
    }
});

// ADMIN UPLOAD
app.post('/api/admin/upload', authenticateToken, isAdmin, upload.single('image'), (req: Request, res: Response) => {
    const file = (req as any).file;
    if (!file) {
        return res.status(400).json({ message: 'No file uploaded' });
    }
    const imageUrl = `${req.protocol}://${req.get('host')}/uploads/${file.filename}`;
    res.json({ imageUrl });
});

// ADMIN CATEGORY CRUD
app.get('/api/categories', async (req: Request, res: Response) => {
    try {
        const result = await pool.query('SELECT * FROM categories ORDER BY name ASC');
        res.json(result.rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Error fetching categories' });
    }
});

app.post('/api/admin/categories', authenticateToken, isAdmin, async (req: Request, res: Response) => {
    const { name, slug, image_url } = req.body;
    try {
        const result = await pool.query(
            'INSERT INTO categories (name, slug, image_url) VALUES ($1, $2, $3) RETURNING *',
            [name, slug, image_url]
        );
        res.status(201).json(result.rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Error creating category' });
    }
});

app.put('/api/admin/categories/:id', authenticateToken, isAdmin, async (req: Request, res: Response) => {
    const { id } = req.params;
    const { name, slug, image_url } = req.body;
    try {
        const result = await pool.query(
            'UPDATE categories SET name=$1, slug=$2, image_url=$3 WHERE id=$4 RETURNING *',
            [name, slug, image_url, id]
        );
        if (result.rows.length === 0) return res.status(404).json({ message: 'Category not found' });
        res.json(result.rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Error updating category' });
    }
});

app.delete('/api/admin/categories/:id', authenticateToken, isAdmin, async (req: Request, res: Response) => {
    const { id } = req.params;
    try {
        await pool.query('DELETE FROM categories WHERE id = $1', [id]);
        res.json({ message: 'Category deleted' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Error deleting category' });
    }
});

// ADMIN ATTRIBUTE CRUD
app.get('/api/attributes', async (req: Request, res: Response) => {
    try {
        const result = await pool.query('SELECT * FROM attributes ORDER BY name ASC');
        res.json(result.rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Error fetching attributes' });
    }
});

app.post('/api/admin/attributes', authenticateToken, isAdmin, async (req: Request, res: Response) => {
    const { name, icon_url } = req.body;
    try {
        const result = await pool.query(
            'INSERT INTO attributes (name, icon_url) VALUES ($1, $2) RETURNING *',
            [name, icon_url]
        );
        res.status(201).json(result.rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Error creating attribute' });
    }
});

app.put('/api/admin/attributes/:id', authenticateToken, isAdmin, async (req: Request, res: Response) => {
    const { id } = req.params;
    const { name, icon_url } = req.body;
    try {
        const result = await pool.query(
            'UPDATE attributes SET name=$1, icon_url=$2 WHERE id=$3 RETURNING *',
            [name, icon_url, id]
        );
        if (result.rows.length === 0) return res.status(404).json({ message: 'Attribute not found' });
        res.json(result.rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Error updating attribute' });
    }
});

app.delete('/api/admin/attributes/:id', authenticateToken, isAdmin, async (req: Request, res: Response) => {
    const { id } = req.params;
    try {
        await pool.query('DELETE FROM attributes WHERE id = $1', [id]);
        res.json({ message: 'Attribute deleted' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Error deleting attribute' });
    }
});

// ADMIN ARTICLE CRUD
app.post('/api/admin/articles', authenticateToken, isAdmin, async (req: Request, res: Response) => {
    const { title, content, image_url, author } = req.body;
    try {
        const result = await pool.query(
            'INSERT INTO articles (title, content, image_url, author) VALUES ($1, $2, $3, $4) RETURNING *',
            [title, content, image_url, author || 'Starsano']
        );
        res.status(201).json(result.rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Error creating article' });
    }
});

app.put('/api/admin/articles/:id', authenticateToken, isAdmin, async (req: Request, res: Response) => {
    const { id } = req.params;
    const { title, content, image_url, author } = req.body;
    try {
        const result = await pool.query(
            'UPDATE articles SET title=$1, content=$2, image_url=$3, author=$4 WHERE id=$5 RETURNING *',
            [title, content, image_url, author, id]
        );
        if (result.rows.length === 0) return res.status(404).json({ message: 'Article not found' });
        res.json(result.rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Error updating article' });
    }
});

app.delete('/api/admin/articles/:id', authenticateToken, isAdmin, async (req: Request, res: Response) => {
    const { id } = req.params;
    try {
        const result = await pool.query('DELETE FROM articles WHERE id = $1 RETURNING id', [id]);
        if (result.rows.length === 0) return res.status(404).json({ message: 'Article not found' });
        res.json({ message: 'Article deleted', id: result.rows[0].id });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Error deleting article' });
    }
});

// GET /api/admin/newsletter
app.get('/api/admin/newsletter', authenticateToken, isAdmin, async (req: Request, res: Response) => {
    try {
        const result = await pool.query('SELECT * FROM newsletter_subscribers ORDER BY created_at DESC');
        res.json(result.rows);
    } catch (err: any) {
        console.error(err);
        res.status(500).json({ message: 'Error fetching newsletter subscribers' });
    }
});

app.delete('/api/admin/articles/all', authenticateToken, isAdmin, async (req: Request, res: Response) => {
    try {
        await pool.query('DELETE FROM articles');
        res.json({ message: 'All articles deleted' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Error deleting articles' });
    }
});

// AI ARTICLE GENERATION
app.post('/api/admin/articles/generate', authenticateToken, isAdmin, async (req: Request, res: Response) => {
    try {
        // We call the seo-writer service inside the docker-compose network
        const response = await fetch('http://seo-writer:8001/generate', {
            method: 'POST'
        });
        
        const data = await response.json();
        
        if (!response.ok) {
            console.error('AI agent service error:', data);
            return res.status(500).json({ message: 'Error en el servicio de generación de IA', details: data });
        }
        
        res.json({ message: 'Artículo generado con éxito', details: data });
    } catch (err: any) {
        console.error('Error connecting to AI agent service:', err.message);
        res.status(500).json({ message: 'No se pudo conectar con el servicio de IA', error: err.message });
    }
});



// ADMIN MANUAL IMPORT
app.post('/api/admin/import', authenticateToken, isAdmin, async (req: Request, res: Response) => {
    try {
        await autoImportProducts();
        res.json({ message: 'Importación completada con éxito' });
    } catch (err: any) {
        console.error(err);
        res.status(500).json({ message: 'Error durante la importación: ' + err.message });
    }
});

// Helper to wait for DB to be ready
async function waitForDB(retries = 15, delay = 2000) {
    for (let i = 0; i < retries; i++) {
        try {
            const client = await pool.connect();
            client.release();
            console.log('✅ Database is ready.');
            return true;
        } catch (err) {
            console.log(`⏳ Waiting for database... (attempt ${i + 1}/${retries})`);
            await new Promise(resolve => setTimeout(resolve, delay));
        }
    }
    return false;
}

// Auto-import products from CSV on startup
async function autoImportProducts() {
    const csvPath = path.join(process.cwd(), 'products_template.csv');
    if (!fs.existsSync(csvPath)) {
        console.log('No products_template.csv found, skipping auto-import.');
        return;
    }

    console.log(`Found products_template.csv at ${csvPath}, starting auto-import...`);
    try {
        const fileContent = fs.readFileSync(csvPath, 'utf-8');
        const records = parse(fileContent, {
            columns: true,
            skip_empty_lines: true,
            trim: true,
            relax_column_count: true,
            skip_records_with_error: true
        });

        const client = await pool.connect();
        try {
            await client.query('BEGIN');

            // 1. Process Categories
            const uniqueCategories = Array.from(new Set(records.map((r: any) => r.category).filter(Boolean)));
            const categoryMap = new Map();

            for (const catName of uniqueCategories) {
                const slug = (catName as string).toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]/g, '');
                const catResult = await client.query(
                    `INSERT INTO categories (name, slug) VALUES ($1, $2)
                     ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name
                     RETURNING id`,
                    [catName, slug]
                );
                categoryMap.set(catName, catResult.rows[0].id);
            }

            // 2. Process Attributes (Badges)
            const allBadges = new Set<string>();
            records.forEach((r: any) => {
                if (!r.badges) return;
                let badgesArr = [];
                try {
                    badgesArr = (typeof r.badges === 'string' && r.badges.trim().startsWith('['))
                        ? JSON.parse(r.badges)
                        : r.badges.split(',').map((s: string) => s.trim());
                } catch (e) {
                    badgesArr = r.badges.split(',').map((s: string) => s.trim());
                }
                badgesArr.forEach((b: string) => { if (b) allBadges.add(b); });
            });

            const attributeMap = new Map();
            for (const attrName of Array.from(allBadges)) {
                const attrResult = await client.query(
                    `INSERT INTO attributes (name) VALUES ($1)
                     ON CONFLICT (name) DO NOTHING
                     RETURNING id`,
                    [attrName]
                );

                if (attrResult.rows.length > 0) {
                    attributeMap.set(attrName, attrResult.rows[0].id);
                } else {
                    const existing = await client.query('SELECT id FROM attributes WHERE name = $1', [attrName]);
                    attributeMap.set(attrName, existing.rows[0].id);
                }
            }

            // 3. Process Products
            for (const record of records) {
                if (!record.name || !record.price) continue;

                const categoryId = categoryMap.get(record.category) || null;

                // Handle single image or array from CSV
                let imagesArr = [];
                try {
                    imagesArr = (typeof record.image === 'string' && record.image.trim().startsWith('['))
                        ? JSON.parse(record.image)
                        : (record.image ? [record.image] : []);
                } catch (e) {
                    imagesArr = record.image ? [record.image] : [];
                }

                const productResult = await client.query(
                    `INSERT INTO products (name, price, description, images, category, category_id, rating)
                     VALUES ($1, $2, $3, $4, $5, $6, $7)
                     ON CONFLICT (name) DO UPDATE SET
                        price = EXCLUDED.price,
                        description = EXCLUDED.description,
                        images = EXCLUDED.images,
                        category = EXCLUDED.category,
                        category_id = EXCLUDED.category_id,
                        rating = EXCLUDED.rating
                     RETURNING id`,
                    [
                        record.name,
                        parseFloat(record.price) || 0,
                        record.description || '',
                        imagesArr,
                        record.category || '',
                        categoryId,
                        parseFloat(record.rating) || 0
                    ]
                );

                const productId = productResult.rows[0].id;

                // Sync Attributes
                let productBadges = [];
                try {
                    productBadges = (typeof record.badges === 'string' && record.badges.trim().startsWith('['))
                        ? JSON.parse(record.badges)
                        : (record.badges ? record.badges.split(',').map((s: string) => s.trim()) : []);
                } catch (e) {
                    productBadges = record.badges ? record.badges.split(',').map((s: string) => s.trim()) : [];
                }

                await client.query('DELETE FROM product_attributes WHERE product_id = $1', [productId]);
                for (const badge of productBadges) {
                    if (!badge) continue;
                    const attrId = attributeMap.get(badge);
                    if (attrId) {
                        await client.query(
                            'INSERT INTO product_attributes (product_id, attribute_id) VALUES ($1, $2) ON CONFLICT DO NOTHING',
                            [productId, attrId]
                        );
                    }
                }
            }

            await client.query('COMMIT');
            console.log(`✅ Auto-import successful: ${records.length} records processed.`);
        } catch (err: any) {
            await client.query('ROLLBACK');
            console.error('❌ Error during database transaction:', err.message);
        } finally {
            client.release();
        }
    } catch (err: any) {
        console.error('❌ Failed to parse CSV for auto-import:', err.message);
    }
}


async function ensureAdminUser() {
    console.log('[DEBUG] Starting ensureAdminUser...');
    const adminEmail = (process.env.ADMIN_EMAIL || 'admin@starsano.com.mx').trim().toLowerCase();
    const adminPass = process.env.ADMIN_PASSWORD || 'ChangeMeAtStartup123!';

    try {
        const hashed = await hashPassword(adminPass);
        console.log(`[DEBUG] Syncing admin: ${adminEmail}`);

        // Let's check what users we have first (debug only)
        const allUsers = await pool.query('SELECT email, role FROM users');
        console.log(`[DEBUG] Current users in DB: ${allUsers.rows.length}`);
        allUsers.rows.forEach(u => console.log(` - ${u.email} (${u.role})`));

        await pool.query(
            `INSERT INTO users (email, password_hash, role) 
             VALUES ($1, $2, 'admin')
             ON CONFLICT (email) DO UPDATE SET password_hash = $2, role = 'admin'`,
            [adminEmail, hashed]
        );
        console.log(`[DEBUG] ✅ Admin user synced successfully: ${adminEmail}`);
    } catch (err: any) {
        console.error('[ERROR] Error in ensureAdminUser:', err);
    }
}

app.listen(port, async () => {
    console.log(`[DEBUG] Server listening on port ${port}`);
    console.log('[DEBUG] --- STARTING INITIALIZATION SEQUENCE ---');

    // 1. Wait for Database to be ready (critical)
    const dbReady = await waitForDB();
    if (!dbReady) {
        console.error('[ERROR] CRITICAL: Database not ready after multiple attempts. Initialization aborted.');
        process.exit(1);
    }

    // 2. Sync Admin User (important)
    try {
        await ensureAdminUser();
        console.log('[DEBUG] ensureAdminUser process completed');
    } catch (err) {
        console.error('[ERROR] ensureAdminUser failed to complete:', err);
    }

    // 3. Import Data and Articles
    try {
        console.log('[DEBUG] Starting background migrations and imports...');
        await Promise.all([
            autoImportProducts().catch(err => console.error('[ERROR] autoImportProducts failed:', err))
        ]);
        console.log('[DEBUG] Background initialization tasks finished');
    } catch (err) {
        console.error('[ERROR] Background tasks failed:', err);
    }

    console.log('[DEBUG] --- INITIALIZATION COMPLETED ---');
});
