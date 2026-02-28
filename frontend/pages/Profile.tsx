import React from 'react';
import { useUser } from '../context/UserContext';
import { Link } from 'react-router-dom';

const Profile: React.FC = () => {
    const { user, logout } = useUser();

    if (!user) {
        return (
            <div className="min-h-[70vh] flex flex-col items-center justify-center">
                <p className="text-secondary mb-4">Debes iniciar sesión para ver tu perfil.</p>
                <Link to="/login" className="bg-primary text-white px-8 py-3 font-bold uppercase tracking-widest text-xs">Iniciar Sesión</Link>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background py-20 px-4">
            <div className="max-w-xl mx-auto bg-white rounded-2xl shadow-xl border border-background-contrast/10 p-8 md:p-12">
                <div className="text-center mb-10">
                    <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                        <span className="material-symbols-outlined text-4xl text-primary">person</span>
                    </div>
                    <h1 className="text-3xl text-foreground font-heading">Mi Cuenta</h1>
                    <p className="text-secondary font-light mt-2">Gestiona tu información personal</p>
                </div>

                <div className="space-y-6">
                    <div className="border-b border-background-contrast/5 pb-4">
                        <label className="block text-[10px] font-bold uppercase tracking-widest text-secondary mb-1">Email</label>
                        <p className="text-foreground font-medium">{user.email}</p>
                    </div>
                    <div className="border-b border-background-contrast/5 pb-4">
                        <label className="block text-[10px] font-bold uppercase tracking-widest text-secondary mb-1">Rol</label>
                        <p className="text-foreground capitalize">{user.role}</p>
                    </div>
                </div>

                <div className="mt-12 flex flex-col gap-4">
                    <Link to="/orders" className="w-full text-center py-4 border border-primary text-primary font-bold uppercase tracking-widest text-xs hover:bg-primary hover:text-white transition-all">Ver mis pedidos</Link>
                    <button
                        onClick={logout}
                        className="w-full text-center py-4 bg-red-50 text-red-500 font-bold uppercase tracking-widest text-xs hover:bg-red-500 hover:text-white transition-all"
                    >
                        Cerrar Sesión
                    </button>
                </div>
            </div>
        </div>
    );
};

export default Profile;
