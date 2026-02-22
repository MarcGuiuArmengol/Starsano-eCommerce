import os
import psycopg2
from datetime import datetime

# Connection config
host = os.environ.get("POSTGRES_HOST", "localhost")
user = os.environ.get("POSTGRES_USER", "postgres")
password = os.environ.get("POSTGRES_PASSWORD", "postgres")
dbname = os.environ.get("POSTGRES_DB", "starsano")
port = os.environ.get("POSTGRES_PORT", "5432")

old_articles = [
    {
        "title": "Stevia Liquida: Tu Mejor Aliado para un Estilo de Vida Keto",
        "content": "<p>La stevia líquida de Starsano es el acompañamiento perfecto para quienes buscan reducir el consumo de azúcar sin sacrificar el sabor. Al ser de origen natural, no provoca picos de glucosa, lo que la hace ideal para diabéticos y seguidores de la dieta keto.</p><p>A diferencia de otros edulcorantes, nuestra stevia no tiene el retrogusto amargo típico, permitiendo que disfrutes de tu café, té o repostería con un dulzor puro y equilibrado.</p>",
        "image_url": "https://lh3.googleusercontent.com/aida-public/AB6AXuC56lFh9q9EJjnaYUtvXarSOWMM-BRMAryqudEVPVxWih1y2Q9uBEz1lpCXSpmbDKoFaFLIF1_MqEl4AL2fiqxbRSDbK96jCxaqsPJWwKNogGyvOieENbmnFwy84WSyBInwOpnNHtnzoVE95V_A541cpge4-3J04LQjGfRsz2XjeYy-cRg6crWseaAtf_XdPPhGQaSNvO--7y0aMIPmrqS-E2V2AkHBEjS8R0W7Ywgxhd09QCDr5U5mDI9aJkYmwbrM6zb1wp3hiug"
    },
    {
        "title": "Harina de Almendras: Secretos para Repostería Saludable",
        "content": "<p>Cocinar con harina de almendras abre un mundo de posibilidades para quienes evitan el gluten o buscan harinas bajas en carbohidratos. Su alto contenido en grasas saludables y proteínas no solo mejora el perfil nutricional de tus postres, sino que les aporta una humedad y textura inigualables.</p><p>Recuerda que la harina de almendras se quema más rápido que la de trigo, por lo que te recomendamos hornear a temperaturas ligeramente más bajas y vigilar el tiempo de cocción para obtener resultados perfectos en tus galletas y bizcochos.</p>",
        "image_url": "https://lh3.googleusercontent.com/aida-public/AB6AXuBbDY3Vm2itOVLLs4spQE4oVqPmdaeBsm7Mo_t6K-MXyYQK9JbRHcLXn4en_8queSFSHi-CPYnnlM_iKZsLxdqmkFODwD4p_FspFmksS7lIbcDxbQAwcv3mMFQCcvROu9JtfRREGhsVWbSGC166G_xzVV6InwzudOUpHTIrfxvma6x4uMEVkRZz7nhAadh4OX7NCkujTd32je0i4tkNMxJGPoU4q4jkTAtUM_0wtF1s2txa_I3rp92QJCoNmOgpCI2_XQv5bWWXh80"
    },
    {
        "title": "Guía de Endulzantes Naturales: Más Allá del Azúcar",
        "content": "<p>Elegir el endulzante adecuado puede ser confuso. El Fruto del Monje (Monk Fruit) es excelente por su potencia y falta de calorías, mientras que el Eritritol es ideal para hornear debido a su volumen similar al azúcar. En Starsano, seleccionamos solo aquellos que mantienen tu salud intestinal y no alteran tu metabolismo.</p><p>Ya sea para tus bebidas matutinas o para preparar una tarta espectacular, entender las proporciones y beneficios de cada opción es el primer paso hacia una vida más saludable y libre de azúcar procesado.</p>",
        "image_url": "https://lh3.googleusercontent.com/aida-public/AB6AXuDaOeOw_rTkUkKYOFtAxGRth7K4CJo9JOGDwxCRBHGArH9Jmnwnq5nednE-EimlynoDB48lK1V5_ZlBaG4vbA9oFUSWfhPwEQ-qbve7rtiGf9muMgmkb2oz9_E_2u6kkPDkL2zuNiWrQoDSnpPtafsDe3RABhUJEotQwWF1nFeNosnkGpNEhRZLaJDGRYmmq7S7FbnFdGd-3G4caszPs3gEvCTFrslhKqV11ZEgf-XU7fll15QllK0zZLR9Dn0Vm9_N-3qWk8oACLM"
    },
    {
        "title": "Vivir Sin Gluten: Consejos para una Transición Exitosa",
        "content": "<p>Empezar una dieta libre de gluten no tiene por qué ser aburrido. El secreto está en enfocarse en los alimentos naturalmente libres de esta proteína: frutas, verduras, carnes y granos como el arroz o la quinoa. En Starsano tenemos una amplia gama de alternativas para que sigas disfrutando de tus panes y snacks favoritos.</p><p>La clave es leer siempre las etiquetas y buscar el sello 'Gluten Free'. Poco a poco, tu digestión mejorará y notarás un aumento en tus niveles de energía diarios.</p>",
        "image_url": "https://lh3.googleusercontent.com/aida-public/AB6AXuC-MQKf1Xtg4Q4wiuljZ7Q2udgX5iUPv2WKEpYhCbQcVYpKR4a2J1LWLaaY0CLHZekMy8rNmSauYJgxMn8_Nx4Tg8EkDL7bKctacoLTJXKlxSKIXO--YpftS_j5XDQ5JCTPUStCfw3p9sFZg19CByA1eRl0RNep8Vek4wuUQAr0k29SorxMPvnnI6OhUrrDsCcV642ngL6HM8gyox2Kqbfo4oZ79nWQihXqmOGUftlaoaIz8AVFmJutxpj-H38Ewpx-r6sIr8WFVfk"
    }
]

def migrate():
    try:
        conn = psycopg2.connect(
            host=host,
            user=user,
            password=password,
            dbname=dbname,
            port=port
        )
        cur = conn.cursor()
        
        for art in old_articles:
            cur.execute(
                "INSERT INTO articles (title, content, image_url, created_at) VALUES (%s, %s, %s, %s) ON CONFLICT DO NOTHING",
                (art['title'], art['content'], art['image_url'], datetime.now())
            )
        
        conn.commit()
        print(f"Successfully migrated {len(old_articles)} articles.")
        cur.close()
        conn.close()
    except Exception as e:
        print(f"Error migrating: {e}")

if __name__ == "__main__":
    migrate()
