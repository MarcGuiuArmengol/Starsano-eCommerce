import React from 'react';
import { BLOG_POSTS } from '../constants';
import { Link } from 'react-router-dom';

const Blog: React.FC = () => {
  const featuredPost = BLOG_POSTS[0];
  const recentPosts = BLOG_POSTS.slice(1);

  return (
    <div className="bg-white min-h-screen pb-24">
        {/* Header */}
        <div className="pt-20 pb-16 text-center px-4 border-b border-background-contrast/20 mb-12">
            <h1 className="text-5xl md:text-7xl text-foreground mb-6">El Journal</h1>
            <p className="text-secondary max-w-2xl mx-auto text-lg font-light leading-relaxed">
                Un espacio dedicado a explorar la nutrición, el bienestar consciente y las historias detrás de nuestros ingredientes.
            </p>
            <div className="flex justify-center gap-4 mt-8">
                {['Nutrición', 'Recetas', 'Estilo de Vida', 'Entrevistas'].map(tag => (
                    <button key={tag} className="px-4 py-2 border border-background-contrast/50 text-xs font-bold uppercase tracking-widest hover:bg-foreground hover:text-white transition-all rounded-full">
                        {tag}
                    </button>
                ))}
            </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            
            {/* Featured Post */}
            <div className="mb-20">
                 <Link to="#" className="group grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
                    <div className="aspect-[16/10] overflow-hidden">
                        <img 
                            src={featuredPost.image} 
                            alt={featuredPost.title} 
                            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                        />
                    </div>
                    <div className="lg:pl-8">
                        <div className="flex items-center gap-4 mb-4 text-xs font-bold uppercase tracking-widest text-secondary">
                            <span className="text-accent">{featuredPost.category}</span>
                            <span>•</span>
                            <span>5 min lectura</span>
                        </div>
                        <h2 className="text-4xl md:text-5xl text-foreground mb-6 leading-tight group-hover:underline decoration-1 underline-offset-8">
                            {featuredPost.title}
                        </h2>
                        <p className="text-secondary text-lg font-light mb-8 leading-relaxed">
                            {featuredPost.excerpt}
                        </p>
                        <span className="inline-flex items-center gap-2 text-primary font-bold border-b border-primary pb-1 group-hover:text-accent group-hover:border-accent transition-colors">
                            Leer historia completa <span className="material-symbols-outlined text-lg">arrow_forward</span>
                        </span>
                    </div>
                 </Link>
            </div>

            {/* Recent Posts Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-16">
                {recentPosts.concat(recentPosts).map((post, idx) => ( // Duplicating for demo purposes
                    <article key={`${post.id}-${idx}`} className="flex flex-col group cursor-pointer">
                        <div className="overflow-hidden aspect-[4/3] mb-6 relative">
                            <img 
                                src={post.image} 
                                alt={post.title} 
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                            />
                        </div>
                        <div>
                            <div className="text-xs font-bold text-accent uppercase tracking-widest mb-3">{post.category}</div>
                            <h2 className="text-2xl text-foreground mb-3 leading-snug group-hover:text-primary transition-colors">
                                {post.title}
                            </h2>
                            <p className="text-secondary font-light mb-4 line-clamp-3 text-sm">
                                {post.excerpt}
                            </p>
                        </div>
                    </article>
                ))}
            </div>
            
            <div className="mt-20 text-center">
                <button className="px-8 py-3 border border-background-contrast text-foreground font-bold uppercase tracking-widest text-xs hover:bg-foreground hover:text-white transition-all">
                    Ver artículos anteriores
                </button>
            </div>
        </div>
    </div>
  );
};

export default Blog;