import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import { Link } from "wouter";

interface PromoBannerProps {
  title: string;
  subtitle?: string;
  description?: string;
  ctaText?: string;
  ctaLink?: string;
  backgroundImage?: string;
  backgroundColor?: string;
  textColor?: string;
}

export function PromoBanner({
  title,
  subtitle,
  description,
  ctaText,
  ctaLink,
  backgroundImage,
  backgroundColor = "from-orange-600 to-red-600",
  textColor = "text-white"
}: PromoBannerProps) {
  const content = (
    <Card className="relative overflow-hidden border-0 rounded-xl">
      {/* Background */}
      <div className="absolute inset-0">
        {backgroundImage ? (
          <>
            <img 
              src={backgroundImage} 
              alt={title}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/60 to-transparent" />
          </>
        ) : (
          <div className={`w-full h-full bg-gradient-to-r ${backgroundColor}`} />
        )}
      </div>

      {/* Content */}
      <div className="relative z-10 px-8 md:px-12 lg:px-16 py-12 md:py-16 lg:py-20">
        <div className="max-w-2xl">
          {subtitle && (
            <p className={`text-sm md:text-base font-medium mb-2 ${textColor} opacity-90`}>
              {subtitle}
            </p>
          )}
          
          <h2 className={`text-3xl md:text-4xl lg:text-5xl font-bold mb-4 ${textColor}`}>
            {title}
          </h2>
          
          {description && (
            <p className={`text-base md:text-lg mb-6 ${textColor} opacity-90 max-w-xl`}>
              {description}
            </p>
          )}
          
          {ctaText && ctaLink && (
            <Button 
              size="lg" 
              className="bg-white text-black hover:bg-white/90 font-semibold"
              asChild
            >
              <Link href={ctaLink}>
                {ctaText}
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
          )}
        </div>
      </div>
    </Card>
  );

  return content;
}
