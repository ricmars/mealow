import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Search, Filter, Trash2, Edit3 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import InventoryItem from "@/components/ui/inventory-item";
import AddItemModal from "@/components/ui/add-item-modal";
import BottomNavigation from "@/components/ui/bottom-navigation";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
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

export default function Inventory() {
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [sortBy, setSortBy] = useState("name");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: ingredients, isLoading } = useQuery<Ingredient[]>({
    queryKey: ["/api/ingredients"],
  });

  const deleteIngredientMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/ingredients/${id}`, {});
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/ingredients"] });
      queryClient.invalidateQueries({ queryKey: ["/api/stats"] });
      queryClient.invalidateQueries({ queryKey: ["/api/recipes/suggested"] });
      toast({
        title: "Item Deleted",
        description: "Item has been removed from your fridge.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to delete item. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Filter and sort ingredients
  const filteredIngredients = ingredients?.filter((ingredient) => {
    const matchesSearch = ingredient.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = categoryFilter === "all" || ingredient.category.toLowerCase() === categoryFilter.toLowerCase();
    return matchesSearch && matchesCategory;
  }).sort((a, b) => {
    switch (sortBy) {
      case "name":
        return a.name.localeCompare(b.name);
      case "category":
        return a.category.localeCompare(b.category);
      case "expiration":
        if (!a.expirationDate) return 1;
        if (!b.expirationDate) return -1;
        return new Date(a.expirationDate).getTime() - new Date(b.expirationDate).getTime();
      default:
        return 0;
    }
  }) || [];

  const categories = Array.from(new Set(ingredients?.map(i => i.category) || []));

  const handleDeleteItem = (id: string) => {
    if (window.confirm("Are you sure you want to delete this item?")) {
      deleteIngredientMutation.mutate(id);
    }
  };

  return (
    <div className="app-container">
      {/* Header */}
      <header className="header-gradient text-white p-4 rounded-b-lg shadow-md">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold">Inventory</h1>
            <p className="text-green-100 text-sm">
              {filteredIngredients.length} items in your fridge
            </p>
          </div>
          <Button
            onClick={() => setIsAddModalOpen(true)}
            size="sm"
            className="bg-white/20 hover:bg-white/30 text-white border-white/30"
          >
            <Plus size={16} className="mr-1" />
            Add
          </Button>
        </div>
      </header>

      {/* Search and Filters */}
      <div className="p-4 bg-gray-50 space-y-3">
        <div className="relative">
          <Search size={20} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          <Input
            placeholder="Search ingredients..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>

        <div className="flex gap-2">
          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="flex-1">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              {categories.map((category) => (
                <SelectItem key={category} value={category.toLowerCase()}>
                  {category}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="flex-1">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="name">Sort by Name</SelectItem>
              <SelectItem value="category">Sort by Category</SelectItem>
              <SelectItem value="expiration">Sort by Expiration</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Inventory List */}
      <main className="p-4 pb-24 space-y-3">
        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="bg-gray-200 h-20 rounded-lg animate-pulse" />
            ))}
          </div>
        ) : filteredIngredients.length > 0 ? (
          filteredIngredients.map((ingredient) => (
            <div key={ingredient.id} className="relative group">
              <InventoryItem ingredient={ingredient} />
              <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={() => handleDeleteItem(ingredient.id)}
                  disabled={deleteIngredientMutation.isPending}
                  className="w-8 h-8 p-0"
                >
                  <Trash2 size={14} />
                </Button>
              </div>
            </div>
          ))
        ) : (
          <div className="text-center py-12 text-gray-500">
            <div className="w-24 h-24 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
              <Search size={32} className="text-gray-400" />
            </div>
            <h3 className="text-lg font-medium mb-2">No items found</h3>
            <p className="text-sm mb-4">
              {searchTerm || categoryFilter !== "all" 
                ? "Try adjusting your search or filters"
                : "Your fridge is empty. Add some ingredients to get started!"
              }
            </p>
            <Button onClick={() => setIsAddModalOpen(true)}>
              <Plus size={16} className="mr-1" />
              Add First Item
            </Button>
          </div>
        )}
      </main>

      {/* Add Item Modal */}
      <AddItemModal
        open={isAddModalOpen}
        onOpenChange={setIsAddModalOpen}
      />

      {/* Bottom Navigation */}
      <BottomNavigation />
    </div>
  );
}
