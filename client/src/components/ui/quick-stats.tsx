import { useQuery } from "@tanstack/react-query";

interface Stats {
  totalItems: number;
  expiringItems: number;
  suggestedRecipes: number;
}

export default function QuickStats() {
  const { data: stats, isLoading } = useQuery<Stats>({
    queryKey: ["/api/stats"],
  });

  if (isLoading) {
    return (
      <div className="p-4 stats-gradient">
        <div className="grid grid-cols-3 gap-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-white p-3 rounded-xl shadow-sm text-center">
              <div className="h-8 bg-gray-200 rounded animate-pulse mb-1"></div>
              <div className="h-3 bg-gray-200 rounded animate-pulse"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 stats-gradient">
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-white p-3 rounded-xl shadow-sm text-center">
          <div className="text-2xl font-bold text-primary">
            {stats?.totalItems || 0}
          </div>
          <div className="text-xs text-gray-500">Items</div>
        </div>
        <div className="bg-white p-3 rounded-xl shadow-sm text-center">
          <div className="text-2xl font-bold text-yellow-600">
            {stats?.expiringItems || 0}
          </div>
          <div className="text-xs text-gray-500">Expiring</div>
        </div>
        <div className="bg-white p-3 rounded-xl shadow-sm text-center">
          <div className="text-2xl font-bold text-secondary">
            {stats?.suggestedRecipes || 0}
          </div>
          <div className="text-xs text-gray-500">Recipes</div>
        </div>
      </div>
    </div>
  );
}
