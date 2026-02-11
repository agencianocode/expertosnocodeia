import { Link, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { cn } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { 
  Home, 
  BookOpen, 
  FileText, 
  Calendar, 
  User,
  Brain
} from "lucide-react";

export default function MobileNav() {
  const [location] = useLocation();

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
    { name: "Más", href: "/profile", icon: User },
  ];

  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-[#262626] border-t border-dark-border z-50">
      <div className="flex justify-around items-center py-2">
        {navigation.map((item) => {
          const isActive = location === item.href || (item.hasDropdown && isInRoomRoute);
          
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
                        : "text-gray-400"
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