import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useUser } from '../context/UserContext';
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
    const [product, setProduct] = useState<any>(null);
    const [reviews, setReviews] = useState<any[]>([]);
    const [recommended, setRecommended] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const { addToCart } = useCart();
    const { user, token } = useUser();
    const [quantity, setQuantity] = useState(1);
    const [activeImageIndex, setActiveImageIndex] = useState(0);
    const [showReviewForm, setShowReviewForm] = useState(false);
    const [newReview, setNewReview] = useState({ rating: 5, comment: '' });
    const [submittingReview, setSubmittingReview] = useState(false);

    const attributeIcons: Record<string, string> = {
        'organic': organicoIcon,
        'sugar-free': sinAzucarIcon,
        'gluten-free': sinGlutenIcon,
        'keto': ketoIcon,
        'vegan': veganoIcon,
        'natural': naturalIcon,
        'integral': integralIcon
    };

    useEffect(() => {
        if (!id) return;
        setLoading(true);
        Promise.all([
            api.getProductById(id),
            api.getProductReviews(id),
            api.getProducts() // For simple recommendations in same category
        ])
            .then(([productData, reviewsData, allProducts]) => {
                setProduct(productData);
                setReviews(reviewsData);
                // Filter recommendations: same category, not current product, max 4
                const recs = allProducts
                    .filter((p: any) => p.category_id === productData.category_id && p.id !== productData.id)
                    .slice(0, 4);
                setRecommended(recs);
                setLoading(false);
            })
            .catch(err => {
                console.error(err);
                setLoading(false);
            });
    }, [id]);

    const handleReviewSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!token || !id) return;
        setSubmittingReview(true);
        try {
            const result = await api.createReview(id, newReview, token);
            setReviews([result, ...reviews]);
            setShowReviewForm(false);
            setNewReview({ rating: 5, comment: '' });
        } catch (err) {
            console.error(err);
            alert('Error al publicar la reseña');
        } finally {
            setSubmittingReview(false);
        }
    };

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
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-20">
                    {/* Gallery */}
                    <div className="space-y-4">
                        <div className="aspect-square bg-[#F5F5F5] overflow-hidden shadow-sm rounded-sm relative">
                            <img 
                                src={product.images && product.images.length > 0 ? product.images[activeImageIndex] : ''} 
                                alt={product.name} 
                                className="w-full h-full object-cover transition-opacity duration-300" 
                            />
                        </div>
                        
                        {/* Thumbnails */}
                        {product.images && product.images.length > 1 && (
                            <div className="flex gap-4 overflow-x-auto pb-2 snap-x hide-scrollbar">
                                {product.images.map((img: string, idx: number) => (
                                    <button
                                        key={idx}
                                        onClick={() => setActiveImageIndex(idx)}
                                        className={`shrink-0 w-20 h-20 sm:w-24 sm:h-24 bg-[#F5F5F5] rounded-sm overflow-hidden border-2 transition-all ${
                                            activeImageIndex === idx ? 'border-primary opacity-100' : 'border-transparent opacity-60 hover:opacity-100'
                                        }`}
                                    >
                                        <img src={img} alt={`${product.name} ${idx + 1}`} className="w-full h-full object-cover" />
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Info */}
                    <div className="pt-2 md:pt-4">
                        <div className="mb-4 md:mb-6 flex flex-wrap gap-2">
                            {product.badges?.map((b: string) => <Badge key={b} text={b} />)}
                        </div>

                        <h1 className="text-3xl md:text-5xl text-foreground mb-4 leading-tight font-heading">{product.name}</h1>

                        {/* Attribute Icons */}
                        <div className="flex flex-wrap gap-4 md:gap-6 mb-8 md:mb-10">
                            {product.badges?.map((badge: string) => (
                                attributeIcons[badge] && (
                                    <div key={badge} className="flex flex-col items-center gap-1.5 group">
                                        <div className="w-12 h-12 md:w-16 md:h-16 rounded-full bg-white shadow-sm flex items-center justify-center p-2.5 md:p-3 hover:shadow-lg transition-all border-2 border-primary/5 group-hover:border-primary/20">
                                            <img src={attributeIcons[badge]} alt={badge} className="w-full h-full object-contain" />
                                        </div>
                                        <span className="text-[8px] md:text-[10px] font-black uppercase tracking-widest text-secondary transition-colors group-hover:text-primary">
                                            {badge}
                                        </span>
                                    </div>
                                )
                            ))}
                        </div>

                        <div className="flex items-center gap-4 mb-6 md:mb-8">
                            <div className="flex items-center text-accent">
                                {[1, 2, 3, 4, 5].map(i => (
                                    <span key={i} className={`material-symbols-outlined text-base md:text-lg ${i <= Math.round(product.rating || 0) ? 'filled' : ''}`}>
                                        {i <= Math.round(product.rating || 0) ? 'star' : 'star_outline'}
                                    </span>
                                ))}
                            </div>
                            <span className="text-[10px] md:text-xs font-bold uppercase tracking-widest text-secondary border-b border-secondary/30 pb-0.5">
                                {product.review_count || 0} Reseñas
                            </span>
                        </div>

                        <div className="text-2xl md:text-3xl font-light text-foreground mb-6 md:mb-8">
                            ${product.price ? product.price.toFixed(2) : '0.00'} MXN
                        </div>

                        <p className="text-secondary leading-relaxed mb-8 md:mb-10 font-light text-base md:text-lg">
                            {product.description}
                        </p>

                        {/* Actions */}
                        <div className="bg-white p-4 md:p-6 border border-background-contrast/20 mb-10">
                            <div className="flex flex-col sm:flex-row gap-4">
                                <div className="flex items-center border border-background-contrast/50 w-full sm:w-32 bg-background">
                                    <button
                                        onClick={() => setQuantity(Math.max(1, quantity - 1))}
                                        className="flex-1 px-4 py-3 hover:text-primary transition-colors text-xl"
                                    >-</button>
                                    <input
                                        type="number"
                                        value={quantity}
                                        readOnly
                                        className="w-12 text-center bg-transparent border-none focus:ring-0 font-bold text-foreground"
                                    />
                                    <button
                                        onClick={() => setQuantity(quantity + 1)}
                                        className="flex-1 px-4 py-3 hover:text-primary transition-colors text-xl"
                                    >+</button>
                                </div>
                                <button
                                    onClick={() => addToCart(product, quantity)}
                                    className="flex-1 bg-primary text-primary-foreground font-bold text-xs md:text-sm uppercase tracking-widest py-4 px-8 hover:bg-accent hover:text-white transition-all shadow-md active:scale-[0.98]"
                                >
                                    Añadir al carrito
                                </button>
                            </div>
                        </div>

                        {/* Reviews Section */}
                        <div className="mt-16 border-t border-background-contrast/10 pt-10">
                            <h3 className="text-2xl font-heading font-bold text-foreground mb-8 uppercase tracking-wider">Valoración y Reseñas</h3>

                            {reviews.length > 0 ? (
                                <div className="space-y-8 mb-10">
                                    {reviews.map((review) => (
                                        <div key={review.id} className="bg-white p-6 border border-background-contrast/10 shadow-sm">
                                            <div className="flex justify-between items-start mb-4">
                                                <div>
                                                    <p className="font-bold text-foreground">{review.user_name}</p>
                                                    <div className="flex text-accent mt-1">
                                                        {[1, 2, 3, 4, 5].map(i => (
                                                            <span key={i} className={`material-symbols-outlined text-sm ${i <= review.rating ? 'filled' : ''}`}>star</span>
                                                        ))}
                                                    </div>
                                                </div>
                                                <span className="text-xs text-secondary">
                                                    {new Date(review.created_at).toLocaleDateString()}
                                                </span>
                                            </div>
                                            <p className="text-secondary text-sm italic">"{review.comment}"</p>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <p className="text-secondary italic mb-10 text-sm">Aún no hay reseñas para este producto. ¡Sé el primero en compartir tu opinión!</p>
                            )}

                            {showReviewForm ? (
                                <form onSubmit={handleReviewSubmit} className="bg-background-contrast/5 p-6 border border-background-contrast/10">
                                    <h4 className="text-lg font-bold mb-4">Escribir una reseña</h4>
                                    <div className="mb-4">
                                        <label className="block text-xs font-bold uppercase tracking-widest text-secondary mb-2">Puntuación</label>
                                        <div className="flex gap-2">
                                            {[1, 2, 3, 4, 5].map(i => (
                                                <button
                                                    key={i}
                                                    type="button"
                                                    onClick={() => setNewReview({ ...newReview, rating: i })}
                                                    className={`material-symbols-outlined text-2xl ${i <= newReview.rating ? 'filled text-accent' : 'text-secondary'}`}
                                                >
                                                    star
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                    <div className="mb-4">
                                        <label className="block text-xs font-bold uppercase tracking-widest text-secondary mb-2">Comentario</label>
                                        <textarea
                                            required
                                            value={newReview.comment}
                                            onChange={(e) => setNewReview({ ...newReview, comment: e.target.value })}
                                            className="w-full bg-white border border-background-contrast/20 p-3 text-sm focus:outline-none focus:border-primary min-h-[100px]"
                                            placeholder="Comparte tu experiencia con este producto..."
                                        ></textarea>
                                    </div>
                                    <div className="flex gap-4">
                                        <button
                                            type="submit"
                                            disabled={submittingReview}
                                            className="bg-primary text-white font-bold text-xs uppercase tracking-widest py-3 px-8 hover:bg-accent transition-all disabled:opacity-50"
                                        >
                                            {submittingReview ? 'Publicando...' : 'Publicar Reseña'}
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setShowReviewForm(false)}
                                            className="text-xs font-bold uppercase tracking-widest text-secondary hover:text-foreground"
                                        >
                                            Cancelar
                                        </button>
                                    </div>
                                </form>
                            ) : (
                                token ? (
                                    <button
                                        onClick={() => setShowReviewForm(true)}
                                        className="text-xs font-bold uppercase tracking-widest text-primary border-b border-primary pb-1 hover:text-accent hover:border-accent transition-colors"
                                    >
                                        Dejar una reseña
                                    </button>
                                ) : (
                                    <p className="text-xs text-secondary font-light">
                                        <Link to="/login" className="text-primary font-bold hover:underline">Inicia sesión</Link> para dejar una reseña.
                                    </p>
                                )
                            )}
                        </div>
                    </div>
                </div>

                {/* Recommended Products */}
                {recommended.length > 0 && (
                    <div className="mt-24">
                        <h3 className="text-2xl font-heading font-bold text-foreground mb-10 uppercase tracking-wider border-l-4 border-primary pl-4">También te podría gustar</h3>
                        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
                            {recommended.map((item) => (
                                <Link to={`/product/${item.id}`} key={item.id} className="group cursor-pointer">
                                    <div className="aspect-[3/4] bg-[#F5F5F5] overflow-hidden mb-4 relative rounded-sm">
                                        <img src={item.images && item.images.length > 0 ? item.images[0] : ''} alt={item.name} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
                                        <div className="absolute top-2 right-2 flex flex-col gap-1">
                                            {item.badges?.slice(0, 1).map((b: string) => (
                                                <div key={b} className="w-6 h-6 rounded-full bg-white/90 shadow-sm flex items-center justify-center p-1">
                                                    {attributeIcons[b] && <img src={attributeIcons[b]} alt={b} className="w-full h-full object-contain" />}
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                    <h4 className="text-xs font-bold uppercase tracking-wider text-foreground group-hover:text-primary transition-colors line-clamp-1">{item.name}</h4>
                                    <p className="text-xs text-secondary mt-1">${item.price.toFixed(2)} MXN</p>
                                </Link>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ProductDetail;