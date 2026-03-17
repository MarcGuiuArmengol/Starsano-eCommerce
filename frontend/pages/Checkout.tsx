import React, { useState } from 'react';
import { useCart } from '../context/CartContext';
import { Link, useNavigate } from 'react-router-dom';
import { useUser } from '../context/UserContext';
import { api } from '../services/api';

const Checkout: React.FC = () => {
    const { cart, cartTotal, clearCart } = useCart();
    const navigate = useNavigate();
    const { user, token } = useUser();
    const [loading, setLoading] = useState(false);

    // Mock form state
    const [formData, setFormData] = useState({
        email: user?.email || '',
        firstName: '',
        lastName: '',
        address: '',
        city: '',
        zip: '',
        card: '',
        expiry: '',
        cvc: ''
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!user || !token) {
            alert('Por favor, inicia sesión para realizar un pedido.');
            navigate('/login');
            return;
        }

        setLoading(true);

        try {
            const orderData = {
                items: cart,
                total: cartTotal,
                shipping_details: {
                    firstName: formData.firstName,
                    lastName: formData.lastName,
                    address: formData.address,
                    city: formData.city,
                    zip: formData.zip
                }
            };

            await api.createOrder(orderData, token);

            clearCart();
            alert('¡Pedido realizado con éxito!');
            navigate('/');
        } catch (err: any) {
            console.error('Error creating order:', err);
            alert('Error al realizar el pedido: ' + err.message);
        } finally {
            setLoading(false);
        }
    };

    if (cart.length === 0) {
        return (
            <div className="min-h-[70vh] flex flex-col items-center justify-center">
                <h2 className="text-2xl font-bold mb-4">Tu carrito está vacío</h2>
                <Link to="/shop" className="text-primary hover:underline">Volver a la tienda</Link>
            </div>
        );
    }

    return (
        <div className="bg-background min-h-screen py-10">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <h1 className="text-3xl font-heading font-bold mb-8 text-center uppercase tracking-widest">Finalizar Compra</h1>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
                    {/* Form */}
                    <div className="space-y-8">
                        {/* Contact */}
                        <div>
                            <h2 className="text-lg font-bold mb-4 uppercase tracking-wider">Contacto</h2>
                            <input
                                type="email"
                                name="email"
                                placeholder="Correo electrónico"
                                className="w-full bg-white border border-background-contrast/50 p-3 rounded-none focus:border-primary focus:ring-0"
                                required
                                value={formData.email}
                                onChange={handleChange}
                            />
                        </div>

                        {/* Shipping */}
                        <div>
                            <h2 className="text-lg font-bold mb-4 uppercase tracking-wider">Envío</h2>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <input type="text" name="firstName" placeholder="Nombre" className="w-full bg-white border border-background-contrast/50 p-3 rounded-none focus:border-primary focus:ring-0" required onChange={handleChange} />
                                <input type="text" name="lastName" placeholder="Apellidos" className="w-full bg-white border border-background-contrast/50 p-3 rounded-none focus:border-primary focus:ring-0" required onChange={handleChange} />
                            </div>
                            <input type="text" name="address" placeholder="Dirección" className="w-full bg-white border border-background-contrast/50 p-3 rounded-none focus:border-primary focus:ring-0 mt-4" required onChange={handleChange} />
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
                                <input type="text" name="city" placeholder="Ciudad" className="w-full bg-white border border-background-contrast/50 p-3 rounded-none focus:border-primary focus:ring-0" required onChange={handleChange} />
                                <input type="text" name="zip" placeholder="Código Postal" className="w-full bg-white border border-background-contrast/50 p-3 rounded-none focus:border-primary focus:ring-0" required onChange={handleChange} />
                            </div>
                        </div>

                        {/* Payment Mock */}
                        <div>
                            <h2 className="text-lg font-bold mb-4 uppercase tracking-wider">Pago Seguro</h2>
                            <div className="bg-white border border-background-contrast/50 p-6 space-y-4">
                                <div className="flex items-center gap-2 mb-4 text-xs text-secondary">
                                    <span className="material-symbols-outlined">lock</span> Encriptación SSL de 256-bits
                                </div>
                                <input type="text" name="card" placeholder="Número de tarjeta (Opcional Prueba)" className="w-full bg-white border border-background-contrast/50 p-3 rounded-none focus:border-primary focus:ring-0" onChange={handleChange} />
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <input type="text" name="expiry" placeholder="MM/YY" className="w-full bg-white border border-background-contrast/50 p-3 rounded-none focus:border-primary focus:ring-0" onChange={handleChange} />
                                    <input type="text" name="cvc" placeholder="CVC" className="w-full bg-white border border-background-contrast/50 p-3 rounded-none focus:border-primary focus:ring-0" onChange={handleChange} />
                                </div>
                            </div>
                        </div>

                        <button
                            onClick={handleSubmit}
                            disabled={loading}
                            className="w-full bg-primary text-white py-4 font-bold uppercase tracking-widest hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {loading ? 'Procesando...' : `Pagar ${cartTotal.toFixed(2)} MXN`}
                        </button>
                    </div>

                    {/* Order Summary */}
                    <div className="bg-white p-6 md:p-8 h-fit border border-background-contrast/20 lg:sticky lg:top-24">
                        <h2 className="text-lg font-bold mb-6 uppercase tracking-wider border-b border-background-contrast/20 pb-4">Resumen del pedido</h2>
                        <div className="space-y-4 mb-6 max-h-[400px] overflow-y-auto custom-scrollbar">
                            {cart.map(item => (
                                <div key={item.id} className="flex gap-4">
                                    <div className="w-16 h-16 bg-background rounded-sm overflow-hidden shrink-0">
                                        <img src={item.images && item.images.length > 0 ? item.images[0] : ''} alt={item.name} className="w-full h-full object-cover bg-[#F5F5F5]" />
                                    </div>
                                    <div className="flex-1">
                                        <h3 className="font-bold text-sm text-foreground">{item.name}</h3>
                                        <p className="text-xs text-secondary">Cant: {item.quantity}</p>
                                    </div>
                                    <div className="text-sm font-light">
                                        {(item.price * item.quantity).toFixed(2)} MXN
                                    </div>
                                </div>
                            ))}
                        </div>
                        <div className="space-y-2 border-t border-background-contrast/20 pt-4 text-sm">
                            <div className="flex justify-between text-secondary">
                                <span>Subtotal</span>
                                <span>{cartTotal.toFixed(2)} MXN</span>
                            </div>
                            <div className="flex justify-between text-secondary">
                                <span>Envío</span>
                                <span>0.00 MXN</span>
                            </div>
                            <div className="flex justify-between font-bold text-lg pt-2 text-foreground">
                                <span>Total</span>
                                <span>{cartTotal.toFixed(2)} MXN</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Checkout;
