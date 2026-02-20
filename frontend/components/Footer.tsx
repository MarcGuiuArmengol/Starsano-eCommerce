import React from 'react';
import { Link } from 'react-router-dom';
import logo from '../logo.png';

const Footer: React.FC = () => {
  return (
    <footer className="bg-primary text-white pt-20 pb-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-16">
          {/* Brand Info */}
          <div>
            <Link to="/" className="flex items-center gap-2 mb-6">
              <img src={logo} alt="Starsano Logo" className="h-10 w-auto object-contain" />
            </Link>
            <p className="text-sm leading-relaxed mb-6 text-white/70">
              Selección consciente para una vida plena. Productos naturales y orgánicos que respetan tu cuerpo y el planeta.
            </p>
            <div className="flex gap-4">
              <a href="#" className="hover:text-accent transition-colors"><span className="material-symbols-outlined text-xl">social_leaderboard</span></a>
              <a href="#" className="hover:text-accent transition-colors"><span className="material-symbols-outlined text-xl">camera</span></a>
              <a href="#" className="hover:text-accent transition-colors"><span className="material-symbols-outlined text-xl">alternate_email</span></a>
            </div>
          </div>
          {/* Navigation */}
          <div>
            <h4 className="text-white font-bold mb-6 text-sm uppercase tracking-widest">Explorar</h4>
            <ul className="space-y-3 text-sm text-white/80">
              <li><Link to="/shop" className="hover:text-accent transition-colors">Todos los productos</Link></li>
              <li><Link to="/shop" className="hover:text-accent transition-colors">Nuevos lanzamientos</Link></li>
              <li><Link to="/blog" className="hover:text-accent transition-colors">Blog</Link></li>
              <li><Link to="/about" className="hover:text-accent transition-colors">Nuestra historia</Link></li>
            </ul>
          </div>
          {/* Legal */}
          <div>
            <h4 className="text-white font-bold mb-6 text-sm uppercase tracking-widest">Ayuda</h4>
            <ul className="space-y-3 text-sm text-white/80">
              <li><a href="#" className="hover:text-accent transition-colors">Envíos y Devoluciones</a></li>
              <li><a href="#" className="hover:text-accent transition-colors">Preguntas Frecuentes</a></li>
              <li><a href="#" className="hover:text-accent transition-colors">Términos del Servicio</a></li>
              <li><a href="#" className="hover:text-accent transition-colors">Política de Privacidad</a></li>
            </ul>
          </div>
          {/* Newsletter */}
          <div>
            <h4 className="text-white font-bold mb-6 text-sm uppercase tracking-widest">Newsletter</h4>
            <p className="text-xs text-white/60 mb-4">Suscríbete para recibir novedades y ofertas exclusivas.</p>
            <form onSubmit={(e) => e.preventDefault()} className="flex flex-col gap-2">
              <input
                type="email"
                placeholder="Tu email"
                className="bg-white/10 border border-white/20 text-white placeholder:text-white/40 px-4 py-2 rounded focus:ring-1 focus:ring-accent focus:border-accent text-sm"
              />
              <button type="submit" className="bg-white text-primary font-bold py-2 px-4 rounded hover:bg-accent hover:text-white transition-colors text-sm uppercase">
                Suscribirse
              </button>
            </form>
          </div>
        </div>
        {/* Bottom Footer */}
        <div className="pt-8 border-t border-white/10 flex flex-col md:flex-row justify-between items-center gap-4 text-xs text-white/50">
          <p>© {new Date().getFullYear()} Starsano. Todos los derechos reservados.</p>
          <div className="flex gap-4">
            <span className="material-symbols-outlined text-xl">credit_card</span>
            <span className="material-symbols-outlined text-xl">account_balance_wallet</span>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;