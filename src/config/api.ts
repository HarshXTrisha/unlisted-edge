// Centralized API configuration with network support
const getApiBaseUrl = () => {
  // If environment variable is set, use it
  if (process.env.NEXT_PUBLIC_API_URL) {
    return process.env.NEXT_PUBLIC_API_URL;
  }
  
  // Default to localhost for server-side rendering
  return 'http://localhost:5000';
};

// Get dynamic API URL for client-side
export const getDynamicApiUrl = () => {
  // Server-side or build time
  if (typeof window === 'undefined') {
    return getApiBaseUrl();
  }
  
  // Client-side - detect network IP
  const hostname = window.location.hostname;
  
  // If accessing via network IP (not localhost), use the same IP for API
  if (hostname !== 'localhost' && hostname !== '127.0.0.1') {
    return `http://${hostname}:5000`;
  }
  
  return 'http://localhost:5000';
};

const baseUrl = getApiBaseUrl();
// Normalize URL and ensure it ends with /api
export const API_BASE_URL = `${baseUrl.replace(/\/$/, '')}/api`;

// Dynamic API URL that works on both client and server
export const DYNAMIC_API_BASE_URL = () => `${getDynamicApiUrl().replace(/\/$/, '')}/api`;

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
}

// Centralized API request helper with timeout and error handling
export const apiRequest = async <T = any>(
  endpoint: string,
  options: RequestInit & { timeout?: number } = {}
): Promise<ApiResponse<T>> => {
  const { timeout = 10000, ...fetchOptions } = options;
  
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);
  
  const apiBaseUrl = DYNAMIC_API_BASE_URL();

  try {
    const response = await fetch(`${apiBaseUrl}${endpoint}`, {
      ...fetchOptions,
      signal: controller.signal,
      headers: {
        'Content-Type': 'application/json',
        ...fetchOptions.headers,
      },
    });

    clearTimeout(timeoutId);

    let data;
    try {
      data = await response.json();
    } catch (parseError) {
      // Handle non-JSON responses
      const textContent = await response.text();
      console.error('JSON parse error:', parseError);
      
      if (response.ok) {
        return { 
          success: false, 
          error: 'Server returned invalid JSON response' 
        };
      } else {
        return { 
          success: false, 
          error: `HTTP ${response.status}: ${response.statusText}` 
        };
      }
    }

    if (response.ok) {
      return { success: true, data };
    } else {
      return { 
        success: false, 
        error: data.message || `HTTP ${response.status}: ${response.statusText}` 
      };
    }
  } catch (error) {
    clearTimeout(timeoutId);
    
    if (error instanceof Error) {
      if (error.name === 'AbortError') {
        return { success: false, error: 'Request timeout' };
      }
      return { success: false, error: error.message };
    }
    
    return { success: false, error: 'Network error' };
  } finally {
    clearTimeout(timeoutId);
  }
};