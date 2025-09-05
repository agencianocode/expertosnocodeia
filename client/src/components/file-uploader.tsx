import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Upload, File, X, CheckCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface FileUploaderProps {
  onFileUpload: (fileInfo: {
    fileName: string;
    fileType: string;
    fileSize: number;
    fileUrl: string;
  }) => void;
  onCancel: () => void;
  accept?: string;
  maxSize?: number; // in bytes
}

export function FileUploader({ 
  onFileUpload, 
  onCancel, 
  accept = ".pdf,.doc,.docx,.xlsx,.xls,.ppt,.pptx,.txt,.zip",
  maxSize = 10 * 1024 * 1024 // 10MB default
}: FileUploaderProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const { toast } = useToast();

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (file.size > maxSize) {
      toast({
        title: "Archivo muy grande",
        description: `El archivo no puede ser mayor a ${Math.round(maxSize / 1024 / 1024)}MB`,
        variant: "destructive",
      });
      return;
    }

    setSelectedFile(file);
  };

  const handleUpload = async () => {
    if (!selectedFile) return;

    setIsUploading(true);
    setUploadProgress(0);

    try {
      // Get upload URL from server
      const response = await fetch('/api/lesson-resources/upload-url', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          fileName: selectedFile.name,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to get upload URL');
      }

      const { uploadURL } = await response.json();

      // Upload file to cloud storage
      const uploadResponse = await fetch(uploadURL, {
        method: 'PUT',
        headers: {
          'Content-Type': selectedFile.type || 'application/octet-stream',
        },
        body: selectedFile,
      });

      if (!uploadResponse.ok) {
        throw new Error('Failed to upload file');
      }

      setUploadProgress(100);

      // Extract file info
      const fileInfo = {
        fileName: selectedFile.name,
        fileType: selectedFile.name.split('.').pop()?.toLowerCase() || 'unknown',
        fileSize: selectedFile.size,
        fileUrl: uploadURL.split('?')[0], // Remove query parameters
      };

      toast({
        title: "Archivo subido",
        description: "El archivo se subió correctamente a la nube",
      });

      onFileUpload(fileInfo);
    } catch (error) {
      console.error('Upload error:', error);
      toast({
        title: "Error al subir archivo",
        description: "No se pudo subir el archivo. Inténtalo de nuevo.",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  const formatFileSize = (bytes: number): string => {
    const units = ['B', 'KB', 'MB', 'GB'];
    let size = bytes;
    let unitIndex = 0;
    
    while (size >= 1024 && unitIndex < units.length - 1) {
      size /= 1024;
      unitIndex++;
    }
    
    return `${size.toFixed(1)} ${units[unitIndex]}`;
  };

  return (
    <Card className="bg-slate-800/50 border-slate-700">
      <CardContent className="p-4">
        <div className="space-y-4">
          <div>
            <Label className="text-white mb-2 block">Seleccionar Archivo</Label>
            <div className="relative">
              <Input
                type="file"
                accept={accept}
                onChange={handleFileSelect}
                className="bg-slate-800 border-slate-600 text-white file:bg-slate-700 file:text-white file:border-0 file:rounded file:px-3 file:py-1 file:mr-3"
                disabled={isUploading}
              />
            </div>
            <p className="text-xs text-gray-400 mt-1">
              Máximo {Math.round(maxSize / 1024 / 1024)}MB • Tipos permitidos: PDF, DOC, XLSX, PPT, TXT, ZIP
            </p>
          </div>

          {selectedFile && (
            <div className="bg-slate-900/50 rounded-lg p-3 border border-slate-600">
              <div className="flex items-center space-x-3">
                <File className="h-5 w-5 text-blue-400" />
                <div className="flex-1 min-w-0">
                  <p className="text-white text-sm font-medium truncate">
                    {selectedFile.name}
                  </p>
                  <p className="text-gray-400 text-xs">
                    {formatFileSize(selectedFile.size)}
                  </p>
                </div>
                {uploadProgress === 100 && (
                  <CheckCircle className="h-5 w-5 text-green-400" />
                )}
              </div>

              {isUploading && (
                <div className="mt-3">
                  <div className="bg-slate-700 rounded-full h-2">
                    <div 
                      className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${uploadProgress}%` }}
                    />
                  </div>
                  <p className="text-xs text-gray-400 mt-1">
                    Subiendo archivo... {uploadProgress}%
                  </p>
                </div>
              )}
            </div>
          )}

          <div className="flex gap-2">
            <Button
              onClick={handleUpload}
              disabled={!selectedFile || isUploading}
              className="bg-purple-600 hover:bg-purple-700 flex-1"
            >
              {isUploading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Subiendo...
                </>
              ) : (
                <>
                  <Upload className="h-4 w-4 mr-2" />
                  Subir Archivo
                </>
              )}
            </Button>
            <Button
              variant="outline"
              onClick={onCancel}
              disabled={isUploading}
            >
              <X className="h-4 w-4 mr-2" />
              Cancelar
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}