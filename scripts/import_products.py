import csv
import json
import requests
import sys
import os

# Configuración
API_URL = "http://localhost:3000/api/products/batch"
CSV_FILE = "products_template.csv"

def import_products(csv_path):
    if not os.path.exists(csv_path):
        print(f"Error: No se encuentra el archivo {csv_path}")
        return

    products = []
    try:
        with open(csv_path, mode='r', encoding='utf-8') as f:
            reader = csv.DictReader(f)
            for row in reader:
                # Procesar badges si vienen como JSON string
                badges = row.get('badges', '[]')
                try:
                    badges_list = json.loads(badges)
                except:
                    badges_list = [b.strip() for b in badges.split(',')] if badges else []

                product = {
                    "name": row['name'],
                    "price": float(row['price']),
                    "description": row['description'],
                    "image": row['image'],
                    "category": row['category'],
                    "badges": badges_list,
                    "rating": float(row.get('rating', 0))
                }
                products.append(product)
        
        print(f"Enviando {len(products)} productos a la API...")
        response = requests.post(API_URL, json=products)
        
        if response.status_code == 200:
            print("✅ Importación exitosa:", response.json().get('message'))
        else:
            print(f"❌ Error {response.status_code}:", response.text)
            
    except Exception as e:
        print(f"💥 Error durante la importación: {e}")

if __name__ == "__main__":
    file_path = sys.argv[1] if len(sys.argv) > 1 else CSV_FILE
    import_products(file_path)
