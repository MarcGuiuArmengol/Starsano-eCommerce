import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import DOMPurify from 'dompurify';
import { api } from '../services/api';

const Blog: React.FC = () => {
    const [articles, setArticles] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchArticles = async () => {
            try {
                const data = await api.getArticles();
                setArticles(Array.isArray(data) ? data : []);
            } catch (error) {
                console.error('Error fetching articles:', error);
            } finally {
                setLoading(false);
            }
        };
        fetchArticles();
    }, []);

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-primary"></div>
            </div>
        );
    }

    // Fallback to empty state if no articles found
    if (articles.length === 0) {
        return (
            <div className="bg-white min-h-screen pt-40 text-center px-4">
                <h1 className="text-4xl text-foreground font-heading mb-4">El Journal</h1>
                <p className="text-secondary max-w-md mx-auto">Aún no hay artículos publicados. ¡Vuelve muy pronto!</p>
                <Link to="/shop" className="inline-block mt-8 text-primary font-bold border-b-2 border-primary">Explorar la tienda</Link>
            </div>
        );
    }

    const featuredPost = articles[0];
    const recentPosts = articles.slice(1);

    return (
        <div className="bg-white min-h-screen pb-24">
            {/* Header */}
            <div className="pt-20 pb-16 text-center px-4 border-b border-background-contrast/20 mb-12">
                <h1 className="text-5xl md:text-7xl text-foreground mb-6">El Journal</h1>
                <p className="text-secondary max-w-2xl mx-auto text-lg font-light leading-relaxed">
                    Un espacio dedicado a explorar la nutrición, el bienestar consciente y las historias detrás de nuestros ingredientes.
                </p>
            </div>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

                {/* Featured Post */}
                <div className="mb-20">
                    <Link to={`/blog/${featuredPost.id}`} className="group block border-b pb-12">
                        <div className="max-w-3xl">
                            <div className="flex items-center gap-4 mb-4 text-xs font-bold uppercase tracking-widest text-secondary">
                                <span className="text-accent">{featuredPost.author || 'Starsano'}</span>
                                <span>•</span>
                                <span>{new Date(featuredPost.created_at).toLocaleDateString()}</span>
                            </div>
                            <h2 className="text-4xl md:text-5xl text-foreground mb-6 leading-tight group-hover:underline decoration-1 underline-offset-8">
                                {featuredPost.title}
                            </h2>
                            <div className="text-secondary text-lg font-light mb-8 leading-relaxed line-clamp-3"
                                dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(featuredPost.content.substring(0, 300) + '...') }} />
                            <span className="inline-flex items-center gap-2 text-primary font-bold border-b border-primary pb-1 group-hover:text-accent group-hover:border-accent transition-colors">
                                Leer historia completa <span className="material-symbols-outlined text-lg">arrow_forward</span>
                            </span>
                        </div>
                    </Link>
                </div>

                {/* Recent Posts Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-16">
                    {recentPosts.map((post) => (
                        <Link to={`/blog/${post.id}`} key={post.id} className="flex flex-col group cursor-pointer border-t pt-8">
                            <div>
                                <div className="text-xs font-bold text-accent uppercase tracking-widest mb-3">{post.author || 'Starsano'}</div>
                                <h2 className="text-2xl text-foreground mb-3 leading-snug group-hover:text-primary transition-colors">
                                    {post.title}
                                </h2>
                                <div className="text-secondary font-light mb-4 line-clamp-3 text-sm"
                                    dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(post.content.substring(0, 150) + '...') }} />
                            </div>
                        </Link>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default Blog;