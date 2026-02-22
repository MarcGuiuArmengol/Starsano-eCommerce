"""OpenAI client using LangChain with a safe mock fallback.

Provides two high-level operations used by the runner:
- `select_product(products_text, past_text)` -> returns a single line: "Name -> URL"
- `generate_article(selected_line, products_text, product_context)` -> returns HTML string

If `OPENAI_API_KEY` is present and LangChain is available the calls use a Chat LLM;
otherwise the client falls back to deterministic local mocks for offline testing.
"""

import os
import random
from typing import Optional

import os
import random
from typing import Optional
from openai import OpenAI


class OpenAIClient:
    def __init__(self, config: dict):
        self.config = config or {}
        self.api_key = self.config.get('OPENAI_API_KEY')
        self.client = None
        
        if not self.api_key:
            print("CRITICAL: OPENAI_API_KEY not found in config.")
        else:
            try:
                self.client = OpenAI(api_key=self.api_key)
                print("OpenAI client initialized successfully.")
            except Exception as e:
                print(f"CRITICAL: Error initializing OpenAI client: {e}")

    def select_product(self, products_text: str, past_text: Optional[str] = '') -> str:
        """Return a single product line `Name -> URL`."""
        selection_prompt = (
            "Eres un asistente técnico que trabaja dentro de un flujo de automatización.\n"
            "Tu tarea es recibir una lista de productos de una tienda y devolver 1 producto elegido aleatoriamente.\n\n"
            "📦 Entrada:\n"
            f"{products_text}\n\n"
            "🔍 Instrucciones:\n\n"
            f"Elige aleatoriamente entre 1 producto que no sea ninguno de los siguientes (articulos de semanas pasadas): {past_text}\n\n"
            "Devuelve solo el producto seleccionado, siguiendo exactamente este formato:\n\n"
            "[Nombre del producto] -> [URL del producto]\n\n"
            "No añadas texto adicional ni comillas."
        )

        if self.client:
            try:
                response = self.client.chat.completions.create(
                    model=self.config.get('OPENAI_MODEL', 'gpt-4o-mini'),
                    messages=[{"role": "user", "content": selection_prompt}],
                    temperature=0.7
                )
                return response.choices[0].message.content.strip()
            except Exception as e:
                print(f"Error in select_product: {e}")

        # Fallback minimal selection
        lines = [l.strip() for l in products_text.splitlines() if '->' in l]
        if not lines: return ''
        return random.choice(lines)

    def generate_article(self, selected_line: str, products_text: str, product_context: str) -> str:
        """Generate article HTML using the user's high-quality SEO prompt."""
        
        # Extract name and URL for the focal product
        focal_name = selected_line.split('->')[0].strip()
        focal_url = selected_line.split('->')[1].strip() if '->' in selected_line else focal_url

        article_prompt = f"""
Eres un redactor SEO profesional especializado en alimentación ecológica, nutrición, sostenibilidad y marketing digital.

Tu tarea es crear un artículo 100% optimizado para SEO de unas 800-1000 palabras (MÍNIMO 800), escrito de forma natural y orientado a conversión, usando solo los productos y enlaces proporcionados.

🔍 CONTEXTO (obligatorio)

Centra el articulo en este producto (no inventes ninguno) (habla del producto en si, no el gramaje, paquete...):
Nombre: {focal_name}
Descripción/Contexto: {product_context}
URL de compra: {focal_url}

Para el linkbuilding interno, usa solo estos enlaces y productos:
{products_text}

🎯 OBJETIVO SEO

Elige una keyword principal (intención informacional o transaccional).
Selecciona 3–5 secondary keywords long-tail relacionadas.
Explica brevemente la intención de búsqueda del usuario.
Redacta un artículo que responda exactamente a esa intención.

🧱 ESTRUCTURA (obligatoria)

Devuelve solo HTML con esta estructura:

<article class="blog-post-content">
  <h1 class="text-4xl md:text-6xl font-heading font-bold text-foreground mb-6 uppercase">[Keyword principal aquí en un titulo optimizado para SEO y llame al click de unas 5-8 palabras]</h1>
  <p class="text-xl italic mb-10 text-secondary">[Meta descripción máx. 160 caracteres]</p>

  <div class="prose prose-lg max-w-none text-secondary">
    <section class="mb-12">
      <h2 class="text-3xl font-bold text-primary mb-6 uppercase">[Secondary keyword 1]</h2>
      <p>…</p>
    </section>

    <section class="mb-12">
      <h2 class="text-3xl font-bold text-primary mb-6 uppercase">[Secondary keyword 2]</h2>
      <p>…</p>
    </section>

    <section class="mb-12">
      <h2 class="text-3xl font-bold text-primary mb-6 uppercase">[Secondary keyword 3]</h2>
      <p>…</p>
    </section>

    <div class="my-12 p-8 bg-background-contrast rounded-2xl border-l-4 border-accent">
       <h3 class="text-2xl font-bold mb-4">Dato Nutricional Starsano: {focal_name}</h3>
       <p>...</p>
    </div>

    <p class="mt-12"><strong>[Añade un parrafo final potente como conclusion]</strong></p>
    
    <div class="mt-8 text-center">
       <a href="{focal_url}" class="bg-primary text-white px-10 py-4 rounded-full font-bold uppercase tracking-widest hover:bg-accent transition-all inline-block">Comprar {focal_name} en Starsano →</a>
    </div>
  </div>
</article>

Reglas internas obligatorias (MÁXIMA PRIORIDAD):

MÍNIMO 2-3 enlaces internos obligatorios usando solo los links del contexto. Es vital que el artículo no solo hable del producto principal, sino que lo relacione con otros productos del catálogo (ej. "combina perfecto con...", "puedes usarlo junto a...", "después de probar esto, te recomendamos...").
Inserta 1 enlace externo de autoridad con rel="nofollow".
No inventes productos ni URLs.
Integra los productos del contexto de forma natural (propiedades, usos, beneficios, recetas, historia…).
Tono profesional, natural, educativo y fluido (sin parecer IA).
Extiéndete en cada sección, sé MUY detallado, aporta valor real al lector.
Varía enfoque temático (receta, guía, comparativa, divulgación…).
Añade un CTA al final.
Usa MAYÚSCULAS en los títulos (H1 y H2).
Vigila con los punteados que puedan romper el html y cambiar el formato de la letra.

🧠 VALIDACIONES FINALES

Antes de devolver el HTML, confirma internamente que:
La keyword principal aparece en el <h1> y en la meta description.
Todas las secondary keywords aparecen en secciones <h2>.
Los enlaces internos pertenecen al listado permitido.
El artículo tiene al menos 800 palabras de contenido sustancial.
No hay productos inventados.
Devuelve solo el HTML final.
"""

        if self.client:
            try:
                response = self.client.chat.completions.create(
                    model=self.config.get('OPENAI_MODEL', 'gpt-4o-mini'),
                    messages=[
                        {"role": "system", "content": "Eres un experto redactor SEO de Starsano México. Escribes artículos largos, estructurados y optimizados."},
                        {"role": "user", "content": article_prompt}
                    ],
                    temperature=0.7
                )
                content = response.choices[0].message.content.strip()
                # Clean markdown backticks if present (e.g. ```html ... ```)
                if content.startswith("```"):
                    import re
                    content = re.sub(r'^```[a-zA-Z]*\n', '', content)
                    content = re.sub(r'\n```$', '', content)
                return content.strip()
            except Exception as e:
                print(f"Error in generate_article: {e}")

        return "Error: No se pudo conectar con OpenAI. Revisa la configuración del contenedor."

