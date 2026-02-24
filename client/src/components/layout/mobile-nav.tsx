import { Link, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { cn } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
} from "@/components/ui/dropdown-menu";
import { 
  Home, 
  BookOpen, 
  FileText, 
  Calendar, 
  User,
  Brain,
  MoreVertical,
  Gift,
  Users,
  Bookmark,
  AlertCircle,
  HeadphonesIcon,
  Moon,
  Sun,
  Monitor,
  LogOut,
} from "lucide-react";
import { useTheme } from "@/hooks/useTheme";
import { useSimpleAuth } from "@/hooks/use-simple-auth";

export default function MobileNav() {
  const [location] = useLocation();
  const { theme, changeTheme } = useTheme();
  const { logout } = useSimpleAuth();

  // Fetch rooms for the dropdown
  const { data: roomsData } = useQuery({
    queryKey: ["/api/rooms"],
  });

  const rooms = (roomsData as any) || [];
  const isInRoomRoute = location.startsWith('/sala/');

  const navigation = [
    { name: "Hogar", href: "/", icon: Home },
    { name: "Cursos", href: "/courses", icon: BookOpen },
    { name: "Programas", href: "/programas", icon: Brain, hasDropdown: true },
    { name: "Guías", href: "/guides", icon: FileText },
    { name: "Talleres", href: "/workshops", icon: Calendar },
    { name: "Más", icon: MoreVertical, hasMoreMenu: true },
  ];

  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-card border-t border-border z-50">
      <div className="flex justify-around items-center py-2">
        {navigation.map((item) => {
          const isActive = !item.hasMoreMenu && (location === item.href || (item.hasDropdown && isInRoomRoute));
          
          // Menú "Más" (tres puntos verticales) con submenú
          if (item.hasMoreMenu) {
            return (
              <DropdownMenu key={item.name}>
                <DropdownMenuTrigger asChild>
                  <div
                    className={cn(
                      "flex flex-col items-center justify-center p-3 rounded-lg transition-colors cursor-pointer",
                      "text-muted-foreground active:text-foreground"
                    )}
                  >
                    <MoreVertical className="h-5 w-5 mb-1" />
                    <span className="text-xs font-medium">{item.name}</span>
                  </div>
                </DropdownMenuTrigger>
                <DropdownMenuContent side="top" align="center" className="mb-2 w-56 bg-card border-border">
                  <DropdownMenuItem asChild>
                    <Link href="/perks" className="flex items-center cursor-pointer">
                      <Gift className="mr-2 h-4 w-4" />
                      <span>Beneficios</span>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/community" className="flex items-center cursor-pointer">
                      <Users className="mr-2 h-4 w-4" />
                      <span>Comunidad</span>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/profile" className="flex items-center cursor-pointer">
                      <User className="mr-2 h-4 w-4" />
                      <span>Mi perfil</span>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/saved" className="flex items-center cursor-pointer">
                      <Bookmark className="mr-2 h-4 w-4" />
                      <span>Guardado</span>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/support" className="flex items-center cursor-pointer">
                      <AlertCircle className="mr-2 h-4 w-4" />
                      <span>Informar un problema</span>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/support" className="flex items-center cursor-pointer">
                      <HeadphonesIcon className="mr-2 h-4 w-4" />
                      <span>Apoyo</span>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSub>
                    <DropdownMenuSubTrigger className="cursor-pointer">
                      {theme === "claro" && <Sun className="mr-2 h-4 w-4" />}
                      {theme === "oscuro" && <Moon className="mr-2 h-4 w-4" />}
                      {theme === "sistema" && <Monitor className="mr-2 h-4 w-4" />}
                      <span>Tema: {theme === "claro" ? "Claro" : theme === "oscuro" ? "Oscuro" : "Sistema"}</span>
                    </DropdownMenuSubTrigger>
                    <DropdownMenuSubContent className="bg-card border-border">
                      <DropdownMenuItem onClick={() => changeTheme("claro")} className="cursor-pointer">
                        <Sun className="mr-2 h-4 w-4" />
                        <span>Claro</span>
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => changeTheme("oscuro")} className="cursor-pointer">
                        <Moon className="mr-2 h-4 w-4" />
                        <span>Oscuro</span>
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => changeTheme("sistema")} className="cursor-pointer">
                        <Monitor className="mr-2 h-4 w-4" />
                        <span>Sistema</span>
                      </DropdownMenuItem>
                    </DropdownMenuSubContent>
                  </DropdownMenuSub>
                  <DropdownMenuItem
                    onClick={logout}
                    className="cursor-pointer text-red-500 focus:text-red-500 focus:bg-muted"
                  >
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Finalizar la sesión</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            );
          }
          
          // Handle "Programas" with dropdown
          if (item.hasDropdown && rooms.length > 0) {
            return (
              <DropdownMenu key={item.name}>
                <DropdownMenuTrigger asChild>
                  <div
                    className={cn(
                      "flex flex-col items-center justify-center p-3 rounded-lg transition-colors cursor-pointer",
                      isActive
                        ? "text-purple-accent"
                        : "text-muted-foreground"
                    )}
                  >
                    <item.icon className="h-5 w-5 mb-1" />
                    <span className="text-xs font-medium">{item.name}</span>
                  </div>
                </DropdownMenuTrigger>
                <DropdownMenuContent side="top" align="center" className="mb-2 max-h-[60vh] overflow-y-auto">
                  {rooms.map((room: any) => {
                    const roomPath = `/sala/${room.slug}`;
                    const isRoomActive = location.startsWith(roomPath);
                    return (
                      <DropdownMenuItem key={room.id} asChild>
                        <Link href={roomPath}>
                          <span className={cn(
                            "w-full text-sm",
                            isRoomActive ? "text-purple-accent font-medium" : "text-foreground"
                          )}>
                            {room.title}
                          </span>
                        </Link>
                      </DropdownMenuItem>
                    );
                  })}
                </DropdownMenuContent>
              </DropdownMenu>
            );
          }
          
          // Regular nav items
          return (
            <Link key={item.name} href={item.href!}>
              <div
                className={cn(
                  "flex flex-col items-center justify-center p-3 rounded-lg transition-colors",
                  isActive
                    ? "text-purple-accent"
                    : "text-muted-foreground"
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