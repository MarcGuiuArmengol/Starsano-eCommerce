import express, { Request, Response } from 'express';
import cors from 'cors';
import { Pool } from 'pg';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import multer from 'multer';
import { parse } from 'csv-parse/sync';
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

    if (!token) return res.status(401).json({ message: 'Missing token' });

    const user = verifyToken(token);
    if (!user) return res.status(403).json({ message: 'Invalid token' });

    (req as any).user = user;
    next();
};

const isAdmin = (req: Request, res: Response, next: any) => {
    if ((req as any).user?.role !== 'admin') {
        return res.status(403).json({ message: 'Admin access required' });
    }
    next();
};

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
        const result = await pool.query('SELECT * FROM products ORDER BY id DESC');
        // Convert price to number if it comes as string from postgres
        const products = result.rows.map((row: any) => ({
            ...row,
            price: Number(row.price),
            rating: Number(row.rating)
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
        const result = await pool.query('SELECT * FROM products WHERE id = $1', [id]);

        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'Product not found' });
        }

        const product = {
            ...result.rows[0],
            price: Number(result.rows[0].price),
            rating: Number(result.rows[0].rating)
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

// ADMIN ROUTES (GET ALL ORDERS)
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

// ADMIN PRODUCT CRUD
app.post('/api/admin/products', authenticateToken, isAdmin, async (req: Request, res: Response) => {
    const { name, price, description, image, category, badges, rating } = req.body;
    try {
        const result = await pool.query(
            `INSERT INTO products (name, price, description, image, category, badges, rating)
             VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
            [name, price, description, image, category, badges || [], rating || 0]
        );
        res.status(201).json(result.rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Error creating product' });
    }
});

app.put('/api/admin/products/:id', authenticateToken, isAdmin, async (req: Request, res: Response) => {
    const { id } = req.params;
    const { name, price, description, image, category, badges, rating } = req.body;
    try {
        const result = await pool.query(
            `UPDATE products SET name=$1, price=$2, description=$3, image=$4, category=$5, badges=$6, rating=$7
             WHERE id=$8 RETURNING *`,
            [name, price, description, image, category, badges, rating, id]
        );
        if (result.rows.length === 0) return res.status(404).json({ message: 'Product not found' });
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
    // Note: We now wait for DB in the main app.listen loop
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
            // Ensure UNIQUE constraint exists for 'name'
            // If it fails, maybe there are already duplicates, we handle that by logging
            try {
                await client.query(`
                    DO $$ 
                    BEGIN 
                        IF NOT EXISTS (
                            SELECT 1 FROM pg_constraint WHERE conname = 'products_name_key'
                        ) THEN 
                            ALTER TABLE products ADD CONSTRAINT products_name_key UNIQUE (name);
                        END IF;
                    END $$;
                `);
            } catch (constrErr: any) {
                console.warn('⚠️ Warning: Could not ensure UNIQUE constraint on name:', constrErr.message);
                console.log('This usually happens if there are already duplicate names in the DB.');
            }

            await client.query('BEGIN');
            for (const record of records) {
                if (!record.name || !record.price) continue;

                // Parse badges if they are JSON strings
                let badges = [];
                try {
                    const b = record.badges || '[]';
                    badges = (typeof b === 'string' && b.trim().startsWith('['))
                        ? JSON.parse(b)
                        : (b ? b.split(',').map((s: string) => s.trim()) : []);
                } catch (e) {
                    badges = record.badges ? record.badges.split(',').map((s: string) => s.trim()) : [];
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
                    [
                        record.name,
                        parseFloat(record.price) || 0,
                        record.description || '',
                        record.image || '',
                        record.category || '',
                        badges,
                        parseFloat(record.rating) || 0
                    ]
                );
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

async function autoMigrationArticles() {
    const client = await pool.connect();
    try {
        // Ensure table exists
        await client.query(`
            CREATE TABLE IF NOT EXISTS articles (
                id SERIAL PRIMARY KEY,
                title TEXT NOT NULL,
                content TEXT NOT NULL,
                image_url TEXT,
                author TEXT DEFAULT 'Starsano',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);

        const check = await client.query('SELECT COUNT(*) FROM articles');
        if (parseInt(check.rows[0].count) > 0) return;

        console.log('Migrating initial articles...');
        const oldArticles = [
            {
                title: "Stevia Liquida: Tu Mejor Aliado para un Estilo de Vida Keto",
                content: "<p>La stevia líquida de Starsano es el acompañamiento perfecto para quienes buscan reducir el consumo de azúcar sin sacrificar el sabor. Al ser de origen natural, no provoca picos de glucosa, lo que la hace ideal para diabéticos y seguidores de la dieta keto.</p>",
                image_url: "https://lh3.googleusercontent.com/aida-public/AB6AXuC56lFh9q9EJjnaYUtvXarSOWMM-BRMAryqudEVPVxWih1y2Q9uBEz1lpCXSpmbDKoFaFLIF1_MqEl4AL2fiqxbRSDbK96jCxaqsPJWwKNogGyvOieENbmnFwy84WSyBInwOpnNHtnzoVE95V_A541cpge4-3J04LQjGfRsz2XjeYy-cRg6crWseaAtf_XdPPhGQaSNvO--7y0aMIPmrqS-E2V2AkHBEjS8R0W7Ywgxhd09QCDr5U5mDI9aJkYmwbrM6zb1wp3hiug"
            },
            {
                title: "Harina de Almendras: Secretos para Repostería Saludable",
                content: "<p>Cocinar con harina de almendras abre un mundo de posibilidades para quienes evitan el gluten o buscan harinas bajas en carbohidratos.</p>",
                image_url: "https://lh3.googleusercontent.com/aida-public/AB6AXuBbDY3Vm2itOVLLs4spQE4oVqPmdaeBsm7Mo_t6K-MXyYQK9JbRHcLXn4en_8queSFSHi-CPYnnlM_iKZsLxdqmkFODwD4p_FspFmksS7lIbcDxbQAwcv3mMFQCcvROu9JtfRREGhsVWbSGC166G_xzVV6InwzudOUpHTIrfxvma6x4uMEVkRZz7nhAadh4OX7NCkujTd32je0i4tkNMxJGPoU4q4jkTAtUM_0wtF1s2txa_I3rp92QJCoNmOgpCI2_XQv5bWWXh80"
            },
            {
                title: "Guía de Endulzantes Naturales: Más Allá del Azúcar",
                content: "<p>Elegir el endulzante adecuado puede ser confuso. El Fruto del Monje (Monk Fruit) es excelente por su potencia y falta de calorías.</p>",
                image_url: "https://lh3.googleusercontent.com/aida-public/AB6AXuDaOwOw_rTkUkKYOFtAxGRth7K4CJo9JOGDwxCRBHGArH9Jmnwnq5nednE-EimlynoDB48lK1V5_ZlBaG4vbA9oFUSWfhPwEQ-qbve7rtiGf9muMgmkb2oz9_E_2u6kkPDkL2zuNiWrQoDSnpPtafsDe3RABhUJEotQwWF1nFeNosnkGpNEhRZLaJDGRYmmq7S7FbnFdGd-3G4caszPs3gEvCTFrslhKqV11ZEgf-XU7fll15QllK0zZLR9Dn0Vm9_N-3qWk8oACLM"
            },
            {
                title: "Vivir Sin Gluten: Consejos para una Transición Exitosa",
                content: "<p>Empezar una dieta libre de gluten no tiene por qué ser abrumador. El secreto está en enfocarse en los alimentos naturalmente libres de esta proteína.</p>",
                image_url: "https://lh3.googleusercontent.com/aida-public/AB6AXuC-MQKf1Xtg4Q4wiuljZ7Q2udgX5iUPv2WKEpYhCbQcVYpKR4a2J1LWLaaY0CLHZekMy8rNmSauYJgxMn8_Nx4Tg8EkDL7bKctacoLTJXKlxSKIXO--YpftS_j5XDQ5JCTPUStCfw3p9sFZg19CByA1eRl0RNep8Vek4wuUQAr0k29SorxMPvnnI6OhUrrDsCcV642ngL6HM8gyox2Kqbfo4oZ79nWQihXqmOGUftlaoaIz8AVFmJutxpj-H38Ewpx-r6sIr8WFVfk"
            }
        ];

        for (const art of oldArticles) {
            await client.query(
                "INSERT INTO articles (title, content, image_url) VALUES ($1, $2, $3)",
                [art.title, art.content, art.image_url]
            );
        }
        console.log('✅ Articles migrated successfully.');
    } catch (err: any) {
        console.error('❌ Error migrating articles:', err.message);
    } finally {
        client.release();
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
            autoImportProducts().catch(err => console.error('[ERROR] autoImportProducts failed:', err)),
            autoMigrationArticles().catch(err => console.error('[ERROR] autoMigrationArticles failed:', err))
        ]);
        console.log('[DEBUG] Background initialization tasks finished');
    } catch (err) {
        console.error('[ERROR] Background tasks failed:', err);
    }

    console.log('[DEBUG] --- INITIALIZATION COMPLETED ---');
});
