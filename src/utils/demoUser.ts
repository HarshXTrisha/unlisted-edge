// Demo user system for testing without Auth0
export interface DemoUser {
  id: number;
  email: string;
  first_name: string;
  last_name: string;
  wallet_balance: number;
}

export const DEMO_USER: DemoUser = {
  id: 1,
  email: 'demo@unlistededge.com',
  first_name: 'Demo',
  last_name: 'User',
  wallet_balance: 50000
};

export const getDemoUser = (): DemoUser => {
  const stored = localStorage.getItem('demo_user');
  if (stored) {
    return JSON.parse(stored);
  }
  return DEMO_USER;
};

export const updateDemoUser = (user: DemoUser): void => {
  localStorage.setItem('demo_user', JSON.stringify(user));
};

export const getDemoToken = (): string => {
  // Generate a simple demo JWT-like token
  return btoa(JSON.stringify({ userId: DEMO_USER.id, email: DEMO_USER.email }));
};