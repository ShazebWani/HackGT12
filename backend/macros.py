import os
import json
import requests
from dotenv import load_dotenv
from transformers import pipeline

# Load USDA API key from .env file
load_dotenv(os.path.join(os.path.dirname(__file__), ".env.local"))
USDA_API_KEY = os.getenv("USDA_API_KEY")

if not USDA_API_KEY:
    raise ValueError("Missing USDA_API_KEY. Put it in your .env file.")

# Step 1: Food classification using Hugging Face model
pipe = pipeline("image-classification", model="prithivMLmods/Food-101-93M")
results = pipe("/Users/khwaj/Documents/GitHub/HackGT12/backend/test/waffles.jpg", top_k=5)  # Get top 5 predictions

# Step 2: Query USDA FoodData Central API
def get_food_nutrition(food_query: str):
    search_url = "https://api.nal.usda.gov/fdc/v1/foods/search"
    params = {
        "api_key": USDA_API_KEY,
        "query": food_query,
        "pageSize": 1
    }
    response = requests.get(search_url, params=params)
    response.raise_for_status()
    data = response.json()

    if not data.get("foods"):
        return {"error": "No results found"}

    food_item = data["foods"][0]

    # Extract only macros
    nutrients = {}
    for nutrient in food_item.get("foodNutrients", []):
        name = nutrient.get("nutrientName")
        value = nutrient.get("value")
        unit = nutrient.get("unitName")
        if name in ["Protein", "Carbohydrate, by difference", "Total lipid (fat)", "Energy"]:
            nutrients[name] = f"{value} {unit}"

    return {
        "description": food_item.get("description"),
        "fdcId": food_item.get("fdcId"),
        "nutrients": nutrients
    }

# Step 3: Process all predictions
foods_output = []
for res in results:
    food_name = res["label"]
    confidence = round(res["score"], 3)
    nutrition = get_food_nutrition(food_name)

    foods_output.append({
        "food_prediction": food_name,
        "confidence": confidence,
        "nutrition": nutrition
    })

# Print in pretty JSON format
foods_obj = json.dumps(foods_output, indent=2)
# print(foods_obj)

for i, food in enumerate(foods_output, 1):
    nutrition = food.get("nutrition", {})
    
    if "error" in nutrition:
        continue
    else:
        print(f"{i}. Food Prediction: {food['food_prediction']} (Confidence: {food['confidence']*100:.1f}%)")
        print(f"   Description: {nutrition.get('description', 'N/A')}")
        print("   Nutrients:")
        for key, value in nutrition.get("nutrients", {}).items():
            print(f"     - {key}: {value}")
    print("-" * 40)


