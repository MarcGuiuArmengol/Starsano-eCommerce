import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { useUser } from '../context/UserContext';

const AdminDashboard: React.FC = () => {
    const { token } = useUser();
    const [orders, setOrders] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (token) {
            fetchOrders();
        }
    }, [token]);

    const fetchOrders = async () => {
        try {
            const response = await fetch(`${import.meta.env.VITE_API_URL}/api/admin/orders`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await response.json();
            setOrders(data);
        } catch (err) {
            console.error('Error fetching admin orders:', err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-background p-4 md:p-8">
            <div className="max-w-7xl mx-auto">
                <header className="flex justify-between items-center mb-12">
                    <div>
                        <h1 className="text-4xl text-foreground font-heading">Panel de Control</h1>
                        <p className="text-secondary font-light mt-1">Gestión de tienda y pedidos</p>
                    </div>
                    <div className="flex gap-4">
                        <button className="bg-primary text-white px-6 py-2 text-xs font-bold uppercase tracking-widest hover:bg-accent transition-all">Subir Producto</button>
                    </div>
                </header>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12">
                    <div className="bg-white p-6 rounded-xl shadow-sm border border-background-contrast/10">
                        <span className="text-xs font-bold text-secondary uppercase tracking-widest block mb-2">Ventas Totales</span>
                        <h3 className="text-3xl text-primary font-heading">${orders.reduce((acc, o) => acc + Number(o.total), 0).toFixed(2)}</h3>
                    </div>
                    <div className="bg-white p-6 rounded-xl shadow-sm border border-background-contrast/10">
                        <span className="text-xs font-bold text-secondary uppercase tracking-widest block mb-2">Pedidos</span>
                        <h3 className="text-3xl text-primary font-heading">{orders.length}</h3>
                    </div>
                    <div className="bg-white p-6 rounded-xl shadow-sm border border-background-contrast/10">
                        <span className="text-xs font-bold text-secondary uppercase tracking-widest block mb-2">Clientes</span>
                        <h3 className="text-3xl text-primary font-heading">{new Set(orders.map(o => o.user_id)).size}</h3>
                    </div>
                </div>

                <div className="bg-white rounded-xl shadow-sm border border-background-contrast/10 overflow-hidden">
                    <div className="px-6 py-4 border-b border-background-contrast/10 flex justify-between items-center">
                        <h3 className="text-lg font-bold text-foreground">Últimos Pedidos</h3>
                        <button className="text-xs text-primary font-bold hover:underline">Ver todos</button>
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
            </div>
        </div>
    );
};

export default AdminDashboard;
