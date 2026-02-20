CREATE TABLE IF NOT EXISTS products (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    price DECIMAL(10, 2) NOT NULL,
    image TEXT,
    category VARCHAR(100),
    badges TEXT[],
    rating DECIMAL(2, 1),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO products (name, price, description, image, category, badges, rating) VALUES
('Mantequilla de Almendras', 8.50, '100% natural, sin aditivos. Perfecta para untar o añadir a tus batidos proteicos.', 'https://lh3.googleusercontent.com/aida-public/AB6AXuBQH8efSf55dRiSihq8QOyOxTxKNVoAmGN4wJ-6M7Ps4nz5VP8DrckXIExBcTl34p9Mw37BHcE2KXFTrXRwU81XiQXuSGVas6wZSZ3IXTEnLDRWEmitCcLGtrzj39x0dkxBt39BuKlcOse3GehAfdeONvv708sZOUt37Up48pkZYQ-SfGixM3NRbzfoI2jkacVu-RrjvCqKLbbGGFNmDkAxxnOn7Ox_XPZBf1vnsFVWURVT5sAlnHx2rd0OaMM_CMPy3UpwQVCewPs', 'snacks', ARRAY['Organic', 'Keto'], 4.8),
('Quinoa Real Blanca', 4.95, 'Altamente nutritiva, 500g. Fuente excelente de proteína vegetal y fibra.', 'https://lh3.googleusercontent.com/aida-public/AB6AXuAFWhbhncBfTLJV1f4psa9yICQJDsj872swMKsNk5krFc1y1fWUQT29-Dj3jp8BoWvGobA9JhsozevG0HbK-7k9Gb_bhO4ZnmrnxB0c1MLezWO_NrEVYRLj57muWTDhP-uzvnEGRtlCx4rAK_IFIEKLZQ2NCdteJ62eVyPlz2EgSJCbCYC9IMCwwCzOns-8S0cxNLjHCZsymrICy2fxwl2aOemNxsgXdrltJuELgZViXHw1gYmjfBNKEg9L8wlgmLRz51bRFflvUGM', 'gluten-free', ARRAY['Organic', 'Gluten Free'], 4.5),
('Granola Crunchy Sin Azúcar', 6.20, 'Mix de avena y nueces horneado lentamente para obtener el crujido perfecto sin azúcar añadido.', 'https://lh3.googleusercontent.com/aida-public/AB6AXuAepgR8kq9BVR6YalmFWYPrgQNBlx7ArVYtZuOmt1GZiE6NKM8WthQgcVLywKtNTQ5WsvF75Nop-AGxlN4HLEdSNaxYigRMTvC75SrlqIEyQUBxExsZsrTRXA6Wj41Zx1AwipV0qrb_2meHRP3XyqovQz75drSJ4eXTNvX-AswDuDw6u8TzzzWW7DRxnrzfyLH2TiZZYB8mZEjspdS-Dan_SrVo59aK7rw6n0r_XkajXVlhuJTnLr2zq4lXIaBFKQ93N5s9OZFaVUQ', 'snacks', ARRAY['Sugar Free'], 4.9),
('Harina de Almendras Fina', 12.90, 'Ideal para repostería Keto. Molienda extra fina para macarons y bizcochos esponjosos.', 'https://lh3.googleusercontent.com/aida-public/AB6AXuAbfUwLr7m8wxoMLTtLrwbBw9kAICddplwb7aJmtqoq6TeLwv4bvB-fby4jKxTZ6v9Q2z83xvVe7vIt5-E3KRozsJf1GK0dZW3pvhv2ESoFqZSfhoenOJl4LWZwmCZ5sLnHBQ-mvCrxsML8yIQ-J-KzP5paDgUBSNhBYekUmkV4ngw7PfdUtn4HbLAii8asQ61OT1TrmeviNXQLOO4gUgZyqJTMDvfvbeXtnYi8DpnCQRW-FKTKKuX9zIiYjopaBU_XKuZwBjwuuoA', 'flours', ARRAY['Keto', 'Gluten Free'], 4.7),
('Aceite de Coco Virgen', 9.50, 'Prensado en frío, 500ml. Ideal para cocinar a altas temperaturas o cuidado personal.', 'https://picsum.photos/id/102/800/800', 'sweeteners', ARRAY['Organic', 'Keto'], 4.6),
('Pasta de Lentejas Rojas', 3.80, 'Rica en proteínas y fibra. Una alternativa saludable a la pasta tradicional.', 'https://picsum.photos/id/292/800/800', 'gluten-free', ARRAY['Gluten Free', 'High Protein'], 4.4);
