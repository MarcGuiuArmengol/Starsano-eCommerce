import React from 'react';
import { api } from '../services/api';

const Contact: React.FC = () => {
    const [formData, setFormData] = React.useState({
        name: '',
        lastName: '',
        email: '',
        subject: 'Información general',
        message: '',
    });
    const [sending, setSending] = React.useState(false);
    const [statusMessage, setStatusMessage] = React.useState('');
    const [statusType, setStatusType] = React.useState<'success' | 'error' | ''>('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setStatusMessage('');
        setStatusType('');
        try {
            setSending(true);
            await api.sendContactMessage(formData);
            setStatusType('success');
            setStatusMessage('Tu mensaje se ha enviado correctamente. Te contactaremos pronto.');
            setFormData({
                name: '',
                lastName: '',
                email: '',
                subject: 'Información general',
                message: '',
            });
        } catch (err: any) {
            setStatusType('error');
            setStatusMessage(err?.message || 'No pudimos enviar tu mensaje. Inténtalo de nuevo.');
        } finally {
            setSending(false);
        }
    };

    return (
        <div className="bg-background min-h-screen">
            {/* Header */}
            <div className="pt-20 pb-12 text-center px-4">
                <h1 className="text-4xl sm:text-5xl md:text-6xl text-foreground mb-4">Contacto</h1>
                <p className="text-secondary max-w-xl mx-auto font-light text-lg">
                    ¿Tienes dudas sobre nuestros productos o envíos? Estamos aquí para ayudarte en tu camino al bienestar.
                </p>
            </div>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-24">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-0 lg:gap-16 items-start">

                    {/* Info Side */}
                    <div className="bg-primary text-white p-6 sm:p-10 md:p-16 rounded-t-lg lg:rounded-lg shadow-xl relative overflow-hidden">
                        <div className="relative z-10">
                            <h2 className="text-3xl text-white mb-8">Información</h2>

                            <div className="space-y-8">
                                <div className="flex items-start gap-4">
                                    <span className="material-symbols-outlined text-accent text-2xl mt-1">location_on</span>
                                    <div>
                                        <h3 className="font-heading font-bold text-sm uppercase tracking-widest mb-1 text-white/80">Ubicación</h3>
                                        <p className="font-light text-white/90">Boulevard Popocatépetl 97,<br />Hab los Pirules, 54040<br />Tlalnepantla, Méx. México</p>
                                    </div>
                                </div>

                                <div className="flex items-start gap-4">
                                    <span className="material-symbols-outlined text-accent text-2xl mt-1">call</span>
                                    <div>
                                        <h3 className="font-heading font-bold text-sm uppercase tracking-widest mb-1 text-white/80">Teléfono</h3>
                                        <p className="font-light text-white/90">+52 56 3082 0401</p>
                                    </div>
                                </div>
                            </div>

                            <div className="mt-16">
                                <h3 className="font-heading font-bold text-sm uppercase tracking-widest mb-4 text-white/80">Síguenos</h3>
                                <div className="flex gap-4">
                                    <a
                                        href="https://www.facebook.com/starsano.oficial"
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        aria-label="Facebook @starsano.oficial"
                                        title="Facebook @starsano.oficial"
                                        className="w-10 h-10 border border-white/20 rounded-full flex items-center justify-center hover:bg-white transition-all text-white hover:text-primary"
                                    >
                                        <svg viewBox="0 0 24 24" className="w-4 h-4 fill-current" aria-hidden="true">
                                            <path d="M22 12.07C22 6.5 17.52 2 12 2S2 6.5 2 12.07c0 5.02 3.66 9.19 8.44 9.93v-7.03H7.9V12.1h2.54V9.94c0-2.52 1.49-3.92 3.78-3.92 1.1 0 2.25.2 2.25.2v2.47h-1.27c-1.25 0-1.64.78-1.64 1.58v1.83h2.8l-.45 2.87h-2.35V22c4.78-.74 8.44-4.91 8.44-9.93z" />
                                        </svg>
                                    </a>
                                    <a
                                        href="https://www.instagram.com/starsano.oficial"
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        aria-label="Instagram @starsano.oficial"
                                        title="Instagram @starsano.oficial"
                                        className="w-10 h-10 border border-white/20 rounded-full flex items-center justify-center hover:bg-white transition-all text-white hover:text-primary"
                                    >
                                        <svg viewBox="0 0 24 24" className="w-4 h-4 fill-current" aria-hidden="true">
                                            <path d="M7.8 2h8.4A5.8 5.8 0 0 1 22 7.8v8.4A5.8 5.8 0 0 1 16.2 22H7.8A5.8 5.8 0 0 1 2 16.2V7.8A5.8 5.8 0 0 1 7.8 2zm0 1.9A3.9 3.9 0 0 0 3.9 7.8v8.4a3.9 3.9 0 0 0 3.9 3.9h8.4a3.9 3.9 0 0 0 3.9-3.9V7.8a3.9 3.9 0 0 0-3.9-3.9H7.8zm8.95 1.45a1.2 1.2 0 1 1 0 2.4 1.2 1.2 0 0 1 0-2.4zM12 7a5 5 0 1 1 0 10 5 5 0 0 1 0-10zm0 1.9a3.1 3.1 0 1 0 0 6.2 3.1 3.1 0 0 0 0-6.2z" />
                                        </svg>
                                    </a>
                                </div>
                            </div>
                        </div>

                        {/* Abstract Background Element */}
                        <div className="absolute -bottom-20 -right-20 w-80 h-80 bg-white/5 rounded-full blur-3xl pointer-events-none"></div>
                    </div>

                    {/* Form Side */}
                    <div className="bg-white p-6 sm:p-10 md:p-16 rounded-b-lg lg:rounded-lg shadow-sm border border-background-contrast/20">
                        <h2 className="text-3xl text-foreground mb-8">Envíanos un mensaje</h2>
                        <form className="space-y-6" onSubmit={handleSubmit}>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-xs font-bold uppercase tracking-widest text-secondary mb-2">Nombre</label>
                                    <input
                                        type="text"
                                        required
                                        value={formData.name}
                                        onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                                        className="w-full bg-background border-0 border-b border-background-contrast focus:border-primary focus:ring-0 px-0 py-3 transition-colors"
                                        placeholder="Tu nombre"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold uppercase tracking-widest text-secondary mb-2">Apellido</label>
                                    <input
                                        type="text"
                                        value={formData.lastName}
                                        onChange={(e) => setFormData(prev => ({ ...prev, lastName: e.target.value }))}
                                        className="w-full bg-background border-0 border-b border-background-contrast focus:border-primary focus:ring-0 px-0 py-3 transition-colors"
                                        placeholder="Tu apellido"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-bold uppercase tracking-widest text-secondary mb-2">Email</label>
                                <input
                                    type="email"
                                    required
                                    value={formData.email}
                                    onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                                    className="w-full bg-background border-0 border-b border-background-contrast focus:border-primary focus:ring-0 px-0 py-3 transition-colors"
                                    placeholder="tucorreo@ejemplo.com"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-bold uppercase tracking-widest text-secondary mb-2">Asunto</label>
                                <select
                                    value={formData.subject}
                                    onChange={(e) => setFormData(prev => ({ ...prev, subject: e.target.value }))}
                                    className="w-full bg-background border-0 border-b border-background-contrast focus:border-primary focus:ring-0 px-0 py-3 transition-colors text-foreground"
                                >
                                    <option>Información general</option>
                                    <option>Estado de mi pedido</option>
                                    <option>Devoluciones</option>
                                    <option>Colaboraciones</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-xs font-bold uppercase tracking-widest text-secondary mb-2">Mensaje</label>
                                <textarea
                                    rows={4}
                                    required
                                    value={formData.message}
                                    onChange={(e) => setFormData(prev => ({ ...prev, message: e.target.value }))}
                                    className="w-full bg-background border-0 border-b border-background-contrast focus:border-primary focus:ring-0 px-0 py-3 transition-colors resize-none"
                                    placeholder="¿Cómo podemos ayudarte?"
                                />
                            </div>

                            {statusMessage && (
                                <div className={`text-sm ${statusType === 'success' ? 'text-green-600' : 'text-red-600'}`}>
                                    {statusMessage}
                                </div>
                            )}

                            <div className="pt-4">
                                <button
                                    type="submit"
                                    disabled={sending}
                                    className="w-full md:w-auto bg-primary text-white px-10 py-4 font-bold uppercase tracking-widest text-sm hover:bg-opacity-90 transition-all shadow-lg hover:shadow-xl hover:-translate-y-1 disabled:opacity-60"
                                >
                                    {sending ? 'Enviando...' : 'Enviar Mensaje'}
                                </button>
                            </div>
                        </form>
                    </div>

                </div>

                {/* Map Section */}
                <div className="mt-16 rounded-2xl overflow-hidden shadow-2xl border border-background-contrast/10 h-[320px] sm:h-[400px] md:h-[450px] relative group">
                    <iframe
                        src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3761.3524671408017!2d-99.21950002388062!3d19.55325068175073!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x85d21cf15222688b%3A0x673c68383cf85f7a!2sBlv.%20Popocat%C3%A9petl%2097%2C%20Hab%20los%20Pirules%2C%2054040%20Tlalnepantla%20de%20Baz%2C%20M%C3%A9x.%2C%20Mexico!5e0!3m2!1sen!2smx!4v1709192400000!5m2!1sen!2smx"
                        width="100%"
                        height="100%"
                        style={{ border: 0 }}
                        allowFullScreen={true}
                        loading="lazy"
                        referrerPolicy="no-referrer-when-downgrade"
                        title="Ubicación Starsano Tlalnepantla"
                        className="grayscale hover:grayscale-0 transition-all duration-700 brightness-95 group-hover:brightness-100"
                    ></iframe>
                </div>
            </div>
        </div>
    );
};

export default Contact;