import React, { useState, useEffect } from 'react';
import { useUser } from '../context/UserContext';
import { api } from '../services/api';
import { PRODUCT_LABELS } from '../constants';

const AdminDashboard: React.FC = () => {
    const { user, token } = useUser();
    const [activeTab, setActiveTab] = useState<'orders' | 'products' | 'articles'>('orders');
    const [orders, setOrders] = useState<any[]>([]);
    const [products, setProducts] = useState<any[]>([]);
    const [articles, setArticles] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [importing, setImporting] = useState(false);
    const [isGenerating, setIsGenerating] = useState(false);
    const [generationProgress, setGenerationProgress] = useState(0);

    // Article Form
    const [showArticleForm, setShowArticleForm] = useState(false);
    const [editingArticle, setEditingArticle] = useState<any>(null);
    const [articleFormData, setArticleFormData] = useState({
        title: '',
        content: '',
        image_url: '',
        author: 'Starsano'
    });

    // Product Form
    const [showProductForm, setShowProductForm] = useState(false);
    const [editingProduct, setEditingProduct] = useState<any>(null);
    const [productFormData, setProductFormData] = useState({
        name: '',
        price: '',
        description: '',
        image: '',
        badges: [] as string[],
        rating: '5'
    });

    const [isDragging, setIsDragging] = useState(false);
    const [uploading, setUploading] = useState(false);

    useEffect(() => {
        if (token) {
            console.log('[DEBUG] AdminDashboard mounted with token. User role:', user?.role);
            refreshData();
        }
    }, [token, user]);

    const refreshData = () => {
        fetchOrders();
        fetchProducts();
        fetchArticles();
    };

    const fetchArticles = async () => {
        try {
            const data = await api.getArticles();
            setArticles(data);
        } catch (err) {
            console.error('Error fetching articles:', err);
        }
    };


    const handleImportCSV = async () => {
        if (!confirm('¿Quieres recargar todos los productos desde el archivo CSV? Esto actualizará precios y descripciones existentes.')) return;
        setImporting(true);
        try {
            const res = await fetch(`/api/admin/import`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                alert('Productos importados correctamente');
                fetchProducts();
            } else {
                alert('Error al importar productos');
            }
        } catch (err) {
            console.error('Error importing CSV:', err);
        } finally {
            setImporting(false);
        }
    };

    const handleFileUpload = async (file: File, type: 'product' | 'article' = 'product') => {
        setUploading(true);
        const data = new FormData();
        data.append('image', file);

        try {
            const res = await fetch(`/api/admin/upload`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` },
                body: data
            });
            const result = await res.json();
            if (res.ok) {
                if (type === 'product') {
                    setProductFormData(prev => ({ ...prev, image: result.imageUrl }));
                } else {
                    setArticleFormData(prev => ({ ...prev, image_url: result.imageUrl }));
                }
            }
        } catch (err) {
            console.error('Error uploading file:', err);
        } finally {
            setUploading(false);
        }
    };

    const handleDrop = (e: React.DragEvent, type: 'product' | 'article' = 'product') => {
        e.preventDefault();
        setIsDragging(false);
        const file = e.dataTransfer.files[0];
        if (file && file.type.startsWith('image/')) {
            handleFileUpload(file, type);
        }
    };
    const handleArticleDrop = (e: React.DragEvent) => handleDrop(e, 'article');
    const handleProductDrop = (e: React.DragEvent) => handleDrop(e, 'product');

    const fetchOrders = async () => {
        try {
            setLoading(true);
            const data = await api.adminGetOrders(token);
            if (Array.isArray(data)) {
                setOrders(data);
            } else {
                setOrders([]);
            }
        } catch (err: any) {
            console.error('Error fetching admin orders:', err);
            setOrders([]);
        } finally {
            setLoading(false);
        }
    };

    const fetchProducts = async () => {
        try {
            const data = await api.getProducts();
            if (Array.isArray(data)) {
                setProducts(data);
            } else {
                setProducts([]);
            }
        } catch (err) {
            console.error('Error fetching products:', err);
            setProducts([]);
        }
    };

    const handleStatusChange = async (orderId: number, newStatus: string) => {
        try {
            await api.updateOrderStatus(orderId, newStatus, token);
            fetchOrders();
        } catch (err) {
            console.error('Error updating status:', err);
            alert('Error al actualizar el estado del pedido');
        }
    };

    const handleProductSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        console.log('Submitting product...'); // Check if this shows in browser console
        try {
            if (!token) {
                alert('No se ha encontrado el token de autenticación. Por favor, inicia sesión de nuevo.');
                return;
            }
            const payload = {
                ...productFormData,
                price: Number(productFormData.price),
                rating: Number(productFormData.rating),
                category: productFormData.badges[0] || 'General'
            };

            console.log('Sending payload:', payload);

            const res = editingProduct
                ? await api.updateProduct(editingProduct.id, payload, token) // I should add these to api.ts if missing, or use fetch
                : await api.createProduct(payload, token);

            if (res) {
                setShowProductForm(false);
                setEditingProduct(null);
                setProductFormData({ name: '', price: '', description: '', image: '', badges: [], rating: '5' });
                fetchProducts();
                alert('Producto guardado correctamente');
            }
        } catch (err: any) {
            console.error('Error saving product:', err);
            alert(`Error al guardar el producto: ${err.message}`);
        }
    };


    const deleteProduct = async (id: number) => {
        if (!confirm('¿Seguro que quieres eliminar este producto?')) return;
        try {
            const res = await fetch(`/api/admin/products/${id}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) fetchProducts();
        } catch (err) {
            console.error('Error deleting product:', err);
        }
    };

    const handleArticleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            // Convert plain text paragraphs to HTML <p> tags
            const htmlContent = articleFormData.content
                .split('\n')
                .filter(p => p.trim() !== '')
                .map(p => `<p>${p.trim()}</p>`)
                .join('\n');

            const submissionData = { ...articleFormData, content: htmlContent };

            const res = editingArticle
                ? await api.updateArticle(editingArticle.id, submissionData, token)
                : await api.createArticle(submissionData, token);
            if (res) {
                setShowArticleForm(false);
                setEditingArticle(null);
                setArticleFormData({ title: '', content: '', image_url: '', author: 'Starsano' });
                fetchArticles();
            }
        } catch (err) {
            console.error('Error saving article:', err);
        }
    };

    const deleteArticle = async (id: number) => {
        if (!confirm('¿Seguro que quieres eliminar este artículo?')) return;
        try {
            await api.deleteArticle(id, token);
            fetchArticles();
        } catch (err) {
            console.error('Error deleting article:', err);
        }
    };


    const handleGenerateArticle = async () => {
        if (isGenerating) return;
        setIsGenerating(true);
        setGenerationProgress(0);

        // Simulate progress while generating
        const interval = setInterval(() => {
            setGenerationProgress(prev => {
                if (prev >= 90) return prev;
                return prev + Math.random() * 5;
            });
        }, 800);

        try {
            await api.generateArticle(token);
            clearInterval(interval);
            setGenerationProgress(100);
            setTimeout(() => {
                setIsGenerating(false);
                setGenerationProgress(0);
                fetchArticles();
            }, 500);
        } catch (err) {
            clearInterval(interval);
            setIsGenerating(false);
            console.error('Error generating article:', err);
            alert('Error al generar el artículo con IA');
        }
    };

    return (
        <div className="min-h-screen bg-background p-4 md:p-8">
            <div className="max-w-7xl mx-auto">
                <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-12">
                    <div>
                        <div className="flex items-center gap-4">
                            <h1 className="text-4xl text-foreground font-heading">Panel de Control</h1>
                        </div>
                        <p className="text-secondary font-light mt-1">Gestión de tienda y administración</p>
                    </div>
                    <div className="flex bg-white rounded-lg p-1 shadow-sm border border-background-contrast/5 overflow-x-auto max-w-full">
                        <button
                            onClick={() => setActiveTab('orders')}
                            className={`px-4 md:px-6 py-2 text-[10px] md:text-xs font-bold uppercase tracking-widest transition-all rounded-md whitespace-nowrap ${activeTab === 'orders' ? 'bg-primary text-white' : 'text-secondary hover:bg-background'}`}
                        >
                            Pedidos
                        </button>
                        <button
                            onClick={() => setActiveTab('products')}
                            className={`px-4 md:px-6 py-2 text-[10px] md:text-xs font-bold uppercase tracking-widest transition-all rounded-md whitespace-nowrap ${activeTab === 'products' ? 'bg-primary text-white' : 'text-secondary hover:bg-background'}`}
                        >
                            Productos
                        </button>
                        <button
                            onClick={() => setActiveTab('articles')}
                            className={`px-4 md:px-6 py-2 text-[10px] md:text-xs font-bold uppercase tracking-widest transition-all rounded-md whitespace-nowrap ${activeTab === 'articles' ? 'bg-primary text-white' : 'text-secondary hover:bg-background'}`}
                        >
                            Journal
                        </button>
                    </div>
                </header>

                {activeTab === 'orders' && (
                    <>
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12">
                            <div className="bg-white p-6 rounded-xl shadow-sm border border-background-contrast/10">
                                <span className="text-xs font-bold text-secondary uppercase tracking-widest block mb-2">Ventas Totales</span>
                                <h3 className="text-3xl text-primary font-heading">${Array.isArray(orders) ? orders.reduce((acc, o) => acc + Number(o.total), 0).toFixed(2) : '0.00'}</h3>
                            </div>
                            <div className="bg-white p-6 rounded-xl shadow-sm border border-background-contrast/10">
                                <span className="text-xs font-bold text-secondary uppercase tracking-widest block mb-2">Pedidos</span>
                                <h3 className="text-3xl text-primary font-heading">{Array.isArray(orders) ? orders.length : 0}</h3>
                            </div>
                            <div className="bg-white p-6 rounded-xl shadow-sm border border-background-contrast/10">
                                <span className="text-xs font-bold text-secondary uppercase tracking-widest block mb-2">Clientes</span>
                                <h3 className="text-3xl text-primary font-heading">{Array.isArray(orders) ? new Set(orders.map(o => o.user_id)).size : 0}</h3>
                            </div>
                        </div>

                        <div className="bg-white rounded-xl shadow-sm border border-background-contrast/10 overflow-hidden">
                            <div className="px-6 py-4 border-b border-background-contrast/10 flex justify-between items-center bg-background/30">
                                <h3 className="text-lg font-bold text-foreground">Gestión de Pedidos</h3>
                            </div>
                            <div className="overflow-x-auto">
                                <table className="w-full text-left text-sm">
                                    <thead className="bg-background/50 text-secondary uppercase text-[10px] font-bold tracking-widest">
                                        <tr>
                                            <th className="px-6 py-4">ID</th>
                                            <th className="px-6 py-4">Cliente</th>
                                            <th className="px-6 py-4">Total</th>
                                            <th className="px-6 py-4">Estado</th>
                                            <th className="px-6 py-4">Fecha</th>
                                            <th className="px-6 py-4 text-right">Acciones</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-background-contrast/5">
                                        {loading ? (
                                            <tr><td colSpan={6} className="text-center py-10 text-secondary">Cargando...</td></tr>
                                        ) : orders.length === 0 ? (
                                            <tr><td colSpan={6} className="text-center py-10 text-secondary">No hay pedidos aún</td></tr>
                                        ) : orders.map(order => (
                                            <tr key={order.id} className="hover:bg-background-contrast/2 transition-colors">
                                                <td className="px-6 py-4 font-mono font-bold text-xs">#{order.id}</td>
                                                <td className="px-6 py-4">
                                                    <div className="font-medium">{order.email}</div>
                                                    <div className="text-[10px] text-secondary uppercase tracking-tighter">ID: {order.user_id}</div>
                                                </td>
                                                <td className="px-6 py-4 font-bold text-primary">${order.total}</td>
                                                <td className="px-6 py-4">
                                                    <select
                                                        value={order.status}
                                                        onChange={(e) => handleStatusChange(order.id, e.target.value)}
                                                        className={`px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase border-none outline-none cursor-pointer tracking-widest shadow-sm transition-all focus:ring-2 focus:ring-primary/20 ${order.status === 'pending' ? 'bg-yellow-50 text-yellow-700' :
                                                            order.status === 'processing' ? 'bg-blue-50 text-blue-700' :
                                                                order.status === 'shipped' ? 'bg-purple-50 text-purple-700' :
                                                                    order.status === 'delivered' ? 'bg-green-50 text-green-700' :
                                                                        'bg-red-50 text-red-700'
                                                            }`}
                                                    >
                                                        <option value="pending">Pendiente</option>
                                                        <option value="processing">Procesando</option>
                                                        <option value="shipped">Enviado</option>
                                                        <option value="delivered">Entregado</option>
                                                        <option value="cancelled">Cancelado</option>
                                                    </select>
                                                </td>
                                                <td className="px-6 py-4 text-secondary text-xs">{new Date(order.created_at).toLocaleString()}</td>
                                                <td className="px-6 py-4 text-right">
                                                    <button className="text-primary hover:text-accent transition-colors p-2 rounded-full hover:bg-primary/5" title="Ver detalles">
                                                        <span className="material-symbols-outlined text-lg">visibility</span>
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </>
                )}

                {activeTab === 'products' && (
                    <>
                        <div className="flex justify-between items-center mb-8">
                            <h2 className="text-2xl font-heading text-foreground">Catálogo de Productos</h2>
                            <div className="flex gap-4">
                                <button
                                    onClick={handleImportCSV}
                                    disabled={importing}
                                    className="bg-white text-secondary border border-background-contrast/20 px-6 py-2.5 text-xs font-bold uppercase tracking-widest hover:bg-background transition-all flex items-center gap-2 disabled:opacity-50"
                                >
                                    <span className="material-symbols-outlined text-sm">{importing ? 'sync' : 'csv'}</span> {importing ? 'Importando...' : 'Recargar desde CSV'}
                                </button>
                                <button
                                    onClick={() => {
                                        setEditingProduct(null);
                                        setProductFormData({ name: '', price: '', description: '', category: '', image: '', badges: [], rating: '5' });
                                        setShowProductForm(true);
                                    }}
                                    className="bg-primary text-white px-6 py-2.5 text-xs font-bold uppercase tracking-widest hover:bg-accent transition-all shadow-lg flex items-center gap-2"
                                >
                                    <span className="material-symbols-outlined text-sm">add</span> Nuevo Producto
                                </button>
                            </div>
                        </div>

                        <div className="bg-white rounded-xl shadow-sm border border-background-contrast/10 overflow-hidden">
                            <div className="overflow-x-auto">
                                <table className="w-full text-left text-sm">
                                    <thead className="bg-background/50 text-secondary uppercase text-[10px] font-bold tracking-widest">
                                        <tr>
                                            <th className="px-6 py-4">Producto</th>
                                            <th className="px-6 py-4">Precio</th>
                                            <th className="px-6 py-4">Precio</th>
                                            <th className="px-6 py-4 text-right">Acciones</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-background-contrast/5">
                                        {products.length === 0 ? (
                                            <tr><td colSpan={4} className="text-center py-10">No hay productos</td></tr>
                                        ) : products.map(product => (
                                            <tr key={product.id} className="hover:bg-background-contrast/2 transition-colors">
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center gap-4">
                                                        <img src={product.image} alt="" className="w-10 h-10 object-cover rounded-md bg-background" />
                                                        <div>
                                                            <div className="font-bold text-foreground">{product.name}</div>
                                                            <div className="text-[10px] text-secondary uppercase tracking-widest flex gap-1">
                                                                {product.badges?.map((b: string) => <span key={b} className="bg-background px-1 rounded">{b}</span>)}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 font-bold">${product.price}</td>
                                                <td className="px-6 py-4 text-right">
                                                    <div className="flex justify-end gap-2">
                                                        <button
                                                            onClick={() => {
                                                                setEditingProduct(product);
                                                                setProductFormData({
                                                                    name: product.name,
                                                                    price: product.price.toString(),
                                                                    description: product.description,
                                                                    image: product.image,
                                                                    badges: product.badges || [],
                                                                    rating: (product.rating || 5).toString()
                                                                });
                                                                setShowProductForm(true);
                                                            }}
                                                            className="text-secondary hover:text-primary p-2 transition-colors"
                                                        >
                                                            <span className="material-symbols-outlined text-lg">edit</span>
                                                        </button>
                                                        <button onClick={() => deleteProduct(product.id)} className="text-secondary hover:text-red-500 p-2 transition-colors">
                                                            <span className="material-symbols-outlined text-lg">delete</span>
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        {showProductForm && (
                            <div className="fixed inset-0 bg-foreground/20 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                                <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                                    <div className="flex justify-between items-center mb-8 border-b pb-4">
                                        <h3 className="text-xl font-bold font-heading">{editingProduct ? 'Editar Producto' : 'Crear Nuevo Producto'}</h3>
                                        <button onClick={() => setShowProductForm(false)} className="text-secondary hover:text-foreground">
                                            <span className="material-symbols-outlined">close</span>
                                        </button>
                                    </div>
                                    <form onSubmit={handleProductSubmit} className="space-y-6">
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div>
                                                <label className="text-[10px] font-bold uppercase tracking-widest text-secondary block mb-2">Nombre</label>
                                                <input required type="text" value={productFormData.name} onChange={e => setProductFormData({ ...productFormData, name: e.target.value })} className="w-full px-4 py-3 bg-background border-none text-sm focus:ring-2 focus:ring-primary/20 outline-none" />
                                            </div>
                                            <div>
                                                <label className="text-[10px] font-bold uppercase tracking-widest text-secondary block mb-2">Precio (MXN)</label>
                                                <input required type="number" step="0.01" value={productFormData.price} onChange={e => setProductFormData({ ...productFormData, price: e.target.value })} className="w-full px-4 py-3 bg-background border-none text-sm focus:ring-2 focus:ring-primary/20 outline-none" />
                                            </div>
                                        </div>
                                        <div>
                                            <label className="text-[10px] font-bold uppercase tracking-widest text-secondary block mb-2">Descripción</label>
                                            <textarea required rows={3} value={productFormData.description} onChange={e => setProductFormData({ ...productFormData, description: e.target.value })} className="w-full px-4 py-3 bg-background border-none text-sm focus:ring-2 focus:ring-primary/20 outline-none resize-none" />
                                        </div>

                                        <div>
                                            <label className="text-[10px] font-bold uppercase tracking-widest text-secondary block mb-4">Etiquetas (Badges)</label>
                                            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                                                {PRODUCT_LABELS.map(tag => (
                                                    <label key={tag.value} className="flex items-center gap-3 p-3 bg-background rounded-lg cursor-pointer hover:bg-primary/5 transition-colors">
                                                        <input
                                                            type="checkbox"
                                                            checked={productFormData.badges.includes(tag.value)}
                                                            onChange={(e) => {
                                                                const badges = e.target.checked
                                                                    ? [...productFormData.badges, tag.value]
                                                                    : productFormData.badges.filter(b => b !== tag.value);
                                                                setProductFormData({ ...productFormData, badges });
                                                            }}
                                                            className="w-4 h-4 text-primary rounded border-none focus:ring-0 cursor-pointer"
                                                        />
                                                        <span className="text-[10px] font-bold uppercase tracking-tight">{tag.label}</span>
                                                    </label>
                                                ))}
                                            </div>
                                        </div>

                                        <div
                                            onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                                            onDragLeave={() => setIsDragging(false)}
                                            onDrop={handleProductDrop}
                                            className={`border-2 border-dashed rounded-xl p-8 text-center transition-all ${isDragging ? 'border-primary bg-primary/5' : 'border-background-contrast/10'}`}
                                        >
                                            {productFormData.image ? (
                                                <div className="relative inline-block group">
                                                    <img src={productFormData.image} alt="Preview" className="w-32 h-32 object-cover rounded-lg shadow-md" />
                                                    <button onClick={() => setProductFormData({ ...productFormData, image: '' })} className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 shadow-lg opacity-0 group-hover:opacity-100 transition-opacity">
                                                        <span className="material-symbols-outlined text-sm">close</span>
                                                    </button>
                                                </div>
                                            ) : (
                                                <div className="space-y-2">
                                                    <span className="material-symbols-outlined text-4xl text-secondary">image</span>
                                                    <p className="text-xs text-secondary">{uploading ? 'Subiendo...' : 'Arrastra una imagen o copia la URL'}</p>
                                                    <input
                                                        type="text"
                                                        placeholder="URL de imagen"
                                                        value={productFormData.image}
                                                        onChange={e => setProductFormData({ ...productFormData, image: e.target.value })}
                                                        className="mt-4 w-full px-4 py-2 bg-background border-none text-xs outline-none text-center"
                                                    />
                                                </div>
                                            )}
                                        </div>

                                        <div className="flex gap-4 pt-4">
                                            <button onClick={() => setShowProductForm(false)} type="button" className="flex-1 px-8 py-3 bg-background text-secondary text-xs font-bold uppercase tracking-widest hover:bg-background-contrast/5 transition-all">Cancelar</button>
                                            <button type="submit" className="flex-1 px-8 py-3 bg-primary text-white text-xs font-bold uppercase tracking-widest hover:bg-accent transition-all shadow-lg">Guardar Producto</button>
                                        </div>
                                    </form>
                                </div>
                            </div>
                        )}
                    </>
                )}

                {activeTab === 'articles' && (
                    <>
                        <div className="flex flex-col gap-4 mb-8">
                            <div className="flex justify-between items-center">
                                <h2 className="text-2xl font-heading text-foreground">Gestión de Artículos (Journal)</h2>
                                <div className="flex gap-4">
                                    <button
                                        onClick={handleGenerateArticle}
                                        disabled={isGenerating}
                                        className="bg-accent text-white px-6 py-2.5 text-xs font-bold uppercase tracking-widest hover:bg-foreground transition-all shadow-lg flex items-center gap-2 disabled:opacity-50"
                                    >
                                        <span className="material-symbols-outlined text-sm">magic_button</span> {isGenerating ? 'Generando...' : 'Generar con IA'}
                                    </button>
                                    <button
                                        onClick={() => {
                                            setEditingArticle(null);
                                            setArticleFormData({ title: '', content: '', image_url: '', author: 'Starsano' });
                                            setShowArticleForm(true);
                                        }}
                                        className="bg-primary text-white px-6 py-2.5 text-xs font-bold uppercase tracking-widest hover:bg-accent transition-all shadow-lg flex items-center gap-2"
                                    >
                                        <span className="material-symbols-outlined text-sm">add</span> Nuevo Artículo
                                    </button>
                                </div>
                            </div>
                            {isGenerating && (
                                <div className="w-full bg-background-contrast/10 h-1.5 rounded-full overflow-hidden">
                                    <div 
                                        className="bg-accent h-full transition-all duration-300 ease-out"
                                        style={{ width: `${generationProgress}%` }}
                                    />
                                </div>
                            )}
                        </div>

                        <div className="bg-white rounded-xl shadow-sm border border-background-contrast/10 overflow-hidden">
                            <div className="overflow-x-auto">
                                <table className="w-full text-left text-sm">
                                    <thead className="bg-background/50 text-secondary uppercase text-[10px] font-bold tracking-widest">
                                        <tr>
                                            <th className="px-6 py-4">Título</th>
                                            <th className="px-6 py-4">Autor</th>
                                            <th className="px-6 py-4">Fecha</th>
                                            <th className="px-6 py-4 text-right">Acciones</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-background-contrast/5">
                                        {articles.length === 0 ? (
                                            <tr><td colSpan={4} className="text-center py-10">No hay artículos</td></tr>
                                        ) : articles.map(article => (
                                            <tr key={article.id} className="hover:bg-background-contrast/2 transition-colors">
                                                <td className="px-6 py-4 font-bold text-foreground">{article.title}</td>
                                                <td className="px-6 py-4 text-secondary">{article.author}</td>
                                                <td className="px-6 py-4 text-secondary text-xs">{new Date(article.created_at).toLocaleDateString()}</td>
                                                <td className="px-6 py-4 text-right">
                                                    <div className="flex justify-end gap-2">
                                                        <button
                                                            onClick={() => {
                                                                setEditingArticle(article);
                                                                setArticleFormData({
                                                                    title: article.title,
                                                                    content: article.content,
                                                                    image_url: article.image_url,
                                                                    author: article.author
                                                                });
                                                                setShowArticleForm(true);
                                                            }}
                                                            className="text-secondary hover:text-primary p-2 transition-colors"
                                                        >
                                                            <span className="material-symbols-outlined text-lg">edit</span>
                                                        </button>
                                                        <button onClick={() => deleteArticle(article.id)} className="text-secondary hover:text-red-500 p-2 transition-colors">
                                                            <span className="material-symbols-outlined text-lg">delete</span>
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        {showArticleForm && (
                            <div className="fixed inset-0 bg-foreground/20 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                                <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-4xl w-full max-h-[90vh] overflow-y-auto">
                                    <div className="flex justify-between items-center mb-8 border-b pb-4">
                                        <h3 className="text-xl font-bold font-heading">{editingArticle ? 'Editar Artículo' : 'Crear Nuevo Artículo'}</h3>
                                        <button onClick={() => setShowArticleForm(false)} className="text-secondary hover:text-foreground">
                                            <span className="material-symbols-outlined">close</span>
                                        </button>
                                    </div>
                                    <form onSubmit={handleArticleSubmit} className="space-y-6">
                                        <div>
                                            <label className="text-[10px] font-bold uppercase tracking-widest text-secondary block mb-2">Título</label>
                                            <input required type="text" value={articleFormData.title} onChange={e => setArticleFormData({ ...articleFormData, title: e.target.value })} className="w-full px-4 py-3 bg-background border-none text-sm focus:ring-2 focus:ring-primary/20 outline-none" />
                                        </div>
                                        <div>
                                            <label className="text-[10px] font-bold uppercase tracking-widest text-secondary block mb-2">Contenido (Texto)</label>
                                            <textarea required rows={10} value={articleFormData.content} onChange={e => setArticleFormData({ ...articleFormData, content: e.target.value })} className="w-full px-4 py-3 bg-background border-none text-sm focus:ring-2 focus:ring-primary/20 outline-none resize-none font-sans" placeholder="Escribe tu artículo aquí. Los párrafos se crearán automáticamente al guardar." />
                                        </div>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div className="space-y-4">
                                                <label className="text-[10px] font-bold uppercase tracking-widest text-secondary block">Imagen Portada</label>
                                                <div
                                                    onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                                                    onDragLeave={() => setIsDragging(false)}
                                                    onDrop={handleArticleDrop}
                                                    className={`border-2 border-dashed rounded-xl p-6 text-center transition-all ${isDragging ? 'border-primary bg-primary/5' : 'border-background-contrast/10'}`}
                                                >
                                                    {articleFormData.image_url ? (
                                                        <div className="relative inline-block group">
                                                            <img src={articleFormData.image_url} alt="Preview" className="w-full h-32 object-cover rounded-lg shadow-sm" />
                                                            <button 
                                                                type="button"
                                                                onClick={() => setArticleFormData({ ...articleFormData, image_url: '' })} 
                                                                className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 shadow-md opacity-0 group-hover:opacity-100 transition-opacity"
                                                            >
                                                                <span className="material-symbols-outlined text-sm">close</span>
                                                            </button>
                                                        </div>
                                                    ) : (
                                                        <div className="space-y-2">
                                                            <span className="material-symbols-outlined text-3xl text-secondary">image</span>
                                                            <p className="text-[10px] text-secondary">{uploading ? 'Subiendo...' : 'Arrastra una imagen o selecciónala'}</p>
                                                            <input
                                                                type="file"
                                                                accept="image/*"
                                                                onChange={(e) => e.target.files?.[0] && handleFileUpload(e.target.files[0], 'article')}
                                                                className="hidden"
                                                                id="article-image-upload"
                                                            />
                                                            <label
                                                                htmlFor="article-image-upload"
                                                                className="inline-block px-4 py-2 bg-background border border-background-contrast/10 text-[10px] font-bold uppercase tracking-widest cursor-pointer hover:bg-background-contrast/5 transition-all"
                                                            >
                                                                Subir desde PC
                                                            </label>
                                                        </div>
                                                    )}
                                                </div>
                                                <input
                                                    type="text"
                                                    placeholder="O pega una URL de imagen"
                                                    value={articleFormData.image_url}
                                                    onChange={e => setArticleFormData({ ...articleFormData, image_url: e.target.value })}
                                                    className="w-full px-4 py-2 bg-background border-none text-[10px] focus:ring-1 focus:ring-primary/20 outline-none"
                                                />
                                            </div>
                                            <div>
                                                <label className="text-[10px] font-bold uppercase tracking-widest text-secondary block mb-2">Autor</label>
                                                <input type="text" value={articleFormData.author} onChange={e => setArticleFormData({ ...articleFormData, author: e.target.value })} className="w-full px-4 py-3 bg-background border-none text-sm focus:ring-2 focus:ring-primary/20 outline-none" />
                                            </div>
                                        </div>
                                        <div className="flex gap-4 pt-4">
                                            <button onClick={() => setShowArticleForm(false)} type="button" className="flex-1 px-8 py-3 bg-background text-secondary text-xs font-bold uppercase tracking-widest hover:bg-background-contrast/5 transition-all">Cancelar</button>
                                            <button type="submit" className="flex-1 px-8 py-3 bg-primary text-white text-xs font-bold uppercase tracking-widest hover:bg-accent transition-all shadow-lg">Guardar Artículo</button>
                                        </div>
                                    </form>
                                </div>
                            </div>
                        )}
                    </>
                )}

            </div>
        </div>
    );
};

export default AdminDashboard;
