// Supabase Storage Service - Complete replacement for Google Cloud Storage and Local Storage
// This is the primary storage service for all file operations

import { createClient } from '@supabase/supabase-js';
import { Response } from 'express';

// Initialize Supabase client (fallback for development)
const supabaseUrl = process.env.SUPABASE_URL || 'https://placeholder.supabase.co';
const supabaseKey = process.env.SUPABASE_ANON_KEY || 'placeholder-key';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || supabaseKey;

// Only create client if we have real credentials
export const supabase = supabaseUrl !== 'https://placeholder.supabase.co' 
  ? createClient(supabaseUrl, supabaseServiceKey) // Use service key for admin operations
  : null;

// Public client for client-side operations
export const supabasePublic = supabaseUrl !== 'https://placeholder.supabase.co'
  ? createClient(supabaseUrl, supabaseKey)
  : null;

export class SupabaseStorageService {
  constructor() {}

  /**
   * Determina el bucket según el tipo de archivo
   */
  private getBucketName(filePath: string): string {
    if (filePath.includes('post-images') || filePath.startsWith('post-images/')) {
      return 'post-images';
    }
    if (filePath.includes('lesson-resources') || filePath.startsWith('lesson-resources/')) {
      return 'lesson-resources';
    }
    if (filePath.includes('profile') || filePath.startsWith('profile-images/')) {
      return 'profile-images';
    }
    return 'attached-assets'; // Default bucket
  }

