import OpenAI from "openai";
import { ClientSecretCredential } from "@azure/identity";

// the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user

async function getAzureToken(): Promise<string> {
  if (process.env.AZURE_TENANT_ID && process.env.AZURE_CLIENT_ID && process.env.AZURE_CLIENT_SECRET) {
    const credential = new ClientSecretCredential(
      process.env.AZURE_TENANT_ID,
      process.env.AZURE_CLIENT_ID,
      process.env.AZURE_CLIENT_SECRET
    );
    
    const tokenResponse = await credential.getToken("https://cognitiveservices.azure.com/.default");
    return tokenResponse.token;
  }
  throw new Error("Azure credentials not configured");
}

const openai = new OpenAI({
  apiKey: process.env.AZURE_OPENAI_ENDPOINT ? "dummy-key" : process.env.OPENAI_API_KEY,
  baseURL: process.env.AZURE_OPENAI_ENDPOINT ? 
    `${process.env.AZURE_OPENAI_ENDPOINT}openai/deployments/${process.env.AZURE_OPENAI_DEPLOYMENT}` : 
    undefined,
  defaultQuery: process.env.AZURE_OPENAI_ENDPOINT ? { 'api-version': '2024-02-01' } : undefined,
});

export interface RecipeSuggestion {
  name: string;
  description: string;
  servingSize: number;
  cookingTime: number;
  difficulty: "Easy" | "Medium" | "Hard";
  instructions: string[];
  requiredIngredients: {
    name: string;
    quantity: string;
    available: boolean;
  }[];
  matchPercentage: number;
  imageUrl?: string;
}

export async function generateRecipeSuggestions(
  availableIngredients: { name: string; quantity: string }[],
  servingSize: number = 2
): Promise<RecipeSuggestion[]> {
  try {
    const ingredientsList = availableIngredients.map(ing => `${ing.name} (${ing.quantity})`).join(", ");
    
    const prompt = `You are a professional chef AI. Based on the available ingredients, suggest 3 different recipes that can be made for ${servingSize} people.

Available ingredients: ${ingredientsList}

For each recipe, provide:
1. A creative and appetizing name
2. A brief description (1-2 sentences)
3. Cooking time in minutes
4. Difficulty level (Easy, Medium, or Hard)
5. Step-by-step cooking instructions (array of strings)
6. Required ingredients with quantities needed
7. A match percentage (how well the recipe uses available ingredients, 0-100)

Prioritize recipes that:
- Use ingredients that are expiring soon
- Minimize waste by using larger quantities
- Are practical and delicious
- Match the serving size requested

Please respond with a JSON object containing an array of 3 recipes in this exact format:
{
  "recipes": [
    {
      "name": "Recipe Name",
      "description": "Brief description",
      "servingSize": ${servingSize},
      "cookingTime": 30,
      "difficulty": "Easy",
      "instructions": ["Step 1", "Step 2", "Step 3"],
      "requiredIngredients": [
        {
          "name": "ingredient name",
          "quantity": "amount needed",
          "available": true/false
        }
      ],
      "matchPercentage": 85
    }
  ]
}`;

    let response;
    if (process.env.AZURE_OPENAI_ENDPOINT) {
      const token = await getAzureToken();
      const openaiWithAuth = new OpenAI({
        apiKey: token,
        baseURL: `${process.env.AZURE_OPENAI_ENDPOINT}openai/deployments/${process.env.AZURE_OPENAI_DEPLOYMENT}`,
        defaultQuery: { 'api-version': '2024-02-01' },
      });
      
      response = await openaiWithAuth.chat.completions.create({
        model: process.env.AZURE_OPENAI_DEPLOYMENT || "gpt-4o",
        messages: [
          {
            role: "system",
            content: "You are a professional chef AI that suggests recipes based on available ingredients. Always respond with valid JSON."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        response_format: { type: "json_object" },
        temperature: 0.7,
      });
    } else {
      response = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content: "You are a professional chef AI that suggests recipes based on available ingredients. Always respond with valid JSON."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        response_format: { type: "json_object" },
        temperature: 0.7,
      });
    }

    const result = JSON.parse(response.choices[0].message.content || "{}");
    return result.recipes || [];
  } catch (error) {
    console.error("Error generating recipe suggestions:", error);
    throw new Error("Failed to generate recipe suggestions: " + (error as Error).message);
  }
}

export async function optimizeInventoryUsage(
  ingredientsUsed: { name: string; quantityUsed: string }[],
  remainingIngredients: { name: string; quantity: string }[]
): Promise<{ suggestions: string[]; warnings: string[] }> {
  try {
    const usedList = ingredientsUsed.map(ing => `${ing.name} (${ing.quantityUsed} used)`).join(", ");
    const remainingList = remainingIngredients.map(ing => `${ing.name} (${ing.quantity} remaining)`).join(", ");
    
    const prompt = `As a food waste reduction expert, analyze the following cooking session and provide optimization suggestions.

Ingredients used: ${usedList}
Remaining ingredients: ${remainingList}

Provide suggestions for:
1. How to use remaining small quantities
2. Warnings about ingredients that might spoil soon
3. Tips to minimize waste in future cooking

Respond with JSON in this format:
{
  "suggestions": ["suggestion 1", "suggestion 2"],
  "warnings": ["warning 1", "warning 2"]
}`;

    let response;
    if (process.env.AZURE_OPENAI_ENDPOINT) {
      const token = await getAzureToken();
      const openaiWithAuth = new OpenAI({
        apiKey: token,
        baseURL: `${process.env.AZURE_OPENAI_ENDPOINT}openai/deployments/${process.env.AZURE_OPENAI_DEPLOYMENT}`,
        defaultQuery: { 'api-version': '2024-02-01' },
      });
      
      response = await openaiWithAuth.chat.completions.create({
        model: process.env.AZURE_OPENAI_DEPLOYMENT || "gpt-4o",
        messages: [
          {
            role: "system",
            content: "You are a food waste reduction expert. Provide practical suggestions to minimize food waste."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        response_format: { type: "json_object" },
      });
    } else {
      response = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content: "You are a food waste reduction expert. Provide practical suggestions to minimize food waste."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        response_format: { type: "json_object" },
      });
    }

    const result = JSON.parse(response.choices[0].message.content || "{}");
    return {
      suggestions: result.suggestions || [],
      warnings: result.warnings || []
    };
  } catch (error) {
    console.error("Error optimizing inventory usage:", error);
    throw new Error("Failed to optimize inventory usage: " + (error as Error).message);
  }
}
