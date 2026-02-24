"use client";

import { useState, useEffect, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Search, BookOpen, FileText, Calendar, Brain } from "lucide-react";
import { cn } from "@/lib/utils";

const TABS = [
  { id: "all", label: "Todo" },
  { id: "courses", label: "Cursos" },
  { id: "programs", label: "Programas" },
  { id: "guides", label: "Guías" },
  { id: "workshops", label: "Talleres" },
] as const;

type TabId = (typeof TABS)[number]["id"];

interface SearchDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function SearchDialog({ open, onOpenChange }: SearchDialogProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState<TabId>("all");

  const { data: courses = [] } = useQuery<any[]>({
    queryKey: ["/api/courses"],
    enabled: open,
  });
  const { data: guides = [] } = useQuery<any[]>({
    queryKey: ["/api/guides"],
    enabled: open,
  });
  const { data: workshops = [] } = useQuery<any[]>({
    queryKey: ["/api/workshops"],
    enabled: open,
  });
  const { data: rooms = [] } = useQuery<any[]>({
    queryKey: ["/api/rooms"],
    enabled: open,
  });

  const term = searchTerm.trim().toLowerCase();

  const filteredCourses = useMemo(() => {
    if (!term) return [];
    return courses.filter(
      (c) =>
        (c.title || "").toLowerCase().includes(term) ||
        (c.description || "").toLowerCase().includes(term) ||
        (c.shortDescription || "").toLowerCase().includes(term)
    );
  }, [courses, term]);

  const filteredGuides = useMemo(() => {
    if (!term) return [];
    return guides.filter(
      (g) =>
        (g.title || "").toLowerCase().includes(term) ||
        (g.description || "").toLowerCase().includes(term) ||
        (g.shortDescription || "").toLowerCase().includes(term)
    );
  }, [guides, term]);

  const filteredWorkshops = useMemo(() => {
    if (!term) return [];
    return workshops.filter(
      (w) =>
        (w.title || "").toLowerCase().includes(term) ||
        (w.description || "").toLowerCase().includes(term)
    );
  }, [workshops, term]);

  const filteredRooms = useMemo(() => {
    if (!term) return [];
    return (rooms as any[]).filter(
      (r) =>
        (r.title || r.name || "").toLowerCase().includes(term) ||
        (r.description || "").toLowerCase().includes(term)
    );
  }, [rooms, term]);

  const showCourses = activeTab === "all" || activeTab === "courses";
  const showPrograms = activeTab === "all" || activeTab === "programs";
  const showGuides = activeTab === "all" || activeTab === "guides";
  const showWorkshops = activeTab === "all" || activeTab === "workshops";

  const results = useMemo(() => {
    const list: { type: "course" | "guide" | "workshop" | "room"; item: any; href: string }[] = [];
    if (showCourses) {
      filteredCourses.forEach((c) => {
        list.push({
          type: "course",
          item: c,
          href: c.slug ? `/curso/${c.slug}` : `/curso/${c.id}`,
        });
      });
    }
    if (showPrograms) {
      filteredRooms.forEach((r: any) => {
        list.push({
          type: "room",
          item: r,
          href: `/sala/${r.slug || r.id}`,
        });
      });
    }
    if (showGuides) {
      filteredGuides.forEach((g) => {
        list.push({
          type: "guide",
          item: g,
          href: g.slug ? `/guia/${g.slug}` : `/guia/${g.id}`,
        });
      });
    }
    if (showWorkshops) {
      filteredWorkshops.forEach((w) => {
        list.push({
          type: "workshop",
          item: w,
          href: `/taller/${w.slug || w.id}`,
        });
      });
    }
    return list;
  }, [
    showCourses,
    showPrograms,
    showGuides,
    showWorkshops,
    filteredCourses,
    filteredRooms,
    filteredGuides,
    filteredWorkshops,
  ]);

  const hasResults = results.length > 0;
  const isEmpty = !term;

  useEffect(() => {
    if (!open) {
      setSearchTerm("");
      setActiveTab("all");
    }
  }, [open]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg p-0 gap-0 overflow-hidden">
        <div className="flex items-center justify-between border-b border-border px-4 py-3">
          <DialogTitle className="text-lg font-semibold">Buscar</DialogTitle>
        </div>
        <div className="p-4 border-b border-border">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Busca cursos, guías, talleres..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2"
              autoFocus
            />
          </div>
        </div>
        {/* Tabs */}
        <div className="flex border-b border-border px-4 gap-4 overflow-x-auto">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "py-3 text-sm font-medium whitespace-nowrap border-b-2 transition-colors",
                activeTab === tab.id
                  ? "border-primary text-primary"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>
        {/* Content */}
        <div className="max-h-[60vh] overflow-y-auto p-4">
          {isEmpty && (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Search className="h-12 w-12 text-muted-foreground/50 mb-4" />
              <p className="text-sm text-muted-foreground">
                Introduzca un término de búsqueda para encontrar cursos, guías y talleres.
              </p>
            </div>
          )}
          {!isEmpty && !hasResults && (
            <div className="py-8 text-center text-sm text-muted-foreground">
              No se encontraron resultados para &quot;{searchTerm}&quot;
            </div>
          )}
          {!isEmpty && hasResults && (
            <ul className="space-y-1">
              {results.map(({ type, item, href }) => (
                <li key={`${type}-${item.id}`}>
                  <Link
                    href={href}
                    onClick={() => onOpenChange(false)}
                    className="flex items-center gap-3 rounded-lg p-3 hover:bg-muted transition-colors"
                  >
                    {type === "course" && <BookOpen className="h-5 w-5 text-muted-foreground flex-shrink-0" />}
                    {type === "guide" && <FileText className="h-5 w-5 text-muted-foreground flex-shrink-0" />}
                    {type === "workshop" && <Calendar className="h-5 w-5 text-muted-foreground flex-shrink-0" />}
                    {type === "room" && <Brain className="h-5 w-5 text-muted-foreground flex-shrink-0" />}
                    <span className="text-sm font-medium truncate">{item.title || item.name}</span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

/** Disparar desde cualquier parte: window.dispatchEvent(new CustomEvent('openSearch')); */
export function useSearchDialog() {
  const [open, setOpen] = useState(false);
  useEffect(() => {
    const handler = () => setOpen(true);
    window.addEventListener("openSearch", handler);
    return () => window.removeEventListener("openSearch", handler);
  }, []);
  return { open, setOpen };
}
