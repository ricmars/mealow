import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Plus, Sparkles, Bell, Camera } from "lucide-react";
import { Button } from "@/components/ui/button";
import QuickStats from "@/components/ui/quick-stats";
import InventoryItem from "@/components/ui/inventory-item";
import RecipeCard from "@/components/ui/recipe-card";
import AddItemModal from "@/components/ui/add-item-modal";
import RecipeDetailModal from "@/components/ui/recipe-detail-modal";
import BottomNavigation from "@/components/ui/bottom-navigation";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface Ingredient {
  id: string;
  name: string;
  quantity: string;
  category: string;
  expirationDate?: string;
  isLowStock?: boolean;
}

interface Recipe {
  id: string;
  name: string;
  description: string;
  servingSize: number;
  cookingTime: number;
  difficulty: string;
  matchPercentage: number;
  imageUrl?: string;
  instructions: string[];
  ingredients: {
    ingredientName: string;
    requiredQuantity: string;
    available: boolean;
  }[];
}

export default function Home() {
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedRecipeId, setSelectedRecipeId] = useState<string | null>(null);
  const [servingSize, setServingSize] = useState("2");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: ingredients, isLoading: ingredientsLoading } = useQuery<Ingredient[]>({
    queryKey: ["/api/ingredients"],
  });

  const suggestRecipesMutation = useMutation({
    mutationFn: async (servingSize: number) => {
      const response = await apiRequest("POST", "/api/recipes/suggest", { servingSize });
      return response.json();
    },
    onSuccess: (recipes) => {
      queryClient.setQueryData(["/api/recipes/suggested"], recipes);
      toast({
        title: "Recipes Suggested!",
        description: `Found ${recipes.length} recipes for you.`,
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to get recipe suggestions. Please try again.",
        variant: "destructive",
      });
    },
  });

  const { data: suggestedRecipes } = useQuery<Recipe[]>({
    queryKey: ["/api/recipes/suggested"],
    enabled: false,
  });

  const handleSuggestMeals = () => {
    suggestRecipesMutation.mutate(parseInt(servingSize));
  };

  const handleCookRecipe = (recipeId: string) => {
    setSelectedRecipeId(recipeId);
  };

  const handleViewRecipeDetails = (recipeId: string) => {
    setSelectedRecipeId(recipeId);
  };

  // Get featured ingredients (first 3, prioritizing expiring ones)
  const featuredIngredients = ingredients?.slice(0, 3) || [];

  return (
    <div className="app-container">
      {/* Header */}
      <header className="header-gradient text-white p-4 rounded-b-lg shadow-md">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center">
              <span className="text-primary text-lg">🍽️</span>
            </div>
            <div>
              <h1 className="text-xl font-bold">MeaLow</h1>
              <p className="text-green-100 text-sm">Smart Fridge Manager</p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="text-white hover:bg-white/20"
          >
            <Bell size={20} />
          </Button>
        </div>
      </header>

      {/* Quick Stats */}
      <QuickStats />

      {/* Main Content */}
      <main className="p-4 pb-24">
        {/* Quick Actions */}
        <section className="mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-3">Quick Actions</h2>
          <div className="grid grid-cols-2 gap-3">
            <Button
              onClick={() => setIsAddModalOpen(true)}
              className="bg-primary hover:bg-primary/90 text-white p-4 h-auto flex flex-col items-center space-y-2 rounded-xl shadow-md"
            >
              <Plus size={24} />
              <span className="font-medium">Add Item</span>
            </Button>
            <Button
              onClick={handleSuggestMeals}
              disabled={suggestRecipesMutation.isPending || !ingredients?.length}
              className="bg-secondary hover:bg-secondary/90 text-white p-4 h-auto flex flex-col items-center space-y-2 rounded-xl shadow-md"
            >
              <Sparkles size={24} />
              <span className="font-medium">
                {suggestRecipesMutation.isPending ? "Loading..." : "Get Recipes"}
              </span>
            </Button>
          </div>
        </section>

        {/* Inventory Overview */}
        <section className="mb-6">
          <div className="flex justify-between items-center mb-3">
            <h2 className="text-lg font-semibold text-gray-900">Your Fridge</h2>
            <Button
              variant="ghost"
              size="sm"
              className="text-primary text-sm font-medium"
            >
              View All
            </Button>
          </div>

          {ingredientsLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="bg-gray-200 h-20 rounded-lg animate-pulse" />
              ))}
            </div>
          ) : featuredIngredients.length > 0 ? (
            <div className="space-y-3">
              {featuredIngredients.map((ingredient) => (
                <InventoryItem key={ingredient.id} ingredient={ingredient} />
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <p>Your fridge is empty. Add some ingredients to get started!</p>
            </div>
          )}
        </section>

        {/* Recipe Suggestions */}
        <section className="mb-6">
          <div className="flex justify-between items-center mb-3">
            <h2 className="text-lg font-semibold text-gray-900">Suggested Recipes</h2>
            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-500">For</span>
              <Select value={servingSize} onValueChange={setServingSize}>
                <SelectTrigger className="w-20 h-8">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">1</SelectItem>
                  <SelectItem value="2">2</SelectItem>
                  <SelectItem value="4">4</SelectItem>
                  <SelectItem value="6">6</SelectItem>
                </SelectContent>
              </Select>
              <span className="text-sm text-gray-500">people</span>
            </div>
          </div>

          {suggestedRecipes && suggestedRecipes.length > 0 ? (
            <div className="space-y-4">
              {suggestedRecipes.map((recipe) => (
                <RecipeCard
                  key={recipe.id}
                  recipe={recipe}
                  onCook={() => handleCookRecipe(recipe.id)}
                  onViewDetails={() => handleViewRecipeDetails(recipe.id)}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <Sparkles size={48} className="mx-auto mb-4 text-gray-300" />
              <p>Click "Get Recipes" to see personalized meal suggestions!</p>
            </div>
          )}
        </section>
      </main>

      {/* Floating Action Button */}
      <Button
        onClick={() => setIsAddModalOpen(true)}
        className="floating-button"
      >
        <Camera size={20} />
      </Button>

      {/* Modals */}
      <AddItemModal
        open={isAddModalOpen}
        onOpenChange={setIsAddModalOpen}
      />

      <RecipeDetailModal
        recipeId={selectedRecipeId}
        open={!!selectedRecipeId}
        onOpenChange={(open) => !open && setSelectedRecipeId(null)}
      />

      {/* Bottom Navigation */}
      <BottomNavigation />
    </div>
  );
}
