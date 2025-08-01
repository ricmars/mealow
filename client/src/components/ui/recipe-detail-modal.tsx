import { useState } from "react";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { X, Clock, Users, BarChart3, Check, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

interface RecipeDetailModalProps {
  recipeId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface RecipeDetails {
  id: string;
  name: string;
  description: string;
  servingSize: number;
  cookingTime: number;
  difficulty: string;
  instructions: string[];
  imageUrl?: string;
  ingredients: {
    ingredientName: string;
    requiredQuantity: string;
    available: boolean;
  }[];
}

export default function RecipeDetailModal({ 
  recipeId, 
  open, 
  onOpenChange 
}: RecipeDetailModalProps) {
  const [cookingMode, setCookingMode] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: recipe, isLoading } = useQuery<RecipeDetails>({
    queryKey: ["/api/recipes", recipeId],
    enabled: !!recipeId && open,
  });

  const cookRecipeMutation = useMutation({
    mutationFn: async () => {
      if (!recipeId) throw new Error("No recipe selected");
      return apiRequest("POST", `/api/recipes/${recipeId}/cook`, {});
    },
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: ["/api/ingredients"] });
      queryClient.invalidateQueries({ queryKey: ["/api/stats"] });
      
      toast({
        title: "Recipe Completed!",
        description: "Your inventory has been updated.",
      });
      
      onOpenChange(false);
      setCookingMode(false);
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to complete recipe. Please try again.",
        variant: "destructive",
      });
    },
  });

  const getDifficultyIcon = (difficulty: string) => {
    switch (difficulty.toLowerCase()) {
      case "easy":
        return <BarChart3 size={14} className="text-green-600" />;
      case "medium":
        return <BarChart3 size={14} className="text-yellow-600" />;
      case "hard":
        return <BarChart3 size={14} className="text-red-600" />;
      default:
        return <BarChart3 size={14} className="text-gray-600" />;
    }
  };

  if (!open) return null;

  if (!recipe || isLoading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl max-w-md w-full p-6 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
          <p className="text-gray-500">Loading recipe...</p>
        </div>
      </div>
    );
  }

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onOpenChange(false);
        }
      }}
    >
      <div className="bg-white rounded-2xl max-w-md w-full max-h-[90vh] flex flex-col overflow-hidden">
        {/* Recipe Header - Fixed */}
        <div className="relative flex-shrink-0">
          {recipe.imageUrl ? (
            <img 
              src={recipe.imageUrl} 
              alt={recipe.name}
              className="w-full h-32 object-cover"
            />
          ) : (
            <div className="w-full h-32 bg-gradient-to-r from-primary/20 to-secondary/20 flex items-center justify-center">
              <div className="text-center">
                <BarChart3 size={32} className="text-primary mx-auto mb-1" />
                <p className="text-gray-600 text-sm">{recipe.name}</p>
              </div>
            </div>
          )}
          <Button
            variant="secondary"
            size="sm"
            className="absolute top-2 right-2 w-8 h-8 rounded-full z-10"
            onClick={() => onOpenChange(false)}
          >
            <X size={14} />
          </Button>
        </div>

        {/* Recipe Content - Scrollable */}
        <div className="flex-1 overflow-y-auto min-h-0">
          <div className="p-4 space-y-4">
            <div className="space-y-2">
              <h2 className="text-lg font-bold text-gray-900">{recipe.name}</h2>
              <div className="flex items-center space-x-3 text-xs text-gray-500">
                <div className="flex items-center gap-1">
                  <Clock size={14} />
                  <span>{recipe.cookingTime} min</span>
                </div>
                <div className="flex items-center gap-1">
                  <Users size={14} />
                  <span>{recipe.servingSize} servings</span>
                </div>
                <div className="flex items-center gap-1">
                  {getDifficultyIcon(recipe.difficulty)}
                  <span>{recipe.difficulty}</span>
                </div>
              </div>
            </div>

            {recipe.description && (
              <p className="text-gray-600 text-sm">{recipe.description}</p>
            )}

            {/* Ingredients Needed */}
            <div>
              <h3 className="font-semibold text-gray-900 mb-2">Ingredients Needed</h3>
              <div className="space-y-2">
                {recipe.ingredients.map((ingredient, index) => (
                  <div
                    key={index}
                    className={cn(
                      "flex justify-between items-center p-2 rounded-lg",
                      ingredient.available ? "bg-green-50" : "bg-red-50"
                    )}
                  >
                    <span className="text-sm">{ingredient.ingredientName}</span>
                    <div className="flex items-center space-x-2">
                      <div className="flex items-center gap-1">
                        {ingredient.available ? (
                          <>
                            <Check size={12} className="text-green-600" />
                            <span className="text-xs text-green-600">Available</span>
                          </>
                        ) : (
                          <>
                            <AlertCircle size={12} className="text-red-600" />
                            <span className="text-xs text-red-600">Missing</span>
                          </>
                        )}
                      </div>
                      <span className="text-sm font-medium">{ingredient.requiredQuantity}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Cooking Instructions */}
            <div>
              <h3 className="font-semibold text-gray-900 mb-2">Instructions</h3>
              <div className="space-y-2">
                {recipe.instructions.map((step, index) => (
                  <div key={index} className="flex space-x-2">
                    <div className="w-5 h-5 bg-primary text-white rounded-full flex items-center justify-center text-xs font-medium flex-shrink-0 mt-0.5">
                      {index + 1}
                    </div>
                    <p className="text-sm text-gray-700 leading-relaxed">{step}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons - Fixed */}
        <div className="border-t border-gray-200 p-4 flex-shrink-0">
          {!cookingMode ? (
            <div className="flex space-x-2">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => onOpenChange(false)}
              >
                Close
              </Button>
              <Button
                className="flex-1 bg-primary hover:bg-primary/90"
                onClick={() => setCookingMode(true)}
              >
                Cook This Recipe
              </Button>
            </div>
          ) : (
            <div className="flex space-x-2">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => setCookingMode(false)}
              >
                Cancel
              </Button>
              <Button
                className="flex-1 bg-green-600 hover:bg-green-700"
                onClick={() => cookRecipeMutation.mutate()}
                disabled={cookRecipeMutation.isPending}
              >
                {cookRecipeMutation.isPending ? "Completing..." : "Complete"}
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}