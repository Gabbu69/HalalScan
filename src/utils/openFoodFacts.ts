export interface OFFProduct {
  name: string;
  brand: string;
  image: string | null;
  ingredients: string;
}

export const fetchProductByBarcode = async (barcode: string): Promise<OFFProduct | null> => {
  try {
    const response = await fetch(`https://world.openfoodfacts.org/api/v0/product/${barcode}.json`);
    const data = await response.json();
    
    if (data.status === 1 && data.product) {
      return {
        name: data.product.product_name || 'Unknown Product',
        brand: data.product.brands || 'Unknown Brand',
        image: data.product.image_url || null,
        ingredients: data.product.ingredients_text || 'No ingredients listed.',
      };
    }
    return null;
  } catch (error) {
    console.error("OpenFoodFacts Error:", error);
    return null;
  }
};
