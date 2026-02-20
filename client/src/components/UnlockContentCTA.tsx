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
        "rounded-xl border border-white/10 p-6 lg:p-8",
        "bg-gradient-to-b from-[#21212B] to-[#2a2a38]",
        className
      )}
    >
      <h3 className="text-[40px] font-bold text-white leading-tight mb-2">{title}</h3>
      <p className="text-base text-[#D0D0D0] mb-4">
        Incluido con la versión de prueba o Pro
      </p>
      <div className="flex flex-wrap items-center gap-2 text-base text-[#D0D0D0] mb-4">
        <span>Tu plan:</span>
        <span className="font-semibold text-white">Invitado</span>
        <span className="text-[#D0D0D0]">No he iniciado sesión</span>
      </div>
      <p className="text-base text-[#D0D0D0] mb-6">
        ¿Ya eres miembro?{" "}
        <button
          type="button"
          onClick={() => setLocation("/register")}
          className="font-medium text-[#407BFF] hover:underline underline-offset-2"
        >
          Inicia sesión
        </button>
        .
      </p>
      <Button
        onClick={() => setLocation("/planes")}
        className="bg-[#407BFF] hover:bg-[#407BFF]/90 text-white border-0"
      >
        Ver planes Pro
        <ArrowRight className="h-4 w-4 ml-2" />
      </Button>
    </div>
  );
}
