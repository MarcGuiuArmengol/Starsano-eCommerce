import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import Badge from '../components/Badge';

const ProductDetail: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const [product, setProduct] = useState<any>(null); // Use existing Product type if possible but 'any' for speed with badges array from DB
    const [loading, setLoading] = useState(true);
    const { addToCart } = useCart();
    const [quantity, setQuantity] = useState(1);
    const [activeTab, setActiveTab] = useState('description');

    React.useEffect(() => {
        if (!id) return;
        fetch(`/api/products/${id}`)
            .then(res => {
                if (!res.ok) throw new Error('Product not found');
                return res.json();
            })
            .then(data => {
                setProduct(data);
                setLoading(false);
            })
            .catch(err => {
                console.error(err);
                setLoading(false);
            });
    }, [id]);

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
            </div>
        );
    }

    if (!product) {
        return (
            <div className="min-h-[60vh] flex flex-col items-center justify-center">
                <h2 className="text-2xl font-bold text-foreground">Producto no encontrado</h2>
                <Link to="/shop" className="text-secondary border-b border-secondary hover:text-foreground mt-4 pb-1">Volver a la tienda</Link>
            </div>
        );
    }

    return (
        <div className="bg-background min-h-screen pb-20">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
                {/* Breadcrumbs */}
                <nav className="flex text-xs text-secondary uppercase tracking-wider mb-8">
                    <Link to="/" className="hover:text-primary">Inicio</Link>
                    <span className="mx-2 text-background-contrast">/</span>
                    <Link to="/shop" className="hover:text-primary">Tienda</Link>
                    <span className="mx-2 text-background-contrast">/</span>
                    <span className="text-foreground font-bold">{product.name}</span>
                </nav>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20">
                    {/* Gallery */}
                    <div className="space-y-4">
                        <div className="aspect-square bg-white overflow-hidden shadow-sm">
                            <img src={product.image} alt={product.name} className="w-full h-full object-cover" />
                        </div>
                        {/* Mock thumbnails */}
                        <div className="grid grid-cols-4 gap-4">
                            {[1, 2, 3, 4].map((i) => (
                                <div key={i} className={`aspect-square bg-white cursor-pointer hover:opacity-75 transition-opacity ${i === 1 ? 'ring-1 ring-primary' : ''}`}>
                                    <img src={product.image} className="w-full h-full object-cover" alt="Thumbnail" />
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Info */}
                    <div className="pt-4">
                        <div className="mb-6 flex gap-2">
                            {product.badges?.map(b => <Badge key={b} text={b} />)}
                        </div>

                        <h1 className="text-4xl md:text-5xl text-foreground mb-4 leading-tight">{product.name}</h1>

                        <div className="flex items-center gap-4 mb-8">
                            <div className="flex items-center text-accent">
                                <span className="material-symbols-outlined filled text-lg">star</span>
                                <span className="material-symbols-outlined filled text-lg">star</span>
                                <span className="material-symbols-outlined filled text-lg">star</span>
                                <span className="material-symbols-outlined filled text-lg">star</span>
                                <span className="material-symbols-outlined filled text-lg">star_half</span>
                            </div>
                            <span className="text-xs font-bold uppercase tracking-widest text-secondary border-b border-secondary/30 pb-0.5 cursor-pointer hover:text-primary">
                                Leer {product.rating || 5} Reseñas
                            </span>
                        </div>

                        <div className="text-3xl font-light text-foreground mb-8">
                            {product.price.toFixed(2)} €
                        </div>

                        <p className="text-secondary leading-relaxed mb-10 font-light text-lg">
                            {product.description}
                        </p>

                        {/* Actions */}
                        <div className="bg-white p-6 border border-background-contrast/20 mb-10">
                            <div className="flex flex-col sm:flex-row gap-4">
                                <div className="flex items-center border border-background-contrast/50 w-full sm:w-32 bg-background">
                                    <button
                                        onClick={() => setQuantity(Math.max(1, quantity - 1))}
                                        className="px-4 py-3 hover:text-primary transition-colors text-xl"
                                    >-</button>
                                    <input
                                        type="number"
                                        value={quantity}
                                        readOnly
                                        className="w-full text-center bg-transparent border-none focus:ring-0 font-bold text-foreground"
                                    />
                                    <button
                                        onClick={() => setQuantity(quantity + 1)}
                                        className="px-4 py-3 hover:text-primary transition-colors text-xl"
                                    >+</button>
                                </div>
                                <button
                                    onClick={() => addToCart(product, quantity)}
                                    className="flex-1 bg-primary text-primary-foreground font-bold text-sm uppercase tracking-widest py-4 px-8 hover:bg-accent hover:text-white transition-all shadow-md"
                                >
                                    Añadir al carrito
                                </button>
                            </div>
                            <div className="mt-4 flex items-center gap-2 text-xs text-secondary justify-center sm:justify-start">
                                <span className="material-symbols-outlined text-sm text-green-600">check_circle</span>
                                <span>Disponible en stock</span>
                                <span className="mx-2 text-background-contrast">|</span>
                                <span className="material-symbols-outlined text-sm">local_shipping</span>
                                <span>Envío en 24/48h</span>
                            </div>
                        </div>

                        {/* Tabs */}
                        <div>
                            <div className="flex gap-8 border-b border-background-contrast/20 mb-8">
                                {['description', 'ingredients', 'shipping'].map(tab => (
                                    <button
                                        key={tab}
                                        onClick={() => setActiveTab(tab)}
                                        className={`pb-4 text-xs font-bold uppercase tracking-widest border-b-2 transition-colors ${activeTab === tab ? 'border-primary text-primary' : 'border-transparent text-secondary hover:text-foreground'}`}
                                    >
                                        {tab === 'description' ? 'Descripción' : tab === 'ingredients' ? 'Ingredientes' : 'Envíos'}
                                    </button>
                                ))}
                            </div>
                            <div className="text-secondary font-light leading-relaxed animate-fadeIn">
                                {activeTab === 'description' && (
                                    <div className="space-y-4">
                                        <p>Este producto ha sido seleccionado cuidadosamente por nuestros expertos en nutrición. Garantizamos su origen natural y procesos sostenibles que respetan tanto tu cuerpo como el medio ambiente.</p>
                                        <p>Perfecto para complementar tu dieta diaria con nutrientes de alta calidad, sin aditivos innecesarios ni procesados agresivos.</p>
                                    </div>
                                )}
                                {activeTab === 'ingredients' && (
                                    <div className="bg-white p-6 border border-background-contrast/10">
                                        <h4 className="font-heading font-bold text-sm uppercase mb-4">Lista completa</h4>
                                        <ul className="list-disc pl-5 space-y-2 text-sm">
                                            <li>100% {product.name.split(' ')[0]} orgánico de cultivo controlado.</li>
                                            <li>Sin conservantes artificiales ni colorantes.</li>
                                            <li>Libre de GMO (Organismos Genéticamente Modificados).</li>
                                            <li>Envasado en atmósfera protectora para garantizar frescura.</li>
                                        </ul>
                                    </div>
                                )}
                                {activeTab === 'shipping' && (
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <div className="border border-background-contrast/20 p-4">
                                            <span className="material-symbols-outlined text-2xl mb-2 text-primary">local_shipping</span>
                                            <p className="font-bold text-sm mb-1">Envío Estándar</p>
                                            <p className="text-xs">2-3 días laborables (3.95€)</p>
                                        </div>
                                        <div className="border border-background-contrast/20 p-4">
                                            <span className="material-symbols-outlined text-2xl mb-2 text-primary">rocket_launch</span>
                                            <p className="font-bold text-sm mb-1">Envío Express</p>
                                            <p className="text-xs">24h laborables (5.95€)</p>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ProductDetail;