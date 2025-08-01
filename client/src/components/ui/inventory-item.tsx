import { 
  Leaf, 
  Apple, 
  UtensilsCrossed, 
  Milk, 
  Package,
  AlertTriangle,
  Clock
} from "lucide-react";
import { format, isAfter, differenceInDays } from "date-fns";
import { cn } from "@/lib/utils";

interface InventoryItemProps {
  ingredient: {
    id: string;
    name: string;
    quantity: string;
    category: string;
    expirationDate?: string;
    isLowStock?: boolean;
  };
  onClick?: () => void;
}

export default function InventoryItem({ ingredient, onClick }: InventoryItemProps) {
  const getCategoryIcon = (category: string) => {
    switch (category.toLowerCase()) {
      case 'vegetables':
        return <Leaf className="text-green-600" />;
      case 'fruits':
        return <Apple className="text-red-600" />;
      case 'meat':
        return <UtensilsCrossed className="text-orange-600" />;
      case 'dairy':
        return <Milk className="text-blue-600" />;
      default:
        return <Package className="text-purple-600" />;
    }
  };

  const getCategoryStyle = (category: string) => {
    switch (category.toLowerCase()) {
      case 'vegetables':
        return 'category-vegetables';
      case 'fruits':
        return 'category-fruits';
      case 'meat':
        return 'category-meat';
      case 'dairy':
        return 'category-dairy';
      default:
        return 'category-pantry';
    }
  };

  const getExpirationStatus = () => {
    if (!ingredient.expirationDate) return null;
    
    const expirationDate = new Date(ingredient.expirationDate);
    const today = new Date();
    const daysUntilExpiration = differenceInDays(expirationDate, today);
    
    if (daysUntilExpiration < 0) {
      return { type: 'expired', text: 'Expired', class: 'text-red-600' };
    } else if (daysUntilExpiration === 0) {
      return { type: 'today', text: 'Expires today!', class: 'text-red-600' };
    } else if (daysUntilExpiration <= 3) {
      return { type: 'soon', text: `Expires in ${daysUntilExpiration} day${daysUntilExpiration === 1 ? '' : 's'}`, class: 'text-orange-600' };
    } else {
      return { type: 'fresh', text: `Fresh until ${format(expirationDate, 'MMM dd')}`, class: 'text-green-600' };
    }
  };

  const expirationStatus = getExpirationStatus();
  
  const getItemStyle = () => {
    if (expirationStatus?.type === 'expired' || expirationStatus?.type === 'today') {
      return 'expire-warning';
    } else if (ingredient.isLowStock || expirationStatus?.type === 'soon') {
      return 'low-stock-warning';
    }
    return 'fresh-item';
  };

  return (
    <div 
      className={cn("p-3 rounded-lg cursor-pointer hover:shadow-md transition-shadow", getItemStyle())}
      onClick={onClick}
    >
      <div className="flex justify-between items-start">
        <div className="flex-1">
          <h3 className="font-medium text-gray-900">{ingredient.name}</h3>
          <p className="text-sm text-gray-600">{ingredient.quantity}</p>
          
          <div className="flex items-center gap-2 mt-1">
            {expirationStatus && (
              <div className="flex items-center gap-1">
                <Clock size={12} className={expirationStatus.class} />
                <p className={cn("text-xs font-medium", expirationStatus.class)}>
                  {expirationStatus.text}
                </p>
              </div>
            )}
            
            {ingredient.isLowStock && (
              <div className="flex items-center gap-1">
                <AlertTriangle size={12} className="text-yellow-600" />
                <p className="text-xs font-medium text-yellow-600">
                  Running low
                </p>
              </div>
            )}
          </div>
        </div>
        
        <div className={cn("category-icon", getCategoryStyle(ingredient.category))}>
          {getCategoryIcon(ingredient.category)}
        </div>
      </div>
    </div>
  );
}
