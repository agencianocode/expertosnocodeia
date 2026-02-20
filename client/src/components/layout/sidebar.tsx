import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useSimpleAuth } from "@/hooks/use-simple-auth";
import { useRoleSwitch } from "@/hooks/useRoleSwitch";
import { useTheme } from "@/hooks/useTheme";
import { useAdmin } from "@/hooks/useAdmin";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import OnboardingModal from "@/components/onboarding-modal";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
} from "@/components/ui/dropdown-menu";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
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
  Command,
  User,
  BarChart3,
  Bookmark,
  Bell,
  Monitor,
  Sun,
  Moon,
  HelpCircle,
  LogOut,
  MoreHorizontal,
  MoreVertical,
  TrendingUp,
  ChevronDown,
  ChevronRight,
  ChevronLeft,
  Shield,
  MessageCircle
} from "lucide-react";

interface SidebarProps {
  onToggle?: () => void;
}

export default function Sidebar({ onToggle }: SidebarProps = {}) {
  const [location] = useLocation();
  const { user } = useAuth();
  const { logout } = useSimpleAuth();
  const { isStudentView, toggleView } = useRoleSwitch();
  const [searchQuery, setSearchQuery] = useState("");
  const { theme, changeTheme } = useTheme();
  const [onboardingOpen, setOnboardingOpen] = useState(false);
  const [programasExpanded, setProgramasExpanded] = useState(false);
  const { isAdmin } = useAdmin();
  
  // Fetch unread comments count for admin badge
  const { data: unreadCommentsData } = useQuery<{ count: number }>({
    queryKey: ['/api/admin/comments/unread-count'],
    enabled: isAdmin,
    refetchInterval: 30000, // Refetch every 30 seconds
  });
  
  const unreadCommentsCount = unreadCommentsData?.count || 0;

  // Notificaciones (guías, cursos, talleres desde BD; filtradas por clearedAt del usuario)
  const { data: notificationsData } = useQuery<{
    notifications: { id: string; contentId?: string; type: "guide" | "course" | "workshop"; title: string; description: string; timeAgo: string }[];
    unreadCount: number;
  }>({
    queryKey: ["/api/notifications"],
    enabled: !!user,
    refetchInterval: 60000,
  });
  const notifications = notificationsData?.notifications ?? [];
  const notificationCount = notificationsData?.unreadCount ?? notifications.length;

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

  const getUserInitials = () => {
    if ((user as any)?.firstName && (user as any)?.lastName) {
      return `${(user as any).firstName[0]}${(user as any).lastName[0]}`.toUpperCase();
    }
    if ((user as any)?.email) {
      return (user as any).email.substring(0, 2).toUpperCase();
    }
    return "U";
  };

  const getUserName = () => {
    if ((user as any)?.firstName && (user as any)?.lastName) {
      return `${(user as any).firstName} ${(user as any).lastName}`;
    }
    if ((user as any)?.email) {
      return (user as any).email.split('@')[0];
    }
    return "User";
  };

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
        {user ? (
          // Sección completa para usuario autenticado
          <>
            {/* Tema / Apariencia: encima de Empezar, 3 puntos verticales abren opciones Luz/Oscuro/Sistema */}
            <div className="px-4 pt-2 pb-3">
              <div className="flex items-center justify-between rounded-lg bg-muted/50 py-2 px-3">
                <div className="flex items-center gap-3 min-w-0">
                  {theme === "claro" && <Sun className="h-4 w-4 text-muted-foreground shrink-0" />}
                  {theme === "oscuro" && <Moon className="h-4 w-4 text-muted-foreground shrink-0" />}
                  {theme === "sistema" && <Monitor className="h-4 w-4 text-muted-foreground shrink-0" />}
                  <span className="text-sm text-foreground truncate">
                    Tema: {theme === "claro" ? "Claro" : theme === "oscuro" ? "Oscuro" : "Sistema"}
                  </span>
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-muted-foreground hover:text-foreground h-6 w-6 shrink-0"
                      aria-label="Opciones de tema"
                    >
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56 bg-card border-border" sideOffset={5}>
                    <DropdownMenuItem
                      className="text-card-foreground hover:bg-muted cursor-pointer"
                      onClick={() => changeTheme("claro")}
                    >
                      <Sun className="mr-2 h-4 w-4" />
                      <span>Luz</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      className="text-card-foreground hover:bg-muted cursor-pointer"
                      onClick={() => changeTheme("oscuro")}
                    >
                      <Moon className="mr-2 h-4 w-4" />
                      <span>Oscuro</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      className="text-card-foreground hover:bg-muted cursor-pointer"
                      onClick={() => changeTheme("sistema")}
                    >
                      <Monitor className="mr-2 h-4 w-4" />
                      <span>Sistema</span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>

            <div className="border-t border-border mx-4" aria-hidden />

            {/* Start Button */}
            <div className="p-4">
              <OnboardingModal 
                open={onboardingOpen} 
                onOpenChange={setOnboardingOpen}
                trigger={
                  <Button 
                    className="w-full font-satoshi text-[13px] leading-[20px] rounded-lg py-2 px-4 flex items-center justify-between border-0"
                    style={{ backgroundColor: '#404040' }}
                  >
                    <div className="flex items-center" style={{ color: '#3c4fb8' }}>
                      <span 
                        className="w-6 h-6 rounded-full flex items-center justify-center lg:mr-3 border border-current"
                        style={{ backgroundColor: 'rgba(60, 79, 184, 0.2)', color: '#3c4fb8' }}
                      >
                        <span className="text-xs">▶</span>
                      </span>
                      <span className="hidden lg:block">Empezar</span>
                    </div>
                    <div 
                      className="hidden lg:flex items-center justify-center w-8 h-8 rounded-full text-white text-xs font-medium shrink-0"
                      style={{
                        background: 'conic-gradient(from -90deg, #8b5cf6 0%, #ec4899 35%, #3b82f6 65%, #a855f7 100%)',
                        padding: '2px',
                      }}
                    >
                      <span 
                        className="w-full h-full rounded-full bg-[#404040] flex items-center justify-center"
                      >
                        67%
                      </span>
                    </div>
                  </Button>
                }
              />
            </div>

            {/* Help Link */}
            <div className="px-4 pb-4">
              <Button
                variant="ghost"
                className="w-full justify-center lg:justify-start font-satoshi font-normal text-[13px] leading-[20px] text-muted-foreground hover:text-foreground hover:bg-muted"
              >
                <Settings className="lg:mr-3 h-4 w-4" />
                <span className="hidden lg:block">Informar un problema</span>
              </Button>
            </div>

            {/* User Profile */}
            <div className="p-4">
              <div className="flex items-center justify-center lg:justify-start lg:space-x-3">
                <div className="w-8 h-8 bg-gradient-to-r from-purple-accent to-blue-accent rounded-full flex items-center justify-center">
                  {(user as any)?.profileImageUrl ? (
                    <img
                      src={(user as any).profileImageUrl}
                      alt="Profile"
                      className="w-8 h-8 rounded-full object-cover"
                    />
                  ) : (
                    <span className="text-xs font-semibold text-white">
                      {getUserInitials()}
                    </span>
                  )}
                </div>
                <div className="flex-1 min-w-0 hidden lg:block">
                  <p className="font-satoshi font-normal text-[13px] leading-[20px] text-foreground truncate">
                    {getUserName()}
                  </p>
                </div>
                <div className="flex items-center space-x-2">
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="relative h-8 w-8 text-muted-foreground hover:text-foreground"
                        aria-label="Notificaciones"
                      >
                        <Bell className="h-4 w-4" />
                        {notificationCount > 0 && (
                          <span className="absolute -top-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-destructive text-[10px] font-medium text-destructive-foreground">
                            {notificationCount > 9 ? "9+" : notificationCount}
                          </span>
                        )}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent
                      align="end"
                      side="bottom"
                      sideOffset={8}
                      className="w-[360px] p-0 bg-card border-border shadow-lg rounded-lg overflow-hidden"
                    >
                      <div className="border-b border-border px-4 py-3">
                        <h3 className="font-semibold text-foreground">Notificaciones</h3>
                      </div>
                      <div className="max-h-[320px] overflow-y-auto">
                        {notifications.length === 0 ? (
                          <div className="px-4 py-6 text-center text-sm text-muted-foreground">
                            No hay notificaciones nuevas
                          </div>
                        ) : (
                          <ul className="divide-y divide-border">
                            {notifications.map((n) => {
                              const href = n.contentId
                                ? n.type === "guide"
                                  ? `/guia/${n.contentId}`
                                  : n.type === "course"
                                    ? `/course/${n.contentId}`
                                    : `/taller/${n.contentId}`
                                : "/notifications";
                              return (
                                <li key={n.id} className="px-4 py-3 hover:bg-muted/50 transition-colors">
                                  <Link href={href} className="block">
                                    <p className="font-medium text-foreground text-sm">
                                      {n.type === "guide" && "¡Nueva guía publicada!"}
                                      {n.type === "course" && "¡Nuevo curso publicado!"}
                                      {n.type === "workshop" && "¡Nuevo taller publicado!"}
                                    </p>
                                    <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
                                      {n.description}
                                    </p>
                                    <p className="text-xs text-muted-foreground mt-1">{n.timeAgo}</p>
                                  </Link>
                                </li>
                              );
                            })}
                          </ul>
                        )}
                      </div>
                      <div className="border-t border-border px-4 py-2.5 bg-muted/30">
                        <Link href="/notifications" className="text-sm font-medium text-primary hover:underline">
                          Ver todas las notificaciones
                        </Link>
                      </div>
                    </PopoverContent>
                  </Popover>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-muted-foreground hover:text-foreground h-6 w-6"
                      >
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent 
                      align="end" 
                      className="w-56 bg-card border-border"
                      sideOffset={5}
                    >
                      <DropdownMenuItem 
                        className="text-card-foreground hover:bg-muted hover:text-foreground cursor-pointer"
                        onClick={() => window.location.href = "/profile"}
                      >
                        <User className="mr-2 h-4 w-4" />
                        <span>Mi perfil</span>
                      </DropdownMenuItem>
                      
                      {/* Admin-only: Panel, Comentarios, Mi progreso */}
                      {isAdmin && (
                        <>
                          <DropdownMenuSeparator className="bg-border" />
                          <DropdownMenuItem 
                            className="text-purple-400 hover:bg-purple-500/10 hover:text-purple-300 cursor-pointer"
                            onClick={() => window.location.href = "/admin"}
                          >
                            <Shield className="mr-2 h-4 w-4" />
                            <span>Panel de Administración</span>
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            className="text-card-foreground hover:bg-muted hover:text-foreground cursor-pointer"
                            onClick={() => window.location.href = "/admin/comentarios"}
                          >
                            <MessageCircle className="mr-2 h-4 w-4" />
                            <div className="flex items-center justify-between flex-1">
                              <span>Comentarios</span>
                              {unreadCommentsCount > 0 && (
                                <Badge variant="destructive" className="ml-2 h-5 min-w-5 flex items-center justify-center px-1.5 text-xs">
                                  {unreadCommentsCount}
                                </Badge>
                              )}
                            </div>
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            className="text-card-foreground hover:bg-muted hover:text-foreground cursor-pointer"
                            onClick={() => window.location.href = "/progreso"}
                          >
                            <TrendingUp className="mr-2 h-4 w-4" />
                            <span>Mi progreso</span>
                          </DropdownMenuItem>
                          <DropdownMenuSeparator className="bg-border" />
                        </>
                      )}
                      
                      <DropdownMenuItem 
                        className="text-card-foreground hover:bg-muted hover:text-foreground cursor-pointer"
                        onClick={() => window.location.href = "/guardado"}
                      >
                        <Bookmark className="mr-2 h-4 w-4" />
                        <span>Guardado</span>
                      </DropdownMenuItem>
                      
                      <DropdownMenuItem 
                        className="text-card-foreground hover:bg-muted hover:text-foreground cursor-pointer"
                        onClick={() => window.location.href = "/apoyo"}
                      >
                        <HelpCircle className="mr-2 h-4 w-4" />
                        <span>Apoyo</span>
                      </DropdownMenuItem>
                      
                      <DropdownMenuSeparator className="bg-border" />
                      
                      <DropdownMenuItem 
                        className="text-red-400 hover:bg-red-500/10 hover:text-red-300 cursor-pointer"
                        onClick={logout}
                      >
                        <LogOut className="mr-2 h-4 w-4" />
                        <span>Finalizar la sesión</span>
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            </div>
          </>
        ) : (
          // Sección minimalista para usuario NO autenticado (imagen de referencia exacta)
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
                    <MoreVertical className="h-4 w-4" />
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
        )}
        
        {/* Collapse button - at bottom of sidebar, only visible when onToggle is provided */}
        {onToggle && (
          <div className="hidden lg:block px-4 pb-3">
            <button
              onClick={onToggle}
              className="w-full flex items-center justify-center gap-2 py-1.5 px-3 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground transition-colors text-xs"
              title="Ocultar sidebar"
              data-testid="sidebar-collapse-button"
            >
              <ChevronLeft className="h-3.5 w-3.5" />
              <span>Ocultar menú</span>
            </button>
          </div>
        )}
      </div>

    </aside>
  );
}
