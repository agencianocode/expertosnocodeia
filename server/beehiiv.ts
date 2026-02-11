import { storage } from './storage';

// Beehiiv API base URL
const BEEHIIV_API_BASE = 'https://api.beehiiv.com/v2';

// Helper to get API key
function getApiKey(): string {
  const apiKey = process.env.BEEHIIV_API_KEY;
  if (!apiKey) {
    throw new Error('BEEHIIV_API_KEY no está configurada en las variables de entorno');
  }
  return apiKey;
}

// Helper to get Publication ID
function getPublicationId(): string {
  let publicationId = process.env.BEEHIIV_PUBLICATION_ID;
  if (!publicationId) {
    throw new Error('BEEHIIV_PUBLICATION_ID no está configurada en las variables de entorno');
  }
  
  // Beehiiv requires publication ID to start with "pub_"
  // Auto-fix if the prefix is missing
  if (!publicationId.startsWith('pub_')) {
    console.log(`⚠️ Añadiendo prefijo "pub_" al Publication ID: ${publicationId} -> pub_${publicationId}`);
    publicationId = `pub_${publicationId}`;
  }
  
  return publicationId;
}

// Helper to make API requests to Beehiiv
async function beehiivRequest(
  method: string,
  endpoint: string,
  data?: any
): Promise<any> {
  const apiKey = getApiKey();
  const url = `${BEEHIIV_API_BASE}${endpoint}`;
  
  const options: RequestInit = {
    method,
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
  };

  if (data && (method === 'POST' || method === 'PUT' || method === 'PATCH')) {
    options.body = JSON.stringify(data);
  }

  const response = await fetch(url, options);

  if (!response.ok) {
    let errorData: any;
    try {
      errorData = await response.json();
    } catch {
      errorData = { message: response.statusText };
    }
    
    // Log detailed error for debugging
    console.error('❌ Beehiiv API Error:', {
      status: response.status,
      statusText: response.statusText,
      url,
      method,
      errorData,
      payload: data ? JSON.stringify(data).substring(0, 200) : undefined,
    });
    
    // Return more detailed error message
    const errorMessage = errorData.message || errorData.error || errorData.errors || response.statusText;
    throw new Error(`Beehiiv API error: ${response.status} ${response.statusText} - ${JSON.stringify(errorMessage)}`);
  }

  return response.json();
}

/**
 * Subscribe a user to Beehiiv newsletter
 */
export async function subscribeToBeehiiv(params: {
  email: string;
  firstName?: string | null;
  lastName?: string | null;
  reactivate?: boolean;
  tags?: string[];
  customFields?: Record<string, any>;
}): Promise<{ success: boolean; error?: string; subscriberId?: string }> {
  try {
    const publicationId = getPublicationId();

    // Build payload according to Beehiiv API documentation
    const payload: any = {
      email: params.email,
    };

    // Add reactivate_existing only if true (some APIs don't like false values)
    if (params.reactivate) {
      payload.reactivate_existing = true;
    }

    // Add custom fields if provided
    const customFields: Record<string, any> = {};
    if (params.firstName) {
      customFields.first_name = params.firstName;
    }
    if (params.lastName) {
      customFields.last_name = params.lastName;
    }
    if (params.customFields) {
      Object.assign(customFields, params.customFields);
    }
    
    // Only add custom_fields if we have at least one field
    if (Object.keys(customFields).length > 0) {
      payload.custom_fields = customFields;
    }

    // Add tags if provided (must be an array)
    if (params.tags && Array.isArray(params.tags) && params.tags.length > 0) {
      payload.tags = params.tags;
    }

    // Log payload for debugging (without sensitive data)
    console.log('📤 Enviando a Beehiiv:', {
      endpoint: `/publications/${publicationId}/subscriptions`,
      email: params.email,
      hasCustomFields: !!payload.custom_fields,
      hasTags: !!payload.tags,
      reactivate: payload.reactivate_existing || false,
    });

    const response = await beehiivRequest(
      'POST',
      `/publications/${publicationId}/subscriptions`,
      payload
    );

    return {
      success: true,
      subscriberId: response.id || response.data?.id || undefined,
    };
  } catch (error: any) {
    console.error('❌ Error suscribiendo a Beehiiv:', error);
    
    // Try with minimal payload if the full payload fails
    if (error.message?.includes('400')) {
      console.log('🔄 Intentando con payload mínimo (solo email)...');
      try {
        const publicationId = getPublicationId();
        const minimalPayload = { email: params.email };
        const minimalResponse = await beehiivRequest(
          'POST',
          `/publications/${publicationId}/subscriptions`,
          minimalPayload
        );
        
        console.log('✅ Suscripción exitosa con payload mínimo');
        return {
          success: true,
          subscriberId: minimalResponse.id || minimalResponse.data?.id || undefined,
        };
      } catch (minimalError: any) {
        console.error('❌ Error incluso con payload mínimo:', minimalError);
        return {
          success: false,
          error: `Error completo: ${error.message}. Error mínimo: ${minimalError.message}`,
        };
      }
    }
    
    return {
      success: false,
      error: error.message || 'Error desconocido al suscribir a Beehiiv',
    };
  }
}

/**
 * Unsubscribe a user from Beehiiv newsletter
 */
