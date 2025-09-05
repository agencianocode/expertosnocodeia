import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Upload, CheckCircle, AlertCircle } from "lucide-react";
import { ObjectUploader } from "@/components/ObjectUploader";
import { useToast } from "@/hooks/use-toast";
import { useAdmin } from "@/hooks/useAdmin";

export default function MediaUpload() {
  const { isAdmin, isLoading: adminLoading } = useAdmin();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [uploadedFiles, setUploadedFiles] = useState<any[]>([]);

  const uploadMutation = useMutation({
    mutationFn: async (fileData: any) => {
      // First, get upload URL
      const uploadResponse = await fetch('/api/admin/media/upload-url', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fileType: fileData.type })
      });
      const { uploadUrl } = await uploadResponse.json();

      // Upload file to storage
      await fetch(uploadUrl, {
        method: 'PUT',
        body: fileData.file,
        headers: { 'Content-Type': fileData.type }
      });

      // Create media record
      const mediaResponse = await fetch('/api/admin/media', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          filename: fileData.name,
          originalName: fileData.name,
          mimeType: fileData.type,
          size: fileData.size,
          url: uploadUrl.split('?')[0], // Remove query params
          type: fileData.type.startsWith('image/') ? 'image' : 
                fileData.type.startsWith('video/') ? 'video' : 'document',
          altText: '',
          description: '',
          isPublic: true
        })
      });
      return mediaResponse.json();
    },
    onSuccess: (data, variables) => {
      toast({
        title: "¡Éxito!",
        description: `${variables.name} subido correctamente`,
      });
      setUploadedFiles(prev => [...prev, { ...data, fileName: variables.name }]);
      queryClient.invalidateQueries({ queryKey: ["/api/admin/media"] });
    },
    onError: (error, variables) => {
      toast({
        title: "Error",
        description: `Error al subir ${variables.name}`,
        variant: "destructive",
      });
    },
  });

  if (adminLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen space-y-4">
        <h1 className="text-2xl font-bold text-red-500">Acceso Denegado</h1>
        <p className="text-gray-400">No tienes privilegios de administrador.</p>
        <Link href="/">
          <Button>Volver al Inicio</Button>
        </Link>
      </div>
    );
  }

  const handleUploadParameters = async () => {
    return {
      method: "PUT" as const,
      url: "", // This will be handled in the mutation
    };
  };

  const handleUploadComplete = (result: any) => {
    if (result.successful && result.successful.length > 0) {
      result.successful.forEach((file: any) => {
        uploadMutation.mutate({
          file: file.data,
          name: file.name,
          type: file.type,
          size: file.size
        });
      });
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center gap-4 mb-6">
        <Link href="/admin/media">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Gestión de Medios
          </Button>
        </Link>
        <div className="flex-1">
          <h1 className="text-3xl font-bold text-white">Subir Archivos</h1>
          <p className="text-gray-400 mt-1">Sube imágenes, videos y documentos a la plataforma</p>
        </div>
      </div>

      <div className="max-w-4xl space-y-6">
        {/* Upload Area */}
        <Card className="bg-slate-900/50 border-slate-700">
          <CardHeader>
            <CardTitle className="text-white">Seleccionar Archivos</CardTitle>
            <CardDescription className="text-gray-400">
              Puedes subir múltiples archivos a la vez. Tipos soportados: JPG, PNG, GIF, MP4, PDF, DOC
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="border-2 border-dashed border-slate-600 rounded-lg p-8 text-center">
              <Upload className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-white mb-2">
                Arrastra archivos aquí o haz clic para seleccionar
              </h3>
              <p className="text-gray-400 mb-6">
                Máximo 50MB por archivo. Hasta 10 archivos simultáneamente.
              </p>
              <ObjectUploader
                maxNumberOfFiles={10}
                maxFileSize={52428800} // 50MB
                onGetUploadParameters={handleUploadParameters}
                onComplete={handleUploadComplete}
                buttonClassName="bg-purple-600 hover:bg-purple-700"
              >
                <Upload className="h-4 w-4 mr-2" />
                Seleccionar Archivos
              </ObjectUploader>
            </div>
          </CardContent>
        </Card>

        {/* Upload Guidelines */}
        <Card className="bg-slate-900/50 border-slate-700">
          <CardHeader>
            <CardTitle className="text-white">Directrices de Subida</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h4 className="text-white font-medium mb-2">✅ Recomendaciones</h4>
                <ul className="text-gray-400 space-y-1 text-sm">
                  <li>• Usa nombres descriptivos para los archivos</li>
                  <li>• Imágenes: mínimo 1200px de ancho para mejor calidad</li>
                  <li>• Videos: formato MP4 preferible</li>
                  <li>• Comprime archivos grandes antes de subir</li>
                </ul>
              </div>
              <div>
                <h4 className="text-white font-medium mb-2">❌ Evita</h4>
                <ul className="text-gray-400 space-y-1 text-sm">
                  <li>• Archivos con caracteres especiales en el nombre</li>
                  <li>• Contenido con derechos de autor</li>
                  <li>• Archivos corruptos o dañados</li>
                  <li>• Imágenes de muy baja resolución</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Recently Uploaded */}
        {uploadedFiles.length > 0 && (
          <Card className="bg-slate-900/50 border-slate-700">
            <CardHeader>
              <CardTitle className="text-white">Archivos Subidos Recientemente</CardTitle>
              <CardDescription className="text-gray-400">
                Archivos subidos en esta sesión
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {uploadedFiles.map((file, index) => (
                  <div key={index} className="flex items-center gap-3 p-3 bg-slate-800 rounded-lg">
                    <CheckCircle className="h-5 w-5 text-green-400" />
                    <div className="flex-1">
                      <p className="text-white font-medium">{file.fileName}</p>
                      <p className="text-gray-400 text-sm">
                        {file.type} • {Math.round(file.size / 1024)} KB
                      </p>
                    </div>
                    <div className="text-green-400 text-sm">
                      Subido
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Error Guidelines */}
        <Card className="bg-slate-900/50 border-slate-700">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-yellow-400" />
              Solución de Problemas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-gray-400 space-y-2 text-sm">
              <p><strong className="text-white">Error de tamaño:</strong> El archivo excede los 50MB. Comprime el archivo antes de subir.</p>
              <p><strong className="text-white">Error de conexión:</strong> Verifica tu conexión a internet y vuelve a intentar.</p>
              <p><strong className="text-white">Formato no soportado:</strong> Convierte el archivo a un formato compatible (JPG, PNG, MP4, PDF, etc.).</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}