import { useState, useRef } from "react";
import type { ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

interface ObjectUploaderProps {
  maxNumberOfFiles?: number;
  maxFileSize?: number;
  onGetUploadParameters: () => Promise<{
    method: "PUT";
    url: string;
  }>;
  onComplete?: (files: Array<{ uploadURL: string; name: string }>) => void;
  buttonClassName?: string;
  children: ReactNode;
  accept?: string;
}

export function ObjectUploader({
  maxNumberOfFiles = 1,
  maxFileSize = 10485760, // 10MB default
  onGetUploadParameters,
  onComplete,
  buttonClassName,
  children,
  accept = "*/*"
}: ObjectUploaderProps) {
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleFileSelect = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    
    if (files.length === 0) return;
    
    if (files.length > maxNumberOfFiles) {
      toast({
        title: "Error",
        description: `Solo puedes subir máximo ${maxNumberOfFiles} archivo(s)`,
        variant: "destructive"
      });
      return;
    }

    for (const file of files) {
      if (file.size > maxFileSize) {
        toast({
          title: "Error", 
          description: `El archivo ${file.name} es demasiado grande. Máximo ${Math.round(maxFileSize / (1024 * 1024))}MB`,
          variant: "destructive"
        });
        return;
      }
    }

    setIsUploading(true);

    try {
      const uploadResults = [];

      for (const file of files) {
        try {
          const { method, url } = await onGetUploadParameters();
          console.log('Upload parameters:', { method, url, fileName: file.name });
          
          const response = await fetch(url, {
            method,
            body: file,
          });

          console.log('Upload response status:', response.status, response.statusText);
          
          if (!response.ok) {
            const responseText = await response.text();
            console.error('Upload failed response:', responseText);
            throw new Error(`Upload failed: ${response.status} ${response.statusText}`);
          }

          const fileUrl = url.split('?')[0]; // Remove query parameters
          uploadResults.push({
            uploadURL: fileUrl,
            name: file.name
          });

          toast({
            title: "Archivo subido",
            description: `${file.name} se ha subido correctamente`
          });
        } catch (error) {
          console.error(`Error uploading ${file.name}:`, error);
          toast({
            title: "Error",
            description: `No se pudo subir ${file.name}: ${error.message}`,
            variant: "destructive"
          });
        }
      }

      if (uploadResults.length > 0 && onComplete) {
        onComplete(uploadResults);
      }
    } catch (error) {
      console.error('Upload error:', error);
      toast({
        title: "Error",
        description: "Error al subir archivo(s)",
        variant: "destructive"
      });
    } finally {
      setIsUploading(false);
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  return (
    <div>
      <input
        ref={fileInputRef}
        type="file"
        multiple={maxNumberOfFiles > 1}
        accept={accept}
        onChange={handleFileChange}
        style={{ display: 'none' }}
      />
      <Button 
        type="button"
        onClick={handleFileSelect}
        disabled={isUploading}
        className={buttonClassName}
      >
        {isUploading ? "Subiendo..." : children}
      </Button>
    </div>
  );
}