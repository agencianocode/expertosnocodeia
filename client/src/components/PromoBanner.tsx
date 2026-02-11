import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import { Link } from "wouter";
import { cn } from "@/lib/utils";

interface PromoBannerProps {
  title: string;
  subtitle?: string;
  description?: string;
  ctaText?: string;
  ctaLink?: string;
  backgroundImage?: string;
  backgroundColor?: string;
  textColor?: string;
  enhancedGlow?: boolean;
  preserveOriginalColors?: boolean; // Si es true, no aplica efectos de brillo/contraste
}

export function PromoBanner({
  title,
  subtitle,
  description,
  ctaText,
  ctaLink,
  backgroundImage,
  backgroundColor = "from-orange-600 to-red-600",
  textColor = "text-white",
  enhancedGlow = false,
  preserveOriginalColors = false
}: PromoBannerProps) {
  // Si hay imagen, mostrar como hero banner (full width, sin gradiente, sin título)
  if (backgroundImage) {
    return (
      <div className="relative w-full overflow-hidden">
        {/* Container con aspect ratio responsive - móvil usa altura mínima, desktop usa aspect ratio */}
        <div className="relative w-full min-h-[300px] sm:min-h-[400px] md:min-h-[500px] md:aspect-[1540/600] lg:min-h-[600px]">
          <div className="absolute inset-0">
            {/* Imagen con o sin efectos de brillo según preserveOriginalColors */}
            <img 
              src={backgroundImage} 
              alt={subtitle || title || "Banner"}
              className={cn(
                "w-full h-full object-cover",
                preserveOriginalColors
                  ? "" // Sin efectos de brillo/contraste para preservar colores originales
                  : enhancedGlow 
                    ? "brightness-[1.3] contrast-[1.3] saturate-[1.3]" 
                    : "brightness-[1.15] contrast-[1.15] saturate-[1.1]"
              )}
              style={{ objectPosition: 'center center' }}
            />
            
            {/* Efectos de glow/brillo solo si no se preservan colores originales */}
            {!preserveOriginalColors && (
              <>
                {/* Efecto de glow/brillo sobre la imagen */}
                <div className={cn(
                  "absolute inset-0 bg-gradient-to-b pointer-events-none",
                  enhancedGlow 
                    ? "from-transparent via-transparent to-black/10" 
                    : "from-transparent via-transparent to-black/20"
                )} />
                
                {/* Efecto de brillo sutil en los bordes */}
                <div className={cn(
                  "absolute inset-0 pointer-events-none",
                  enhancedGlow
                    ? "shadow-[inset_0_0_150px_rgba(255,255,255,0.2),inset_0_0_300px_rgba(255,140,0,0.3),inset_0_0_400px_rgba(255,200,0,0.2)]"
                    : "shadow-[inset_0_0_100px_rgba(255,255,255,0.1),inset_0_0_200px_rgba(255,140,0,0.15)]"
                )} />
                
                {/* Efecto de resplandor animado sutil */}
                <div className={cn(
                  "absolute inset-0 animate-pulse pointer-events-none",
                  enhancedGlow ? "opacity-80" : "opacity-60"
                )}
                     style={{ 
                       background: enhancedGlow
                         ? 'radial-gradient(circle at 50% 50%, rgba(255, 200, 0, 0.3) 0%, rgba(255, 140, 0, 0.2) 30%, transparent 70%)'
                         : 'radial-gradient(circle at 50% 50%, rgba(255, 140, 0, 0.15) 0%, transparent 70%)',
                       animation: 'pulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite'
                     }} 
                />
                
                {/* Efecto de brillo adicional para enhancedGlow */}
                {enhancedGlow && (
                  <>
                    {/* Brillo animado más intenso */}
                    <div className="absolute inset-0 opacity-70 pointer-events-none"
                         style={{
                           background: 'radial-gradient(ellipse at center, rgba(255, 255, 255, 0.15) 0%, rgba(255, 200, 0, 0.2) 20%, transparent 60%)',
                           animation: 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite'
                         }}
                    />
                    {/* Resplandor en los bordes superior e inferior */}
                    <div className="absolute top-0 left-0 right-0 h-32 bg-gradient-to-b from-white/10 via-transparent to-transparent pointer-events-none" />
                    <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-white/10 via-transparent to-transparent pointer-events-none" />
                  </>
                )}
              </>
            )}
          </div>
        </div>
        
        {/* Bottom fade to blend with content */}
        <div className="absolute bottom-0 left-0 right-0 h-16 sm:h-20 md:h-24 lg:h-28 xl:h-32 bg-gradient-to-t from-background to-transparent z-10" />
        
        {/* Content overlay - solo si hay subtitle, description o CTA */}
        {(subtitle || description || (ctaText && ctaLink)) && (
          <div className="absolute inset-0 flex items-center z-20">
            <div className="pl-4 sm:pl-8 md:pl-12 lg:pl-20 xl:pl-32 2xl:pl-40 pr-3 sm:pr-6 md:pr-8 lg:pr-12 xl:pr-16">
              <div className="max-w-2xl space-y-1.5 sm:space-y-2.5 md:space-y-3 lg:space-y-4">
              {subtitle && (
                <p className={`text-xs sm:text-base md:text-lg lg:text-xl xl:text-2xl font-medium ${textColor} drop-shadow-[0_0_8px_rgba(255,255,255,0.8),0_0_16px_rgba(255,140,0,0.5)]`}>
                  {subtitle}
                </p>
              )}
              
              {description && (
                <p className={`text-[10px] sm:text-sm md:text-base lg:text-lg xl:text-xl ${textColor} max-w-xl leading-relaxed drop-shadow-[0_0_6px_rgba(255,255,255,0.6),0_0_12px_rgba(255,140,0,0.4)]`}>
                  {description}
                </p>
              )}
              
              {ctaText && ctaLink && (
                <div className="pt-1.5 sm:pt-2.5 md:pt-3">
                  <Button 
                    size="sm"
                    className="bg-white text-black hover:bg-white/90 font-semibold text-xs sm:text-base md:text-lg lg:text-xl h-7 sm:h-9 md:h-10 lg:h-12 px-3 sm:px-5 md:px-6 lg:px-8 shadow-[0_0_20px_rgba(255,255,255,0.5)] hover:shadow-[0_0_30px_rgba(255,255,255,0.7)] transition-all duration-300"
                    asChild
                  >
                    <Link href={ctaLink}>
                      <span className="whitespace-nowrap">{ctaText}</span>
                      <ArrowRight className="ml-1.5 sm:ml-2.5 h-3.5 w-3.5 sm:h-5 sm:w-5 md:h-6 md:w-6" />
                    </Link>
                  </Button>
                </div>
              )}
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // Si no hay imagen, mostrar con gradiente (fallback)
  const content = (
    <Card className="relative overflow-hidden border-0 rounded-xl min-h-[180px] sm:min-h-[220px] md:min-h-[280px] lg:min-h-[320px]">
      {/* Background */}
      <div className="absolute inset-0">
        <div className={`w-full h-full bg-gradient-to-r ${backgroundColor}`} />
      </div>

      {/* Content */}
      <div className="relative z-10 px-3 sm:px-6 md:px-12 lg:px-16 py-3 sm:py-6 md:py-10 lg:py-14">
        <div className="max-w-2xl space-y-1 sm:space-y-1.5 md:space-y-2 lg:space-y-3">
          {subtitle && (
            <p className={`text-[10px] sm:text-xs md:text-sm lg:text-base font-medium ${textColor} opacity-90`}>
              {subtitle}
            </p>
          )}
          
          {description && (
            <p className={`text-[11px] sm:text-xs md:text-sm lg:text-base xl:text-lg ${textColor} opacity-90 max-w-xl leading-snug sm:leading-relaxed`}>
              {description}
            </p>
          )}
          
          {ctaText && ctaLink && (
            <div className="pt-1 sm:pt-2">
              <Button 
                size="sm"
                className="bg-white text-black hover:bg-white/90 font-semibold text-[11px] sm:text-xs md:text-sm lg:text-base h-7 sm:h-8 md:h-10 px-3 sm:px-4 md:px-6"
                asChild
              >
                <Link href={ctaLink}>
                  <span className="whitespace-nowrap">{ctaText}</span>
                  <ArrowRight className="ml-1 sm:ml-1.5 md:ml-2 h-3 w-3 sm:h-3.5 sm:w-3.5 md:h-4 md:w-4 lg:h-5 lg:w-5" />
                </Link>
              </Button>
            </div>
          )}
        </div>
      </div>
    </Card>
  );

  return content;
}
