import express, { Request, Response } from 'express';
import cors from 'cors';
import { Pool } from 'pg';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { parse } from 'csv-parse/sync';

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

// POST /api/products/batch
app.post('/api/products/batch', async (req: Request, res: Response) => {
    const client = await pool.connect();
    try {
        const products = req.body;
        if (!Array.isArray(products)) {
            return res.status(400).json({ message: 'Request body must be an array of products' });
        }

        await client.query('BEGIN');
        for (const product of products) {
            const { name, price, description, image, category, badges, rating } = product;
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
                [name, price, description, image, category, badges || [], rating || 0]
            );
        }
        await client.query('COMMIT');
        res.json({ message: `Successfully imported ${products.length} products` });
    } catch (err: any) {
        await client.query('ROLLBACK');
        console.error(err);
        res.status(500).json({ message: 'Error importing products', error: err.message });
    } finally {
        client.release();
    }
});

// Helper to wait for DB to be ready
async function waitForDB(retries = 5, delay = 2000) {
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
    if (!(await waitForDB())) {
        console.error('❌ Could not connect to database. Skipping auto-import.');
        return;
    }

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

app.listen(port, () => {
    console.log(`Server running on port ${port}`);
    autoImportProducts().catch(err => console.error('Unhandled auto-import error:', err));
});
