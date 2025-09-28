import os
import json
import requests
from dotenv import load_dotenv
from transformers import pipeline

class FoodNutritionAnalyzer:
    """Class to classify food images and fetch nutritional information using USDA API."""

    MACRO_NUTRIENTS = ["Protein", "Carbohydrate, by difference", "Total lipid (fat)", "Energy"]

    def __init__(self, usda_api_key: str | None = None):
        # Load USDA API key from environment if not provided
        if not usda_api_key:
            load_dotenv(os.path.join(os.path.dirname(__file__), ".env.local"))
            usda_api_key = os.getenv("USDA_API_KEY")

        if not usda_api_key:
            raise ValueError("Missing USDA_API_KEY. Put it in your .env file or provide it directly.")

        self.usda_api_key = usda_api_key
        # Initialize Hugging Face food classification pipeline
        self.pipe = pipeline("image-classification", model="prithivMLmods/Food-101-93M")

    def classify_food(self, image_path: str, top_k: int = 5):
        """Classify food in the image and return top_k predictions."""
        return self.pipe(image_path, top_k=top_k)

    def get_food_nutrition(self, food_query: str) -> dict:
        """Query USDA FoodData Central API for a food item and return macros."""
        search_url = "https://api.nal.usda.gov/fdc/v1/foods/search"
        params = {
            "api_key": self.usda_api_key,
            "query": food_query,
            "pageSize": 1
        }

        response = requests.get(search_url, params=params)
        response.raise_for_status()
        data = response.json()

        if not data.get("foods"):
            return {"error": "No results found"}

        food_item = data["foods"][0]

        # Extract only macro nutrients
        nutrients = {}
        for nutrient in food_item.get("foodNutrients", []):
            name = nutrient.get("nutrientName")
            value = nutrient.get("value")
            unit = nutrient.get("unitName")
            if name in self.MACRO_NUTRIENTS:
                nutrients[name] = f"{value} {unit}"

        return {
            "description": food_item.get("description"),
            "fdcId": food_item.get("fdcId"),
            "nutrients": nutrients
        }

    def analyze_image(self, image_path: str, top_k: int = 5) -> list[dict]:
        """Classify an image and fetch nutrition info for all top predictions."""
        results = self.classify_food(image_path, top_k=top_k)
        foods_output = []

        for res in results:
            food_name = res["label"]
            confidence = round(res["score"], 3)
            nutrition = self.get_food_nutrition(food_name)

            foods_output.append({
                "food_prediction": food_name,
                "confidence": confidence,
                "nutrition": nutrition
            })

        return foods_output

    def display_results(self, foods_output: list[dict]):
        """Print formatted nutrition info to the console."""
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


if __name__ == "__main__":
    analyzer = FoodNutritionAnalyzer()
    foods = analyzer.analyze_image("/Users/khwaj/Documents/GitHub/HackGT12/backend/test/waffles.jpg")
    analyzer.display_results(foods)
