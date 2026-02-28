import React, { useState, useEffect } from 'react';
import { useUser } from '../context/UserContext';
import { api } from '../services/api';
import { Link } from 'react-router-dom';

const Orders: React.FC = () => {
    const { token, user } = useUser();
    const [orders, setOrders] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (token) {
            api.getOrderHistory(token)
                .then(data => setOrders(data))
                .catch(err => console.error(err))
                .finally(() => setLoading(false));
        }
    }, [token]);

    if (!user) {
        return (
            <div className="min-h-[70vh] flex flex-col items-center justify-center">
                <p className="text-secondary mb-4">Debes iniciar sesión para ver tus pedidos.</p>
                <Link to="/login" className="bg-primary text-white px-8 py-3 font-bold uppercase tracking-widest text-xs">Iniciar Sesión</Link>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background py-20 px-4">
            <div className="max-w-4xl mx-auto">
                <div className="mb-12">
                    <h1 className="text-4xl text-foreground font-heading">Mis Pedidos</h1>
                    <p className="text-secondary font-light mt-1">Historial de tus compras en Starsano</p>
                </div>

                {loading ? (
                    <div className="bg-white p-12 text-center rounded-2xl shadow-sm border border-background-contrast/10">
                        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-primary mx-auto mb-4"></div>
                        <p className="text-secondary text-sm">Buscando tus pedidos...</p>
                    </div>
                ) : orders.length === 0 ? (
                    <div className="bg-white p-16 text-center rounded-2xl shadow-sm border border-background-contrast/10">
                        <span className="material-symbols-outlined text-5xl text-background-contrast/20 mb-4 text-primary">shopping_basket</span>
                        <h3 className="text-xl text-foreground mb-2">Aún no tienes pedidos</h3>
                        <p className="text-secondary font-light mb-8 max-w-xs mx-auto">Cuando realices tu primera compra, aparecerá aquí.</p>
                        <Link to="/shop" className="inline-block bg-primary text-white px-10 py-4 font-bold uppercase tracking-widest text-xs hover:bg-accent transition-all">Ir a la tienda</Link>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {orders.map(order => (
                            <div key={order.id} className="bg-white p-6 rounded-xl shadow-sm border border-background-contrast/10 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:shadow-md transition-shadow">
                                <div>
                                    <div className="flex items-center gap-3 mb-1">
                                        <span className="text-[10px] font-bold uppercase tracking-widest text-secondary">Pedido #{order.id}</span>
                                        <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase ${order.status === 'pending' ? 'bg-yellow-100 text-yellow-700' : 'bg-green-100 text-green-700'
                                            }`}>
                                            {order.status}
                                        </span>
                                    </div>
                                    <p className="text-xs text-secondary font-light">{new Date(order.created_at).toLocaleDateString('es-MX', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
                                </div>
                                <div className="flex items-center justify-between md:justify-end gap-12">
                                    <div className="text-right">
                                        <p className="text-[10px] text-secondary font-bold uppercase tracking-widest mb-0.5">Total</p>
                                        <p className="text-lg font-bold text-primary">${order.total}</p>
                                    </div>
                                    <Link to={`/orders/${order.id}`} className="p-2 border border-background-contrast/10 rounded-full hover:bg-background-contrast/5 transition-colors">
                                        <span className="material-symbols-outlined text-secondary">chevron_right</span>
                                    </Link>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default Orders;
