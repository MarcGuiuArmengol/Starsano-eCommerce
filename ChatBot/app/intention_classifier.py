import os
import json
from typing import Literal, Dict, Any, List, Optional
from langchain_openai import ChatOpenAI
from langchain.prompts import PromptTemplate
from dotenv import load_dotenv

from .db import db_client

load_dotenv()

OPENAI_MODEL = os.environ.get("OPENAI_MODEL", "gpt-4o-mini")

# Inicializar el modelo OpenAI
llm = ChatOpenAI(
    model=OPENAI_MODEL,
    api_key=os.environ.get("OPENAI_API_KEY"),
    temperature=0
)

assistant_llm = ChatOpenAI(
    model=OPENAI_MODEL,
    api_key=os.environ.get("OPENAI_API_KEY"),
    temperature=0.4
)

angry_llm = ChatOpenAI(
    model=OPENAI_MODEL,
    api_key=os.environ.get("OPENAI_API_KEY"),
    temperature=0.3
)

INTENTION_PROMPT = """Eres un clasificador de intención para mensajes de clientes de la tienda starsano.com.mx.

Analiza SOLO el ÚLTIMO mensaje del usuario.
El contexto previo es solo apoyo, pero la decisión se basa principalmente en el último mensaje.

Debes devolver **EXACTAMENTE UNA** de estas tres palabras (sin frases, sin JSON, sin puntuación):

product_search
general_question
order_tracking
need_human

Reglas Críticas de Selección:
- Si el mensaje es ambiguo o muy corto (ej: "ahora?", "y?", "repetir", "más info") y el historial muestra que se estaba hablando de un pedido, selecciona order_tracking.

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

order_tracking →
- El usuario quiere saber el estado de su pedido.
- Menciona un número de pedido (ej: "pedido 123").
- Pregunta "¿dónde está mi pedido?" o similares.

need_human →
- Enfado, quejas, insultos o frustración explícita.
- Reembolsos, cambios, cancelaciones complejas.
- Problemas graves con pagos o cargos incorrectos.
- Peticiones que implican acciones que el bot no puede realizar.

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
- **CONVERSATIONAL FLOW**: Use a cohesive and "linked" narrative.
- Your goal is to sound like a boutique shop assistant, not a database result.

### Rules:
- Use ONLY the product information provided.
- For each product, you MUST provide a direct clickable link using markdown: [Ver producto]({frontend_url}#/product/[ID])
- Mention price (in MXN, use '$') and a brief benefit.
- **FORMATTING**: Use clean paragraphs and bullet points for lists.
- Avoid using double asterisks (**) for bolding, use simple text.
- If no products are found, apologize naturally.

### Found Products:
{found_products}

User message: {user_message}
Context: {context}

Response (Natural Spanish):"""

ORDER_INFO_PROMPT = """Extrae el ID del pedido y el EMAIL del usuario del mensaje proporcionado.

REGLAS ESTRICTAS:
1. SOLO extrae si el valor está presente en el mensaje.
2. NUNCA inventes números como "123", "0", "1" si no están en el texto.
3. Si el usuario dice "ese", "el mío", "ahora", deja order_id como null (se usará la memoria).
4. Responde SOLO en JSON: {{"order_id": "valor", "email": "valor"}}.

Mensaje: {message}
JSON:"""

order_info_prompt_template = PromptTemplate(
    input_variables=["message"],
    template=ORDER_INFO_PROMPT
)

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

def classify_intention(message: str, context: str = "", history: str = "") -> Literal["product_search", "general_question", "order_tracking", "need_human"]:
    try:
        combined_context = f"{context}\n\nHistorial reciente:\n{history}" if history else context
        prompt = prompt_template.format(message=message, context=combined_context)
        response = llm.invoke(prompt)
        intention = response.content.strip().lower()
        valid_intentions = ["product_search", "general_question", "order_tracking", "need_human"]
        if intention not in valid_intentions:
            return "general_question"
        return intention
    except Exception as e:
        print(f"Error en clasificación: {e}")
        return "general_question"

from .vector_store import vector_store

