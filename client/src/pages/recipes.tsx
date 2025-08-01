import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ChefHat, Clock, Users, BarChart3, History } from "lucide-react";
import { Button } from "@/components/ui/button";
import RecipeCard from "@/components/ui/recipe-card";
import RecipeDetailModal from "@/components/ui/recipe-detail-modal";
import BottomNavigation from "@/components/ui/bottom-navigation";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

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

interface CookingHistoryItem {
  id: string;
  recipeId: string;
  cookedAt: string;
  ingredientsUsed: string;
  recipe?: {
    name: string;
    difficulty: string;
    cookingTime: number;
  };
}

export default function Recipes() {
  const [selectedRecipeId, setSelectedRecipeId] = useState<string | null>(null);

  const { data: suggestedRecipes } = useQuery<Recipe[]>({
    queryKey: ["/api/recipes/suggested"],
    enabled: false,
  });

  const { data: cookingHistory } = useQuery<CookingHistoryItem[]>({
    queryKey: ["/api/cooking-history"],
    enabled: false, // This would be enabled when we have the endpoint
  });

  const handleCookRecipe = (recipeId: string) => {
    setSelectedRecipeId(recipeId);
  };

  const handleViewRecipeDetails = (recipeId: string) => {
    setSelectedRecipeId(recipeId);
  };

  return (
    <div className="app-container">
      {/* Header */}
      <header className="header-gradient text-white p-4 rounded-b-lg shadow-md">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center">
            <ChefHat className="text-primary" size={20} />
          </div>
          <div>
            <h1 className="text-xl font-bold">Recipes</h1>
            <p className="text-green-100 text-sm">Discover delicious meals</p>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="p-4 pb-24">
        <Tabs defaultValue="suggested" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="suggested">Suggested</TabsTrigger>
            <TabsTrigger value="history">History</TabsTrigger>
          </TabsList>

          <TabsContent value="suggested" className="space-y-4 mt-4">
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
              <div className="text-center py-12 text-gray-500">
                <div className="w-24 h-24 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
                  <ChefHat size={32} className="text-gray-400" />
                </div>
                <h3 className="text-lg font-medium mb-2">No recipes yet</h3>
                <p className="text-sm mb-4">
                  Add ingredients to your fridge and get personalized recipe suggestions.
                </p>
                <Button>Go to Home</Button>
              </div>
            )}
          </TabsContent>

          <TabsContent value="history" className="space-y-4 mt-4">
            {cookingHistory && cookingHistory.length > 0 ? (
              <div className="space-y-3">
                {cookingHistory.map((item) => (
                  <Card key={item.id}>
                    <CardContent className="p-4">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <h3 className="font-medium text-gray-900">
                            {item.recipe?.name || "Unknown Recipe"}
                          </h3>
                          <p className="text-sm text-gray-500 mt-1">
                            Cooked on {new Date(item.cookedAt).toLocaleDateString()}
                          </p>
                          <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                            <span className="flex items-center gap-1">
                              <Clock size={12} />
                              {item.recipe?.cookingTime || 0} min
                            </span>
                            <span className="flex items-center gap-1">
                              <BarChart3 size={12} />
                              {item.recipe?.difficulty || "Unknown"}
                            </span>
                          </div>
                        </div>
                        <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                          <History className="text-orange-600" size={20} />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 text-gray-500">
                <div className="w-24 h-24 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
                  <History size={32} className="text-gray-400" />
                </div>
                <h3 className="text-lg font-medium mb-2">No cooking history</h3>
                <p className="text-sm">
                  Your cooked recipes will appear here.
                </p>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </main>

      {/* Recipe Detail Modal */}
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
