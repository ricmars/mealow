import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertIngredientSchema, insertCookingHistorySchema } from "@shared/schema";
import { generateRecipeSuggestions, optimizeInventoryUsage, generateRecipeImage } from "./services/openai";
import { z } from "zod";

export async function registerRoutes(app: Express): Promise<Server> {
  // Ingredients routes
  app.get("/api/ingredients", async (req, res) => {
    try {
      const ingredients = await storage.getIngredients();
      res.json(ingredients);
    } catch (error) {
      console.error("Error fetching ingredients:", error);
      res.status(500).json({ error: "Failed to fetch ingredients" });
    }
  });

  app.post("/api/ingredients", async (req, res) => {
    try {
      const validatedData = insertIngredientSchema.parse(req.body);
      const ingredient = await storage.createIngredient(validatedData);
      res.json(ingredient);
    } catch (error) {
      console.error("Error creating ingredient:", error);
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: "Invalid ingredient data", details: error.errors });
      } else {
        res.status(500).json({ error: "Failed to create ingredient" });
      }
    }
  });

  app.patch("/api/ingredients/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const updates = req.body;
      const ingredient = await storage.updateIngredient(id, updates);
      res.json(ingredient);
    } catch (error) {
      console.error("Error updating ingredient:", error);
      res.status(500).json({ error: "Failed to update ingredient" });
    }
  });

  app.delete("/api/ingredients/:id", async (req, res) => {
    try {
      const { id } = req.params;
      await storage.deleteIngredient(id);
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting ingredient:", error);
      res.status(500).json({ error: "Failed to delete ingredient" });
    }
  });

  // Recipe suggestions route
  app.post("/api/recipes/suggest", async (req, res) => {
    try {
      const { servingSize = 2 } = req.body;
      const ingredients = await storage.getIngredients();
      
      if (ingredients.length === 0) {
        return res.json([]);
      }

      const availableIngredients = ingredients.map(ing => ({
        name: ing.name,
        quantity: ing.quantity
      }));

      const suggestions = await generateRecipeSuggestions(availableIngredients, servingSize);
      
      // Store suggestions in database
      const savedRecipes = [];
      for (const suggestion of suggestions) {
        const recipe = await storage.createRecipe({
          name: suggestion.name,
          description: suggestion.description,
          servingSize: suggestion.servingSize,
          cookingTime: suggestion.cookingTime,
          difficulty: suggestion.difficulty,
          instructions: JSON.stringify(suggestion.instructions),
          matchPercentage: suggestion.matchPercentage,
          imageUrl: suggestion.imageUrl
        });

        // Store recipe ingredients
        for (const ingredient of suggestion.requiredIngredients) {
          await storage.createRecipeIngredient({
            recipeId: recipe.id,
            ingredientName: ingredient.name,
            requiredQuantity: ingredient.quantity,
            available: ingredient.available
          });
        }

        savedRecipes.push({
          ...recipe,
          ingredients: suggestion.requiredIngredients,
          instructions: suggestion.instructions
        });
      }

      res.json(savedRecipes);
    } catch (error) {
      console.error("Error generating recipe suggestions:", error);
      res.status(500).json({ error: "Failed to generate recipe suggestions" });
    }
  });

  // Get all recipes route
  app.get("/api/recipes", async (req, res) => {
    try {
      const recipes = await storage.getRecipes();
      
      // For each recipe, get its ingredients and parse instructions
      const recipesWithDetails = await Promise.all(
        recipes.map(async (recipe) => {
          const ingredients = await storage.getRecipeIngredients(recipe.id);
          return {
            ...recipe,
            instructions: JSON.parse(recipe.instructions),
            ingredients: ingredients
          };
        })
      );
      
      res.json(recipesWithDetails);
    } catch (error) {
      console.error("Error fetching recipes:", error);
      res.status(500).json({ error: "Failed to fetch recipes" });
    }
  });

  // Get recipe with ingredients (with real-time availability check)
  app.get("/api/recipes/:id", async (req, res) => {
    try {
      const { id } = req.params;
      console.log("Fetching recipe with ID:", id);
      const recipe = await storage.getRecipeWithIngredients(id);
      
      if (!recipe) {
        console.log("Recipe not found for ID:", id);
        return res.status(404).json({ error: "Recipe not found" });
      }
      
      console.log("Recipe found:", recipe.name);

      // Get current ingredient availability for real-time validation
      const currentIngredients = await storage.getIngredients();
      
      // Update ingredient availability based on current fridge contents
      const updatedIngredients = recipe.ingredients.map(recipeIngredient => {
        const currentIngredient = currentIngredients.find(
          ing => ing.name.toLowerCase() === recipeIngredient.ingredientName.toLowerCase()
        );
        
        return {
          ...recipeIngredient,
          available: !!currentIngredient // Update availability based on current fridge contents
        };
      });

      res.json({
        ...recipe,
        instructions: JSON.parse(recipe.instructions),
        ingredients: updatedIngredients
      });
    } catch (error) {
      console.error("Error fetching recipe:", error);
      res.status(500).json({ error: "Failed to fetch recipe" });
    }
  });

  // Generate image for existing recipe
  app.post("/api/recipes/:id/generate-image", async (req, res) => {
    try {
      const { id } = req.params;
      const recipe = await storage.getRecipe(id);
      
      if (!recipe) {
        return res.status(404).json({ error: "Recipe not found" });
      }

      // Generate image using OpenAI
      const imageUrl = await generateRecipeImage(recipe.name, recipe.description || "");
      
      if (imageUrl) {
        // Update recipe with new image URL
        await storage.updateRecipe(id, { imageUrl });
        
        res.json({ 
          success: true, 
          imageUrl,
          message: "Image generated successfully!" 
        });
      } else {
        res.status(500).json({ error: "Failed to generate image" });
      }
    } catch (error) {
      console.error("Error generating recipe image:", error);
      res.status(500).json({ error: "Failed to generate image" });
    }
  });

  // Cook recipe and update inventory
  app.post("/api/recipes/:id/cook", async (req, res) => {
    try {
      const { id } = req.params;
      const recipe = await storage.getRecipeWithIngredients(id);
      
      if (!recipe) {
        return res.status(404).json({ error: "Recipe not found" });
      }

      const ingredientsUsed: { name: string; quantityUsed: string }[] = [];
      const currentIngredients = await storage.getIngredients();

      // Update inventory by reducing used ingredients
      for (const recipeIngredient of recipe.ingredients) {
        if (recipeIngredient.available) {
          const currentIngredient = currentIngredients.find(
            ing => ing.name.toLowerCase() === recipeIngredient.ingredientName.toLowerCase()
          );

          if (currentIngredient) {
            // For simplicity, we'll mark as used and potentially reduce quantity
            // In a real app, you'd implement proper quantity parsing and reduction
            ingredientsUsed.push({
              name: recipeIngredient.ingredientName,
              quantityUsed: recipeIngredient.requiredQuantity
            });

            // Update ingredient to mark as low stock or delete if fully used
            await storage.updateIngredient(currentIngredient.id, {
              isLowStock: true
            });
          }
        }
      }

      // Record cooking history
      await storage.createCookingHistory({
        recipeId: id,
        ingredientsUsed: JSON.stringify(ingredientsUsed)
      });

      // Get optimization suggestions
      const remainingIngredients = currentIngredients
        .filter(ing => !ingredientsUsed.some(used => 
          used.name.toLowerCase() === ing.name.toLowerCase()
        ))
        .map(ing => ({ name: ing.name, quantity: ing.quantity }));

      const optimization = await optimizeInventoryUsage(ingredientsUsed, remainingIngredients);

      res.json({
        success: true,
        message: "Recipe cooked successfully!",
        ingredientsUsed,
        optimization
      });
    } catch (error) {
      console.error("Error cooking recipe:", error);
      res.status(500).json({ error: "Failed to cook recipe" });
    }
  });

  // Get inventory stats
  app.get("/api/stats", async (req, res) => {
    try {
      const ingredients = await storage.getIngredients();
      const expiringIngredients = await storage.getExpiringIngredients(3); // next 3 days
      const recentRecipes = await storage.getRecipes();

      const stats = {
        totalItems: ingredients.length,
        expiringItems: expiringIngredients.length,
        suggestedRecipes: recentRecipes.length
      };

      res.json(stats);
    } catch (error) {
      console.error("Error fetching stats:", error);
      res.status(500).json({ error: "Failed to fetch stats" });
    }
  });

  // Get expiring ingredients
  app.get("/api/ingredients/expiring", async (req, res) => {
    try {
      const days = parseInt(req.query.days as string) || 7;
      const expiringIngredients = await storage.getExpiringIngredients(days);
      res.json(expiringIngredients);
    } catch (error) {
      console.error("Error fetching expiring ingredients:", error);
      res.status(500).json({ error: "Failed to fetch expiring ingredients" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
