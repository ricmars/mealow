import { sql } from "drizzle-orm";
import { pgTable, text, varchar, timestamp, integer, decimal, boolean } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const ingredients = pgTable("ingredients", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  quantity: text("quantity").notNull(),
  category: text("category").notNull(),
  purchaseDate: timestamp("purchase_date").notNull().defaultNow(),
  expirationDate: timestamp("expiration_date"),
  isLowStock: boolean("is_low_stock").default(false),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const recipes = pgTable("recipes", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  description: text("description"),
  servingSize: integer("serving_size").notNull(),
  cookingTime: integer("cooking_time"), // in minutes
  difficulty: text("difficulty").notNull(), // Easy, Medium, Hard
  instructions: text("instructions").notNull(), // JSON string of steps
  imageData: text("image_data"), // Store image as base64 encoded string
  imageMimeType: text("image_mime_type"), // Store MIME type for proper handling
  matchPercentage: integer("match_percentage"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const recipeIngredients = pgTable("recipe_ingredients", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  recipeId: varchar("recipe_id").notNull().references(() => recipes.id),
  ingredientName: text("ingredient_name").notNull(),
  requiredQuantity: text("required_quantity").notNull(),
  available: boolean("available").default(false),
});

export const cookingHistory = pgTable("cooking_history", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  recipeId: varchar("recipe_id").notNull().references(() => recipes.id),
  cookedAt: timestamp("cooked_at").notNull().defaultNow(),
  ingredientsUsed: text("ingredients_used").notNull(), // JSON string
});

export const ingredientsRelations = relations(ingredients, ({ many }) => ({
  recipeIngredients: many(recipeIngredients),
}));

export const recipesRelations = relations(recipes, ({ many }) => ({
  recipeIngredients: many(recipeIngredients),
  cookingHistory: many(cookingHistory),
}));

export const recipeIngredientsRelations = relations(recipeIngredients, ({ one }) => ({
  recipe: one(recipes, {
    fields: [recipeIngredients.recipeId],
    references: [recipes.id],
  }),
}));

export const cookingHistoryRelations = relations(cookingHistory, ({ one }) => ({
  recipe: one(recipes, {
    fields: [cookingHistory.recipeId],
    references: [recipes.id],
  }),
}));

export const insertIngredientSchema = createInsertSchema(ingredients).omit({
  id: true,
  createdAt: true,
});

export const insertRecipeSchema = createInsertSchema(recipes).omit({
  id: true,
  createdAt: true,
});

export const insertRecipeIngredientSchema = createInsertSchema(recipeIngredients).omit({
  id: true,
});

export const insertCookingHistorySchema = createInsertSchema(cookingHistory).omit({
  id: true,
  cookedAt: true,
});

export type InsertIngredient = z.infer<typeof insertIngredientSchema>;
export type InsertRecipe = z.infer<typeof insertRecipeSchema>;
export type InsertRecipeIngredient = z.infer<typeof insertRecipeIngredientSchema>;
export type InsertCookingHistory = z.infer<typeof insertCookingHistorySchema>;

export type Ingredient = typeof ingredients.$inferSelect;
export type Recipe = typeof recipes.$inferSelect;
export type RecipeIngredient = typeof recipeIngredients.$inferSelect;
export type CookingHistory = typeof cookingHistory.$inferSelect;
