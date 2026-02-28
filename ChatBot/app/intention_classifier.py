import os
import json
from typing import Literal, Dict, Any, List
from langchain_openai import ChatOpenAI
from langchain.prompts import PromptTemplate
from dotenv import load_dotenv

from .db import db_client

load_dotenv()

# Inicializar el modelo OpenAI
llm = ChatOpenAI(
    model="gpt-3.5-turbo",
    api_key=os.environ.get("OPENAI_API_KEY"),
    temperature=0
)

assistant_llm = ChatOpenAI(
    model=os.environ.get("GENERAL_QUESTION_MODEL", "gpt-4o-mini"),
    api_key=os.environ.get("OPENAI_API_KEY"),
    temperature=0.4
)

angry_llm = ChatOpenAI(
    model=os.environ.get("ANGRY_USER_MODEL", "gpt-4o-mini"),
    api_key=os.environ.get("OPENAI_API_KEY"),
    temperature=0.3
)

INTENTION_PROMPT = """Eres un clasificador de intención para mensajes de clientes de la tienda starsano.com.mx.

Analiza SOLO el ÚLTIMO mensaje del usuario.
El contexto previo es solo apoyo, pero la decisión se basa principalmente en el último mensaje.

Debes devolver **EXACTAMENTE UNA** de estas tres palabras (sin frases, sin JSON, sin puntuación):

product_search
general_question
need_human

Definiciones estrictas:

product_search →
- Preguntas sobre productos, suplementos, vitaminas, ingredientes, beneficios
- Comparaciones o recomendaciones
- Precio, promociones, formatos, dosis, para qué sirve algo

general_question →
- Preguntas informativas generales
- Cómo comprar, envíos, tiempos de entrega generales, formas de pago
- Saludos o conversación inicial sin pedir un producto concreto
- Ubicación de la tienda, horario o contacto

need_human →
- Enfado, quejas, insultos o frustración explícita
- Seguimiento de pedidos específicos, reembolsos, cambios, cancelaciones
- Problemas con pagos, cargos, pedidos no recibidos
- Peticiones que implican acciones que el bot no puede realizar

Reglas IMPORTANTES:
- No inventes intención.
- Si hay duda entre general_question y product_search, elige product_search.
- Si el usuario pide una acción operativa, SIEMPRE usa need_human.

Mensaje del usuario:
{message}

Contexto previo (solo referencia):
{context}

Responde SOLO con una palabra exacta."""

prompt_template = PromptTemplate(
    input_variables=["message", "context"],
    template=INTENTION_PROMPT
)

GENERAL_QUESTION_PROMPT = """You are the Starsano AI assistant, a friendly and knowledgeable support agent for the online health store starsano.com.mx.

Your goal is to assist customers in Spanish, using a natural, human-like, and concise tone.

### Context about Starsano:
Starsano is a Mexican eCommerce focused on wellness and health products.

### Información fija de la tienda Starsano (fuente de verdad):
📍 Ubicación: Bulevard Popocatépetl 97, Hab los Pirules, 54040 Tlalnepantla, Méx. México.
☎️ Teléfono de contacto: +52 56 3082 0401

### Your personality:
- Friendly, patient, and professional.
- Write in fluent, casual Spanish (tuteando al usuario).
- Keep answers short (2–4 lines max).
- Use emojis occasionally.

### Instructions:
- If the user asks for location, address, or how to get there, use the exact address above.
- If the user asks for a phone number or contact, use the one above.
- If they ask general things about shipping, say we ship all across Mexico.
- **IMPORTANT**: Use clean paragraphs for readability. Use lists for steps or multiple items. Keep it visually structured.

Now, respond to the following user message:
User: {user_message}
"""

NEED_HUMAN_PROMPT = """You are the Starsano AI assistant. The user is upset or needs human intervention.
Respond in Spanish with empathy and redirect them to human support (+52 56 3082 0401).

The previous messages with this user are:
{previous_messages}

Now respond to the following user message:
User: {user_message}
"""

PRODUCT_SEARCH_PROMPT = """You are the Starsano AI Product Expert. Your goal is to help customers find the right products from our catalog in a helpful and conversational way.

### Personality & Tone:
- Answer in friendly, warm Spanish (tuteando).
- **CONVERSATIONAL FLOW**: Do not just list products. Use a cohesive and "linked" narrative. Use transitions like "Para lo que buscas, te sugiero...", "También podría interesarte...", or "Si prefieres algo más específico...".
- Your goal is to sound like a boutique shop assistant, not a database search result.

### Rules:
- Use ONLY the product information provided.
- For each product, you MUST provide a direct clickable link using markdown: [Ver producto](http://localhost:8080/#/product/[ID])
- Mention price (in MXN, use '$') and a brief benefit in the flow of the sentence.
- **FORMATTING**: Use clean paragraphs. Start names in UPPERCASE without asterisks. 
- Avoid using double asterisks (**) for bolding.
- If no products are found, apologize naturally and offer to help with something else.
- Keep it concise but elegant (max 2-3 products).

### Found Products:
{found_products}

User message: {user_message}
Context: {context}

Response (Conversational & Natural Spanish):"""

