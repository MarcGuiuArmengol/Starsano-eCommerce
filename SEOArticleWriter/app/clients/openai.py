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

try:
    from langchain.chat_models import ChatOpenAI
    from langchain import LLMChain
    from langchain.prompts import PromptTemplate
    LANGCHAIN_AVAILABLE = True
except Exception:
    LANGCHAIN_AVAILABLE = False


class OpenAIClient:
    def __init__(self, config: dict):
        self.config = config or {}
        self.api_key = self.config.get('OPENAI_API_KEY')
        self._llm = None
        if self.api_key and LANGCHAIN_AVAILABLE:
            os.environ.setdefault('OPENAI_API_KEY', self.api_key)
            # initialize a chat model (adjust model/temperature as desired)
            self._llm = ChatOpenAI(temperature=0.6)

    def _call_chain(self, template: str, inputs: dict) -> str:
        if self._llm is None:
            return ''
        prompt = PromptTemplate(template=template, input_variables=list(inputs.keys()))
        chain = LLMChain(llm=self._llm, prompt=prompt)
        return chain.run(inputs)

    def select_product(self, products_text: str, past_text: Optional[str] = '') -> str:
        """Return a single product line `Name -> URL`.

        If LangChain is available, use the LLM with the selection prompt.
        Otherwise pick randomly from products_text excluding any lines that appear in past_text.
        """
        selection_prompt = (
            "Eres un asistente técnico que trabaja dentro de un flujo de automatización.\n"
            "Tu tarea es recibir una lista de productos de una tienda Shopify y devolver 1 producto elegido aleatoriamente, en un formato de texto limpio.\n\n"
            "📦 Entrada:\n"
            "{products}\n\n"
            "🔍 Instrucciones:\n\n"
            "Elige aleatoriamente entre 1 producto que no sea ninguno de los siguientes (articulos de semanas pasadas): {past}\n\n"
            "Devuelve solo el producto seleccionado, siguiendo exactamente este formato:\n\n"
            "[Nombre del producto] -> [URL del producto]\n\n"
            "No añadas texto adicional, explicaciones ni comillas. Devuelve siempre 1 producto\n\n"
            "No inventes productos ni enlaces."
        )

        if self._llm is not None and LANGCHAIN_AVAILABLE:
            out = self._call_chain(selection_prompt, {'products': products_text, 'past': past_text})
            return out.strip()

        # Fallback mock selection
        lines = [l.strip() for l in products_text.splitlines() if '->' in l]
        past_lines = set([l.strip() for l in (past_text or '').splitlines() if l.strip()])
        candidates = [l for l in lines if l not in past_lines]
        if not candidates and lines:
            candidates = lines
        if not candidates:
            return ''
        return random.choice(candidates)

    def generate_article(self, selected_line: str, products_text: str, product_context: str) -> str:
        """Generate article HTML centered on selected_line.

        `product_context` is text to be used in the CONTEXTO section (the product description/content).
        """
        article_prompt = (
            "Eres un redactor SEO profesional especializado en alimentación ecológica, nutrición, sostenibilidad y marketing digital.\n\n"
            "Tu tarea es crear un artículo 100% optimizado para SEO de unas 600-750 palabras, escrito de forma natural y orientado a conversión, usando solo los productos y enlaces proporcionados.\n\n"
            "🔍 CONTEXTO (obligatorio)\n\n"
            "Centra el articulo en este producto (no inventes ninguno) (habla del producto en si, no el gramaje, paquete...):\n"
            "{product_context}\n\n"
            "Para el linkbuilding interno, usa solo estos enlaces y productos:\n"
            "{products}\n\n"
            "🎯 OBJETIVO SEO\n\n"
            "Elige una keyword principal (intención informacional o transaccional).\n"
            "Selecciona 3–5 secondary keywords long-tail relacionadas.\n"
            "Explica brevemente la intención de búsqueda del usuario.\n"
            "Redacta un artículo que responda exactamente a esa intención.\n\n"
            "🧱 ESTRUCTURA (obligatoria)\n\n"
            "Devuelve solo HTML con esta estructura:\n"
            "<article class=\"blog-post\">\n"
            "  <h1>[Keyword principal aquí en un titulo optimizado para SEO y llame al click de unas 5-8 palabras]</h1>\n"
            "  <p><em>[Meta descripción máx. 160 caracteres]</em></p>\n\n"
            "  <section>\n"
            "    <h2>[Secondary keyword 1]</h2>\n"
            "    <p>…</p>\n"
            "  </section>\n\n"
            "  <section>\n"
            "    <h2>[Secondary keyword 2]</h2>\n"
            "    <p>…</p>\n"
            "  </section>\n\n"
            "  <section>\n"
            "    <h2>[Secondary keyword 3]</h2>\n"
            "    <p>…</p>\n"
            "  </section>\n\n"
            "  <p><strong>[Añade un parrafo final como conclusion]</strong></p>\n"
            "</article>\n\n"
            "Reglas internas obligatorias:\n\n"
            "Añade 2–4 enlaces internos usando solo los links del contexto.\n"
            "Inserta 1 enlace externo de autoridad con rel=\"nofollow\".\n"
            "No inventes productos ni URLs.\n"
            "Integra los productos del contexto de forma natural (propiedades, usos, beneficios, recetas, historia…).\n"
            "Tono profesional, natural, educativo y fluido (sin parecer IA).\n"
            "Varía enfoque temático (receta, guía, comparativa, divulgación…).\n"
            "Añade un CTA al final\n\n"
            "🧠 VALIDACIONES FINALES\n\n"
            "Antes de devolver el HTML, confirma internamente que:\n"
            "La keyword principal aparece en el <h1> y en la meta description.\n"
            "Todas las secondary keywords aparecen en secciones <h2>.\n"
            "Los enlaces internos pertenecen al listado permitido.\n"
            "No hay productos inventados.\n"
            "El artículo responde a la intención de búsqueda detectada.\n\n"
            "Devuelve solo el HTML final.\n"
        )

        if self._llm is not None and LANGCHAIN_AVAILABLE:
            out = self._call_chain(article_prompt, {
                'product_context': product_context,
                'products': products_text
            })
            return out.strip()

        # Fallback mock article (simple HTML scaffold)
        name, url = (selected_line.split('->')[0].strip(), selected_line.split('->')[1].strip() if '->' in selected_line else ('', ''))
        title = f"Descubre {name}: Beneficios y uso"
        meta = f"Artículo sobre {name} centrado en beneficios y usos. Compra aquí: {url}"
        html = [
            '<article class="blog-post">',
            f'  <h1>{title.upper()}</h1>',
            f'  <p><em>{meta[:160]}</em></p>',
            '  <section>',
            '    <h2>Beneficios del producto</h2>',
            f'    <p>Este producto, {name}, destaca por sus propiedades saludables y sostenibles.</p>',
            '  </section>',
            '  <section>',
            '    <h2>Usos y recetas</h2>',
            f'    <p>Incorpora {name} en recetas sencillas para aprovechar sus beneficios.</p>',
            '  </section>',
            '  <section>',
            '    <h2>Por qué elegirlo</h2>',
            f'    <p>Calidad ecológica y compromiso con la sostenibilidad: <a href="{url}">{name}</a>.</p>',
            '  </section>',
            f'  <p><strong>En resumen, {name} es una excelente opción por su calidad y versatilidad. <a href="{url}" rel="nofollow">Comprar ahora</a></strong></p>',
            '</article>'
        ]
        return '\n'.join(html)

