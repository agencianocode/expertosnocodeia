import { useState } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import { useSimpleAuth } from "@/hooks/use-simple-auth";
import { useRoleSwitch } from "@/hooks/useRoleSwitch";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import {
  Brain,
  Home,
  BookOpen,
  FileText,
  Calendar,
  CalendarDays,
  Users,
  Star,
  Search,
  Settings,
} from "lucide-react";

export default function CourseSidebar() {
  const [location] = useLocation();
  const { user } = useAuth();
  const { logout } = useSimpleAuth();
  const { isStudentView, toggleView } = useRoleSwitch();
  const [searchQuery, setSearchQuery] = useState("");

  const navigation = [
    { name: "Hogar", href: "/", icon: Home },
    { name: "Cursos", href: "/courses", icon: BookOpen },
    { name: "Guías", href: "/guides", icon: FileText },
    { name: "Talleres", href: "/workshops", icon: Calendar },
    { name: "Eventos", href: "/events", icon: CalendarDays },
    { name: "Comunidad", href: "/community", icon: Users },
    { name: "Beneficios", href: "/perks", icon: Star },
  ];

  const getUserInitials = () => {
    if ((user as any)?.firstName && (user as any)?.lastName) {
      return `${(user as any).firstName[0]}${(user as any).lastName[0]}`.toUpperCase();
    }
    if ((user as any)?.email) {
      return (user as any).email.slice(0, 2).toUpperCase();
    }
    return "User";
  };

  const getUserName = () => {
    if ((user as any)?.firstName && (user as any)?.lastName) {
      return `${(user as any).firstName} ${(user as any).lastName}`;
    }
    if ((user as any)?.email) {
      return (user as any).email.split("@")[0];
    }
    return "User";
  };

  return (
    <aside className="w-[250px] bg-card border-r border-border flex flex-col h-screen fixed left-0 top-0 z-10">
      {/* Logo */}
      <div className="px-4 py-4 border-b border-border">
        <div className="flex items-center space-x-2">
          <div>
            <h1 className="font-satoshi font-bold text-[14px]">
              <span className="bg-gradient-to-r from-purple-accent to-blue-accent bg-clip-text text-transparent font-extrabold">Universidad</span>
              <span className="text-foreground"> Expertos NoCode IA</span>
            </h1>
          </div>
        </div>
      </div>
      {/* Search */}
      <div className="px-4 py-4">
        <div className="relative">
          <Search className="absolute left-3 top-3 text-muted-foreground h-4 w-4" />
          <Input
            type="text"
            placeholder="Buscar"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-background border-border rounded-lg pl-10 pr-12 py-2 font-satoshi text-sm text-muted-foreground focus:outline-none focus:ring-2 focus:ring-purple-accent focus:border-transparent focus:text-foreground"
          />
          <div className="absolute right-3 top-2.5 flex items-center bg-muted rounded px-1">
            <span className="text-xs text-muted-foreground font-satoshi">⌘K</span>
          </div>
        </div>
      </div>
      {/* Navigation */}
      <nav className="flex-1 px-4">
        <ul className="space-y-2">
          {navigation.map((item) => {
            const isActive = location === item.href;
            
            // Special case for Comunidad - open in new tab
            if (item.name === "Comunidad") {
              return (
                <li key={item.name}>
                  <button
                    onClick={() => window.open(item.href, '_blank')}
                    className={cn(
                      "w-full flex items-center space-x-3 p-2 rounded-lg transition-colors cursor-pointer font-satoshi font-normal text-[13px] leading-[20px]",
                      "text-muted-foreground hover:bg-muted hover:text-foreground"
                    )}
                  >
                    <item.icon className="h-4 w-4" />
                    <span>{item.name}</span>
                  </button>
                </li>
              );
            }
            
            return (
              <li key={item.name}>
                <Link href={item.href}>
                  <div
                    className={cn(
                      "flex items-center space-x-3 p-2 rounded-lg transition-colors cursor-pointer font-satoshi font-normal text-[13px] leading-[20px]",
                      isActive
                        ? "bg-purple-accent/20 text-purple-accent"
                        : "text-muted-foreground hover:bg-muted hover:text-foreground"
                    )}
                  >
                    <item.icon className="h-4 w-4" />
                    <span>{item.name}</span>
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
      {/* Bottom Section */}
      <div className="mt-auto">
        {/* Start Button */}
        <div className="p-4">
          <Button className="w-full bg-secondary hover:bg-secondary/80 text-secondary-foreground font-satoshi text-[13px] leading-[20px] rounded-lg py-2 px-4 flex items-center justify-between">
            <div className="flex items-center">
              <span className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center mr-3">
                <span className="text-secondary-foreground text-xs">▶</span>
              </span>
              Empezar
            </div>
            <div className="bg-green-500 text-primary-foreground text-xs px-2 py-1 rounded-full">
              52%
            </div>
          </Button>
        </div>

        {/* Help Link */}
        <div className="px-4 pb-4">
          <Button
            variant="ghost"
            className="w-full justify-start font-satoshi font-normal text-[13px] leading-[20px] text-muted-foreground hover:text-foreground hover:bg-muted"
          >
            <Settings className="mr-3 h-4 w-4" />
            Informar un problema
          </Button>
        </div>

        {/* User Profile */}
        <div className="p-4 border-t border-border">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-gradient-to-r from-purple-accent to-blue-accent rounded-full flex items-center justify-center">
              {(user as any)?.profileImageUrl ? (
                <img
                  src={(user as any).profileImageUrl}
                  alt="Profile"
                  className="w-8 h-8 rounded-full object-cover"
                />
              ) : (
                <span className="text-xs font-semibold text-primary-foreground">
                  {getUserInitials()}
                </span>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-satoshi font-normal text-[13px] leading-[20px] text-white truncate">
                {getUserName()}
              </p>
            </div>
            <div className="flex items-center space-x-2">
              <Button
                variant="ghost"
                size="sm"
                className="text-xs text-gray-400 hover:text-white h-6 px-2"
                onClick={toggleView}
                title={isStudentView ? "Cambiar a vista Admin" : "Cambiar a vista Estudiante"}
              >
                {isStudentView ? "👨‍🎓" : "⚙️"}
              </Button>
              <div className="w-4 h-4 bg-yellow-500 rounded-full flex items-center justify-center">
                <span className="text-xs">🔔</span>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="text-gray-400 hover:text-white h-6 w-6"
                onClick={logout}
              >
                <span className="text-lg">⋯</span>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
}