KEYWORDS_PROMPT = """Extrae el nombre del producto o ingredientes clave del siguiente mensaje de un usuario para buscarlo en una base de datos.
Responde SOLO con los términos de búsqueda, sin nada más. No incluyas puntuación ni artículos innecesarios.
Ejemplos:
'¿Tienes mantequilla de almendras?' -> mantequilla almendras
'Busco vitaminas para el pelo' -> vitaminas pelo
'Precio de la proteina vegana' -> proteina vegana

Mensaje: {message}
Keywords:"""

keywords_prompt_template = PromptTemplate(
    input_variables=["message"],
    template=KEYWORDS_PROMPT
)

def extract_search_keywords(message: str) -> str:
    try:
        prompt = keywords_prompt_template.format(message=message)
        response = llm.invoke(prompt)
        return response.content.strip()
    except Exception as e:
        print(f"Error extrayendo keywords: {e}")
        return message

def classify_intention(message: str, context: str = "") -> Literal["product_search", "general_question", "need_human"]:
    try:
        prompt = prompt_template.format(message=message, context=context)
        response = llm.invoke(prompt)
        intention = response.content.strip().lower()
        valid_intentions = ["product_search", "general_question", "need_human"]
        if intention not in valid_intentions:
            return "general_question"
        return intention
    except Exception as e:
        print(f"Error en clasificación: {e}")
        return "general_question"
    except Exception as e:
        print(f"Error en clasificación: {e}")
        return "general_question"

from .vector_store import vector_store

def generate_product_search_response(user_message: str, products_data: List[Dict[str, Any]], context: str = "") -> str:
    try:
        if not products_data:
            return "Lo siento, no he podido encontrar productos que coincidan con tu búsqueda. ¿Buscas algo más en específico?"
        
        products_str = ""
        for p in products_data:
            products_str += f"- {p['name']} (${p['price']} MXN): {p['description'][:60]}... URL: http://localhost:8080/#/product/{p['id']}\n"
        
        prompt = PRODUCT_SEARCH_PROMPT.format(
            found_products=products_str,
            user_message=user_message,
            context=context
        )
        response = assistant_llm.invoke(prompt)
        return response.content.strip()
    except Exception as e:
        print(f"Error generando respuesta de producto: {e}")
        return "Hubo un problema consultando el catálogo. ¿Puedes intentar de nuevo?"

def generate_general_question_response(user_message: str) -> str:
    try:
        prompt = GENERAL_QUESTION_PROMPT.format(user_message=user_message)
        response = assistant_llm.invoke(prompt)
        return response.content.strip()
    except Exception as e:
        return "Gracias por tu mensaje. Estamos ubicados en Bulevard Popocatépetl 97 y nuestro teléfono es +52 56 3082 0401. ¿En qué más puedo ayudarte?"

def generate_need_human_response(user_message: str, previous_messages: str = "") -> str:
    try:
        prompt = NEED_HUMAN_PROMPT.format(user_message=user_message, previous_messages=previous_messages)
        response = angry_llm.invoke(prompt)
        return response.content.strip()
    except Exception as e:
        return "Lamento lo ocurrido. Un asesor te contactará pronto al +52 56 3082 0401."

def handle_product_search(message: str, user_id: str, thread_id: str, slots: Dict[str, Any]) -> dict:
    # 1. Búsqueda semántica (RAG)
    print(f"[SEARCH] Iniciando búsqueda semántica para: {message}")
    products = vector_store.semantic_search(message)
    
    # 2. Si no hay resultados semánticos, fallback a keywords
    if not products:
        keywords = extract_search_keywords(message)
        print(f"[SEARCH-FALLBACK] Keywords: {keywords}")
        products = db_client.search_products(keywords)
    
    # 3. Generar respuesta
    response_text = generate_product_search_response(message, products)
    return {"status": "handled", "intention": "product_search", "response_text": response_text}

def handle_general_question(message: str, user_id: str, thread_id: str, slots: Dict[str, Any]) -> dict:
    response_text = generate_general_question_response(message)
    return {"status": "handled", "intention": "general_question", "response_text": response_text}

def handle_need_human(message: str, user_id: str, thread_id: str, slots: Dict[str, Any]) -> dict:
    response_text = generate_need_human_response(message)
    return {"status": "handled", "intention": "need_human", "notify_email": True, "response_text": response_text}

def route_message(intention: str, message: str, user_id: str, thread_id: str, slots: Dict[str, Any]) -> dict:
    routers = {
        "product_search": handle_product_search,
        "general_question": handle_general_question,
        "need_human": handle_need_human
    }
    handler = routers.get(intention)
    return handler(message, user_id, thread_id, slots) if handler else {"status": "error"}
