import { useState } from "react";
import { Link, useLocation } from "wouter";
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
  Command
} from "lucide-react";

export default function LoginSidebar() {
  const [location] = useLocation();
  const [searchQuery, setSearchQuery] = useState("");

  const navigation = [
    { name: "Hogar", href: "/", icon: Home },
    { name: "Cursos", href: "/courses", icon: BookOpen },
    { name: "Guías", href: "/guides", icon: FileText },
    { name: "Talleres", href: "/talleres", icon: Calendar },
    { name: "Eventos", href: "/events", icon: CalendarDays },
    { name: "Comunidad", href: "/community", icon: Users },
    { name: "Beneficios", href: "/perks", icon: Star },
  ];

  return (
    <aside className="hidden md:flex w-16 lg:w-[250px] bg-card border-r border-border flex-col fixed h-screen top-0 left-0 z-40">
      {/* Logo */}
      <div className="px-4 py-4 border-b border-border">
        <Link href="/" className="flex items-center gap-3 transition-all duration-200 group">
          
          <div className="hidden lg:block overflow-hidden">
            <div className="font-bold text-foreground text-sm leading-tight">
              Expertos NoCode IA
            </div>
            <div className="text-xs text-muted-foreground">Plataforma de Aprendizaje</div>
          </div>
        </Link>
      </div>
      {/* Search */}
      <div className="px-4 py-3 border-b border-border">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
          <Input
            type="text"
            placeholder="Buscar"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 bg-background border-border text-sm h-9 hidden lg:block"
          />
          <div className="lg:hidden w-8 h-8 bg-muted rounded-lg flex items-center justify-center">
            <Search className="w-4 h-4 text-muted-foreground" />
          </div>
        </div>
        <div className="hidden lg:block mt-2">
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <Command className="w-3 h-3" />
            <span>⌘K</span>
          </div>
        </div>
      </div>
      {/* Navigation */}
      <nav className="flex-1 px-2 py-4 space-y-1 overflow-y-auto">
        {navigation.map((item) => {
          const isActive = location === item.href;
          
          // Special case for Comunidad - open in new tab
          if (item.name === "Comunidad") {
            return (
              <button
                key={item.name}
                onClick={() => window.open(item.href, '_blank')}
                className={cn(
                  "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 group cursor-pointer",
                  "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                )}
              >
                <item.icon className="w-4 h-4 shrink-0 text-blue-500" />
                <span className="hidden lg:block truncate">{item.name}</span>
              </button>
            );
          }
          
          return (
            <Link key={item.name} href={item.href}>
              <div className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 group cursor-pointer",
                isActive
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
              )}>
                <item.icon className={cn(
                  "w-4 h-4 shrink-0 transition-colors",
                  isActive ? "text-primary-foreground" : "text-blue-500"
                )} />
                <span className="hidden lg:block truncate">{item.name}</span>
              </div>
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}