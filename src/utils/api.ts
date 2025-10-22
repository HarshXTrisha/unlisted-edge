import { getDemoToken } from './demoUser';

const API_BASE_URL = 'http://localhost:5000/api';

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

export const apiCall = async <T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<ApiResponse<T>> => {
  try {
    const token = getDemoToken();
    
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
        ...options.headers,
      },
    });

    const data = await response.json();

    if (response.ok) {
      return { success: true, data };
    } else {
      return { success: false, error: data.message || 'API call failed' };
    }
  } catch (error) {
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Network error' 
    };
  }
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