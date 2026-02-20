import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import logo from '../logo.png';

const Navbar: React.FC = () => {
  const { setIsCartOpen, cartCount } = useCart();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const location = useLocation();

  const isHome = location.pathname === '/';

  return (
    <header className="sticky top-0 z-50 w-full bg-white/90 backdrop-blur-md border-b border-primary/5 shadow-sm transition-all duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex h-20 items-center justify-between gap-4">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 shrink-0 group">
            <img src={logo} alt="Starsano Logo" className="h-12 w-auto object-contain transition-transform duration-300 group-hover:scale-105" />
          </Link>

          {/* Desktop Menu */}
          <nav className="hidden lg:flex items-center gap-8">
            <Link to="/" className={`text-xs font-bold uppercase tracking-widest hover:text-accent transition-colors ${location.pathname === '/' ? 'text-primary' : 'text-secondary'}`}>Inicio</Link>
            <Link to="/shop" className={`text-xs font-bold uppercase tracking-widest hover:text-accent transition-colors ${location.pathname === '/shop' ? 'text-primary' : 'text-secondary'}`}>Tienda</Link>
            <Link to="/blog" className={`text-xs font-bold uppercase tracking-widest hover:text-accent transition-colors ${location.pathname === '/blog' ? 'text-primary' : 'text-secondary'}`}>Journal</Link>
            <Link to="/contact" className={`text-xs font-bold uppercase tracking-widest hover:text-accent transition-colors ${location.pathname === '/contact' ? 'text-primary' : 'text-secondary'}`}>Contacto</Link>
          </nav>

          {/* Search & Icons */}
          <div className="flex items-center gap-4 flex-1 justify-end">
            <div className="hidden md:flex relative max-w-[200px] w-full group">
              <input
                className="w-full bg-transparent border-b border-secondary/20 py-1.5 pl-0 pr-6 text-xs focus:border-accent focus:ring-0 text-foreground placeholder:text-secondary/50 transition-all font-medium"
                type="text"
                placeholder="BUSCAR..."
              />
              <span className="material-symbols-outlined absolute right-0 top-1/2 -translate-y-1/2 text-secondary/50 text-lg group-focus-within:text-accent transition-colors">search</span>
            </div>

            <button className="p-2 text-foreground hover:text-accent transition-colors">
              <span className="material-symbols-outlined">person</span>
            </button>

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
              className="lg:hidden p-2 text-foreground"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            >
              <span className="material-symbols-outlined">menu</span>
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <div className="lg:hidden py-6 border-t border-primary/5 animate-fadeIn bg-white absolute left-0 right-0 shadow-xl px-4 flex flex-col gap-4">
            <nav className="flex flex-col gap-4">
              <Link to="/" onClick={() => setIsMobileMenuOpen(false)} className="text-sm font-bold text-foreground uppercase tracking-widest">Inicio</Link>
              <Link to="/shop" onClick={() => setIsMobileMenuOpen(false)} className="text-sm font-bold text-secondary uppercase tracking-widest">Tienda</Link>
              <Link to="/blog" onClick={() => setIsMobileMenuOpen(false)} className="text-sm font-bold text-secondary uppercase tracking-widest">Journal</Link>
              <Link to="/contact" onClick={() => setIsMobileMenuOpen(false)} className="text-sm font-bold text-secondary uppercase tracking-widest">Contacto</Link>
            </nav>
            <div className="pt-4 border-t border-primary/5">
              <input
                className="w-full bg-background/50 border border-secondary/20 py-3 px-4 text-sm rounded-none focus:border-accent focus:ring-0"
                type="text"
                placeholder="Buscar productos..."
              />
            </div>
          </div>
        )}
      </div>
    </header>
  );
};

export default Navbar;