import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileText, Download } from "lucide-react";

interface LessonResourcesProps {
  lessonId: string;
  className?: string;
}

interface LessonResource {
  id: string;
  title: string;
  description?: string;
  fileUrl: string;
  fileName: string;
  fileType: string;
  fileSize?: number;
}

export function LessonResources({ lessonId, className = "" }: LessonResourcesProps) {
  const { data: resources, isLoading } = useQuery<LessonResource[]>({
    queryKey: [`/api/lessons/${lessonId}/resources`],
    enabled: !!lessonId,
  });

  // No mostrar la card si no hay recursos
  if (!resources || resources.length === 0 || isLoading) {
    return null;
  }

  const handleDownload = async (resource: LessonResource) => {
    try {
      // Construct the download URL
      let downloadUrl: string;
      
      // Check if it's a server-relative path or Supabase URL
      if (resource.fileUrl.startsWith('/lesson-resources/')) {
        // Server-relative path - construct the correct API URL
        const cleanPath = resource.fileUrl.substring(1); // Remove leading '/'
        downloadUrl = `/api/${cleanPath}`;
      } else if (resource.fileUrl.includes('supabase.co/storage')) {
        // Supabase public URL - convert to server path
        // Extract resourceId and fileName from Supabase URL
        const urlMatch = resource.fileUrl.match(/lesson-resources\/([^\/]+)\/(.+)$/);
        if (urlMatch) {
          const [, resourceId, fileName] = urlMatch;
          downloadUrl = `/api/lesson-resources/${resourceId}/${fileName}`;
        } else {
          // Fallback: try to use the URL directly (will fail with CORS, but we'll catch it)
          downloadUrl = resource.fileUrl;
        }
      } else {
        // External URL - for external URLs, we need to use a proxy or fetch as blob
        downloadUrl = resource.fileUrl;
      }
      
      // Fetch the file as blob to force download (this bypasses browser's default behavior)
      const response = await fetch(downloadUrl, {
        credentials: 'include',
        method: 'GET',
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Download failed:', response.status, errorText);
        throw new Error(`Failed to download: ${response.status} ${response.statusText}`);
      }
      
      // Get the blob
      const blob = await response.blob();
      
      // Create object URL from blob
      const blobUrl = window.URL.createObjectURL(blob);
      
      // Create download link
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = resource.fileName || 'download';
      link.style.display = 'none';
      
      // Add to DOM
      document.body.appendChild(link);
      
      // Trigger download
      link.click();
      
      // Clean up
      setTimeout(() => {
        if (document.body.contains(link)) {
          document.body.removeChild(link);
        }
        window.URL.revokeObjectURL(blobUrl);
      }, 100);
    } catch (error: any) {
      console.error('Error downloading file:', error);
      alert(`Error al descargar el archivo: ${error.message || 'Error desconocido'}`);
    }
  };

  const formatFileSize = (bytes: number | undefined): string => {
    if (!bytes) return '';
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
    <Card className={`bg-[#1a1a1a] border-[#333333] ${className}`}>
      <CardHeader className="pb-3">
        <CardTitle className="text-white text-base font-semibold">
          Recursos
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0 space-y-2">
        {resources.map((resource) => (
          <div
            key={resource.id}
            className="flex items-center justify-between p-3 bg-[#2a2a2a] rounded-lg hover:bg-[#333333] transition-colors"
          >
            <div className="flex items-start space-x-3 flex-1">
              <div className="flex-shrink-0 mt-1">
                <FileText className="h-4 w-4 text-gray-400" />
              </div>
              <div className="flex-1 min-w-0">
               <h3 className="text-white text-sm font-medium leading-5 mb-1 truncate" title={resource.title}>
                  {resource.title}
                </h3>
                <div className="flex items-center space-x-2 text-xs text-gray-400">
                  <span className="uppercase">{resource.fileType}</span>
                  {resource.fileSize && (
                    <>
                      <span>•</span>
                      <span>{formatFileSize(resource.fileSize)}</span>
                    </>
                  )}
                </div>
                {resource.description && (
                  <p className="text-xs text-gray-400 mt-1 line-clamp-2">
                    {resource.description}
                  </p>
                )}
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleDownload(resource)}
              className="flex-shrink-0 ml-2 h-8 w-8 p-0 hover:bg-[#404040] text-gray-400 hover:text-white"
            >
              <Download className="h-4 w-4" />
            </Button>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}