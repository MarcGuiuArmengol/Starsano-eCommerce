import React from 'react';
import { Link } from 'react-router-dom';
import { CATEGORIES, PRODUCTS, BLOG_POSTS } from '../constants';
import ProductCard from '../components/ProductCard';
import { api } from '../services/api';

const Home: React.FC = () => {
  const [products, setProducts] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [newsletterEmail, setNewsletterEmail] = React.useState('');
  const [newsletterStatus, setNewsletterStatus] = React.useState<'idle' | 'loading' | 'success' | 'error'>('idle');

  const handleNewsletterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newsletterEmail) return;
    setNewsletterStatus('loading');
    try {
      await api.subscribeNewsletter(newsletterEmail);
      setNewsletterStatus('success');
      setNewsletterEmail('');
    } catch (err) {
      setNewsletterStatus('error');
    }
  };

  React.useEffect(() => {
    console.log('Fetching products from api');
    api.getProducts()
      .then(data => {
        console.log(`Fetched ${data.length} products`);
        setProducts(data);
        setLoading(false);
      })
      .catch(err => {
        console.error("Failed to fetch featured products:", err.message);
        setError(err.message);
        setLoading(false);
      });
  }, []);

  const [currentSlide, setCurrentSlide] = React.useState(0);
  const slides = [
    {
      image: "/images/1.png",
      title: "Tienda de alimentos orgánicos, sin gluten y sin azúcar",
      subtitle: "CALIDAD PREMIUM",
      description: "Descubre nuestra selección de productos naturales para una vida más saludable."
    },
    {
      image: "/images/2.png",
      title: "Tu bienestar, nuestra prioridad",
      subtitle: "100% NATURAL",
      description: "Ingredientes puros y procesos sostenibles desde el origen hasta tu mesa."
    },
    {
      image: "/images/3.png",
      title: "Sabor que nutre tu cuerpo",
      subtitle: "CONSCIENCIA",
      description: "Suplementos y superalimentos diseñados para potenciar tu energía vital."
    }
  ];

  React.useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [slides.length]);

  const featuredProducts = products.slice(0, 4);

  return (
    <>
      {/* Pure Visual Hero Carousel */}
      <section className="relative w-full h-[70vh] md:h-[85vh] overflow-hidden bg-background">
        {slides.map((slide, index) => (
          <div
            key={index}
            className={`absolute inset-0 z-0 transition-opacity duration-1000 ease-in-out ${index === currentSlide ? 'opacity-100' : 'opacity-0'
              }`}
          >
            <img
              src={slide.image}
              className={`w-full h-full object-cover transition-transform duration-[8000ms] ${index === currentSlide ? 'scale-105' : 'scale-100'
                }`}
              alt={`Starsano Slide ${index + 1}`}
            />
          </div>
        ))}

        {/* Carousel Indicators (Minimalist) */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-20 flex gap-2">
          {slides.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentSlide(index)}
              className={`h-1.5 transition-all duration-300 rounded-full ${index === currentSlide ? 'bg-primary w-8' : 'bg-white/50 w-4 hover:bg-white'
                }`}
              aria-label={`Go to slide ${index + 1}`}
            />
          ))}
        </div>
      </section>

      {/* SEO Headline & Mission Section */}
      <section className="py-20 md:py-32 bg-white text-center px-4 border-b border-background-contrast/10">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-4xl md:text-6xl lg:text-7xl text-foreground mb-10 leading-tight font-heading">
            Tienda de alimentos orgánicos, <br className="hidden md:block" />
            <span className="text-primary italic">sin gluten y sin azúcar.</span>
          </h1>
          <p className="text-lg md:text-xl text-secondary font-light mb-12 max-w-2xl mx-auto leading-relaxed">
            En Starsano, seleccionamos cada producto pensando en tu bienestar. Calidad premium, 100% natural y con consciencia en cada ingrediente.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
            <Link to="/shop" className="w-full sm:w-auto px-12 py-5 bg-primary text-white font-bold uppercase tracking-widest text-sm hover:bg-accent transition-all duration-300 shadow-lg shadow-primary/20">
              Explorar Catálogo
            </Link>
            <Link to="/blog" className="w-full sm:w-auto px-12 py-5 border border-primary text-primary font-bold uppercase tracking-widest text-sm hover:bg-primary hover:text-white transition-all duration-300">
              Leer El Journal
            </Link>
          </div>
        </div>
      </section>

      {/* Marquee / Benefits - Modernized */}
      <section className="py-6 bg-accent text-white overflow-hidden border-b border-primary/10">
        <div className="flex justify-around items-center max-w-7xl mx-auto text-xs font-bold uppercase tracking-widest px-4">
          <span className="hidden md:inline">Envío Gratis +$999</span>
          <span className="flex items-center gap-2"><span className="material-symbols-outlined text-sm">eco</span> 100% Orgánico</span>
          <span className="flex items-center gap-2"><span className="material-symbols-outlined text-sm">verified</span> Calidad Certificada</span>
          <span className="hidden md:inline">Pagos Seguros</span>
        </div>
      </section>

      {/* Collections Grid */}
      <section className="py-24 px-4 bg-background">
        <div className="max-w-7xl mx-auto">
          <div className="flex justify-between items-end mb-12">
            <h2 className="text-4xl text-foreground">Colecciones</h2>
            <Link to="/shop" className="hidden md:block font-heading text-xs font-bold uppercase tracking-widest border-b border-foreground pb-1 hover:text-accent hover:border-accent transition-colors">
              Ver todo
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {CATEGORIES.slice(0, 2).map((cat) => (
              <Link to="/shop" key={cat.id} className="group relative h-[500px] overflow-hidden">
                <img
                  src={cat.image}
                  alt={cat.name}
                  className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-black/10 group-hover:bg-black/20 transition-colors"></div>
                <div className="absolute bottom-8 left-8 bg-white/90 backdrop-blur px-6 py-4">
                  <h3 className="text-2xl text-foreground m-0">{cat.name}</h3>
                  <span className="text-xs font-bold uppercase tracking-widest text-secondary mt-1 block group-hover:text-accent transition-colors">Explorar</span>
                </div>
              </Link>
            ))}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
            {CATEGORIES.slice(2).map((cat) => (
              <Link to="/shop" key={cat.id} className="group relative h-[350px] overflow-hidden">
                <img
                  src={cat.image}
                  alt={cat.name}
                  className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-black/10 group-hover:bg-black/20 transition-colors"></div>
                <div className="absolute bottom-6 left-6 text-white">
                  <h3 className="text-2xl m-0">{cat.name}</h3>
                  <span className="text-xs font-bold uppercase tracking-widest mt-1 block opacity-0 group-hover:opacity-100 transition-opacity transform translate-y-2 group-hover:translate-y-0">Explorar</span>
                </div>
              </Link>
            ))}
            <Link to="/shop" className="relative h-[350px] bg-primary flex flex-col items-center justify-center text-center p-8 group">
              <span className="material-symbols-outlined text-6xl text-accent mb-4 group-hover:scale-110 transition-transform">arrow_forward</span>
              <h3 className="text-2xl text-white mb-2">Ver todo el catálogo</h3>
              <p className="text-white/60 text-sm">Descubre más de 100 productos naturales.</p>
            </Link>
          </div>
        </div>
      </section>

      {/* Featured Sections */}
      <section className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

          {/* Section 1: Novedades */}
          <div className="mb-24">
            <div className="flex justify-between items-end mb-12">
              <div>
                <span className="font-heading text-xs font-bold uppercase tracking-widest text-accent mb-3 block">Recién Llegados</span>
                <h2 className="text-4xl md:text-5xl text-foreground">Novedades</h2>
              </div>
              <Link to="/shop" className="hidden md:block font-heading text-xs font-bold uppercase tracking-widest border-b border-foreground pb-1 hover:text-accent hover:border-accent transition-colors">
                Ver todas las novedades
              </Link>
            </div>

            {loading ? (
              <div className="flex justify-center py-20"><div className="animate-spin rounded-full h-12 w-12 border-t-2 border-primary"></div></div>
            ) : products.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
                {products.slice(0, 4).map(product => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
            ) : (
              <p className="text-center text-secondary py-10">Cargando productos...</p>
            )}
          </div>

          {/* Section 2: Populares */}
          <div className="mb-24">
            <div className="flex justify-between items-end mb-12">
              <div>
                <span className="font-heading text-xs font-bold uppercase tracking-widest text-accent mb-3 block">Los Favoritos</span>
                <h2 className="text-4xl md:text-5xl text-foreground">Más Populares</h2>
              </div>
              <Link to="/shop" className="hidden md:block font-heading text-xs font-bold uppercase tracking-widest border-b border-foreground pb-1 hover:text-accent hover:border-accent transition-colors">
                Ver todos los favoritos
              </Link>
            </div>

            {loading ? (
              <div className="flex justify-center py-20"><div className="animate-spin rounded-full h-12 w-12 border-t-2 border-primary"></div></div>
            ) : products.length > 4 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
                {products.slice(4, 8).map(product => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
            ) : products.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
                {products.slice(0, 4).map(product => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
            ) : (
              <p className="text-center text-secondary py-10">Cargando productos...</p>
            )}
          </div>

          <div className="text-center mt-8">
            <Link to="/shop" className="inline-block px-12 py-5 bg-foreground text-white font-bold uppercase tracking-widest text-xs hover:bg-primary transition-all shadow-xl">
              Explorar todo el catálogo
            </Link>
          </div>
        </div>
      </section>

      {/* Newsletter - Moved Up */}
      <section className="py-24 bg-primary text-white text-center">
        <div className="max-w-xl mx-auto px-4">
          <span className="material-symbols-outlined text-4xl mb-6 text-accent">spa</span>
          <h2 className="text-3xl md:text-4xl mb-4 text-white">Únete a la comunidad Starsano</h2>
          <p className="text-white/70 mb-8 font-light">
            Recibe consejos de bienestar, recetas exclusivas y un 10% de descuento en tu primera compra.
          </p>
          <form className="flex flex-col sm:flex-row gap-2" onSubmit={handleNewsletterSubmit}>
            <input
              type="email"
              value={newsletterEmail}
              onChange={(e) => setNewsletterEmail(e.target.value)}
              placeholder="Tu correo electrónico"
              className="flex-1 bg-white/10 border border-white/20 text-white placeholder:text-white/40 px-4 py-3 focus:outline-none focus:border-accent"
              required
              disabled={newsletterStatus === 'loading'}
            />
            <button
              type="submit"
              disabled={newsletterStatus === 'loading'}
              className="bg-white text-primary px-8 py-3 font-bold uppercase tracking-widest text-sm hover:bg-accent hover:text-white transition-colors disabled:opacity-50"
            >
              {newsletterStatus === 'loading' ? 'Enviando...' : 'Suscribirse'}
            </button>
          </form>
          {newsletterStatus === 'success' && <p className="mt-4 text-accent font-bold">¡Gracias por suscribirte!</p>}
          {newsletterStatus === 'error' && <p className="mt-4 text-red-300">Hubo un error. Intenta de nuevo.</p>}
        </div>
      </section>

      {/* Story / About Teaser */}
      <section className="py-24 bg-background-contrast/5">
        <div className="max-w-7xl mx-auto px-4 grid grid-cols-1 md:grid-cols-2 gap-16 items-center">
          <div className="order-2 md:order-1">
            <img
              src="https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?q=80&w=2813&auto=format&fit=crop"
              alt="Our philosophy"
              className="w-full h-[500px] object-cover grayscale hover:grayscale-0 transition-all duration-700 rounded-sm"
            />
          </div>
          <div className="order-1 md:order-2">
            <span className="text-6xl text-accent/20 font-serif block -mb-8 relative z-0">Filosofía</span>
            <h2 className="text-4xl md:text-5xl text-foreground mb-6 relative z-10">Consciencia en cada ingrediente.</h2>
            <p className="text-secondary text-lg leading-relaxed mb-8 font-light">
              En Starsano, creemos que la salud no debe ser complicada. Seleccionamos rigurosamente cada producto para asegurar que cumpla con los más altos estándares de pureza y sostenibilidad.
            </p>
            <div className="grid grid-cols-2 gap-8 mb-8">
              <div>
                <h4 className="text-2xl text-foreground mb-2">10k+</h4>
                <p className="text-xs font-bold uppercase tracking-widest text-secondary">Clientes Felices</p>
              </div>
              <div>
                <h4 className="text-2xl text-foreground mb-2">100%</h4>
                <p className="text-xs font-bold uppercase tracking-widest text-secondary">Natural</p>
              </div>
            </div>
            <Link to="/contact" className="text-primary font-bold border-b border-primary pb-1 hover:text-accent hover:border-accent transition-colors">
              Nuestra Historia &rarr;
            </Link>
          </div>
        </div>
      </section>

      {/* Newsletter section was here, now moved up */}

      {/* Blog Journal */}
      <section className="py-24 bg-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-end mb-12">
            <h2 className="text-4xl text-foreground">El Journal</h2>
            <Link to="/blog" className="hidden md:block font-heading text-xs font-bold uppercase tracking-widest border-b border-foreground pb-1 hover:text-accent hover:border-accent transition-colors">
              Leer todo
            </Link>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {BLOG_POSTS.map(post => (
              <article key={post.id} className="group cursor-pointer">
                <div className="aspect-[4/3] overflow-hidden mb-6">
                  <img
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105 grayscale-[20%] group-hover:grayscale-0"
                    src={post.image}
                    alt={post.title}
                    loading="lazy"
                  />
                </div>
                <div>
                  <div className="text-xs font-bold text-accent uppercase tracking-widest mb-3">{post.category}</div>
                  <h3 className="text-2xl text-foreground mb-3 leading-tight group-hover:underline decoration-1 underline-offset-4">{post.title}</h3>
                  <p className="text-secondary text-sm line-clamp-2 font-light">{post.excerpt}</p>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>
    </>
  );
};

export default Home;