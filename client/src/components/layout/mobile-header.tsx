import { Brain, Search, Bell, Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { Link } from "wouter";

export default function MobileHeader() {
  const { user } = useAuth();

  const getUserInitials = () => {
    if ((user as any)?.firstName && (user as any)?.lastName) {
      return `${(user as any).firstName[0]}${(user as any).lastName[0]}`.toUpperCase();
    }
    if ((user as any)?.email) {
      return (user as any).email.substring(0, 2).toUpperCase();
    }
    return "U";
  };

  return (
    <header className="lg:hidden flex items-center justify-between p-4 bg-background border-b border-border">
      {/* Left side - Logo (enlaza a home) */}
      <Link href="/" className="flex items-center space-x-2 cursor-pointer hover:opacity-90 transition-opacity min-w-0">
        <div>
          <h1 className="font-bold text-[12px]">
            <span className="bg-gradient-to-r from-purple-accent to-blue-accent bg-clip-text text-transparent text-[14px]">Universidad</span>
            <span className="text-foreground text-[14px]"> Expertos NoCode IA</span>
          </h1>
        </div>
      </Link>
      {/* Right side - Iconos con navegación */}
      <div className="flex items-center space-x-2 sm:space-x-3 flex-shrink-0">
        <Button variant="ghost" size="sm" className="p-2" aria-label="Buscar cursos" onClick={() => window.dispatchEvent(new CustomEvent("openSearch"))}>
          <Search className="h-5 w-5 text-muted-foreground" />
        </Button>
        <Button variant="ghost" size="sm" className="p-2 relative" asChild>
          <Link href="/notifications" aria-label="Notificaciones">
            <Bell className="h-5 w-5 text-muted-foreground" />
          </Link>
        </Button>
        <Link href="/profile" className="cursor-pointer hover:opacity-90 transition-opacity flex-shrink-0" aria-label="Mi perfil">
          <div className="w-8 h-8 bg-gradient-to-r from-purple-accent to-blue-accent rounded-full flex items-center justify-center">
            {(user as any)?.profileImageUrl ? (
              <img
                src={(user as any).profileImageUrl}
                alt="Profile"
                className="w-8 h-8 rounded-full object-cover"
              />
            ) : (
              <span className="text-primary-foreground text-xs font-bold">{getUserInitials()}</span>
            )}
          </div>
        </Link>
      </div>
    </header>
  );
}