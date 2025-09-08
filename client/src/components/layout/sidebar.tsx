import { useState } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import { useSimpleAuth } from "@/hooks/use-simple-auth";
import { useRoleSwitch } from "@/hooks/useRoleSwitch";
import { useTheme } from "@/hooks/useTheme";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
  Monitor,
  Sun,
  Moon,
  HelpCircle,
  LogOut,
  MoreHorizontal,
  TrendingUp
} from "lucide-react";

export default function Sidebar() {
  const [location] = useLocation();
  const { user } = useAuth();
  const { logout } = useSimpleAuth();
  const { isStudentView, toggleView } = useRoleSwitch();
  const [searchQuery, setSearchQuery] = useState("");
  const { theme, changeTheme } = useTheme();

  const navigation = [
    { name: "Hogar", href: "/", icon: Home },
    { name: "Cursos", href: "/courses", icon: BookOpen },
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
    <aside className="hidden md:flex w-16 lg:w-[250px] bg-card border-r border-border flex-col fixed h-screen top-0 left-0 z-40">
      {/* Logo */}
      <div className="px-4 py-4 border-b border-border">
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
        {/* Start Button */}
        <div className="p-4">
          <Button className="w-full bg-secondary hover:bg-secondary/80 text-secondary-foreground font-satoshi text-[13px] leading-[20px] rounded-lg py-2 px-4 flex items-center justify-between">
            <div className="flex items-center">
              <span className="w-6 h-6 bg-green-accent rounded-full flex items-center justify-center lg:mr-3">
                <span className="text-white text-xs">▶</span>
              </span>
              <span className="hidden lg:block">Empezar</span>
            </div>
            <div className="bg-green-accent text-white text-xs px-2 py-1 rounded-full hidden lg:block">
              52%
            </div>
          </Button>
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
        <div className="p-4 border-t border-border">
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
            <div className="flex items-center space-x-2 hidden lg:flex">
              <Button
                variant="ghost"
                size="sm"
                className="text-xs text-muted-foreground hover:text-foreground h-6 px-2"
                onClick={toggleView}
                title={isStudentView ? "Cambiar a vista Admin" : "Cambiar a vista Estudiante"}
              >
                {isStudentView ? "👨‍🎓" : "⚙️"}
              </Button>
              <div className="w-4 h-4 bg-yellow-500 rounded-full flex items-center justify-center">
                <span className="text-xs">🔔</span>
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
                  {user ? (
                    // Menu para usuario autenticado
                    <>
                      <DropdownMenuItem 
                        className="text-card-foreground hover:bg-muted hover:text-foreground cursor-pointer"
                        onClick={() => window.location.href = "/profile"}
                      >
                        <User className="mr-2 h-4 w-4" />
                        <span>Mi perfil</span>
                      </DropdownMenuItem>
                      
                      <DropdownMenuItem 
                        className="text-card-foreground hover:bg-muted hover:text-foreground cursor-pointer"
                        onClick={() => window.location.href = "/progreso"}
                      >
                        <TrendingUp className="mr-2 h-4 w-4" />
                        <span>Mi progreso</span>
                      </DropdownMenuItem>
                      
                      <DropdownMenuItem 
                        className="text-card-foreground hover:bg-muted hover:text-foreground cursor-pointer"
                        onClick={() => window.location.href = "/guardado"}
                      >
                        <Bookmark className="mr-2 h-4 w-4" />
                        <span>Guardado</span>
                      </DropdownMenuItem>
                      
                      <DropdownMenuSub>
                        <DropdownMenuSubTrigger className="text-muted-foreground hover:bg-muted hover:text-foreground">
                          <Monitor className="mr-2 h-4 w-4" />
                          <span>Tema: {theme.charAt(0).toUpperCase() + theme.slice(1)}</span>
                        </DropdownMenuSubTrigger>
                        <DropdownMenuSubContent className="bg-card border-border">
                          <DropdownMenuItem 
                            className="text-card-foreground hover:bg-muted hover:text-foreground cursor-pointer"
                            onClick={() => changeTheme("claro")}
                          >
                            <Sun className="mr-2 h-4 w-4" />
                            <span>Claro</span>
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
                        </DropdownMenuSubContent>
                      </DropdownMenuSub>
                      
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
                    </>
                  ) : (
                    // Menu para usuario NO autenticado (imagen de referencia exacta)
                    <>
                      <DropdownMenuSub>
                        <DropdownMenuSubTrigger className="text-card-foreground hover:bg-muted hover:text-foreground">
                          <Monitor className="mr-2 h-4 w-4" />
                          <span>Tema: Sistema</span>
                        </DropdownMenuSubTrigger>
                        <DropdownMenuSubContent className="bg-card border-border">
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
                        </DropdownMenuSubContent>
                      </DropdownMenuSub>
                      
                      <DropdownMenuItem 
                        className="text-card-foreground hover:bg-muted hover:text-foreground cursor-pointer"
                        onClick={() => window.location.href = "/apoyo"}
                      >
                        <HelpCircle className="mr-2 h-4 w-4" />
                        <span>Apoyo</span>
                      </DropdownMenuItem>
                      
                      <DropdownMenuSeparator className="bg-border" />
                      
                      <div className="p-2">
                        <Button 
                          className="w-full bg-muted-foreground hover:bg-muted text-background"
                          onClick={() => window.location.href = "/login"}
                        >
                          Acceso
                        </Button>
                      </div>
                    </>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
}
