import React, { useState, useMemo, useEffect } from 'react';
import ProductCard from '../components/ProductCard';
import { Product } from '../types';
import { api } from '../services/api';
import { CATEGORIES, PRODUCT_LABELS } from '../constants';

const Shop: React.FC = () => {
    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedCategory, setSelectedCategory] = useState<string>('all');
    const [selectedLabels, setSelectedLabels] = useState<string[]>([]);
    const [searchQuery, setSearchQuery] = useState('');

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setLoading(true);
        try {
            const productsData = await api.getProducts();
            setProducts(productsData);
        } catch (err) {
            console.error("Failed to fetch shop data:", err);
        } finally {
            setLoading(false);
        }
    };

    const filteredProducts = useMemo(() => {
        return products.filter((product: Product) => {
            const matchCategory = true;

            const matchSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase());

            const matchLabels = selectedLabels.length === 0 ||
                selectedLabels.every(label =>
                    product.badges?.includes(label)
                );

            return matchCategory && matchSearch && matchLabels;
        });
    }, [products, selectedCategory, selectedLabels, searchQuery]);

    const toggleLabel = (value: string) => {
        setSelectedLabels(prev =>
            prev.includes(value) ? prev.filter(l => l !== value) : [...prev, value]
        );
    };

    return (
        <div className="bg-background min-h-screen">
            {/* Header Banner */}
            <div className="bg-primary text-white py-16 px-4 text-center">
                <h1 className="text-4xl md:text-5xl mb-2 font-heading">Tienda</h1>
                <p className="text-white/60 font-light max-w-xl mx-auto">Explora nuestra colección completa de productos naturales y orgánicos.</p>
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
                                        className="w-full bg-transparent border-b border-foreground/30 py-2 pl-0 pr-8 text-sm focus:border-primary focus:ring-0 placeholder:text-secondary/50 outline-none transition-colors"
                                        placeholder="Buscar producto..."
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                    />
                                    <span className="material-symbols-outlined absolute right-0 top-1/2 -translate-y-1/2 text-secondary text-lg">search</span>
                                </div>


                                {/* Attribute Filters */}
                                <div>
                                    <h3 className="font-heading text-xs font-bold text-foreground uppercase tracking-widest mb-6">Filtros</h3>
                                    <div className="space-y-3">
                                        {PRODUCT_LABELS.map(label => (
                                            <div key={label.value} className="flex items-center gap-3 cursor-pointer group" onClick={() => toggleLabel(label.value)}>
                                                <div
                                                    className={`w-5 h-5 border flex items-center justify-center transition-all ${selectedLabels.includes(label.value) ? 'bg-primary border-primary' : 'border-slate-300 group-hover:border-primary'}`}
                                                >
                                                    {selectedLabels.includes(label.value) && (
                                                        <span className="material-symbols-outlined text-white text-base">check</span>
                                                    )}
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <span className={`text-sm transition-colors ${selectedLabels.includes(label.value) ? 'text-primary font-bold' : 'text-secondary group-hover:text-foreground'}`}>
                                                        {label.label}
                                                    </span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </aside>

                        {/* Product Grid */}
                        <div className="flex-1">
                            <div className="mb-6 flex justify-between items-center bg-white/50 p-4 rounded-lg backdrop-blur-sm border border-background-contrast/5">
                                <span className="text-xs font-bold uppercase tracking-widest text-secondary">{filteredProducts.length} Productos encontrados</span>
                            </div>

                            {filteredProducts.length === 0 ? (
                                <div className="text-center py-20 border border-dashed border-background-contrast/20 rounded-xl bg-white/30">
                                    <span className="material-symbols-outlined text-5xl text-background-contrast mb-4 opacity-20">inventory_2</span>
                                    <h3 className="text-xl font-bold text-foreground font-heading">Sin resultados</h3>
                                    <p className="text-secondary font-light mb-6">Intenta ajustar tus filtros de búsqueda.</p>
                                    <button
                                        onClick={() => { setSearchQuery(''); setSelectedLabels([]); }}
                                        className="text-primary border-b border-primary/20 pb-0.5 text-xs font-bold uppercase tracking-widest hover:border-primary transition-all"
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