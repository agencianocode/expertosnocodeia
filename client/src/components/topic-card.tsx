import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { useLocation } from "wouter";
import { 
  Users, 
  Code2, 
  Megaphone, 
  PenTool, 
  GraduationCap, 
  Settings, 
  TrendingUp, 
  DollarSign,
  Bus,
  BarChart3,
  CheckSquare,
  MoreHorizontal,
  FileText,
  Building2
} from "lucide-react";

interface TopicCardProps {
  category: any;
}

export default function TopicCard({ category }: TopicCardProps) {
  const [, setLocation] = useLocation();

  const getCategorySlug = (categoryName: string) => {
    const slugMap: { [key: string]: string } = {
      "General": "general",
      "Codificación": "codificacion", 
      "Marketing": "marketing",
      "Creación de contenido": "creacion-contenido",
      "Educación": "educacion",
      "Operaciones comerciales": "operaciones-comerciales",
      "Ventas": "ventas",
      "Finanzas": "finanzas",
      "Consultoría": "consultoria",
      "Análisis de datos": "analisis-datos",
      "Gestión de proyectos": "gestion-proyectos",
      "Otros": "otros",
    };
    return slugMap[categoryName] || categoryName.toLowerCase().replace(/\s+/g, '-');
  };

  const handleClick = () => {
    const slug = getCategorySlug(category.name);
    setLocation(`/categoria/${slug}`);
  };

  const getIcon = (name: string) => {
    const iconMap: { [key: string]: any } = {
      "General": Users,
      "Codificación": Code2,
      "Marketing": Megaphone,
      "Creador de contenido": PenTool,
      "Educador": GraduationCap,
      "Operaciones comerciales": Building2,
      "Ventas": TrendingUp,
      "Finanzas": DollarSign,
      "Consultante": Bus,
      "Análisis de datos": BarChart3,
      "Gestión de proyectos": FileText,
      "Otros": MoreHorizontal,
    };
    return iconMap[name] || Users;
  };

  const getColor = (name: string) => {
    const colorMap: { [key: string]: string } = {
      "General": "blue",
      "Codificación": "blue",
      "Marketing": "red",
      "Creador de contenido": "orange",
      "Educador": "green",
      "Operaciones comerciales": "blue",
      "Ventas": "green",
      "Finanzas": "green",
      "Consultante": "orange",
      "Análisis de datos": "blue",
      "Gestión de proyectos": "blue",
      "Otros": "gray",
    };
    return colorMap[name] || "blue";
  };

  const Icon = getIcon(category.name);
  const color = getColor(category.name);

  const getIconColor = (name: string) => {
    const colorMap: { [key: string]: string } = {
      "General": "text-blue-400",
      "Codificación": "text-blue-400",
      "Marketing": "text-red-400",
      "Creador de contenido": "text-orange-400",
      "Educador": "text-green-400",
      "Operaciones comerciales": "text-blue-400",
      "Ventas": "text-green-400",
      "Finanzas": "text-green-400",
      "Consultante": "text-orange-400",
      "Análisis de datos": "text-blue-400",
      "Gestión de proyectos": "text-blue-400",
      "Otros": "text-gray-400",
    };
    return colorMap[name] || "text-blue-400";
  };

  const iconColor = getIconColor(category.name);

  return (
    <Card 
      onClick={handleClick}
      className="bg-card border-border py-3 px-4 hover:shadow-lg transition-all cursor-pointer h-14 hover:bg-muted/50"
    >
      <div className="flex items-center space-x-3 h-full">
        <Icon className={cn(iconColor)} size={18} />
        <span className="font-medium text-sm text-foreground">{category.name}</span>
      </div>
    </Card>
  );
}
