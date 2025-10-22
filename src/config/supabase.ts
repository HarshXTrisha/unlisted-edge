import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

if (!supabaseUrl) {
  throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL environment variable');
}

if (!supabaseAnonKey) {
  throw new Error('Missing NEXT_PUBLIC_SUPABASE_ANON_KEY environment variable');
}

// Create Supabase client for client-side operations
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
  realtime: {
    params: {
      eventsPerSecond: 10,
    },
  },
});

// Types for our Supabase tables
export interface AnalyticsRecord {
  id: string;
  company_id: number;
  type: string;
  insights: any;
  created_at: string;
  updated_at: string;
}

export interface MarketTrend {
  id: string;
  trends_data: any;
  created_at: string;
}

export interface UserBehavior {
  id: string;
  user_id: number;
  action: string;
  metadata: any;
  created_at: string;
}

export interface PerformanceMetric {
  id: string;
  metric_name: string;
  metric_value: number;
  metadata: any;
  created_at: string;
}

// Helper functions for common operations
export const supabaseHelpers = {
  // Get AI insights for a company
  async getCompanyInsights(companyId: number) {
    const { data, error } = await supabase
      .from('analytics')
      .select('insights, updated_at')
      .eq('company_id', companyId)
      .eq('type', 'ai_analysis')
      .single();

    if (error) {
      console.error('Error fetching company insights:', error);
      return null;
    }

    return data;
  },

  // Track user behavior
  async trackUserBehavior(userId: number, action: string, metadata: any = {}) {
    const { error } = await supabase
      .from('user_behavior')
      .insert({
        user_id: userId,
        action,
        metadata,
      });

    if (error) {
      console.error('Error tracking user behavior:', error);
    }
  },

  // Get recent market trends
  async getMarketTrends(limit: number = 10) {
    const { data, error } = await supabase
      .from('market_trends')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('Error fetching market trends:', error);
      return [];
    }

    return data;
  },

  // Subscribe to real-time updates
  subscribeToAnalytics(callback: (payload: any) => void) {
    return supabase
      .channel('analytics-changes')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'analytics' }, 
        callback
      )
      .subscribe();
  },

  // Subscribe to market trends updates
  subscribeToMarketTrends(callback: (payload: any) => void) {
    return supabase
      .channel('market-trends-changes')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'market_trends' }, 
        callback
      )
      .subscribe();
  },
};

export default supabase;