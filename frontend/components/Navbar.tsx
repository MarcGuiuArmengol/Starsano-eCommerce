import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useUser } from '../context/UserContext';
import logo from '../logo.png';

const Navbar: React.FC = () => {
  const { setIsCartOpen, cartCount } = useCart();
  const { user, logout } = useUser();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const location = useLocation();

  const isHome = location.pathname === '/';

  // Close mobile menu on route change
  useEffect(() => {
    setIsMobileMenuOpen(false);
    setIsUserMenuOpen(false);
  }, [location.pathname]);

  // Lock scroll when menu is open
  useEffect(() => {
    if (isMobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isMobileMenuOpen]);

  return (
    <header className={`sticky top-0 w-full bg-white/90 backdrop-blur-md border-b border-primary/5 shadow-sm transition-all duration-300 ${isMobileMenuOpen ? 'z-[2000]' : 'z-50'}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex h-20 items-center justify-between gap-4">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 shrink-0 group">
            <img src={logo} alt="Starsano Logo" className="h-10 md:h-12 w-auto object-contain transition-transform duration-300 group-hover:scale-105" />
          </Link>

          {/* Desktop Menu */}
          <nav className="hidden lg:flex items-center gap-8">
            <Link to="/" className={`text-xs font-bold uppercase tracking-widest hover:text-accent transition-colors ${location.pathname === '/' ? 'text-primary' : 'text-secondary'}`}>Inicio</Link>
            <Link to="/shop" className={`text-xs font-bold uppercase tracking-widest hover:text-accent transition-colors ${location.pathname === '/shop' ? 'text-primary' : 'text-secondary'}`}>Tienda</Link>
            <Link to="/blog" className={`text-xs font-bold uppercase tracking-widest hover:text-accent transition-colors ${location.pathname === '/blog' ? 'text-primary' : 'text-secondary'}`}>Journal</Link>
            <Link to="/contact" className={`text-xs font-bold uppercase tracking-widest hover:text-accent transition-colors ${location.pathname === '/contact' ? 'text-primary' : 'text-secondary'}`}>Contacto</Link>
            {user?.role === 'admin' && (
              <Link to="/admin" className="text-xs font-bold uppercase tracking-widest text-accent hover:underline">Admin</Link>
            )}
          </nav>

          {/* Search & Icons */}
          <div className="flex items-center gap-1 sm:gap-4 flex-1 justify-end">
            <div className="hidden md:flex relative max-w-[200px] w-full group">
              <input
                className="w-full bg-transparent border-b border-secondary/20 py-1.5 pl-0 pr-6 text-xs focus:border-accent focus:ring-0 text-foreground placeholder:text-secondary/50 transition-all font-medium"
                type="text"
                placeholder="BUSCAR..."
              />
              <span className="material-symbols-outlined absolute right-0 top-1/2 -translate-y-1/2 text-secondary/50 text-lg group-focus-within:text-accent transition-colors">search</span>
            </div>

            <div className="relative">
              <button
                onClick={() => user ? setIsUserMenuOpen(!isUserMenuOpen) : undefined}
                className="p-2 text-foreground hover:text-accent transition-colors flex items-center gap-1"
              >
                {user ? (
                  <>
                    <span className="material-symbols-outlined">person</span>
                    <span className="hidden lg:inline text-[10px] font-bold uppercase tracking-wider">{user.email.split('@')[0]}</span>
                  </>
                ) : (
                  <Link to="/login" className="material-symbols-outlined">person</Link>
                )}
              </button>

              {user && isUserMenuOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-white border border-background-contrast/10 shadow-xl rounded-lg py-2 z-[60] animate-fadeIn">
                  <div className="px-4 py-2 border-b border-background-contrast/5">
                    <p className="text-[10px] text-secondary font-bold uppercase tracking-tighter truncate">{user.email}</p>
                  </div>
                  <Link to="/profile" className="block px-4 py-2 text-xs text-secondary hover:bg-background-contrast/5 hover:text-primary">Mi Perfil</Link>
                  <Link to="/orders" className="block px-4 py-2 text-xs text-secondary hover:bg-background-contrast/5 hover:text-primary">Mis Pedidos</Link>
                  <button
                    onClick={logout}
                    className="w-full text-left px-4 py-2 text-xs text-red-500 hover:bg-red-50"
                  >
                    Cerrar Sesión
                  </button>
                </div>
              )}
            </div>

            <button
              onClick={() => setIsCartOpen(true)}
              className="relative p-2 text-foreground hover:text-accent transition-colors group"
            >
              <span className="material-symbols-outlined fill-current">shopping_bag</span>
              {cartCount > 0 && (
                <span className="absolute top-0 right-0 bg-accent text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center animate-fadeIn">
                  {cartCount}
                </span>
              )}
            </button>

            <button
              className="lg:hidden p-2 text-foreground flex items-center justify-center relative z-[200] touch-manipulation"
              aria-label="Toggle Menu"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setIsMobileMenuOpen(!isMobileMenuOpen);
              }}
            >
              <span className="material-symbols-outlined text-3xl font-bold">
                {isMobileMenuOpen ? 'close' : 'menu'}
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu Overlay - Move outside of max-w container but inside header */}
      {isMobileMenuOpen && (
        <div 
          className="lg:hidden fixed inset-0 bg-white flex flex-col h-screen w-screen overflow-hidden z-[9999]"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Mobile Header */}
          <div className="flex h-20 items-center justify-between px-4 border-b border-primary/5 shadow-sm shrink-0">
            <Link to="/" className="flex items-center gap-2" onClick={() => setIsMobileMenuOpen(false)}>
              <img src={logo} alt="Starsano Logo" className="h-10 w-auto object-contain" />
            </Link>
            <button
              onClick={() => setIsMobileMenuOpen(false)}
              className="p-2 text-foreground h-12 w-12 flex items-center justify-center bg-background/50 rounded-full"
            >
              <span className="material-symbols-outlined text-3xl">close</span>
            </button>
          </div>

          {/* Nav Links */}
          <nav className="flex-1 px-6 py-8 flex flex-col gap-1 overflow-y-auto bg-white">
            <Link 
              to="/" 
              className="block w-full py-6 text-3xl font-black text-primary uppercase tracking-[0.1em] border-b border-primary/10 active:bg-primary/5 transition-colors"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              Inicio
            </Link>
            <Link 
              to="/shop" 
              className="block w-full py-6 text-3xl font-black text-secondary uppercase tracking-[0.1em] border-b border-primary/10 active:bg-primary/5 transition-colors"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              Tienda
            </Link>
            <Link 
              to="/blog" 
              className="block w-full py-6 text-3xl font-black text-secondary uppercase tracking-[0.1em] border-b border-primary/10 active:bg-primary/5 transition-colors"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              Journal
            </Link>
            <Link 
              to="/contact" 
              className="block w-full py-6 text-3xl font-black text-secondary uppercase tracking-[0.1em] border-b border-primary/10 active:bg-primary/5 transition-colors"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              Contacto
            </Link>
            {user?.role === 'admin' && (
              <Link 
                to="/admin" 
                className="block w-full py-6 text-3xl font-black text-accent uppercase tracking-[0.1em] border-b border-accent/20 active:bg-accent/5 transition-colors"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Admin
              </Link>
            )}

            <div className="mt-auto py-8 flex flex-col items-center gap-6 border-t border-primary/5">
              <p className="text-[10px] text-primary/60 font-black uppercase tracking-[0.2em]">Bienvenido a Starsano</p>
              <div className="flex justify-center gap-10">
                <span className="material-symbols-outlined text-primary/40 text-3xl">eco</span>
                <span className="material-symbols-outlined text-primary/40 text-3xl">verified</span>
                <span className="material-symbols-outlined text-primary/40 text-3xl">spa</span>
              </div>
            </div>
          </nav>
        </div>
      )}
    </header>
  );
};

export default Navbar;