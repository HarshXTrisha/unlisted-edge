import { getDemoToken } from './demoUser';
import { DYNAMIC_API_BASE_URL, apiRequest, ApiResponse } from '@/config/api';

export type { ApiResponse };

export const apiCall = async <T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<ApiResponse<T>> => {
  const token = getDemoToken();

  return apiRequest<T>(endpoint, {
    ...options,
    headers: {
      'Authorization': `Bearer ${token}`,
      ...options.headers,
    },
  });
};

// Helper function to make HTTP requests with consistent timeout and error handling
const makeRequest = async (
  endpoint: string,
  method: string,
  body?: unknown
): Promise<Response> => {
  const token = getDemoToken();
  const apiBaseUrl = DYNAMIC_API_BASE_URL();
  
  let controller: AbortController;
  let timeoutId: ReturnType<typeof setTimeout> | null = null;
  
  try {
    controller = new AbortController();
    timeoutId = setTimeout(() => controller.abort(), 10000);
    
    const requestInit: RequestInit = {
      method,
      signal: controller.signal,
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    };
    
    if (body !== undefined) {
      requestInit.body = JSON.stringify(body);
    }
    
    const response = await fetch(`${apiBaseUrl}${endpoint}`, requestInit);
    return response;
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      throw new Error('Request timeout');
    }
    throw error;
  } finally {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
  }
};

// API client with centralized error handling and timeout
export const api = {
  get: async (endpoint: string) => makeRequest(endpoint, 'GET'),
  post: async (endpoint: string, data: unknown) => makeRequest(endpoint, 'POST', data),
  patch: async (endpoint: string, data: unknown) => makeRequest(endpoint, 'PATCH', data),
  delete: async (endpoint: string) => makeRequest(endpoint, 'DELETE'),
};

// Specific API functions
export const placeOrder = async (orderData: {
  company_id: number;
  type: 'BUY' | 'SELL';
  order_type: 'MARKET' | 'LIMIT';
  quantity: number;
  price?: number;
}) => {
  return apiCall('/orders', {
    method: 'POST',
    body: JSON.stringify(orderData),
  });
};

export const getPortfolio = async () => {
  return apiCall('/portfolio');
};

export const getWalletBalance = async () => {
  return apiCall('/wallet/balance');
};

export const depositFunds = async (amount: number) => {
  return apiCall('/wallet/deposit', {
    method: 'POST',
    body: JSON.stringify({ amount }),
  });
};

export const withdrawFunds = async (amount: number) => {
  return apiCall('/wallet/withdraw', {
    method: 'POST',
    body: JSON.stringify({ amount }),
  });
};