def generate_product_search_response(user_message: str, products_data: List[Dict[str, Any]], context: str = "") -> str:
    try:
        if not products_data:
            return "Lo siento, no he podido encontrar productos que coincidan con tu búsqueda. ¿Buscas algo más en específico?"
        
        frontend_url = os.environ.get("FRONTEND_URL", "http://localhost:8080/")
        products_str = ""
        for p in products_data:
            products_str += f"- {p['name']} (${p['price']} MXN): {p['description'][:60]}... URL: {frontend_url}#/product/{p['id']}\n"
        
        prompt = PRODUCT_SEARCH_PROMPT.format(
            found_products=products_str,
            user_message=user_message,
            context=context,
            frontend_url=frontend_url
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

def handle_product_search(message: str, user_id: str, thread_id: str, slots: Dict[str, Any], session_email: Optional[str] = None) -> dict:
    # 1. Búsqueda semántica (RAG)
    print(f"[SEARCH] Iniciando búsqueda semántica para: {message}")
    products = vector_store.semantic_search(message)
    
    # 2. Si no hay resultados semánticos, fallback a keywords
    if not products:
        keywords = extract_search_keywords(message)
        products = db_client.search_products(keywords)
    
    # 3. Generar respuesta
    response_text = generate_product_search_response(message, products)
    
    return {
        "status": "handled", 
        "intention": "product_search", 
        "response_text": response_text, 
        "slots": slots
    }

def handle_general_question(message: str, user_id: str, thread_id: str, slots: Dict[str, Any], session_email: Optional[str] = None) -> dict:
    response_text = generate_general_question_response(message)
    return {
        "status": "handled", 
        "intention": "general_question", 
        "response_text": response_text, 
        "slots": slots
    }

def handle_need_human(message: str, user_id: str, thread_id: str, slots: Dict[str, Any], session_email: Optional[str] = None) -> dict:
    response_text = generate_need_human_response(message)
    return {
        "status": "handled", 
        "intention": "need_human", 
        "notify_email": True, 
        "response_text": response_text, 
        "slots": slots
    }

def handle_order_tracking(message: str, user_id: str, thread_id: str, slots: Dict[str, Any], session_email: Optional[str] = None) -> dict:
    try:
        # 0. Seguridad: Solo dar info si el usuario está registrado
        if not session_email:
            return {
                "status": "handled",
                "intention": "order_tracking",
                "response_text": "Por razones de seguridad, solo puedo dar información sobre pedidos a usuarios registrados que hayan iniciado sesión. 🔒 Por favor, [inicia sesión](/login) para consultar tus pedidos."
            }

        status_map = {
            "pending": "Pendiente (estamos preparando tu paquete) 📦",
            "processing": "En proceso (preparando envío) ⚙️",
            "shipped": "En camino (¡ya salió de nuestra tienda!) 🚚",
            "delivered": "Entregado (¡esperamos que lo disfrutes!) 🎉",
            "cancelled": "Cancelado ❌",
        }

        def format_order_summary(order):
            status_friendly = status_map.get(order['status'], order['status'])
            return f"• **Pedido #{order['id']}**: {status_friendly} (${order['total']} MXN)"

        # 1. Si el usuario pregunta genéricamente o usa conectores de seguimiento
        follow_up_keywords = ["ahora", "y?", "mas info", "dime mas", "continuar", "repetir", "el mio"]
        generic_status_keywords = ["donde esta mi pedido", "como va mi pedido", "mis pedidos", "mi compra", "estado de mi pedido"]
        
        is_generic_query = any(kw in message.lower() for kw in generic_status_keywords + follow_up_keywords)
        is_very_short = len(message.strip()) < 10
        
        if is_generic_query or is_very_short:
            # Primero ver si tenemos un order_id en slots que sea útil
            cached_order_id = slots.get("order_id")
            if cached_order_id:
                order = db_client.get_order_status(cached_order_id, session_email)
                if order:
                    status_friendly = status_map.get(order['status'], order['status'])
                    return {
                        "status": "handled",
                        "intention": "order_tracking",
                        "response_text": f"Siguiendo con tu pedido **#{cached_order_id}**:\n\nEstado actual: **{status_friendly}**\nTotal: **${order['total']} MXN**\n\n¿Necesitas saber algo más sobre este pedido?",
                        "slots": slots
                    }

            orders = db_client.get_latest_orders_by_email(session_email, limit=3)
            if not orders:
                return {
                    "status": "handled",
                    "intention": "order_tracking",
                    "response_text": "No he encontrado ningún pedido asociado a tu cuenta. ¡Anímate a hacer tu primera compra! 😊",
                    "slots": slots
                }
            
            if len(orders) > 1:
                orders_list = "\n".join([format_order_summary(o) for o in orders])
                return {
                    "status": "handled",
                    "intention": "order_tracking",
                    "response_text": f"He encontrado tus últimos pedidos:\n\n{orders_list}\n\n¿Quieres que te dé más detalles sobre alguno en particular? (solo dime el número del pedido).",
                    "slots": slots
                }
            
            # Solo tiene uno
            order = orders[0]
            slots["order_id"] = str(order['id'])
            status_friendly = status_map.get(order['status'], order['status'])
            return {
                "status": "handled",
                "intention": "order_tracking",
                "response_text": f"He encontrado tu pedido **#{order['id']}**.\n\nEstado actual: **{status_friendly}**\nTotal: **${order['total']} MXN**\nFecha de compra: {order['created_at'].strftime('%d/%m/%Y')}\n\n¿En qué más te puedo ayudar?",
                "slots": slots
            }

        # 2. Intentar extraer ID si es una consulta específica
        prompt = order_info_prompt_template.format(message=message)
        response = llm.invoke(prompt)
        try:
            data = json.loads(response.content.strip())
        except:
            data = {}
            
        order_id = data.get("order_id")
        
        # Sanitización inteligente: si el order_id extraído NO está en el mensaje original, es una alucinación (ej: "123")
        # Excepto si coincide con lo que ya tenemos en slots (memoria)
        if order_id and str(order_id) not in message:
            # El LLM ha inventado un ID. Lo ignoramos.
            order_id = None
        
        # Si sigue siendo "123" (placeholder común), lo descartamos
        if order_id == "123":
            order_id = None

        # Si la extracción falló o fue descartada, pero tenemos un ID en memoria, USAR la memoria
        if not order_id and slots.get("order_id"):
            order_id = slots.get("order_id")

        if not order_id:
            return {
                "status": "handled",
                "intention": "order_tracking",
                "response_text": "¿Podrías indicarme el **ID de tu pedido** para darte información detallada? (ej. el número que aparece en tu confirmación).",
                "slots": slots
            }
        
        # Verificar propiedad: buscar el pedido ESPECÍFICO para este email
        order = db_client.get_order_status(order_id, session_email)
        if not order:
            return {
                "status": "handled",
                "intention": "order_tracking",
                "response_text": f"Lo siento, no pude encontrar ningún pedido con el ID **{order_id}** asociado a tu cuenta actual. Por favor, verifica el número e intenta de nuevo.",
                "slots": slots
            }
        
        # Guardar en slots para memoria
        slots["order_id"] = str(order_id)
        
        status_friendly = status_map.get(order['status'], order['status'])
        return {
            "status": "handled",
            "intention": "order_tracking",
            "response_text": f"Aquí tienes los detalles del pedido **#{order_id}**.\n\nEstado actual: **{status_friendly}**\nTotal: **${order['total']} MXN**\nFecha de compra: {order['created_at'].strftime('%d/%m/%Y')}\n\n¿Deseas saber algo más?",
            "slots": slots
        }
    except Exception as e:
        print(f"Error en handle_order_tracking: {e}")
        return {
            "status": "handled",
            "intention": "order_tracking",
            "response_text": "Tuve un pequeño problema consultando tu pedido, pero puedes contactarnos directamente al +52 56 3082 0401 y te ayudaremos de inmediato.",
            "slots": slots
        }

def route_message(intention: str, message: str, user_id: str, thread_id: str, slots: Dict[str, Any], session_email: Optional[str] = None) -> dict:
    routers = {
        "product_search": handle_product_search,
        "general_question": handle_general_question,
        "order_tracking": handle_order_tracking,
        "need_human": handle_need_human
    }
    handler = routers.get(intention)
    return handler(message, user_id, thread_id, slots, session_email) if handler else {"status": "error"}
