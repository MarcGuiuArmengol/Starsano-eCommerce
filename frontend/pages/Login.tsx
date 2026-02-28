import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import { useUser } from '../context/UserContext';

const Login: React.FC = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const { login } = useUser();
    const navigate = useNavigate();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        try {
            const data = await api.login({ email, password });
            login(data.token, data.user);
            navigate('/');
        } catch (err: any) {
            setError(err.message || 'Error al iniciar sesión');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-background flex flex-col items-center justify-center px-4 py-12">
            <div className="max-w-md w-full bg-white p-8 rounded-2xl shadow-xl border border-background-contrast/10">
                <div className="text-center mb-8">
                    <span className="material-symbols-outlined text-4xl text-primary mb-2">spa</span>
                    <h1 className="text-3xl text-foreground font-heading">Bienvenido de nuevo</h1>
                    <p className="text-secondary font-light mt-2">Accede a tu cuenta de Starsano</p>
                </div>

                {error && (
                    <div className="bg-red-50 text-red-600 p-4 rounded-lg mb-6 text-sm flex items-center gap-2">
                        <span className="material-symbols-outlined text-lg">error</span>
                        {error}
                    </div>
                )}

                <form className="space-y-6" onSubmit={handleSubmit}>
                    <div>
                        <label className="block text-xs font-bold uppercase tracking-widest text-secondary mb-2">Email</label>
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full bg-background border-0 border-b border-background-contrast focus:border-primary focus:ring-0 px-0 py-3 transition-colors"
                            placeholder="tucorreo@ejemplo.com"
                            required
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-bold uppercase tracking-widest text-secondary mb-2">Contraseña</label>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full bg-background border-0 border-b border-background-contrast focus:border-primary focus:ring-0 px-0 py-3 transition-colors"
                            placeholder="••••••••"
                            required
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-primary text-white py-4 font-bold uppercase tracking-widest text-sm hover:bg-opacity-90 transition-all shadow-lg hover:shadow-xl hover:-translate-y-1 disabled:opacity-50"
                    >
                        {loading ? 'Iniciando sesión...' : 'Iniciar Sesión'}
                    </button>
                </form>

                <div className="mt-8 text-center text-sm">
                    <span className="text-secondary font-light">¿No tienes cuenta? </span>
                    <Link to="/register" className="text-primary font-bold hover:text-accent transition-colors">Regístrate gratis</Link>
                </div>
            </div>
        </div>
    );
};

export default Login;
