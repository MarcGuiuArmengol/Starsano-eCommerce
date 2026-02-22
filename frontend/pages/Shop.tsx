import React, { useState, useMemo } from 'react';
import ProductCard from '../components/ProductCard';
import { CATEGORIES } from '../constants';
import { Product } from '../types';

const Shop: React.FC = () => {
    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedCategory, setSelectedCategory] = useState<string>('all');
    const [selectedBadges, setSelectedBadges] = useState<string[]>([]);
    const [searchQuery, setSearchQuery] = useState('');

    React.useEffect(() => {
        console.log("Fetching products from /api/products...");
        setLoading(true);
        fetch('/api/products')
            .then(res => {
                if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
                return res.json();
            })
            .then(data => {
                console.log(`Fetched ${data.length} products`);
                const mappedProducts = data.map((p: any) => ({
                    ...p,
                    id: String(p.id)
                }));
                setProducts(mappedProducts);
                setLoading(false);
            })
            .catch(err => {
                console.error("Failed to fetch products:", err.message);
                setLoading(false);
            });
    }, []);

    const filteredProducts = useMemo(() => {
        return products.filter((product: Product) => {
            const matchCategory = selectedCategory === 'all' || product.category === selectedCategory;
            const matchSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase());
            const matchBadges = selectedBadges.length === 0 ||
                selectedBadges.every(badge => product.badges?.includes(badge));
            return matchCategory && matchSearch && matchBadges;
        });
    }, [products, selectedCategory, selectedBadges, searchQuery]);

    const toggleBadge = (badge: string) => {
        setSelectedBadges(prev =>
            prev.includes(badge) ? prev.filter(b => b !== badge) : [...prev, badge]
        );
    };

    return (
        <div className="bg-background min-h-screen">
            {/* Header Banner */}
            <div className="bg-primary text-white py-16 px-4 text-center">
                <h1 className="text-4xl md:text-5xl mb-2">Tienda</h1>
                <p className="text-white/60 font-light max-w-xl mx-auto">Explora nuestra colección completa de productos naturales.</p>
            </div>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                {loading ? (
                    <div className="flex justify-center py-20">
                        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
                    </div>
                ) : (
                    <div className="flex flex-col lg:flex-row gap-12">
                        {/* Sidebar Filters */}
                        <aside className="w-full lg:w-64 flex-shrink-0">
                            <div className="sticky top-24 space-y-10">

                                {/* Search */}
                                <div className="relative">
                                    <input
                                        type="text"
                                        className="w-full bg-transparent border-b border-foreground/30 py-2 pl-0 pr-8 text-sm focus:border-primary focus:ring-0 placeholder:text-secondary/50"
                                        placeholder="Buscar producto..."
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                    />
                                    <span className="material-symbols-outlined absolute right-0 top-1/2 -translate-y-1/2 text-secondary text-lg">search</span>
                                </div>

                                {/* Categories */}
                                <div>
                                    <h3 className="font-heading text-xs font-bold text-foreground uppercase tracking-widest mb-6">Categorías</h3>
                                    <div className="space-y-4">
                                        <button
                                            onClick={() => setSelectedCategory('all')}
                                            className={`block w-full text-left text-sm transition-colors ${selectedCategory === 'all' ? 'text-primary font-bold translate-x-1' : 'text-secondary hover:text-foreground'}`}
                                        >
                                            Ver todo
                                        </button>
                                        {CATEGORIES.map(cat => (
                                            <button
                                                key={cat.id}
                                                onClick={() => setSelectedCategory(cat.slug)}
                                                className={`block w-full text-left text-sm transition-all ${selectedCategory === cat.slug ? 'text-primary font-bold translate-x-1' : 'text-secondary hover:text-foreground'}`}
                                            >
                                                {cat.name}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Badge Filters */}
                                <div>
                                    <h3 className="font-heading text-xs font-bold text-foreground uppercase tracking-widest mb-6 font-bold">Filtros</h3>
                                    <div className="space-y-3">
                                        {[
                                            { label: 'Orgánicos', value: 'Organic' },
                                            { label: 'Sin Azúcar', value: 'Sugar Free' },
                                            { label: 'Sin Gluten', value: 'Gluten Free' }
                                        ].map(filter => (
                                            <div key={filter.value} className="flex items-center gap-3 cursor-pointer group" onClick={() => toggleBadge(filter.value)}>
                                                <div
                                                    className={`w-5 h-5 border flex items-center justify-center transition-all ${selectedBadges.includes(filter.value) ? 'bg-primary border-primary' : 'border-slate-300 group-hover:border-primary'}`}
                                                >
                                                    {selectedBadges.includes(filter.value) && (
                                                        <span className="material-symbols-outlined text-white text-base">check</span>
                                                    )}
                                                </div>
                                                <span className={`text-sm transition-colors ${selectedBadges.includes(filter.value) ? 'text-primary font-bold' : 'text-secondary group-hover:text-foreground'}`}>
                                                    {filter.label}
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </aside>

                        {/* Product Grid */}
                        <div className="flex-1">
                            <div className="mb-6 flex justify-between items-center">
                                <span className="text-xs font-bold uppercase tracking-widest text-secondary">{filteredProducts.length} Productos</span>

                                {/* Mobile Filter Toggle (Visual Only for now) */}
                                <button className="lg:hidden flex items-center gap-2 text-xs font-bold uppercase tracking-widest">
                                    Filtros <span className="material-symbols-outlined text-sm">tune</span>
                                </button>
                            </div>

                            {filteredProducts.length === 0 ? (
                                <div className="text-center py-20 border border-dashed border-background-contrast/50 rounded-sm">
                                    <span className="material-symbols-outlined text-4xl text-background-contrast mb-2">filter_list_off</span>
                                    <h3 className="text-lg font-bold text-foreground">Sin resultados</h3>
                                    <p className="text-secondary font-light">Intenta ajustar tus filtros de búsqueda.</p>
                                    <button
                                        onClick={() => { setSelectedCategory('all'); setSearchQuery(''); setSelectedBadges([]); }}
                                        className="mt-4 text-primary border-b border-primary pb-0.5 text-sm font-bold hover:text-accent hover:border-accent"
                                    >
                                        Limpiar filtros
                                    </button>
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-10">
                                    {filteredProducts.map(product => (
                                        <ProductCard key={product.id} product={product} />
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Shop;