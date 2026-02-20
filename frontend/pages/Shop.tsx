import React, { useState, useMemo } from 'react';
import ProductCard from '../components/ProductCard';
import { CATEGORIES } from '../constants';
import { Product } from '../types';

const Shop: React.FC = () => {
    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedCategory, setSelectedCategory] = useState<string>('all');
    const [priceRange, setPriceRange] = useState<number>(50);
    const [searchQuery, setSearchQuery] = useState('');

    React.useEffect(() => {
        fetch('/api/products')
            .then(res => res.json())
            .then(data => {
                // Ensure ID is string to match frontend types if needed, or update types. 
                // For now, let's cast or keep as is if loose. 
                // Logic: DB id is number, Frontend type says string. 
                // Best to map it.
                const mappedProducts = data.map((p: any) => ({
                    ...p,
                    id: String(p.id)
                }));
                setProducts(mappedProducts);
                setLoading(false);
            })
            .catch(err => {
                console.error("Failed to fetch products", err);
                setLoading(false);
            });
    }, []);

    const filteredProducts = useMemo(() => {
        return products.filter((product: Product) => {
            const matchCategory = selectedCategory === 'all' || product.category === selectedCategory;
            const matchPrice = product.price <= priceRange;
            const matchSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase());
            return matchCategory && matchPrice && matchSearch;
        });
    }, [products, selectedCategory, priceRange, searchQuery]);

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

                                {/* Price Filter */}
                                <div>
                                    <h3 className="font-heading text-xs font-bold text-foreground uppercase tracking-widest mb-6">Precio</h3>
                                    <input
                                        type="range"
                                        min="0"
                                        max="50"
                                        step="1"
                                        value={priceRange}
                                        onChange={(e) => setPriceRange(Number(e.target.value))}
                                        className="w-full h-1 bg-background-contrast/30 rounded-lg appearance-none cursor-pointer accent-primary"
                                    />
                                    <div className="flex justify-between text-xs text-secondary mt-2 font-mono">
                                        <span>Max: {priceRange.toFixed(2)} €</span>
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
                                        onClick={() => { setSelectedCategory('all'); setSearchQuery(''); setPriceRange(50); }}
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