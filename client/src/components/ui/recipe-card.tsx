import { Clock, Users, BarChart3 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface RecipeCardProps {
  recipe: {
    id: string;
    name: string;
    description: string;
    servingSize: number;
    cookingTime: number;
    difficulty: string;
    matchPercentage: number;
    imageUrl?: string;
  };
  onCook: () => void;
  onViewDetails: () => void;
}

export default function RecipeCard({ recipe, onCook, onViewDetails }: RecipeCardProps) {
  const getMatchBadgeStyle = (percentage: number) => {
    if (percentage >= 80) return "high-match";
    if (percentage >= 60) return "medium-match";
    return "low-match";
  };

  const getDifficultyIcon = (difficulty: string) => {
    const bars = difficulty === "Easy" ? 1 : difficulty === "Medium" ? 2 : 3;
    return (
      <div className="flex gap-1">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className={cn(
              "w-1 h-3 rounded",
              i <= bars ? "bg-gray-600" : "bg-gray-300"
            )}
          />
        ))}
      </div>
    );
  };

  return (
    <div className="recipe-card">
      {recipe.imageUrl && (
        <img 
          src={recipe.imageUrl} 
          alt={recipe.name}
          className="w-full h-32 object-cover"
        />
      )}
      <div className="p-4">
        <div className="flex justify-between items-start mb-2">
          <h3 className="font-semibold text-gray-900 flex-1 pr-2">{recipe.name}</h3>
          <div className={cn("match-badge", getMatchBadgeStyle(recipe.matchPercentage))}>
            {recipe.matchPercentage}% Match
          </div>
        </div>
        
        <p className="text-sm text-gray-600 mb-3 line-clamp-2">{recipe.description}</p>
        
        <div className="flex justify-between items-center text-xs text-gray-500 mb-3">
          <div className="flex items-center gap-1">
            <Clock size={12} />
            <span>{recipe.cookingTime} min</span>
          </div>
          <div className="flex items-center gap-1">
            {getDifficultyIcon(recipe.difficulty)}
            <span>{recipe.difficulty}</span>
          </div>
          <div className="flex items-center gap-1">
            <Users size={12} />
            <span>{recipe.servingSize} servings</span>
          </div>
        </div>
        
        <div className="flex space-x-2">
          <Button 
            onClick={onCook}
            className="flex-1 bg-primary hover:bg-primary/90 text-white"
          >
            Cook This
          </Button>
          <Button 
            onClick={onViewDetails}
            variant="outline" 
            className="px-4"
          >
            Details
          </Button>
        </div>
      </div>
    </div>
  );
}
