import { 
  type Ingredient, 
  type InsertIngredient,
  type Recipe,
  type InsertRecipe,
  type RecipeIngredient,
  type InsertRecipeIngredient,
  type CookingHistory,
  type InsertCookingHistory
} from "../shared/schema.js";
import { db } from "./db.js";
import { ingredients, recipes, recipeIngredients, cookingHistory } from "../shared/schema.js";
import { eq, desc, lt, gte } from "drizzle-orm";

export interface IStorage {
  // Ingredients
  getIngredients(): Promise<Ingredient[]>;
  getIngredient(id: string): Promise<Ingredient | undefined>;
  createIngredient(ingredient: InsertIngredient): Promise<Ingredient>;
  updateIngredient(id: string, updates: Partial<InsertIngredient>): Promise<Ingredient>;
  deleteIngredient(id: string): Promise<void>;
  getExpiringIngredients(days: number): Promise<Ingredient[]>;
  
  // Recipes
  getRecipes(): Promise<Recipe[]>;
  getRecipe(id: string): Promise<Recipe | undefined>;
  createRecipe(recipe: InsertRecipe): Promise<Recipe>;
  updateRecipe(id: string, updates: Partial<InsertRecipe>): Promise<Recipe>;
  getRecipeWithIngredients(id: string): Promise<Recipe & { ingredients: RecipeIngredient[] } | undefined>;
  
  // Recipe Ingredients
  createRecipeIngredient(recipeIngredient: InsertRecipeIngredient): Promise<RecipeIngredient>;
  getRecipeIngredients(recipeId: string): Promise<RecipeIngredient[]>;
  
  // Cooking History
  createCookingHistory(history: InsertCookingHistory): Promise<CookingHistory>;
  getCookingHistory(): Promise<CookingHistory[]>;
}

export class DatabaseStorage implements IStorage {
  async getIngredients(): Promise<Ingredient[]> {
    return await db.select().from(ingredients).orderBy(desc(ingredients.createdAt));
  }

  async getIngredient(id: string): Promise<Ingredient | undefined> {
    const [ingredient] = await db.select().from(ingredients).where(eq(ingredients.id, id));
    return ingredient || undefined;
  }

  async createIngredient(ingredient: InsertIngredient): Promise<Ingredient> {
    const [newIngredient] = await db
      .insert(ingredients)
      .values(ingredient)
      .returning();
    return newIngredient;
  }

  async updateIngredient(id: string, updates: Partial<InsertIngredient>): Promise<Ingredient> {
    const [updatedIngredient] = await db
      .update(ingredients)
      .set(updates)
      .where(eq(ingredients.id, id))
      .returning();
    return updatedIngredient;
  }

  async deleteIngredient(id: string): Promise<void> {
    await db.delete(ingredients).where(eq(ingredients.id, id));
  }

  async getExpiringIngredients(days: number): Promise<Ingredient[]> {
    const expirationThreshold = new Date();
    expirationThreshold.setDate(expirationThreshold.getDate() + days);
    
    return await db
      .select()
      .from(ingredients)
      .where(
        lt(ingredients.expirationDate, expirationThreshold)
      );
  }

  async getRecipes(): Promise<Recipe[]> {
    return await db.select().from(recipes).orderBy(desc(recipes.createdAt));
  }

  async getRecipe(id: string): Promise<Recipe | undefined> {
    const [recipe] = await db.select().from(recipes).where(eq(recipes.id, id));
    return recipe || undefined;
  }

  async createRecipe(recipe: InsertRecipe): Promise<Recipe> {
    const [newRecipe] = await db
      .insert(recipes)
      .values(recipe)
      .returning();
    return newRecipe;
  }

  async updateRecipe(id: string, updates: Partial<InsertRecipe>): Promise<Recipe> {
    const [updatedRecipe] = await db
      .update(recipes)
      .set(updates)
      .where(eq(recipes.id, id))
      .returning();
    return updatedRecipe;
  }

  async getRecipeWithIngredients(id: string): Promise<Recipe & { ingredients: RecipeIngredient[] } | undefined> {
    const recipe = await this.getRecipe(id);
    if (!recipe) return undefined;
    
    const ingredientsList = await this.getRecipeIngredients(id);
    return { ...recipe, ingredients: ingredientsList };
  }

  async createRecipeIngredient(recipeIngredient: InsertRecipeIngredient): Promise<RecipeIngredient> {
    const [newRecipeIngredient] = await db
      .insert(recipeIngredients)
      .values(recipeIngredient)
      .returning();
    return newRecipeIngredient;
  }

  async getRecipeIngredients(recipeId: string): Promise<RecipeIngredient[]> {
    return await db
      .select()
      .from(recipeIngredients)
      .where(eq(recipeIngredients.recipeId, recipeId));
  }

  async createCookingHistory(history: InsertCookingHistory): Promise<CookingHistory> {
    const [newHistory] = await db
      .insert(cookingHistory)
      .values(history)
      .returning();
    return newHistory;
  }

  async getCookingHistory(): Promise<CookingHistory[]> {
    return await db.select().from(cookingHistory).orderBy(desc(cookingHistory.cookedAt));
  }
}

export const storage = new DatabaseStorage();
