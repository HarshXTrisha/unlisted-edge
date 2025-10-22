-- Supabase setup SQL for replacing MongoDB functionality
-- Run these commands in your Supabase SQL editor

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create analytics table (replaces MongoDB analytics collection)
CREATE TABLE IF NOT EXISTS analytics (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  company_id INTEGER NOT NULL,
  type VARCHAR(50) NOT NULL DEFAULT 'ai_analysis',
  insights JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(company_id, type)
);

-- Create market_trends table (replaces MongoDB market trends collection)
CREATE TABLE IF NOT EXISTS market_trends (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  trends_data JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create user_behavior table (replaces MongoDB user behavior collection)
CREATE TABLE IF NOT EXISTS user_behavior (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id INTEGER NOT NULL,
  action VARCHAR(100) NOT NULL,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create performance_metrics table (replaces MongoDB performance metrics)
CREATE TABLE IF NOT EXISTS performance_metrics (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  metric_name VARCHAR(100) NOT NULL,
  metric_value NUMERIC NOT NULL,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_analytics_company_id ON analytics(company_id);
CREATE INDEX IF NOT EXISTS idx_analytics_type ON analytics(type);
CREATE INDEX IF NOT EXISTS idx_analytics_updated_at ON analytics(updated_at);

CREATE INDEX IF NOT EXISTS idx_market_trends_created_at ON market_trends(created_at);

CREATE INDEX IF NOT EXISTS idx_user_behavior_user_id ON user_behavior(user_id);
CREATE INDEX IF NOT EXISTS idx_user_behavior_action ON user_behavior(action);
CREATE INDEX IF NOT EXISTS idx_user_behavior_created_at ON user_behavior(created_at);

CREATE INDEX IF NOT EXISTS idx_performance_metrics_name ON performance_metrics(metric_name);
CREATE INDEX IF NOT EXISTS idx_performance_metrics_created_at ON performance_metrics(created_at);

-- Create RPC functions for table creation (called from Node.js)
CREATE OR REPLACE FUNCTION create_analytics_table()
RETURNS TEXT AS $$
BEGIN
  -- Table creation is handled above, this is just for compatibility
  RETURN 'Analytics table ready';
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION create_market_trends_table()
RETURNS TEXT AS $$
BEGIN
  -- Table creation is handled above, this is just for compatibility
  RETURN 'Market trends table ready';
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION create_user_behavior_table()
RETURNS TEXT AS $$
BEGIN
  -- Table creation is handled above, this is just for compatibility
  RETURN 'User behavior table ready';
END;
$$ LANGUAGE plpgsql;

-- Create RPC function to get analytics summary
CREATE OR REPLACE FUNCTION get_analytics_summary()
RETURNS JSONB AS $$
DECLARE
  result JSONB;
BEGIN
  SELECT jsonb_build_object(
    'total_insights', (SELECT COUNT(*) FROM analytics),
    'total_trends', (SELECT COUNT(*) FROM market_trends),
    'total_user_actions', (SELECT COUNT(*) FROM user_behavior),
    'recent_activity', (
      SELECT COUNT(*) 
      FROM user_behavior 
      WHERE created_at >= NOW() - INTERVAL '24 hours'
    )
  ) INTO result;
  
  RETURN result;
END;
$$ LANGUAGE plpgsql;

-- Create RPC function to clean old data
CREATE OR REPLACE FUNCTION cleanup_old_data()
RETURNS TEXT AS $$
BEGIN
  -- Clean market trends older than 30 days
  DELETE FROM market_trends 
  WHERE created_at < NOW() - INTERVAL '30 days';
  
  -- Clean user behavior older than 90 days
  DELETE FROM user_behavior 
  WHERE created_at < NOW() - INTERVAL '90 days';
  
  -- Clean performance metrics older than 30 days
  DELETE FROM performance_metrics 
  WHERE created_at < NOW() - INTERVAL '30 days';
  
  RETURN 'Cleanup completed';
END;
$$ LANGUAGE plpgsql;

-- Enable Row Level Security (RLS) for better security
ALTER TABLE analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE market_trends ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_behavior ENABLE ROW LEVEL SECURITY;
ALTER TABLE performance_metrics ENABLE ROW LEVEL SECURITY;

-- Create policies for service role access (adjust as needed)
CREATE POLICY "Service role can manage analytics" ON analytics
  FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role can manage market_trends" ON market_trends
  FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role can manage user_behavior" ON user_behavior
  FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role can manage performance_metrics" ON performance_metrics
  FOR ALL USING (auth.role() = 'service_role');

-- Create a view for recent analytics (optional)
CREATE OR REPLACE VIEW recent_analytics AS
SELECT 
  a.company_id,
  a.insights,
  a.updated_at,
  COUNT(ub.id) as user_interactions
FROM analytics a
LEFT JOIN user_behavior ub ON ub.metadata->>'company_id' = a.company_id::text
WHERE a.updated_at >= NOW() - INTERVAL '7 days'
GROUP BY a.company_id, a.insights, a.updated_at
ORDER BY a.updated_at DESC;