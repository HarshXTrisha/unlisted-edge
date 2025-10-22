const axios = require('axios');
const { getAIInsights, storeAIInsights } = require('../config/supabase');

const AI_SERVICE_URL = process.env.AI_SERVICE_URL || 'http://localhost:5001';
const AI_SERVICE_ENABLED = process.env.AI_SERVICE_ENABLED === 'true';

class AIService {
  constructor() {
    this.baseURL = AI_SERVICE_URL;
    this.enabled = AI_SERVICE_ENABLED;
    this.timeout = 10000; // 10 seconds
  }

  async isHealthy() {
    if (!this.enabled) return false;
    
    try {
      const response = await axios.get(`${this.baseURL}/health`, {
        timeout: this.timeout
      });
      return response.status === 200;
    } catch (error) {
      console.error('AI Service health check failed:', error.message);
      return false;
    }
  }

  async generateInsight(companyData) {
    // Input validation
    if (!companyData || typeof companyData !== 'object') {
      return this.getFallbackInsight({});
    }
    
    if (!companyData.id || !companyData.symbol) {
      return this.getFallbackInsight(companyData);
    }

    if (!this.enabled) {
      return this.getFallbackInsight(companyData);
    }

    try {
      // Check Supabase cache first
      const cached = await getAIInsights(companyData.id);
      
      if (cached) {
        console.log(`🧠 AI insight cache hit for company ${companyData.id}`);
        return cached;
      }

      // Call Python AI service
      const response = await axios.post(`${this.baseURL}/ai/insight`, companyData, {
        timeout: this.timeout,
        headers: {
          'Content-Type': 'application/json'
        }
      });

      const insight = response.data;
      
      // Cache the result in Supabase
      await storeAIInsights(companyData.id, insight);
      
      console.log(`🧠 AI insight generated for company ${companyData.symbol || companyData.id || 'unknown'}`);
      return insight;

    } catch (error) {
      console.error('AI Service insight generation failed:', error.message);
      
      // Fallback to mock insight
      return this.getFallbackInsight(companyData);
    }
  }

  async batchAnalysis(companies) {
    if (!this.enabled || !companies.length) {
      return companies.map(company => this.getFallbackInsight(company));
    }

    try {
      const response = await axios.post(`${this.baseURL}/ai/batch-analysis`, {
        companies
      }, {
        timeout: this.timeout * 2, // Longer timeout for batch
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (response.data.success) {
        console.log(`🧠 Batch AI analysis completed for ${response.data.processed_count} companies`);
        return response.data.insights;
      }

      throw new Error('Batch analysis failed');

    } catch (error) {
      console.error('AI Service batch analysis failed:', error.message);
      
      // Fallback to individual mock insights
      return companies.map(company => this.getFallbackInsight(company));
    }
  }

  async getMarketSentiment() {
    if (!this.enabled) {
      return this.getFallbackMarketSentiment();
    }

    try {
      // Check Supabase cache first
      const cached = await getAIInsights('market_sentiment');
      
      if (cached) {
        console.log('🧠 Market sentiment cache hit');
        return cached;
      }

      const response = await axios.get(`${this.baseURL}/ai/market-sentiment`, {
        timeout: this.timeout
      });

      const sentiment = response.data;
      
      // Cache in Supabase
      await storeAIInsights('market_sentiment', sentiment);
      
      console.log('🧠 Market sentiment analysis completed');
      return sentiment;

    } catch (error) {
      console.error('AI Service market sentiment failed:', error.message);
      return this.getFallbackMarketSentiment();
    }
  }

  getFallbackInsight(companyData) {
    // Guard against invalid input
    if (!companyData) {
      companyData = { id: 0, name: 'Unknown Company', symbol: 'UNKNOWN', sector: 'Unknown' };
    }
    
    const id = companyData?.id ?? 0;
    const name = companyData?.name ?? 'Unknown Company';
    const symbol = companyData?.symbol ?? 'UNKNOWN';
    const sector = companyData?.sector ?? 'Unknown';
    
    // Fallback mock insight when AI service is unavailable
    const insights = {
      1: { // BYJU'S
        id: 1,
        company_id: 1,
        company_name: "BYJU'S - Think and Learn",
        symbol: "BYJU",
        insight_text: "BYJU'S shows strong fundamentals in the EdTech sector with significant market penetration in K-12 education. The company has demonstrated resilience during market downturns and continues to expand globally. However, high cash burn rate and increased competition pose challenges.",
        confidence_score: 78,
        recommendation: "HOLD",
        date_generated: new Date().toISOString(),
        key_factors: [
          "Strong brand recognition in EdTech",
          "Global expansion strategy",
          "High cash burn rate concern",
          "Competitive market landscape",
          "Long-term education digitization trend"
        ]
      },
      4: { // Dream11
        id: 4,
        company_id: 4,
        company_name: "Dream11 Fantasy Sports",
        symbol: "DREAM11",
        insight_text: "Dream11 dominates the fantasy sports market in India with strong user engagement and revenue growth. The company benefits from increasing smartphone penetration and sports viewership. Regulatory clarity around fantasy sports provides a stable operating environment.",
        confidence_score: 85,
        recommendation: "BUY",
        date_generated: new Date().toISOString(),
        key_factors: [
          "Market leader in fantasy sports",
          "Strong user engagement metrics",
          "Regulatory environment favorable",
          "Growing sports viewership",
          "Effective monetization strategy"
        ]
      },
      5: { // Razorpay
        id: 5,
        company_id: 5,
        company_name: "Razorpay Software",
        symbol: "RAZORPAY",
        insight_text: "Razorpay is well-positioned in India's rapidly growing digital payments ecosystem. The company has expanded beyond payments into lending and banking services, creating multiple revenue streams. Strong technology platform and merchant relationships provide competitive advantages.",
        confidence_score: 82,
        recommendation: "BUY",
        date_generated: new Date().toISOString(),
        key_factors: [
          "Leading fintech platform",
          "Diversified product portfolio",
          "Strong merchant relationships",
          "Growing digital payments market",
          "Expansion into financial services"
        ]
      }
    };

    return insights[id] || {
      id: id,
      company_id: id,
      company_name: name,
      symbol: symbol,
      insight_text: `${name} operates in the ${sector} sector with current market dynamics showing mixed signals. The company demonstrates solid fundamentals but faces sector-specific challenges. Market conditions suggest a cautious approach with potential for moderate growth.`,
      confidence_score: 65,
      recommendation: "WATCH",
      date_generated: new Date().toISOString(),
      key_factors: [
        "Sector-specific market dynamics",
        "Moderate growth potential",
        "Mixed market signals",
        "Solid fundamental metrics",
        "Risk-adjusted returns consideration"
      ]
    };
  }

  getFallbackMarketSentiment() {
    return {
      sentiment: 'Neutral',
      score: 0.1,
      description: 'Market shows balanced sentiment with mixed signals from various indicators',
      confidence: 75,
      timestamp: new Date().toISOString(),
      factors: [
        'Technical indicator analysis',
        'Trading volume patterns',
        'Sector performance review',
        'Global market correlation',
        'Economic indicator assessment'
      ]
    };
  }
}

module.exports = new AIService();