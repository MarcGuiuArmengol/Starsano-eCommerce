import React from 'react';
import { useCart } from '../context/CartContext';
import { Link, useNavigate } from 'react-router-dom';
import { useUser } from '../context/UserContext';
import { api } from '../services/api';
import { useState } from 'react';

const CartDrawer: React.FC = () => {
  const { items, isCartOpen, setIsCartOpen, removeFromCart, updateQuantity, cartTotal, clearCart } = useCart();
  const { user, token } = useUser();
  const navigate = useNavigate();
  const [isProcessing, setIsProcessing] = useState(false);

  const handleDirectCheckout = async () => {
    if (!user || !token) {
      alert('Por favor, inicia sesión para realizar un pedido.');
      setIsCartOpen(false);
      navigate('/login');
      return;
    }

    if (items.length === 0) return;

    setIsProcessing(true);
    try {
      const orderData = {
        items: items,
        total: cartTotal,
        shipping_details: {
          firstName: 'Prueba',
          lastName: 'Directa',
          address: 'Dirección de prueba',
          city: 'Ciudad de prueba',
          zip: '00000'
        }
      };

      await api.createOrder(orderData, token);

      alert('¡Pedido realizado con éxito directamente!');
      clearCart();
      setIsCartOpen(false);
    } catch (err: any) {
      console.error('Error in direct checkout:', err);
      alert('Error al procesar el pedido: ' + err.message);
    } finally {
      setIsProcessing(false);
    }
  };

  if (!isCartOpen) return null;

  return (
    <div className="relative z-[60]" aria-labelledby="slide-over-title" role="dialog" aria-modal="true">
      {/* Background backdrop */}
      <div
        className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm transition-opacity"
        onClick={() => setIsCartOpen(false)}
      ></div>

      <div className="fixed inset-0 overflow-hidden">
        <div className="absolute inset-0 overflow-hidden">
          <div className="pointer-events-none fixed inset-y-0 right-0 flex max-w-full pl-10">
            <div className="pointer-events-auto w-screen max-w-md transform transition duration-500 sm:duration-700">
              <div className="flex h-full flex-col bg-white dark:bg-slate-900 shadow-xl">
                <div className="flex-1 overflow-y-auto px-4 py-6 sm:px-6">
                  <div className="flex items-start justify-between">
                    <h2 className="text-lg font-bold text-slate-900 dark:text-white" id="slide-over-title">
                      Tu Carrito
                    </h2>
                    <div className="ml-3 flex h-7 items-center">
                      <button
                        type="button"
                        className="relative -m-2 p-2 text-slate-400 hover:text-slate-500"
                        onClick={() => setIsCartOpen(false)}
                      >
                        <span className="absolute -inset-0.5"></span>
                        <span className="sr-only">Close panel</span>
                        <span className="material-symbols-outlined">close</span>
                      </button>
                    </div>
                  </div>

                  <div className="mt-8">
                    {items.length === 0 ? (
                      <div className="text-center py-10">
                        <span className="material-symbols-outlined text-6xl text-slate-300 mb-4">shopping_basket</span>
                        <p className="text-slate-500">Tu carrito está vacío.</p>
                        <button
                          onClick={() => setIsCartOpen(false)}
                          className="mt-4 text-primary font-bold hover:underline"
                        >
                          Seguir comprando
                        </button>
                      </div>
                    ) : (
                      <div className="flow-root">
                        <ul role="list" className="-my-6 divide-y divide-slate-200 dark:divide-slate-800">
                          {items.map((item) => (
                            <li key={item.id} className="flex py-6">
                              <div className="h-24 w-24 flex-shrink-0 overflow-hidden rounded-md border border-slate-200 dark:border-slate-700">
                                <img
                                  src={item.images && item.images.length > 0 ? item.images[0] : ''}
                                  alt={item.name}
                                  className="h-full w-full object-cover object-center bg-[#F5F5F5]"
                                />
                              </div>

                              <div className="ml-4 flex flex-1 flex-col">
                                <div>
                                  <div className="flex justify-between text-base font-medium text-slate-900 dark:text-white">
                                    <h3>
                                      <a href="#">{item.name}</a>
                                    </h3>
                                    <p className="ml-4">{(item.price * item.quantity).toFixed(2)} MXN</p>
                                  </div>
                                  <p className="mt-1 text-sm text-slate-500">{item.category}</p>
                                </div>
                                <div className="flex flex-1 items-end justify-between text-sm">
                                  <div className="flex items-center gap-2 border border-slate-300 dark:border-slate-700 rounded-lg px-2 py-1">
                                    <button
                                      onClick={() => updateQuantity(item.id, item.quantity - 1)}
                                      className="text-slate-500 hover:text-primary disabled:opacity-50"
                                      disabled={item.quantity <= 1}
                                    >
                                      -
                                    </button>
                                    <span className="font-semibold w-4 text-center dark:text-white">{item.quantity}</span>
                                    <button
                                      onClick={() => updateQuantity(item.id, item.quantity + 1)}
                                      className="text-slate-500 hover:text-primary"
                                    >
                                      +
                                    </button>
                                  </div>

                                  <div className="flex">
                                    <button
                                      type="button"
                                      className="font-medium text-red-500 hover:text-red-600 flex items-center gap-1"
                                      onClick={() => removeFromCart(item.id)}
                                    >
                                      Eliminar
                                    </button>
                                  </div>
                                </div>
                              </div>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </div>

                {items.length > 0 && (
                  <div className="border-t border-slate-200 dark:border-slate-800 px-4 py-6 sm:px-6">
                    <div className="flex justify-between text-base font-bold text-slate-900 dark:text-white">
                      <p>Subtotal</p>
                      <p>{cartTotal.toFixed(2)} MXN</p>
                    </div>
                    <p className="mt-0.5 text-sm text-slate-500">Envío e impuestos calculados en el checkout.</p>
                    <div className="mt-6">
                      <button
                        onClick={handleDirectCheckout}
                        disabled={isProcessing}
                        className="w-full flex items-center justify-center rounded-xl border border-transparent bg-primary px-6 py-3 text-base font-medium text-white shadow-sm hover:bg-primary-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {isProcessing ? 'Procesando...' : 'Pagar ahora'}
                      </button>
                    </div>
                    <div className="mt-6 flex justify-center text-center text-sm text-slate-500">
                      <p>
                        o{' '}
                        <button
                          type="button"
                          className="font-bold text-primary hover:text-primary-dark"
                          onClick={() => setIsCartOpen(false)}
                        >
                          Seguir comprando
                          <span aria-hidden="true"> &rarr;</span>
                        </button>
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CartDrawer;
