import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import DOMPurify from 'dompurify';
import { api } from '../services/api';

const BlogPost: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const [article, setArticle] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchArticle = async () => {
            try {
                if (!id) return;
                const data = await api.getArticleById(id);
                setArticle(data);
            } catch (error) {
                console.error('Error fetching article:', error);
            } finally {
                setLoading(false);
            }
        };
        fetchArticle();
    }, [id]);

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-primary"></div>
            </div>
        );
    }

    if (!article) {
        return (
            <div className="min-h-screen pt-40 text-center px-4">
                <h2 className="text-3xl mb-4">Artículo no encontrado</h2>
                <Link to="/blog" className="text-primary font-bold underline">Volver al Journal</Link>
            </div>
        );
    }

    return (
        <div className="bg-white min-h-screen pb-24">
            <div className="max-w-4xl mx-auto px-4 pt-20">
                <Link to="/blog" className="inline-flex items-center gap-2 text-secondary hover:text-primary mb-12 transition-colors uppercase tracking-widest text-xs font-bold">
                    <span className="material-symbols-outlined text-lg">arrow_back</span>
                    Volver al Journal
                </Link>

                <div className="mb-12">
                    <div className="flex items-center gap-4 mb-6 text-xs font-bold uppercase tracking-widest text-secondary">
                        <span className="text-accent">{article.author || 'Starsano'}</span>
                        <span>•</span>
                        <span>{new Date(article.created_at).toLocaleDateString()}</span>
                    </div>
                </div>

                <div
                    className="blog-post-content prose prose-lg max-w-none prose-headings:font-heading prose-headings:font-bold prose-p:text-secondary prose-p:font-light prose-a:text-primary prose-a:font-bold prose-a:underline prose-a:underline-offset-4 prose-a:decoration-primary/30 hover:prose-a:text-accent hover:prose-a:decoration-accent transition-all"
                    dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(article.content) }}
                />

                <div className="mt-20 pt-12 border-t border-background-contrast/20">
                    <div className="bg-background-contrast/5 p-8 rounded-2xl text-center">
                        <h3 className="text-2xl font-heading mb-4">¿Te ha gustado este artículo?</h3>
                        <p className="text-secondary mb-8">Suscríbete a nuestro Journal para recibir más consejos sobre nutrición y bienestar consciente.</p>
                        <div className="flex flex-col sm:flex-row gap-4 max-w-md mx-auto">
                            <input
                                type="email"
                                placeholder="Tu email"
                                className="flex-1 px-6 py-3 border border-background-contrast/20 focus:outline-none focus:border-primary"
                            />
                            <button className="bg-foreground text-white px-8 py-3 font-bold uppercase tracking-widest text-xs hover:bg-primary transition-all">
                                Suscribirme
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default BlogPost;
