import { compressToEncodedURIComponent, decompressFromEncodedURIComponent } from 'lz-string';

/**
 * Form state that will be encoded in the URL
 */
export interface ShareableFormState {
  loanTypeId: string;
  responses: Record<string, any>;
  currentSectionIndex: number;
  completedSections: string[];
}

/**
 * Encode form state to a URL-safe token
 * 
 * Process:
 * 1. JSON stringify the state
 * 2. Compress using lz-string (URL-safe encoding)
 * 3. Return URL-safe string
 */
export function encodeFormState(state: ShareableFormState): string {
  try {
    const json = JSON.stringify(state);
    const compressed = compressToEncodedURIComponent(json);
    return compressed;
  } catch (error) {
    console.error('Failed to encode form state:', error);
    throw new Error('Failed to encode form state');
  }
}

/**
 * Decode a URL token back to form state
 * 
 * Process:
 * 1. Decompress the URL-safe string
 * 2. Parse JSON
 * 3. Validate structure
 * 4. Return state or null if invalid
 */
export function decodeFormState(token: string): ShareableFormState | null {
  try {
    const decompressed = decompressFromEncodedURIComponent(token);
    
    if (!decompressed) {
      console.warn('Failed to decompress token');
      return null;
    }
    
    const state = JSON.parse(decompressed) as ShareableFormState;
    
    // Validate structure
    if (!state.loanTypeId || !state.responses || !Array.isArray(state.completedSections)) {
      console.warn('Invalid form state structure');
      return null;
    }
    
    return state;
  } catch (error) {
    console.error('Failed to decode form state:', error);
    return null;
  }
}

/**
 * Get the current resume token from URL
 */
export function getResumeTokenFromURL(): string | null {
  if (typeof window === 'undefined') return null;
  
  const params = new URLSearchParams(window.location.search);
  return params.get('resume');
}

/**
 * Update URL with new resume token (without page reload)
 */
export function updateURLWithToken(token: string, loanTypeId: string): void {
  if (typeof window === 'undefined') return;
  
  const url = new URL(window.location.href);
  url.searchParams.set('resume', token);
  
  // Update URL without reload
  window.history.replaceState({}, '', url.toString());
}

/**
 * Clear resume token from URL
 */
export function clearResumeToken(): void {
  if (typeof window === 'undefined') return;
  
  const url = new URL(window.location.href);
  url.searchParams.delete('resume');
  
  window.history.replaceState({}, '', url.toString());
}
