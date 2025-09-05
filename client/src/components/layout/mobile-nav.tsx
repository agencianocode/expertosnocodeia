import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";
import { 
  Home, 
  BookOpen, 
  FileText, 
  Calendar, 
  User
} from "lucide-react";

export default function MobileNav() {
  const [location] = useLocation();

  const navigation = [
    { name: "Hogar", href: "/", icon: Home },
    { name: "Cursos", href: "/courses", icon: BookOpen },
    { name: "Guías", href: "/guides", icon: FileText },
    { name: "Talleres", href: "/workshops", icon: Calendar },
    { name: "Más", href: "/profile", icon: User },
  ];

  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-[#262626] border-t border-dark-border z-50">
      <div className="flex justify-around items-center py-2">
        {navigation.map((item) => {
          const isActive = location === item.href;
          return (
            <Link key={item.name} href={item.href}>
              <div
                className={cn(
                  "flex flex-col items-center justify-center p-3 rounded-lg transition-colors",
                  isActive
                    ? "text-purple-accent"
                    : "text-gray-400"
                )}
              >
                <item.icon className="h-5 w-5 mb-1" />
                <span className="text-xs font-medium">{item.name}</span>
              </div>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}