import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import Badge from '../components/Badge';
import { api } from '../services/api';

// Import icons
import organicoIcon from '../icons/organico.png';
import sinAzucarIcon from '../icons/sin-azucar.png';
import sinGlutenIcon from '../icons/sin-gluten.png';
import ketoIcon from '../icons/keto.png';
import veganoIcon from '../icons/vegano.png';
import naturalIcon from '../icons/natural.png';
import integralIcon from '../icons/integral.png';

const ProductDetail: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const [product, setProduct] = useState<any>(null); // Use existing Product type if possible but 'any' for speed with badges array from DB
    const [loading, setLoading] = useState(true);
    const { addToCart } = useCart();
    const [quantity, setQuantity] = useState(1);
    const [activeTab, setActiveTab] = useState('description');

    const attributeIcons: Record<string, string> = {
        'organic': organicoIcon,
        'sugar-free': sinAzucarIcon,
        'gluten-free': sinGlutenIcon,
        'keto': ketoIcon,
        'vegan': veganoIcon,
        'natural': naturalIcon,
        'integral': integralIcon
    };

    React.useEffect(() => {
        if (!id) return;
        api.getProductById(id)
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
                            {product.badges?.map((b: string) => <Badge key={b} text={b} />)}
                        </div>

                        <h1 className="text-4xl md:text-5xl text-foreground mb-4 leading-tight">{product.name}</h1>

                        {/* Attribute Icons */}
                        <div className="flex flex-wrap gap-6 mb-10">
                            {product.badges?.map((badge: string) => (
                                attributeIcons[badge] && (
                                    <div key={badge} className="flex flex-col items-center gap-1.5 group">
                                        <div className="w-16 h-16 rounded-full bg-white shadow-md flex items-center justify-center p-3 hover:shadow-lg transition-all border-2 border-primary/5 group-hover:border-primary/20">
                                            <img src={attributeIcons[badge]} alt={badge} className="w-full h-full object-contain" />
                                        </div>
                                        <span className="text-[10px] font-black uppercase tracking-widest text-secondary transition-colors group-hover:text-primary">
                                            {badge}
                                        </span>
                                    </div>
                                )
                            ))}
                        </div>

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
                            ${product.price ? product.price.toFixed(2) : '0.00'} MXN
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
                        </div>

                        {/* Reviews Section */}
                        <div className="mt-16 border-t border-background-contrast/10 pt-10">
                            <h3 className="text-2xl font-heading font-bold text-foreground mb-8 uppercase tracking-wider">Valoración y Reseñas</h3>
                            <div className="space-y-8">
                                <div className="bg-white p-6 border border-background-contrast/10 shadow-sm">
                                    <div className="flex justify-between items-start mb-4">
                                        <div>
                                            <p className="font-bold text-foreground">María García</p>
                                            <div className="flex text-accent mt-1">
                                                {[1, 2, 3, 4, 5].map(i => <span key={i} className="material-symbols-outlined text-sm filled">star</span>)}
                                            </div>
                                        </div>
                                        <span className="text-xs text-secondary">Hace 2 días</span>
                                    </div>
                                    <p className="text-secondary text-sm italic">"Excelente calidad, se nota que es un producto 100% natural. El sabor es auténtico y el envío fue muy rápido. Volveré a comprar sin duda."</p>
                                </div>
                                <div className="bg-white p-6 border border-background-contrast/10 shadow-sm">
                                    <div className="flex justify-between items-start mb-4">
                                        <div>
                                            <p className="font-bold text-foreground">Juan Pérez</p>
                                            <div className="flex text-accent mt-1">
                                                {[1, 2, 3, 4].map(i => <span key={i} className="material-symbols-outlined text-sm filled">star</span>)}
                                                <span className="material-symbols-outlined text-sm">star</span>
                                            </div>
                                        </div>
                                        <span className="text-xs text-secondary">Hace 1 semana</span>
                                    </div>
                                    <p className="text-secondary text-sm italic">"Muy buen producto, cumple con todo lo que promete. El empaque llegó en perfectas condiciones."</p>
                                </div>
                            </div>
                            <button className="mt-8 text-xs font-bold uppercase tracking-widest text-primary border-b border-primary pb-1 hover:text-accent hover:border-accent transition-colors">
                                Dejar una reseña
                            </button>
                        </div>
                    </div>
                </div>

                {/* Recommended Products */}
                <div className="mt-24">
                    <h3 className="text-2xl font-heading font-bold text-foreground mb-10 uppercase tracking-wider border-l-4 border-primary pl-4">También te podría gustar</h3>
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
                        {/* Static sample products for recommendation */}
                        {[1, 2, 3, 4].map((i) => (
                            <div key={i} className="group cursor-pointer">
                                <div className="aspect-[3/4] bg-white overflow-hidden mb-4 relative">
                                    <img src={product.image} alt="Recommended" className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
                                    <div className="absolute top-2 right-2">
                                        <div className="w-6 h-6 rounded-full bg-white/90 shadow-sm flex items-center justify-center p-1">
                                            <img src={attributeIcons['Natural']} alt="Natural" className="w-full h-full object-contain" />
                                        </div>
                                    </div>
                                </div>
                                <h4 className="text-xs font-bold uppercase tracking-wider text-foreground group-hover:text-primary transition-colors">Producto Relacionado {i}</h4>
                                <p className="text-xs text-secondary mt-1">$99.00 MXN</p>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ProductDetail;