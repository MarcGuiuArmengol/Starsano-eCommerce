import React from 'react';
import { Link } from 'react-router-dom';
import { CATEGORIES, PRODUCTS, BLOG_POSTS } from '../constants';
import ProductCard from '../components/ProductCard';

const Home: React.FC = () => {
  const [products, setProducts] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    console.log('Fetching products from /api/products');
    fetch('/api/products')
      .then(res => {
        if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
        return res.json();
      })
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

  const featuredProducts = products.slice(0, 4);

  return (
    <>
      {/* Editorial Hero */}
      <section className="relative w-full h-[90vh] flex items-center justify-center overflow-hidden bg-primary/95 text-white">
        <div className="absolute inset-0 z-0 opacity-40">
          <img
            src="https://images.unsplash.com/photo-1515023115689-589c33041697?q=80&w=2940&auto=format&fit=crop"
            className="w-full h-full object-cover"
            alt="Organic lifestyle"
          />
        </div>
        <div className="relative z-10 text-center px-4 max-w-4xl animate-slideUp">
          <p className="font-heading text-xs md:text-sm uppercase tracking-[0.3em] text-accent mb-6 font-semibold">
            Bienestar Natural
          </p>
          <h1 className="text-6xl md:text-8xl mb-8 leading-tight">
            Eleva tu <span className="italic font-light">cuerpo</span> <br />
            y tu mente.
          </h1>
          <p className="text-lg md:text-xl text-white/80 font-light mb-10 max-w-2xl mx-auto leading-relaxed">
            Una curaduría de productos orgánicos y suplementos naturales diseñados para tu mejor versión.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link to="/shop" className="w-full sm:w-auto px-10 py-4 bg-white text-primary font-bold uppercase tracking-widest text-sm hover:bg-accent hover:text-white transition-all duration-300">
              Comprar Ahora
            </Link>
            <Link to="/blog" className="w-full sm:w-auto px-10 py-4 border border-white text-white font-bold uppercase tracking-widest text-sm hover:bg-white hover:text-primary transition-all duration-300">
              Leer Journal
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

      {/* Featured Products - Clean & Spacious */}
      <section className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <span className="font-heading text-xs font-bold uppercase tracking-widest text-accent mb-3 block">Nuestros Favoritos</span>
            <h2 className="text-4xl md:text-5xl text-foreground">Lo más vendido</h2>
          </div>

          {loading ? (
            <div className="flex flex-col items-center justify-center py-20">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary mb-4"></div>
              <p className="text-secondary">Cargando productos...</p>
            </div>
          ) : error ? (
            <div className="text-center py-20 bg-red-50/50 rounded-sm">
              <p className="text-red-800 font-bold mb-2">Error al conectar con el servidor</p>
              <p className="text-red-600 text-sm mb-4">{error}</p>
              <button onClick={() => window.location.reload()} className="px-6 py-2 bg-red-600 text-white text-xs font-bold uppercase tracking-widest hover:bg-red-700 transition-colors">
                Reintentar
              </button>
            </div>
          ) : featuredProducts.length === 0 ? (
            <div className="text-center py-20 border border-dashed border-background-contrast/20 rounded-sm">
              <span className="material-symbols-outlined text-4xl text-secondary mb-2">inventory_2</span>
              <p className="text-foreground font-bold">Sin productos en venta</p>
              <p className="text-secondary text-sm">Asegúrate de que el archivo CSV tenga productos válidos.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 gap-y-12">
              {featuredProducts.map(product => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          )}

          <div className="text-center mt-16">
            <Link to="/shop" className="inline-block px-12 py-4 border border-foreground text-foreground font-bold uppercase tracking-widest text-xs hover:bg-foreground hover:text-white transition-all">
              Ver catálogo completo
            </Link>
          </div>
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

      {/* Newsletter */}
      <section className="py-24 bg-primary text-white text-center">
        <div className="max-w-xl mx-auto px-4">
          <span className="material-symbols-outlined text-4xl mb-6 text-accent">spa</span>
          <h2 className="text-3xl md:text-4xl mb-4">Únete a la comunidad Starsano</h2>
          <p className="text-white/70 mb-8 font-light">
            Recibe consejos de bienestar, recetas exclusivas y un 10% de descuento en tu primera compra.
          </p>
          <form className="flex flex-col sm:flex-row gap-2" onSubmit={(e) => e.preventDefault()}>
            <input
              type="email"
              placeholder="Tu correo electrónico"
              className="flex-1 bg-white/10 border border-white/20 text-white placeholder:text-white/40 px-4 py-3 focus:outline-none focus:border-accent"
            />
            <button type="submit" className="bg-white text-primary px-8 py-3 font-bold uppercase tracking-widest text-sm hover:bg-accent hover:text-white transition-colors">
              Suscribirse
            </button>
          </form>
        </div>
      </section>

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