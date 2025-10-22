'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { DYNAMIC_API_BASE_URL } from '@/config/api';

interface Company {
  id: number;
  symbol: string;
  name: string;
  current_price: string;
  sector: string;
}

interface AIInsight {
  id: number;
  company_id: number;
  company_name: string;
  symbol: string;
  insight_text: string;
  confidence_score: number;
  recommendation: 'BUY' | 'HOLD' | 'SELL' | 'WATCH';
  date_generated: string;
  key_factors: string[];
}

export default function AIPage() {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [selectedCompany, setSelectedCompany] = useState<number | null>(null);
  const [insight, setInsight] = useState<AIInsight | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchCompanies();
  }, []);

  const fetchCompanies = async () => {
    try {
      const apiBaseUrl = DYNAMIC_API_BASE_URL();
      const response = await fetch(`${apiBaseUrl}/companies`);
      const data = await response.json();
      
      if (response.ok) {
        setCompanies(data.companies.slice(0, 6)); // Show first 6 companies
      }
    } catch (err) {
      console.error('Failed to fetch companies');
    }
  };

  const generateInsight = async (companyId: number) => {
    setLoading(true);
    setError('');
    setInsight(null);

    try {
      const company = companies.find(c => c.id === companyId);
      if (!company) return;

      // Simulate AI analysis delay
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Generate mock AI insight based on company
      const insights: { [key: number]: AIInsight } = {
        1: { // BYJU'S
          id: 1,
          company_id: 1,
          company_name: "BYJU'S - Think and Learn",
          symbol: "BYJU",
          insight_text: "BYJU'S shows strong fundamentals in the EdTech sector with significant market penetration in K-12 education. The company has demonstrated resilience during market downturns and continues to expand globally. However, high cash burn rate and increased competition pose challenges. Current valuation appears reasonable given the long-term growth potential in digital education.",
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
          insight_text: "Dream11 dominates the fantasy sports market in India with strong user engagement and revenue growth. The company benefits from increasing smartphone penetration and sports viewership. Regulatory clarity around fantasy sports provides a stable operating environment. Strong monetization through contests and partnerships with major sports leagues.",
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
          insight_text: "Razorpay is well-positioned in India's rapidly growing digital payments ecosystem. The company has expanded beyond payments into lending and banking services, creating multiple revenue streams. Strong technology platform and merchant relationships provide competitive advantages. Growth in digital transactions and SME financing presents significant opportunities.",
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

      const mockInsight = insights[companyId] || {
        id: companyId,
        company_id: companyId,
        company_name: company.name,
        symbol: company.symbol,
        insight_text: `${company.name} operates in the ${company.sector} sector with current market dynamics showing mixed signals. The company demonstrates solid fundamentals but faces sector-specific challenges. Market conditions suggest a cautious approach with potential for moderate growth. Consider portfolio allocation and risk tolerance before investing.`,
        confidence_score: 65,
        recommendation: "WATCH" as const,
        date_generated: new Date().toISOString(),
        key_factors: [
          "Sector-specific market dynamics",
          "Moderate growth potential",
          "Mixed market signals",
          "Solid fundamental metrics",
          "Risk-adjusted returns consideration"
        ]
      };

      setInsight(mockInsight);
    } catch (err) {
      setError('Failed to generate AI insight. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const getRecommendationColor = (recommendation: string) => {
    const colors: { [key: string]: string } = {
      'BUY': 'bg-green-500/20 text-green-300 border-green-500/30',
      'HOLD': 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30',
      'SELL': 'bg-red-500/20 text-red-300 border-red-500/30',
      'WATCH': 'bg-blue-500/20 text-blue-300 border-blue-500/30'
    };
    return colors[recommendation] || 'bg-gray-500/20 text-gray-300 border-gray-500/30';
  };

  const getConfidenceColor = (score: number) => {
    if (score >= 80) return 'text-green-400';
    if (score >= 60) return 'text-yellow-400';
    return 'text-red-400';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 to-purple-900">
      {/* Header */}
      <header className="bg-black/20 backdrop-blur-sm border-b border-white/10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <Link href="/" className="text-xl md:text-2xl font-bold text-white">
              Unlisted Edge
            </Link>
            <nav className="flex items-center space-x-6">
              <Link href="/dashboard" className="text-white/70 hover:text-white">Dashboard</Link>
              <Link href="/companies" className="text-white/70 hover:text-white">Companies</Link>
              <Link href="/education" className="text-white/70 hover:text-white">Education</Link>
              <Link href="/news" className="text-white/70 hover:text-white">News</Link>
            </nav>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        {/* Page Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-white mb-4">
            🧠 AI Analytics & Insights
          </h1>
          <p className="text-xl text-blue-200 max-w-3xl mx-auto">
            Get data-driven insights powered by artificial intelligence to make informed investment decisions
          </p>
        </div>

        {/* How AI Works Section */}
        <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6 border border-white/20 mb-8">
          <h2 className="text-2xl font-bold text-white mb-4">How Our AI Analysis Works</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="text-4xl mb-3">📊</div>
              <h3 className="text-lg font-semibold text-white mb-2">Data Collection</h3>
              <p className="text-white/70 text-sm">
                Analyzes financial data, market trends, trading patterns, and sector performance
              </p>
            </div>
            <div className="text-center">
              <div className="text-4xl mb-3">🤖</div>
              <h3 className="text-lg font-semibold text-white mb-2">AI Processing</h3>
              <p className="text-white/70 text-sm">
                Advanced algorithms process multiple data points to identify patterns and trends
              </p>
            </div>
            <div className="text-center">
              <div className="text-4xl mb-3">💡</div>
              <h3 className="text-lg font-semibold text-white mb-2">Actionable Insights</h3>
              <p className="text-white/70 text-sm">
                Generates clear recommendations with confidence scores and key factors
              </p>
            </div>
          </div>
        </div>

        {/* Company Selection */}
        <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6 border border-white/20 mb-8">
          <h2 className="text-2xl font-bold text-white mb-6">Select Company for AI Analysis</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {companies.map((company) => (
              <button
                key={company.id}
                onClick={() => {
                  setSelectedCompany(company.id);
                  generateInsight(company.id);
                }}
                disabled={loading}
                className={`p-4 rounded-lg border transition-all duration-200 text-left ${
                  selectedCompany === company.id
                    ? 'bg-blue-500/20 border-blue-500/50'
                    : 'bg-white/5 border-white/20 hover:bg-white/10'
                } ${loading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
              >
                <div className="flex justify-between items-start mb-2">
                  <h3 className="text-lg font-bold text-white">{company.symbol}</h3>
                  <span className="text-green-400 font-semibold">
                    ₹{parseFloat(company.current_price).toLocaleString()}
                  </span>
                </div>
                <p className="text-blue-200 text-sm mb-1">{company.name}</p>
                <p className="text-white/50 text-xs">{company.sector}</p>
              </button>
            ))}
          </div>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="bg-white/10 backdrop-blur-sm rounded-lg p-8 border border-white/20 mb-8 text-center">
            <div className="animate-spin text-4xl mb-4">🧠</div>
            <h3 className="text-xl font-bold text-white mb-2">Analyzing Company Data...</h3>
            <p className="text-white/70">Our AI is processing financial data, market trends, and sector analysis</p>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="bg-red-500/20 border border-red-500/50 rounded-lg p-4 mb-8 text-center">
            <p className="text-red-200">{error}</p>
          </div>
        )}

        {/* AI Insight Results */}
        {insight && !loading && (
          <div className="bg-white/10 backdrop-blur-sm rounded-lg p-8 border border-white/20 mb-8">
            <div className="flex justify-between items-start mb-6">
              <div>
                <h2 className="text-2xl font-bold text-white mb-2">
                  AI Analysis: {insight.symbol}
                </h2>
                <p className="text-blue-200">{insight.company_name}</p>
              </div>
              <div className="text-right">
                <div className={`px-4 py-2 rounded-lg border font-semibold ${getRecommendationColor(insight.recommendation)}`}>
                  {insight.recommendation}
                </div>
                <p className="text-white/50 text-sm mt-2">
                  Generated: {new Date(insight.date_generated).toLocaleDateString()}
                </p>
              </div>
            </div>

            {/* Confidence Score */}
            <div className="mb-6">
              <div className="flex justify-between items-center mb-2">
                <span className="text-white font-semibold">Confidence Score</span>
                <span className={`font-bold ${getConfidenceColor(insight.confidence_score)}`}>
                  {insight.confidence_score}%
                </span>
              </div>
              <div className="w-full bg-white/20 rounded-full h-2">
                <div
                  className={`h-2 rounded-full ${
                    insight.confidence_score >= 80 ? 'bg-green-400' :
                    insight.confidence_score >= 60 ? 'bg-yellow-400' : 'bg-red-400'
                  }`}
                  style={{ width: `${insight.confidence_score}%` }}
                ></div>
              </div>
            </div>

            {/* Insight Text */}
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-white mb-3">AI Analysis</h3>
              <p className="text-white/80 leading-relaxed">{insight.insight_text}</p>
            </div>

            {/* Key Factors */}
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-white mb-3">Key Factors Analyzed</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {insight.key_factors.map((factor, index) => (
                  <div key={index} className="flex items-center">
                    <span className="text-blue-400 mr-2">•</span>
                    <span className="text-white/80 text-sm">{factor}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-4">
              <Link
                href={`/companies/${insight.company_id}`}
                className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-6 rounded-lg transition-colors"
              >
                View Company Details
              </Link>
              <Link
                href={`/trade/${insight.company_id}`}
                className="bg-green-600 hover:bg-green-700 text-white font-semibold py-2 px-6 rounded-lg transition-colors"
              >
                Trade Now
              </Link>
            </div>
          </div>
        )}

        {/* Disclaimer */}
        <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-6">
          <h3 className="text-lg font-bold text-yellow-300 mb-3">⚠️ AI Analysis Disclaimer</h3>
          <div className="text-yellow-200/80 space-y-2 text-sm">
            <p>• AI insights are generated based on available data and algorithmic analysis.</p>
            <p>• These recommendations should not be considered as financial advice.</p>
            <p>• Past performance and AI predictions do not guarantee future results.</p>
            <p>• Always conduct your own research and consult financial advisors before investing.</p>
            <p>• Market conditions can change rapidly, affecting the validity of AI recommendations.</p>
          </div>
        </div>
      </main>
    </div>
  );
}