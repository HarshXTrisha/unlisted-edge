const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');

dotenv.config();

// Supabase configuration
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY; // Use service role for server-side operations
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY; // For client-side operations

if (!supabaseUrl) {
    console.error('❌ SUPABASE_URL environment variable is required');
    process.exit(1);
}

if (!supabaseServiceKey) {
    console.error('❌ SUPABASE_SERVICE_ROLE_KEY environment variable is required');
    process.exit(1);
}

if (!supabaseAnonKey) {
    console.error('❌ SUPABASE_ANON_KEY environment variable is required for client operations');
    process.exit(1);
}

// Server-side Supabase client (with service role key for admin operations)
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
        autoRefreshToken: false,
        persistSession: false
    }
});

// Client-side Supabase client (with anon key for public operations)
// SECURITY: Never use service role key as fallback for client operations
const supabaseClient = createClient(supabaseUrl, supabaseAnonKey);

/**
 * Initialize Supabase tables for analytics and caching
 */
const initializeSupabaseTables = async () => {
    try {
        console.log('🔄 Initializing Supabase tables...');

        // Create analytics table for AI insights cache
        const { error: analyticsError } = await supabaseAdmin.rpc('create_analytics_table');
        if (analyticsError && !analyticsError.message.includes('already exists')) {
            console.warn('Analytics table creation warning:', analyticsError.message);
        }

        // Create market_trends table for market data cache
        const { error: trendsError } = await supabaseAdmin.rpc('create_market_trends_table');
        if (trendsError && !trendsError.message.includes('already exists')) {
            console.warn('Market trends table creation warning:', trendsError.message);
        }

        // Create user_behavior table for user analytics
        const { error: behaviorError } = await supabaseAdmin.rpc('create_user_behavior_table');
        if (behaviorError && !behaviorError.message.includes('already exists')) {
            console.warn('User behavior table creation warning:', behaviorError.message);
        }

        console.log('✅ Supabase tables initialized successfully');
    } catch (error) {
        console.error('❌ Failed to initialize Supabase tables:', error);
        // Don't exit process, continue without analytics cache
        console.log('⚠️  Continuing without analytics cache...');
    }
};

/**
 * Store AI insights in Supabase
 */
const storeAIInsights = async (companyId, insights) => {
    try {
        const { data, error } = await supabaseAdmin
            .from('analytics')
            .upsert({
                company_id: companyId,
                insights: insights,
                type: 'ai_analysis',
                updated_at: new Date().toISOString()
                // created_at will be set by DB default on insert
            }, {
                onConflict: 'company_id,type'
            });

        if (error) {
            console.error('Failed to store AI insights:', error);
            return false;
        }

        return true;
    } catch (error) {
        console.error('Error storing AI insights:', error);
        return false;
    }
};

/**
 * Get AI insights from Supabase cache
 */
const getAIInsights = async (companyId) => {
    try {
        const { data, error } = await supabaseAdmin
            .from('analytics')
            .select('insights, updated_at')
            .eq('company_id', companyId)
            .eq('type', 'ai_analysis')
            .single();

        if (error) {
            if (error.code === 'PGRST116') {
                // No data found
                return null;
            }
            console.error('Failed to get AI insights:', error);
            return null;
        }

        // Check if cache is still fresh (less than 1 hour old)
        const cacheAge = Date.now() - new Date(data.updated_at).getTime();
        const maxCacheAge = 60 * 60 * 1000; // 1 hour

        if (cacheAge > maxCacheAge) {
            return null; // Cache expired
        }

        return data.insights;
    } catch (error) {
        console.error('Error getting AI insights:', error);
        return null;
    }
};

/**
 * Store market trends data
 */
const storeMarketTrends = async (trendsData) => {
    try {
        const { data, error } = await supabaseAdmin
            .from('market_trends')
            .insert({
                trends_data: trendsData,
                created_at: new Date().toISOString()
            });

        if (error) {
            console.error('Failed to store market trends:', error);
            return false;
        }

        return true;
    } catch (error) {
        console.error('Error storing market trends:', error);
        return false;
    }
};

/**
 * Store user behavior analytics
 */
const storeUserBehavior = async (userId, action, metadata = {}) => {
    try {
        const { data, error } = await supabaseAdmin
            .from('user_behavior')
            .insert({
                user_id: userId,
                action: action,
                metadata: metadata,
                created_at: new Date().toISOString()
            });

        if (error) {
            console.error('Failed to store user behavior:', error);
            return false;
        }

        return true;
    } catch (error) {
        console.error('Error storing user behavior:', error);
        return false;
    }
};

/**
 * Get analytics data for admin dashboard
 */
const getAnalytics = async () => {
    try {
        // Get recent user behavior
        const { data: behaviorData, error: behaviorError } = await supabaseAdmin
            .from('user_behavior')
            .select('*')
            .gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()) // Last 7 days
            .order('created_at', { ascending: false });

        if (behaviorError) {
            console.error('Failed to get behavior analytics:', behaviorError);
        }

        // Get market trends
        const { data: trendsData, error: trendsError } = await supabaseAdmin
            .from('market_trends')
            .select('*')
            .order('created_at', { ascending: false })
            .limit(10);

        if (trendsError) {
            console.error('Failed to get market trends:', trendsError);
        }

        return {
            userBehavior: behaviorData || [],
            marketTrends: trendsData || []
        };
    } catch (error) {
        console.error('Error getting analytics:', error);
        return {
            userBehavior: [],
            marketTrends: []
        };
    }
};

module.exports = {
    supabaseAdmin,
    supabaseClient,
    initializeSupabaseTables,
    storeAIInsights,
    getAIInsights,
    storeMarketTrends,
    storeUserBehavior,
    getAnalytics
};