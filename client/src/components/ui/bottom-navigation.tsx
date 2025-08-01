import { Link, useLocation } from "wouter";
import { Home, Package, BookOpen, User } from "lucide-react";
import { cn } from "@/lib/utils";

export default function BottomNavigation() {
  const [location] = useLocation();

  const navItems = [
    { path: "/", icon: Home, label: "Home" },
    { path: "/inventory", icon: Package, label: "Inventory" },
    { path: "/recipes", icon: BookOpen, label: "Recipes" },
    { path: "/profile", icon: User, label: "Profile" },
  ];

  return (
    <nav className="fixed bottom-0 left-1/2 transform -translate-x-1/2 w-full max-w-md bg-white border-t border-gray-200">
      <div className="flex justify-around py-2">
        {navItems.map((item) => {
          const isActive = location === item.path;
          return (
            <Link key={item.path} href={item.path}>
              <button
                className={cn(
                  "flex flex-col items-center py-2 px-4 transition-colors",
                  isActive
                    ? "text-primary"
                    : "text-gray-500 hover:text-primary"
                )}
              >
                <item.icon className="text-lg mb-1" size={20} />
                <span className={cn("text-xs", isActive && "font-medium")}>
                  {item.label}
                </span>
              </button>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
