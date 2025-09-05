// Supabase Storage Service - Migration from Google Cloud Storage
// This will replace the current Google Cloud Storage + Replit sidecar system

import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client (fallback for development)
const supabaseUrl = process.env.SUPABASE_URL || 'https://placeholder.supabase.co';
const supabaseKey = process.env.SUPABASE_ANON_KEY || 'placeholder-key';

// Only create client if we have real credentials
export const supabase = supabaseUrl !== 'https://placeholder.supabase.co' 
  ? createClient(supabaseUrl, supabaseKey)
  : null;

export class SupabaseStorageService {
  private bucketName = 'lesson-resources';

  constructor() {}

  // Upload file to Supabase Storage
  async uploadFile(filePath: string, file: File | Buffer): Promise<string> {
    if (!supabase) {
      throw new Error('Supabase no configurado - configurar variables de entorno');
    }
    
    const { data, error } = await supabase.storage
      .from(this.bucketName)
      .upload(filePath, file);

    if (error) throw error;
    return data.path;
  }

  // Get public URL for a file
  getPublicUrl(filePath: string): string {
    if (!supabase) {
      return `/placeholder/${filePath}`;
    }
    
    const { data } = supabase.storage
      .from(this.bucketName)
      .getPublicUrl(filePath);
    
    return data.publicUrl;
  }

  // Download file from Supabase Storage
  async downloadFile(filePath: string): Promise<Blob> {
    if (!supabase) {
      throw new Error('Supabase no configurado - configurar variables de entorno');
    }
    
    const { data, error } = await supabase.storage
      .from(this.bucketName)
      .download(filePath);

    if (error) throw error;
    return data;
  }

  // Delete file from Supabase Storage
  async deleteFile(filePath: string): Promise<void> {
    if (!supabase) {
      throw new Error('Supabase no configurado - configurar variables de entorno');
    }
    
    const { error } = await supabase.storage
      .from(this.bucketName)
      .remove([filePath]);

    if (error) throw error;
  }

  // Get signed URL for temporary access
  async getSignedUrl(filePath: string, expiresIn: number = 3600): Promise<string> {
    if (!supabase) {
      throw new Error('Supabase no configurado - configurar variables de entorno');
    }
    
    const { data, error } = await supabase.storage
      .from(this.bucketName)
      .createSignedUrl(filePath, expiresIn);

    if (error) throw error;
    return data.signedUrl;
  }

  // Legacy compatibility methods for migration
  async getLessonResourceFile(objectPath: string): Promise<any> {
    if (!supabase) {
      throw new Error('Supabase no configurado - sistema legacy no disponible');
    }
    return this.downloadFile(objectPath);
  }

  async downloadObject(file: any, res: any): Promise<void> {
    // Legacy method for compatibility - placeholder
    res.status(503).json({ message: "Storage en migración - usar Supabase" });
  }
}

export const supabaseStorage = new SupabaseStorageService();