  /**
   * Normaliza la ruta del archivo para Supabase Storage
   */
  private normalizePath(filePath: string, bucketName?: string): string {
    // Remover prefijos comunes
    let normalized = filePath
      .replace(/^\/attached_assets\//, '')
      .replace(/^attached_assets\//, '')
      .replace(/^public\//, '')
      .replace(/^private\//, '')
      .replace(/^\/api\/object-proxy\/objects\//, '')
      .replace(/\\/g, '/'); // Normalizar separadores

    // Si tiene bucket en la ruta, extraerlo
    const bucket = bucketName || this.getBucketName(normalized);
    normalized = normalized.replace(new RegExp(`^${bucket}/?`), '');

    return normalized;
  }

  // Upload file to Supabase Storage
  async uploadFile(filePath: string, file: File | Buffer, options?: { contentType?: string; upsert?: boolean }): Promise<string> {
    if (!supabase) {
      throw new Error('Supabase no configurado - configurar variables de entorno');
    }
    
    const bucketName = this.getBucketName(filePath);
    const normalizedPath = this.normalizePath(filePath, bucketName);
    
    const { data, error } = await supabase.storage
      .from(bucketName)
      .upload(normalizedPath, file, {
        contentType: options?.contentType,
        upsert: options?.upsert ?? true,
      });

    if (error) {
      console.error('Supabase upload error:', error);
      throw error;
    }
    
    return data.path;
  }

  // Get public URL for a file
  getPublicUrl(filePath: string, bucketName?: string): string {
    if (!supabase) {
      console.warn('⚠️ Supabase no configurado, usando URL placeholder');
      return `/placeholder/${filePath}`;
    }
    
    const bucket = bucketName || this.getBucketName(filePath);
    const normalizedPath = this.normalizePath(filePath, bucket);
    
    console.log(`🔗 Generando URL pública:`, {
      bucket,
      normalizedPath,
      originalPath: filePath,
    });
    
    const { data } = supabase.storage
      .from(bucket)
      .getPublicUrl(normalizedPath);
    
    console.log(`✅ URL pública generada: ${data.publicUrl.substring(0, 80)}...`);
    return data.publicUrl;
  }

  // Download file from Supabase Storage
  async downloadFile(filePath: string, bucketName?: string): Promise<Blob> {
    if (!supabase) {
      throw new Error('Supabase no configurado - configurar variables de entorno');
    }
    
    const bucket = bucketName || this.getBucketName(filePath);
    const normalizedPath = this.normalizePath(filePath, bucket);
    
    // Intentar verificar si el archivo existe primero (opcional, para mejor diagnóstico)
    try {
      const { data, error } = await supabase.storage
        .from(bucket)
        .download(normalizedPath);

      if (error) {
        // Extraer información del error de manera más robusta
        const errorInfo: any = {
          bucket,
          path: normalizedPath,
          errorName: error.name || 'Unknown',
        };

        // Intentar extraer más información del error
        try {
          errorInfo.errorMessage = error.message || String(error) || 'Unknown error';
          errorInfo.errorStatus = (error as any).statusCode || (error as any).status || (error as any).statusCode || 'N/A';
          
          // Intentar obtener más detalles del error original
          if ((error as any).originalError) {
            errorInfo.originalError = String((error as any).originalError);
          }
          
          // Si el mensaje está vacío, intentar obtener información del stack
          if (!errorInfo.errorMessage || errorInfo.errorMessage === '{}' || errorInfo.errorMessage === 'Unknown error') {
            if ((error as any).stack) {
              const stackMatch = (error as any).stack.match(/Error: (.+)/);
              if (stackMatch) {
                errorInfo.errorMessage = stackMatch[1];
              }
            }
          }
        } catch (parseError) {
          errorInfo.errorMessage = `Error parsing error: ${String(parseError)}`;
        }
        
        // Solo loguear errores que no sean 404 (archivo no encontrado es esperado durante migración)
        const isNotFound = errorInfo.errorStatus === 404 || 
                          errorInfo.errorStatus === '404' ||
                          errorInfo.errorMessage?.includes('not found') ||
                          errorInfo.errorMessage?.includes('404');
        
        if (!isNotFound) {
          console.error(`❌ Error descargando archivo de Supabase:`, errorInfo);
        }
        
        // Lanzar error con información útil
        if (isNotFound) {
          throw new Error(`Archivo no encontrado: ${normalizedPath} en bucket ${bucket}`);
        } else if (errorInfo.errorStatus === 400 || errorInfo.errorStatus === '400') {
          throw new Error(`Solicitud inválida para archivo: ${normalizedPath}. Verifica que el bucket '${bucket}' existe y tiene las políticas correctas.`);
        } else {
          throw new Error(`Error de Supabase Storage: ${errorInfo.errorMessage || 'Error desconocido'}`);
        }
      }
      
      if (!data) {
        throw new Error(`No se recibieron datos para el archivo: ${normalizedPath}`);
      }
      
      return data;
    } catch (error: any) {
      // Si el error ya fue procesado arriba, relanzarlo
      if (error.message && error.message.includes('Archivo no encontrado') || 
          error.message.includes('Error de Supabase Storage') ||
          error.message.includes('Solicitud inválida')) {
        throw error;
      }
      
      // Para otros errores, proporcionar un mensaje más útil
      throw new Error(`Error descargando archivo de Supabase: ${error.message || String(error)}`);
    }
  }

  // Serve file directly to Express response
  async serveFile(filePath: string, res: Response, bucketName?: string, forceDownload: boolean = true): Promise<boolean> {
    // Verificar que los headers no se hayan enviado antes de intentar servir
    if (res.headersSent) {
      return false;
    }

    try {
      // Solo loguear en modo debug para reducir ruido en logs
      const isDebug = process.env.DEBUG_STORAGE === 'true';
      if (isDebug) {
        console.log(`📤 Sirviendo archivo:`, {
          filePath,
          bucketName,
          forceDownload,
        });
      }
      
      const blob = await this.downloadFile(filePath, bucketName);
      const arrayBuffer = await blob.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      
      // Verificar nuevamente que los headers no se hayan enviado
      if (res.headersSent) {
        return false;
      }
      
      // Determinar content type
      const ext = filePath.split('.').pop()?.toLowerCase();
      const mimeTypes: Record<string, string> = {
        'pdf': 'application/pdf',
        'png': 'image/png',
        'jpg': 'image/jpeg',
        'jpeg': 'image/jpeg',
        'gif': 'image/gif',
        'webp': 'image/webp',
        'svg': 'image/svg+xml',
        'mp4': 'video/mp4',
        'mp3': 'audio/mpeg',
        'zip': 'application/zip',
        'json': 'application/json',
        'doc': 'application/msword',
        'docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'xls': 'application/vnd.ms-excel',
        'xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'txt': 'text/plain',
        'csv': 'text/csv',
      };
      
      const contentType = mimeTypes[ext || ''] || blob.type || 'application/octet-stream';
      const fileName = filePath.split('/').pop() || 'download';
      
      // Set headers in correct order - Content-Disposition must be set before sending
      res.setHeader('Content-Type', contentType);
      res.setHeader('Content-Length', buffer.length.toString());
      // Para imágenes de perfil, no forzar descarga, mostrar en el navegador
      if (forceDownload && !filePath.includes('profile')) {
        res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(fileName)}"`);
      }
      res.setHeader('Cache-Control', 'public, max-age=31536000'); // Cache for 1 year
      res.send(buffer);
      
      if (isDebug) {
        console.log(`✅ Archivo servido exitosamente desde Supabase: ${fileName} (${buffer.length} bytes)`);
      }
      
      return true;
    } catch (error: any) {
      // Solo loguear errores que no sean "archivo no encontrado" (esperado durante migración)
      // o si estamos en modo debug
      const isNotFound = error.message?.includes('no encontrado') || 
                         error.message?.includes('not found') ||
                         error.message?.includes('404');
      const isDebug = process.env.DEBUG_STORAGE === 'true';
      
      if (!isNotFound || isDebug) {
        console.error(`❌ Error sirviendo archivo desde Supabase:`, {
          filePath,
          bucketName,
          error: error.message,
        });
      }
      
      // Asegurarse de que no se hayan enviado headers antes de retornar false
      // para que el fallback pueda funcionar
      return false;
    }
  }

  // Delete file from Supabase Storage
  async deleteFile(filePath: string, bucketName?: string): Promise<void> {
    if (!supabase) {
      throw new Error('Supabase no configurado - configurar variables de entorno');
    }
    
    const bucket = bucketName || this.getBucketName(filePath);
    const normalizedPath = this.normalizePath(filePath, bucket);
    
    const { error } = await supabase.storage
      .from(bucket)
      .remove([normalizedPath]);

    if (error) {
      console.error('Supabase delete error:', error);
      throw error;
    }
  }

  // Get signed URL for temporary access
  async getSignedUrl(filePath: string, expiresIn: number = 3600, bucketName?: string): Promise<string> {
    if (!supabase) {
      throw new Error('Supabase no configurado - configurar variables de entorno');
    }
    
    const bucket = bucketName || this.getBucketName(filePath);
    const normalizedPath = this.normalizePath(filePath, bucket);
    
    const { data, error } = await supabase.storage
      .from(bucket)
      .createSignedUrl(normalizedPath, expiresIn);

    if (error) {
      console.error('Supabase signed URL error:', error);
      throw error;
    }
    
    return data.signedUrl;
  }

  // Check if file exists
  async fileExists(filePath: string, bucketName?: string): Promise<boolean> {
    if (!supabase) {
      return false;
    }
    
    try {
      const bucket = bucketName || this.getBucketName(filePath);
      const normalizedPath = this.normalizePath(filePath, bucket);
      
      const { data, error } = await supabase.storage
        .from(bucket)
        .list(normalizedPath.split('/').slice(0, -1).join('/') || '', {
          limit: 1000,
          search: normalizedPath.split('/').pop() || '',
        });

      if (error) return false;
      
      return data?.some(file => file.name === normalizedPath.split('/').pop()) ?? false;
    } catch {
      return false;
    }
  }

  // List files in a directory
  async listFiles(prefix: string, bucketName: string = 'attached-assets'): Promise<string[]> {
    if (!supabase) {
      return [];
    }
    
    try {
      const { data, error } = await supabase.storage
        .from(bucketName)
        .list(prefix, {
          limit: 1000,
          sortBy: { column: 'name', order: 'asc' },
        });

      if (error) {
        console.error('Supabase list error:', error);
        return [];
      }

      return data?.map(file => `${prefix}/${file.name}`) || [];
    } catch (error) {
      console.error('Error listing files:', error);
      return [];
    }
  }

  // Legacy compatibility methods
  async getLessonResourceFile(objectPath: string): Promise<Blob> {
    return this.downloadFile(objectPath, 'lesson-resources');
  }

  async downloadObject(file: any, res: Response): Promise<void> {
    // Legacy method - try to serve from Supabase
    const filePath = file.name || file.path || '';
    const served = await this.serveFile(filePath, res);
    if (!served) {
      res.status(404).json({ message: "Archivo no encontrado" });
    }
  }
}

export const supabaseStorage = new SupabaseStorageService();