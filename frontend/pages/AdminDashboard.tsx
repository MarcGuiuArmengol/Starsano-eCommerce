import React, { useState, useEffect } from 'react';
import { useUser } from '../context/UserContext';

const AdminDashboard: React.FC = () => {
    const { token } = useUser();
    const [activeTab, setActiveTab] = useState<'orders' | 'products'>('orders');
    const [orders, setOrders] = useState<any[]>([]);
    const [products, setProducts] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [importing, setImporting] = useState(false);
    const [showProductForm, setShowProductForm] = useState(false);
    const [editingProduct, setEditingProduct] = useState<any>(null);
    const [isDragging, setIsDragging] = useState(false);
    const [uploading, setUploading] = useState(false);

    // Form state
    const [formData, setFormData] = useState({
        name: '',
        price: '',
        description: '',
        category: '',
        image: '',
        badges: '',
        rating: '5'
    });

    useEffect(() => {
        if (token) {
            fetchOrders();
            fetchProducts();
        }
    }, [token]);

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

    const handleFileUpload = async (file: File) => {
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
                setFormData(prev => ({ ...prev, image: result.imageUrl }));
            }
        } catch (err) {
            console.error('Error uploading file:', err);
        } finally {
            setUploading(false);
        }
    };

    const onDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
        const file = e.dataTransfer.files[0];
        if (file && file.type.startsWith('image/')) {
            handleFileUpload(file);
        }
    };

    const fetchOrders = async () => {
        try {
            const response = await fetch(`/api/admin/orders`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await response.json();
            if (response.ok && Array.isArray(data)) {
                setOrders(data);
            } else {
                console.error('Non-array or error response for orders:', data);
                setOrders([]);
                if (response.status === 403) {
                    alert('Acceso denegado: Se requieren permisos de administrador.');
                }
            }
        } catch (err) {
            console.error('Error fetching admin orders:', err);
            setOrders([]);
        } finally {
            setLoading(false);
        }
    };

    const fetchProducts = async () => {
        try {
            const response = await fetch(`/api/products`);
            const data = await response.json();
            if (response.ok && Array.isArray(data)) {
                setProducts(data);
            } else {
                setProducts([]);
            }
        } catch (err) {
            console.error('Error fetching items:', err);
            setProducts([]);
        }
    };

    const handleProductSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const url = editingProduct
            ? `/api/admin/products/${editingProduct.id}`
            : `/api/admin/products`;

        const method = editingProduct ? 'PUT' : 'POST';

        const payload = {
            ...formData,
            price: Number(formData.price),
            rating: Number(formData.rating),
            badges: formData.badges.split(',').map(b => b.trim()).filter(b => b !== '')
        };

        try {
            const res = await fetch(url, {
                method,
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(payload)
            });
            if (res.ok) {
                setShowProductForm(false);
                setEditingProduct(null);
                setFormData({ name: '', price: '', description: '', category: '', image: '', badges: '', rating: '5' });
                fetchProducts();
            }
        } catch (err) {
            console.error('Error saving product:', err);
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

    return (
        <div className="min-h-screen bg-background p-4 md:p-8">
            <div className="max-w-7xl mx-auto">
                <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-12">
                    <div>
                        <h1 className="text-4xl text-foreground font-heading">Panel de Control</h1>
                        <p className="text-secondary font-light mt-1">Gestión de tienda y administración</p>
                    </div>
                    <div className="flex bg-white rounded-lg p-1 shadow-sm border border-background-contrast/5">
                        <button
                            onClick={() => setActiveTab('orders')}
                            className={`px-6 py-2 text-xs font-bold uppercase tracking-widest transition-all rounded-md ${activeTab === 'orders' ? 'bg-primary text-white' : 'text-secondary hover:bg-background'}`}
                        >
                            Pedidos
                        </button>
                        <button
                            onClick={() => setActiveTab('products')}
                            className={`px-6 py-2 text-xs font-bold uppercase tracking-widest transition-all rounded-md ${activeTab === 'products' ? 'bg-primary text-white' : 'text-secondary hover:bg-background'}`}
                        >
                            Productos
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
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-background-contrast/5">
                                        {loading ? (
                                            <tr><td colSpan={5} className="text-center py-10">Cargando...</td></tr>
                                        ) : orders.length === 0 ? (
                                            <tr><td colSpan={5} className="text-center py-10">No hay pedidos aún</td></tr>
                                        ) : orders.map(order => (
                                            <tr key={order.id} className="hover:bg-background-contrast/5 transition-colors">
                                                <td className="px-6 py-4 font-mono">#{order.id}</td>
                                                <td className="px-6 py-4">{order.email}</td>
                                                <td className="px-6 py-4 font-bold text-primary">${order.total}</td>
                                                <td className="px-6 py-4">
                                                    <span className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase ${order.status === 'pending' ? 'bg-yellow-100 text-yellow-700' : 'bg-green-100 text-green-700'
                                                        }`}>
                                                        {order.status}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 text-secondary">{new Date(order.created_at).toLocaleDateString()}</td>
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
                                    onClick={() => { setShowProductForm(true); setEditingProduct(null); }}
                                    className="bg-primary text-white px-6 py-2.5 text-xs font-bold uppercase tracking-widest hover:bg-accent transition-all shadow-lg flex items-center gap-2"
                                >
                                    <span className="material-symbols-outlined text-sm">add</span> Nuevo Producto
                                </button>
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
                                                <input required type="text" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} className="w-full px-4 py-3 bg-background border-none text-sm focus:ring-2 focus:ring-primary/20 outline-none" />
                                            </div>
                                            <div>
                                                <label className="text-[10px] font-bold uppercase tracking-widest text-secondary block mb-2">Precio (MXN)</label>
                                                <input required type="number" step="0.01" value={formData.price} onChange={e => setFormData({ ...formData, price: e.target.value })} className="w-full px-4 py-3 bg-background border-none text-sm focus:ring-2 focus:ring-primary/20 outline-none" />
                                            </div>
                                        </div>
                                        <div>
                                            <label className="text-[10px] font-bold uppercase tracking-widest text-secondary block mb-2">Descripción</label>
                                            <textarea required rows={3} value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })} className="w-full px-4 py-3 bg-background border-none text-sm focus:ring-2 focus:ring-primary/20 outline-none resize-none" />
                                        </div>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div>
                                                <label className="text-[10px] font-bold uppercase tracking-widest text-secondary block mb-2">Categoría</label>
                                                <input required type="text" value={formData.category} onChange={e => setFormData({ ...formData, category: e.target.value })} className="w-full px-4 py-3 bg-background border-none text-sm focus:ring-2 focus:ring-primary/20 outline-none" />
                                            </div>
                                            <div>
                                                <label className="text-[10px] font-bold uppercase tracking-widest text-secondary block mb-2">Imagen del Producto</label>
                                                <div
                                                    onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                                                    onDragLeave={() => setIsDragging(false)}
                                                    onDrop={onDrop}
                                                    className={`relative border-2 border-dashed rounded-xl p-6 transition-all flex flex-col items-center justify-center gap-2 ${isDragging ? 'border-primary bg-primary/5' : 'border-background-contrast/20 bg-background/30'
                                                        }`}
                                                >
                                                    {formData.image ? (
                                                        <div className="relative w-full aspect-video rounded-lg overflow-hidden border shadow-inner">
                                                            <img src={formData.image} alt="Preview" className="w-full h-full object-contain" />
                                                            <button
                                                                type="button"
                                                                onClick={() => setFormData({ ...formData, image: '' })}
                                                                className="absolute top-2 right-2 bg-white/80 p-1 rounded-full text-red-600 hover:bg-white shadow-sm"
                                                            >
                                                                <span className="material-symbols-outlined text-sm">close</span>
                                                            </button>
                                                        </div>
                                                    ) : (
                                                        <>
                                                            <span className="material-symbols-outlined text-primary text-3xl mb-1">
                                                                {uploading ? 'sync' : 'cloud_upload'}
                                                            </span>
                                                            <p className="text-[10px] text-secondary text-center uppercase font-bold">
                                                                {uploading ? 'Subiendo...' : 'Suelta tu imagen aquí o haz click'}
                                                            </p>
                                                            <input
                                                                type="file"
                                                                className="absolute inset-0 opacity-0 cursor-pointer"
                                                                accept="image/*"
                                                                onChange={(e) => {
                                                                    const file = e.target.files?.[0];
                                                                    if (file) handleFileUpload(file);
                                                                }}
                                                            />
                                                        </>
                                                    )}
                                                </div>
                                                <input
                                                    type="text"
                                                    value={formData.image}
                                                    onChange={e => setFormData({ ...formData, image: e.target.value })}
                                                    className="w-full mt-2 px-4 py-2 bg-background border-none text-[10px] focus:ring-2 focus:ring-primary/20 outline-none"
                                                    placeholder="O pega una URL aquí..."
                                                />
                                            </div>
                                        </div>
                                        <button className="w-full bg-primary text-white py-4 font-bold uppercase tracking-widest text-xs hover:bg-accent transition-all shadow-xl">
                                            {editingProduct ? 'Guardar Cambios' : 'Publicar Producto'}
                                        </button>
                                    </form>
                                </div>
                            </div>
                        )}

                        <div className="bg-white rounded-xl shadow-sm border border-background-contrast/10 overflow-hidden">
                            <div className="overflow-x-auto">
                                <table className="w-full text-left text-sm">
                                    <thead className="bg-background/50 text-secondary uppercase text-[10px] font-bold tracking-widest">
                                        <tr>
                                            <th className="px-6 py-4">Producto</th>
                                            <th className="px-6 py-4">Categoría</th>
                                            <th className="px-6 py-4">Precio</th>
                                            <th className="px-6 py-4">Rating</th>
                                            <th className="px-6 py-4 text-right">Acciones</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-background-contrast/5">
                                        {products.map(p => (
                                            <tr key={p.id} className="hover:bg-background-contrast/5 transition-colors">
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center gap-4">
                                                        <img src={p.image} alt={p.name} className="w-10 h-10 object-cover rounded shadow-sm" />
                                                        <span className="font-bold text-foreground">{p.name}</span>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 text-secondary">{p.category}</td>
                                                <td className="px-6 py-4 font-bold text-primary">${p.price}</td>
                                                <td className="px-6 py-4 text-accent">★ {p.rating}</td>
                                                <td className="px-6 py-4 text-right">
                                                    <div className="flex justify-end gap-2">
                                                        <button
                                                            onClick={() => {
                                                                setEditingProduct(p);
                                                                setFormData({
                                                                    name: p.name,
                                                                    price: p.price.toString(),
                                                                    description: p.description,
                                                                    category: p.category,
                                                                    image: p.image,
                                                                    badges: (p.badges || []).join(', '),
                                                                    rating: p.rating.toString()
                                                                });
                                                                setShowProductForm(true);
                                                            }}
                                                            className="p-2 text-secondary hover:text-primary transition-colors"
                                                        >
                                                            <span className="material-symbols-outlined text-sm">edit</span>
                                                        </button>
                                                        <button
                                                            onClick={() => deleteProduct(p.id)}
                                                            className="p-2 text-secondary hover:text-red-600 transition-colors"
                                                        >
                                                            <span className="material-symbols-outlined text-sm">delete</span>
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
};

export default AdminDashboard;
