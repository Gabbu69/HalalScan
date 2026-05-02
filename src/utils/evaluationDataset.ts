/**
 * Evaluation Dataset for HalalScan AI System
 * 
 * This module contains a curated test dataset of 30 products with ground-truth
 * Halal/Haram/Mashbooh labels. Each entry represents a realistic product with
 * known ingredient lists and an expected compliance verdict.
 * 
 * The dataset is used to evaluate the accuracy of both the KR&R (Knowledge
 * Representation & Reasoning) engine and the integrated ML+KR&R pipeline.
 */

export type TestCase = {
  id: number;
  productName: string;
  ingredients: string;
  expectedVerdict: 'HALAL' | 'HARAM' | 'MASHBOOH';
  category: string;
  rationale: string;
};

export const EVALUATION_DATASET: TestCase[] = [
  // ===================== HALAL PRODUCTS (10 cases) =====================
  {
    id: 1,
    productName: "Organic Rice Crackers",
    ingredients: "whole grain rice, sunflower oil, sea salt",
    expectedVerdict: "HALAL",
    category: "Snacks",
    rationale: "All plant-based ingredients, no animal derivatives."
  },
  {
    id: 2,
    productName: "Fresh Orange Juice",
    ingredients: "100% orange juice from concentrate, water, vitamin C (ascorbic acid)",
    expectedVerdict: "HALAL",
    category: "Beverages",
    rationale: "Pure fruit juice with no additives of concern."
  },
  {
    id: 3,
    productName: "Whole Wheat Bread",
    ingredients: "whole wheat flour, water, sugar, yeast, soybean oil, salt, calcium sulfate",
    expectedVerdict: "HALAL",
    category: "Bakery",
    rationale: "Standard bread ingredients, all plant-based."
  },
  {
    id: 4,
    productName: "Plain Potato Chips",
    ingredients: "potatoes, vegetable oil (sunflower, corn), salt",
    expectedVerdict: "HALAL",
    category: "Snacks",
    rationale: "Simple plant-based ingredients."
  },
  {
    id: 5,
    productName: "Canned Chickpeas",
    ingredients: "chickpeas, water, salt, calcium chloride",
    expectedVerdict: "HALAL",
    category: "Canned Goods",
    rationale: "Legumes with mineral preservative, fully plant-based."
  },
  {
    id: 6,
    productName: "Olive Oil Extra Virgin",
    ingredients: "100% extra virgin olive oil",
    expectedVerdict: "HALAL",
    category: "Oils",
    rationale: "Pure plant oil."
  },
  {
    id: 7,
    productName: "Instant Oatmeal",
    ingredients: "rolled oats, sugar, salt, calcium carbonate, iron, vitamin A",
    expectedVerdict: "HALAL",
    category: "Breakfast",
    rationale: "Grain-based with mineral fortification."
  },
  {
    id: 8,
    productName: "Green Tea Bags",
    ingredients: "green tea leaves",
    expectedVerdict: "HALAL",
    category: "Beverages",
    rationale: "Single plant ingredient."
  },
  {
    id: 9,
    productName: "Canned Tuna in Water",
    ingredients: "tuna, water, salt",
    expectedVerdict: "HALAL",
    category: "Canned Goods",
    rationale: "Fish is Halal by default (majority scholarly view)."
  },
  {
    id: 10,
    productName: "Peanut Butter Natural",
    ingredients: "roasted peanuts, salt",
    expectedVerdict: "HALAL",
    category: "Spreads",
    rationale: "Plant-based, no additives."
  },

  // ===================== HARAM PRODUCTS (10 cases) =====================
  {
    id: 11,
    productName: "Pork Sausage Links",
    ingredients: "pork, water, salt, spices, sugar, sodium phosphate",
    expectedVerdict: "HARAM",
    category: "Meat",
    rationale: "Contains pork as primary ingredient."
  },
  {
    id: 12,
    productName: "Bacon Flavored Chips",
    ingredients: "potatoes, vegetable oil, bacon seasoning (bacon fat, natural smoke flavor, salt, sugar)",
    expectedVerdict: "HARAM",
    category: "Snacks",
    rationale: "Contains bacon and bacon fat."
  },
  {
    id: 13,
    productName: "Red Velvet Cake Mix",
    ingredients: "sugar, flour, cocoa, carmine (E120), vanilla, baking soda, salt",
    expectedVerdict: "HARAM",
    category: "Bakery",
    rationale: "Contains carmine (E120) — insect-derived colorant."
  },
  {
    id: 14,
    productName: "Classic Pepperoni Pizza",
    ingredients: "wheat flour, tomato sauce, mozzarella cheese, pepperoni (pork, beef, spices), water, yeast",
    expectedVerdict: "HARAM",
    category: "Ready Meals",
    rationale: "Contains pepperoni made from pork."
  },
  {
    id: 15,
    productName: "Tiramisu Dessert",
    ingredients: "mascarpone cheese, sugar, eggs, espresso, rum, ladyfingers, cocoa powder",
    expectedVerdict: "HARAM",
    category: "Desserts",
    rationale: "Contains rum (alcohol)."
  },
  {
    id: 16,
    productName: "Blood Sausage (Morcilla)",
    ingredients: "pork blood, rice, onions, pork fat, salt, spices",
    expectedVerdict: "HARAM",
    category: "Meat",
    rationale: "Contains blood and pork — both explicitly Haram."
  },
  {
    id: 17,
    productName: "Wine Vinegar Dressing",
    ingredients: "olive oil, wine vinegar, wine, mustard, salt, sugar",
    expectedVerdict: "HARAM",
    category: "Condiments",
    rationale: "Contains wine as an ingredient."
  },
  {
    id: 18,
    productName: "Prosciutto Wrapped Melon",
    ingredients: "cantaloupe melon, prosciutto, black pepper",
    expectedVerdict: "HARAM",
    category: "Appetizers",
    rationale: "Contains prosciutto (Italian cured pork)."
  },
  {
    id: 19,
    productName: "Ham and Cheese Croissant",
    ingredients: "wheat flour, butter, ham, cheese, eggs, sugar, yeast, salt",
    expectedVerdict: "HARAM",
    category: "Bakery",
    rationale: "Contains ham (pork product)."
  },
  {
    id: 20,
    productName: "Beer Battered Fish",
    ingredients: "cod fillet, wheat flour, beer, salt, sunflower oil, baking powder",
    expectedVerdict: "HARAM",
    category: "Ready Meals",
    rationale: "Contains beer (alcohol)."
  },

  // ===================== MASHBOOH PRODUCTS (10 cases) =====================
  {
    id: 21,
    productName: "Gummy Bears (Generic)",
    ingredients: "sugar, glucose syrup, gelatin, citric acid, natural flavors, artificial colors",
    expectedVerdict: "MASHBOOH",
    category: "Confectionery",
    rationale: "Contains gelatin (source unspecified) and natural flavors."
  },
  {
    id: 22,
    productName: "Cheese Crackers",
    ingredients: "enriched flour, vegetable oil, cheddar cheese (milk, rennet, salt), whey, salt, E471",
    expectedVerdict: "MASHBOOH",
    category: "Snacks",
    rationale: "Contains rennet (source unknown), whey, and E471 emulsifier."
  },
  {
    id: 23,
    productName: "Vanilla Ice Cream",
    ingredients: "milk, cream, sugar, egg yolks, natural vanilla flavoring, glycerin, stabilizer",
    expectedVerdict: "MASHBOOH",
    category: "Desserts",
    rationale: "Contains glycerin (source unknown), natural flavoring, and stabilizer."
  },
  {
    id: 24,
    productName: "Chocolate Coated Biscuits",
    ingredients: "wheat flour, sugar, cocoa butter, cocoa mass, vegetable fat, emulsifier (lecithin), whey powder, natural flavors",
    expectedVerdict: "MASHBOOH",
    category: "Confectionery",
    rationale: "Contains lecithin (source unknown), whey powder, and natural flavors."
  },
  {
    id: 25,
    productName: "Fruit Yogurt",
    ingredients: "milk, sugar, strawberries, modified corn starch, gelatin, natural flavors, E471, pectin",
    expectedVerdict: "MASHBOOH",
    category: "Dairy",
    rationale: "Contains gelatin (source unknown), natural flavors, and E471."
  },
  {
    id: 26,
    productName: "Soft White Bread (Premium)",
    ingredients: "wheat flour, water, sugar, yeast, soybean oil, mono and diglycerides, calcium stearate, whey",
    expectedVerdict: "MASHBOOH",
    category: "Bakery",
    rationale: "Contains mono and diglycerides, calcium stearate, and whey (sources unknown)."
  },
  {
    id: 27,
    productName: "Cheese Pizza (Frozen)",
    ingredients: "wheat flour, water, mozzarella cheese (milk, rennet, cultures), tomato paste, vegetable oil, sugar, E481, yeast",
    expectedVerdict: "MASHBOOH",
    category: "Ready Meals",
    rationale: "Contains rennet (source unspecified) and E481 emulsifier."
  },
  {
    id: 28,
    productName: "Protein Bar",
    ingredients: "whey protein isolate, chicory root fiber, almonds, glycerol, natural flavors, soy lecithin, calcium stearate",
    expectedVerdict: "MASHBOOH",
    category: "Health Foods",
    rationale: "Contains whey, glycerol, natural flavors, lecithin, and calcium stearate — all from unknown sources."
  },
  {
    id: 29,
    productName: "Marshmallows",
    ingredients: "sugar, corn syrup, gelatin, water, artificial flavor",
    expectedVerdict: "MASHBOOH",
    category: "Confectionery",
    rationale: "Contains gelatin and artificial flavor from unspecified sources."
  },
  {
    id: 30,
    productName: "Processed Cheese Slices",
    ingredients: "cheddar cheese (milk, salt, enzymes), water, milkfat, sodium citrate, E471, lipase, artificial color",
    expectedVerdict: "MASHBOOH",
    category: "Dairy",
    rationale: "Contains unspecified enzymes, E471, and lipase (animal or microbial source unknown)."
  },
];
