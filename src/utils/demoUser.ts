// Demo user system for testing without Auth0
export interface DemoUser {
  id: number;
  email: string;
  first_name: string;
  last_name: string;
  wallet_balance: number;
  role?: string;
  kyc_status?: string;
  is_active?: boolean;
}

export const DEMO_USERS: DemoUser[] = [
  {
    id: 1,
    email: 'demo@unlistededge.com',
    first_name: 'Demo',
    last_name: 'User',
    wallet_balance: 50000,
    role: 'user',
    kyc_status: 'pending',
    is_active: true
  },
  {
    id: 2,
    email: 'john@example.com',
    first_name: 'John',
    last_name: 'Doe',
    wallet_balance: 25000,
    role: 'user',
    kyc_status: 'pending',
    is_active: true
  },
  {
    id: 3,
    email: 'admin@platform.com',
    first_name: 'Admin',
    last_name: 'User',
    wallet_balance: 100000,
    role: 'admin',
    kyc_status: 'approved',
    is_active: true
  }
];

export const DEMO_USER: DemoUser = DEMO_USERS[0];

export const getDemoUser = (): DemoUser => {
  const stored = localStorage.getItem('demo_user');
  if (stored) {
    return JSON.parse(stored);
  }
  return DEMO_USER;
};

export const setDemoUser = (user: DemoUser): void => {
  localStorage.setItem('demo_user', JSON.stringify(user));
};

export const updateDemoUser = (user: DemoUser): void => {
  localStorage.setItem('demo_user', JSON.stringify(user));
};

export const getDemoToken = (): string => {
  const user = getDemoUser();
  // Generate a simple demo JWT-like token
  return btoa(JSON.stringify({ userId: user.id, email: user.email }));
};

// Simple hash function for demo purposes (NOT for production)
const simpleHash = (str: string): string => {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return hash.toString(16);
};

// Demo credential hashes (NOT for production - use proper bcrypt in production)
const DEMO_CREDENTIAL_HASHES: { [key: string]: string } = {
  'demo@unlistededge.com': simpleHash('demo123'),
  'john@example.com': simpleHash('john123'),
  'admin@platform.com': simpleHash('admin123')
};

export const loginDemoUser = (email: string, password: string): DemoUser | null => {
  // SECURITY WARNING: This is for demo purposes only
  // In production, use proper password hashing (bcrypt) and secure authentication
  if (process.env.NODE_ENV === 'production') {
    console.error('Demo authentication should not be used in production');
    return null;
  }

  const hashedPassword = simpleHash(password);
  
  if (DEMO_CREDENTIAL_HASHES[email] === hashedPassword) {
    const user = DEMO_USERS.find(u => u.email === email);
    if (user) {
      setDemoUser(user);
      return user;
    }
  }
  return null;
};

// For development reference only - these credentials are for demo purposes
export const getDemoCredentials = () => {
  if (process.env.NODE_ENV === 'production') {
    return null;
  }
  
  return [
    { email: 'demo@unlistededge.com', password: 'demo123', role: 'Verified Investor' },
    { email: 'john@example.com', password: 'john123', role: 'Regular User' },
    { email: 'admin@platform.com', password: 'admin123', role: 'Admin' }
  ];
};