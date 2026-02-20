import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface UnlockContentCTAProps {
  variant: "guide" | "course";
  className?: string;
  backUrl?: string;
}

export function UnlockContentCTA({ variant, className, backUrl }: UnlockContentCTAProps) {
  const [, setLocation] = useLocation();
  const title = variant === "guide" ? "Desbloquea esta guía" : "Desbloquea este curso";

  return (
    <div
      className={cn(
        "rounded-xl border border-border bg-muted/80 dark:bg-muted/60 p-6 lg:p-8",
        className
      )}
    >
      <h3 className="text-lg font-semibold text-foreground mb-1">{title}</h3>
      <p className="text-sm text-muted-foreground mb-4">
        Incluido con la versión de prueba o Pro
      </p>
      <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground mb-4">
        <span>Tu plan:</span>
        <span className="font-medium text-foreground">Invitado</span>
        <span className="text-muted-foreground">No he iniciado sesión</span>
      </div>
      <p className="text-sm text-muted-foreground mb-4">
        ¿Ya eres miembro?{" "}
        <button
          type="button"
          onClick={() => setLocation("/register")}
          className="font-medium text-primary hover:underline underline-offset-2"
        >
          Inicia sesión
        </button>
        .
      </p>
      <div className="flex flex-wrap gap-3">
        <Button
          onClick={() => setLocation("/planes")}
          className="bg-primary hover:bg-primary/90"
        >
          Ver planes Pro
          <ArrowRight className="h-4 w-4 ml-2" />
        </Button>
        {backUrl && (
          <Button
            variant="outline"
            onClick={() => setLocation(backUrl)}
            className="border-border text-foreground"
          >
            Volver
          </Button>
        )}
      </div>
    </div>
  );
}
