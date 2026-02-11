// Utility functions to save and retrieve used emails from localStorage

export interface SavedEmail {
  email: string;
  provider: 'email' | 'google';
  lastUsed: number; // timestamp
  name?: string; // For Google accounts
}

const STORAGE_KEY = 'saved_emails';

/**
 * Save an email to localStorage
 */
export function saveEmail(email: string, provider: 'email' | 'google' = 'email', name?: string): void {
  try {
    const savedEmails = getSavedEmails();
    
    // Check if email already exists
    const existingIndex = savedEmails.findIndex(e => e.email.toLowerCase() === email.toLowerCase());
    
    if (existingIndex !== -1) {
      // Update existing entry
      savedEmails[existingIndex] = {
        email,
        provider,
        lastUsed: Date.now(),
        name: name || savedEmails[existingIndex].name,
      };
    } else {
      // Add new entry
      savedEmails.push({
        email,
        provider,
        lastUsed: Date.now(),
        name,
      });
    }
    
    // Sort by last used (most recent first) and limit to 10
    savedEmails.sort((a, b) => b.lastUsed - a.lastUsed);
    const limitedEmails = savedEmails.slice(0, 10);
    
    localStorage.setItem(STORAGE_KEY, JSON.stringify(limitedEmails));
  } catch (error) {
    console.error('Error saving email:', error);
  }
}

/**
 * Get all saved emails from localStorage
 */
export function getSavedEmails(): SavedEmail[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return [];
    
    const emails = JSON.parse(stored) as SavedEmail[];
    // Sort by last used (most recent first)
    return emails.sort((a, b) => b.lastUsed - a.lastUsed);
  } catch (error) {
    console.error('Error getting saved emails:', error);
    return [];
  }
}

/**
 * Get emails filtered by provider
 */
export function getEmailsByProvider(provider: 'email' | 'google'): SavedEmail[] {
  return getSavedEmails().filter(e => e.provider === provider);
}

/**
 * Clear all saved emails
 */
export function clearSavedEmails(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (error) {
    console.error('Error clearing saved emails:', error);
  }
}