export async function unsubscribeFromBeehiiv(email: string): Promise<{ success: boolean; error?: string }> {
  try {
    const publicationId = getPublicationId();

    await beehiivRequest(
      'DELETE',
      `/publications/${publicationId}/subscriptions`,
      { email }
    );

    return { success: true };
  } catch (error: any) {
    console.error('❌ Error desuscribiendo de Beehiiv:', error);
    
    return {
      success: false,
      error: error.message || 'Error desconocido al desuscribir de Beehiiv',
    };
  }
}

/**
 * Update subscriber information in Beehiiv
 */
export async function updateBeehiivSubscriber(params: {
  email: string;
  firstName?: string | null;
  lastName?: string | null;
  tags?: string[];
  customFields?: Record<string, any>;
}): Promise<{ success: boolean; error?: string }> {
  try {
    const publicationId = getPublicationId();

    const payload: any = {};

    if (params.firstName || params.lastName || params.customFields) {
      payload.custom_fields = {
        ...(params.customFields || {}),
      };
      
      if (params.firstName) {
        payload.custom_fields.first_name = params.firstName;
      }
      if (params.lastName) {
        payload.custom_fields.last_name = params.lastName;
      }
    }

    if (params.tags && params.tags.length > 0) {
      payload.tags = params.tags;
    }

    await beehiivRequest(
      'PATCH',
      `/publications/${publicationId}/subscriptions`,
      {
        email: params.email,
        ...payload,
      }
    );

    return { success: true };
  } catch (error: any) {
    console.error('❌ Error actualizando suscriptor en Beehiiv:', error);
    
    return {
      success: false,
      error: error.message || 'Error desconocido al actualizar suscriptor en Beehiiv',
    };
  }
}

/**
 * Get subscriber information from Beehiiv
 */
export async function getBeehiivSubscriber(email: string): Promise<{ 
  success: boolean; 
  subscriber?: any; 
  error?: string 
}> {
  try {
    const publicationId = getPublicationId();

    const response = await beehiivRequest(
      'GET',
      `/publications/${publicationId}/subscriptions?email=${encodeURIComponent(email)}`
    );

    return {
      success: true,
      subscriber: response.data || response,
    };
  } catch (error: any) {
    console.error('❌ Error obteniendo suscriptor de Beehiiv:', error);
    
    if (error.message?.includes('404') || error.message?.includes('not found')) {
      return {
        success: false,
        error: 'Suscriptor no encontrado en Beehiiv',
      };
    }

    return {
      success: false,
      error: error.message || 'Error desconocido al obtener suscriptor de Beehiiv',
    };
  }
}

/**
 * Sync all users to Beehiiv (for initial setup or bulk sync)
 */
export async function syncAllUsersToBeehiiv(options?: {
  limit?: number;
  offset?: number;
  segment?: 'trial' | 'active' | 'cancelled' | 'none';
}): Promise<{
  synced: number;
  failed: number;
  errors: Array<{ email: string; error: string }>;
}> {
  try {
    const users = await storage.getAllUsers({
      limit: options?.limit || 1000,
      offset: options?.offset || 0,
      subscriptionStatus: options?.segment,
    });

    let synced = 0;
    let failed = 0;
    const errors: Array<{ email: string; error: string }> = [];

    // Sync users in batches to avoid rate limits
    const batchSize = 10;
    for (let i = 0; i < users.length; i += batchSize) {
      const batch = users.slice(i, i + batchSize);

      await Promise.all(
        batch.map(async (user) => {
          if (!user.email) return;

          try {
            // Determine tags based on subscription status
            const tags: string[] = [];
            if (user.subscription) {
              tags.push(`subscription-${user.subscription.status}`);
              if (user.subscription.plan) {
                tags.push(`plan-${user.subscription.plan.name.toLowerCase().replace(/\s+/g, '-')}`);
              }
            } else {
              tags.push('no-subscription');
            }

            const result = await subscribeToBeehiiv({
              email: user.email,
              firstName: user.firstName,
              lastName: user.lastName,
              reactivate: true, // Reactivate if already unsubscribed
              tags,
            });

            if (result.success) {
              synced++;
            } else {
              failed++;
              errors.push({ email: user.email, error: result.error || 'Error desconocido' });
            }
          } catch (error: any) {
            failed++;
            errors.push({ email: user.email, error: error.message || 'Error desconocido' });
          }
        })
      );

      // Small delay between batches to avoid rate limits
      if (i + batchSize < users.length) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }

    return { synced, failed, errors };
  } catch (error: any) {
    console.error('❌ Error sincronizando usuarios con Beehiiv:', error);
    throw error;
  }
}

/**
 * Check Beehiiv configuration
 */
export function checkBeehiivConfig(): {
  configured: boolean;
  hasApiKey: boolean;
  hasPublicationId: boolean;
  message: string;
} {
  const hasApiKey = !!process.env.BEEHIIV_API_KEY;
  const hasPublicationId = !!process.env.BEEHIIV_PUBLICATION_ID;

  return {
    configured: hasApiKey && hasPublicationId,
    hasApiKey,
    hasPublicationId,
    message: hasApiKey && hasPublicationId
      ? '✅ Beehiiv está configurado correctamente'
      : !hasApiKey && !hasPublicationId
        ? '❌ BEEHIIV_API_KEY y BEEHIIV_PUBLICATION_ID no están configuradas'
        : !hasApiKey
          ? '❌ BEEHIIV_API_KEY no está configurada'
          : '❌ BEEHIIV_PUBLICATION_ID no está configurada',
  };
}
