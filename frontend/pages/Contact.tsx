import React from 'react';

const Contact: React.FC = () => {
  return (
    <div className="bg-background min-h-screen">
      {/* Header */}
      <div className="pt-20 pb-12 text-center px-4">
        <h1 className="text-5xl md:text-6xl text-foreground mb-4">Contacto</h1>
        <p className="text-secondary max-w-xl mx-auto font-light text-lg">
          ¿Tienes dudas sobre nuestros productos o envíos? Estamos aquí para ayudarte en tu camino al bienestar.
        </p>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-24">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-0 lg:gap-16 items-start">
          
          {/* Info Side */}
          <div className="bg-primary text-white p-10 md:p-16 rounded-t-lg lg:rounded-lg shadow-xl relative overflow-hidden">
            <div className="relative z-10">
                <h2 className="text-3xl text-white mb-8">Información</h2>
                
                <div className="space-y-8">
                    <div className="flex items-start gap-4">
                        <span className="material-symbols-outlined text-accent text-2xl mt-1">location_on</span>
                        <div>
                            <h3 className="font-heading font-bold text-sm uppercase tracking-widest mb-1 text-white/80">Ubicación</h3>
                            <p className="font-light text-white/90">Av. Reforma 123, Piso 4<br/>Ciudad de México, CDMX</p>
                        </div>
                    </div>

                    <div className="flex items-start gap-4">
                        <span className="material-symbols-outlined text-accent text-2xl mt-1">mail</span>
                        <div>
                            <h3 className="font-heading font-bold text-sm uppercase tracking-widest mb-1 text-white/80">Email</h3>
                            <p className="font-light text-white/90">hola@starsano.com.mx</p>
                            <p className="font-light text-white/90">soporte@starsano.com.mx</p>
                        </div>
                    </div>

                    <div className="flex items-start gap-4">
                        <span className="material-symbols-outlined text-accent text-2xl mt-1">schedule</span>
                        <div>
                            <h3 className="font-heading font-bold text-sm uppercase tracking-widest mb-1 text-white/80">Horario</h3>
                            <p className="font-light text-white/90">Lun - Vie: 9:00am - 6:00pm</p>
                            <p className="font-light text-white/90">Sáb: 10:00am - 2:00pm</p>
                        </div>
                    </div>
                </div>

                <div className="mt-16">
                    <h3 className="font-heading font-bold text-sm uppercase tracking-widest mb-4 text-white/80">Síguenos</h3>
                    <div className="flex gap-4">
                        <a href="#" className="w-10 h-10 border border-white/20 rounded-full flex items-center justify-center hover:bg-white hover:text-primary transition-all">
                             <span className="material-symbols-outlined text-sm">public</span>
                        </a>
                        <a href="#" className="w-10 h-10 border border-white/20 rounded-full flex items-center justify-center hover:bg-white hover:text-primary transition-all">
                             <span className="material-symbols-outlined text-sm">photo_camera</span>
                        </a>
                    </div>
                </div>
            </div>
            
            {/* Abstract Background Element */}
            <div className="absolute -bottom-20 -right-20 w-80 h-80 bg-white/5 rounded-full blur-3xl pointer-events-none"></div>
          </div>

          {/* Form Side */}
          <div className="bg-white p-10 md:p-16 rounded-b-lg lg:rounded-lg shadow-sm border border-background-contrast/20">
            <h2 className="text-3xl text-foreground mb-8">Envíanos un mensaje</h2>
            <form className="space-y-6" onSubmit={(e) => e.preventDefault()}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label className="block text-xs font-bold uppercase tracking-widest text-secondary mb-2">Nombre</label>
                        <input type="text" className="w-full bg-background border-0 border-b border-background-contrast focus:border-primary focus:ring-0 px-0 py-3 transition-colors" placeholder="Tu nombre" />
                    </div>
                    <div>
                        <label className="block text-xs font-bold uppercase tracking-widest text-secondary mb-2">Apellido</label>
                        <input type="text" className="w-full bg-background border-0 border-b border-background-contrast focus:border-primary focus:ring-0 px-0 py-3 transition-colors" placeholder="Tu apellido" />
                    </div>
                </div>
                
                <div>
                    <label className="block text-xs font-bold uppercase tracking-widest text-secondary mb-2">Email</label>
                    <input type="email" className="w-full bg-background border-0 border-b border-background-contrast focus:border-primary focus:ring-0 px-0 py-3 transition-colors" placeholder="tucorreo@ejemplo.com" />
                </div>

                <div>
                    <label className="block text-xs font-bold uppercase tracking-widest text-secondary mb-2">Asunto</label>
                    <select className="w-full bg-background border-0 border-b border-background-contrast focus:border-primary focus:ring-0 px-0 py-3 transition-colors text-foreground">
                        <option>Información general</option>
                        <option>Estado de mi pedido</option>
                        <option>Devoluciones</option>
                        <option>Colaboraciones</option>
                    </select>
                </div>

                <div>
                    <label className="block text-xs font-bold uppercase tracking-widest text-secondary mb-2">Mensaje</label>
                    <textarea rows={4} className="w-full bg-background border-0 border-b border-background-contrast focus:border-primary focus:ring-0 px-0 py-3 transition-colors resize-none" placeholder="¿Cómo podemos ayudarte?"></textarea>
                </div>

                <div className="pt-4">
                    <button type="submit" className="w-full md:w-auto bg-primary text-white px-10 py-4 font-bold uppercase tracking-widest text-sm hover:bg-opacity-90 transition-all shadow-lg hover:shadow-xl hover:-translate-y-1">
                        Enviar Mensaje
                    </button>
                </div>
            </form>
          </div>

        </div>
      </div>
    </div>
  );
};

export default Contact;