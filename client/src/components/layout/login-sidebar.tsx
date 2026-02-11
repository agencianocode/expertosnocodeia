import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useTheme } from "@/hooks/useTheme";
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
  Monitor,
  Sun,
  Moon,
  HelpCircle,
  MoreHorizontal,
  ChevronDown,
  ChevronRight
} from "lucide-react";

export default function LoginSidebar() {
  const [location] = useLocation();
  const [searchQuery, setSearchQuery] = useState("");
  const { theme, changeTheme } = useTheme();
  const [programasExpanded, setProgramasExpanded] = useState(false);

  // Auto-expand Programas when entering a room route
  const isInRoomRoute = location.startsWith('/sala/');
  
  useEffect(() => {
    if (isInRoomRoute) {
      setProgramasExpanded(true);
    }
  }, [isInRoomRoute]);

  // Fetch rooms for the submenu
  const { data: roomsData } = useQuery({
    queryKey: ["/api/rooms"],
  });

  const navigation = [
    { name: "Hogar", href: "/", icon: Home },
    { name: "Cursos", href: "/courses", icon: BookOpen },
    { name: "Programas", href: "#", icon: Brain },
    { name: "Guías", href: "/guides", icon: FileText },
    { name: "Talleres", href: "/talleres", icon: Calendar },
    { name: "Eventos", href: "/events", icon: CalendarDays },
    { name: "Comunidad", href: "/community", icon: Users },
    { name: "Beneficios", href: "/perks", icon: Star },
  ];

  return (
    <aside className="hidden md:flex w-16 lg:w-[250px] bg-card flex-col fixed h-screen top-0 left-0 z-40">
      {/* Logo */}
      <div className="px-4 py-4">
        <div className="flex items-center justify-center lg:justify-start">
          <div className="hidden lg:block">
            <h1 className="font-satoshi font-bold text-[14px]">
              <span className="bg-gradient-to-r from-purple-accent to-blue-accent bg-clip-text text-transparent">Universidad</span>
              <span className="text-foreground"> Expertos NoCode IA</span>
            </h1>
          </div>
        </div>
      </div>
      {/* Search */}
      <div className="px-4 py-4 hidden lg:block">
        <div className="relative">
          <Search className="absolute left-3 top-3 text-muted-foreground h-4 w-4" />
          <Input
            type="text"
            placeholder="Buscar"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-background border-border rounded-lg pl-10 pr-12 py-2 font-satoshi text-sm text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent"
          />
          <div className="absolute right-3 top-2.5 flex items-center bg-muted rounded px-1">
            <span className="text-xs text-muted-foreground font-satoshi">⌘K</span>
          </div>
        </div>
      </div>
      {/* Search icon only for tablet */}
      <div className="px-4 py-4 lg:hidden md:flex justify-center">
        <Search className="text-muted-foreground h-6 w-6" />
      </div>
      {/* Navigation */}
      <nav className="flex-1 px-4">
        <ul className="space-y-2">
          {navigation.map((item) => {
            const isActive = location === item.href;
            const isRoomActive = location.startsWith('/sala/');
            
            // Handle "Programas" specially with submenu for rooms
            if (item.name === "Programas") {
              return (
                <li key={item.name}>
                  {/* Main Programas item */}
                  <div className="flex flex-col">
                    <div className="flex items-center">
                      <div 
                        onClick={() => setProgramasExpanded(!programasExpanded)}
                        className="flex-1"
                      >
                        <div
                          className={cn(
                            "flex items-center justify-center lg:justify-start lg:space-x-3 p-2 rounded-lg transition-colors cursor-pointer font-satoshi font-normal text-[13px] leading-[20px]",
                            isRoomActive
                              ? "bg-primary/20 text-primary"
                              : "text-muted-foreground hover:bg-muted hover:text-foreground"
                          )}
                        >
                          <item.icon className="h-5 w-5" />
                          <span className="hidden lg:block flex-1">{item.name}</span>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => setProgramasExpanded(!programasExpanded)}
                        className="hidden lg:flex p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                      >
                        {programasExpanded ? (
                          <ChevronDown className="h-4 w-4" />
                        ) : (
                          <ChevronRight className="h-4 w-4" />
                        )}
                      </button>
                    </div>
                    
                    {/* Submenu - Salas/Programas */}
                    {programasExpanded && roomsData && Array.isArray(roomsData) && roomsData.length > 0 ? (
                      <ul className="hidden lg:block ml-8 mt-1 space-y-1">
                        {roomsData.map((room: any) => {
                          const roomPath = `/sala/${room.slug}`;
                          const isRoomItemActive = location.startsWith(roomPath);
                          return (
                            <li key={room.id}>
                              <Link href={roomPath}>
                                <div
                                  className={cn(
                                    "flex items-center space-x-3 p-2 rounded-lg transition-colors cursor-pointer font-satoshi font-normal text-[12px] leading-[18px]",
                                    isRoomItemActive
                                      ? "bg-primary/10 text-primary"
                                      : "text-muted-foreground hover:bg-muted hover:text-foreground"
                                  )}
                                  data-testid={`sidebar-room-${room.slug}`}
                                >
                                  <span>{room.title}</span>
                                </div>
                              </Link>
                            </li>
                          );
                        })}
                      </ul>
                    ) : null}
                  </div>
                </li>
              );
            }
            
            // Regular nav items
            return (
              <li key={item.name}>
                <Link href={item.href}>
                  <div
                    className={cn(
                      "flex items-center justify-center lg:justify-start lg:space-x-3 p-2 rounded-lg transition-colors cursor-pointer font-satoshi font-normal text-[13px] leading-[20px]",
                      isActive
                        ? "bg-primary/20 text-primary"
                        : "text-muted-foreground hover:bg-muted hover:text-foreground"
                    )}
                  >
                    <item.icon className="h-5 w-5" />
                    <span className="hidden lg:block">{item.name}</span>
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
      {/* Bottom Section */}
      <div className="mt-auto">
        {/* Sección minimalista para usuario NO autenticado (imagen de referencia exacta) */}
        <div className="p-4 border-t border-border space-y-3">
          {/* Tema: Sistema - línea directa con dropdown de opciones */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Monitor className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Tema: Sistema</span>
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-muted-foreground hover:text-foreground h-6 w-6"
                >
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent 
                align="end" 
                className="w-56 bg-card border-border"
                sideOffset={5}
              >
                <DropdownMenuItem 
                  className="text-card-foreground hover:bg-muted hover:text-foreground cursor-pointer"
                  onClick={() => changeTheme("claro")}
                >
                  <Sun className="mr-2 h-4 w-4" />
                  <span>Luz</span>
                </DropdownMenuItem>
                <DropdownMenuItem 
                  className="text-card-foreground hover:bg-muted hover:text-foreground cursor-pointer"
                  onClick={() => changeTheme("oscuro")}
                >
                  <Moon className="mr-2 h-4 w-4" />
                  <span>Oscuro</span>
                </DropdownMenuItem>
                <DropdownMenuItem 
                  className="text-card-foreground hover:bg-muted hover:text-foreground cursor-pointer"
                  onClick={() => changeTheme("sistema")}
                >
                  <Monitor className="mr-2 h-4 w-4" />
                  <span>Sistema</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* Apoyo - línea directa */}
          <div 
            className="flex items-center space-x-3 cursor-pointer hover:bg-muted rounded-lg p-2 -mx-2"
            onClick={() => window.location.href = "/apoyo"}
          >
            <HelpCircle className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">Apoyo</span>
          </div>

          {/* Separador */}
          <div className="border-t border-border"></div>

          {/* Botón Acceso */}
          <Button 
            className="w-full bg-muted-foreground hover:bg-muted text-background"
            onClick={() => window.location.href = "/login"}
          >
            Acceso
          </Button>
        </div>
      </div>
    </aside>
  );
}
