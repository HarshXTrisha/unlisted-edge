'use client';

import { useState } from 'react';
import Link from 'next/link';

interface EducationContent {
  id: number;
  title: string;
  description: string;
  category: string;
  type: 'article' | 'video' | 'guide';
  duration: string;
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
  content: string;
}

export default function EducationPage() {
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [selectedContent, setSelectedContent] = useState<EducationContent | null>(null);

  const educationContent: EducationContent[] = [
    {
      id: 1,
      title: "What are Unlisted Shares?",
      description: "Learn the basics of unlisted shares and how they differ from publicly traded stocks.",
      category: "BASICS",
      type: "article",
      duration: "5 min read",
      difficulty: "Beginner",
      content: `
        <h3>Understanding Unlisted Shares</h3>
        <p>Unlisted shares are equity shares of companies that are not listed on any stock exchange like NSE or BSE. These companies are typically startups, private companies, or companies that have not yet gone public through an IPO.</p>
        
        <h4>Key Characteristics:</h4>
        <ul>
          <li><strong>Not traded on exchanges:</strong> Cannot be bought/sold through regular stock brokers</li>
          <li><strong>Limited liquidity:</strong> Harder to buy and sell compared to listed shares</li>
          <li><strong>Higher risk:</strong> Less regulatory oversight and transparency</li>
          <li><strong>Potential for high returns:</strong> Early investment in successful companies can yield significant returns</li>
        </ul>

        <h4>Examples of Unlisted Companies:</h4>
        <p>Many well-known companies were once unlisted, including BYJU'S, Dream11, Razorpay, and Swiggy before their public listings or funding rounds.</p>

        <h4>Why Invest in Unlisted Shares?</h4>
        <ul>
          <li>Access to high-growth companies before they go public</li>
          <li>Potential for significant returns if the company succeeds</li>
          <li>Diversification of investment portfolio</li>
          <li>Participation in India's startup ecosystem</li>
        </ul>
      `
    },
    {
      id: 2,
      title: "How to Value Unlisted Companies",
      description: "Learn different methods to evaluate and value unlisted companies before investing.",
      category: "VALUATION",
      type: "guide",
      duration: "10 min read",
      difficulty: "Intermediate",
      content: `
        <h3>Valuation Methods for Unlisted Companies</h3>
        <p>Valuing unlisted companies is more challenging than listed ones due to lack of market price. Here are key methods:</p>
        
        <h4>1. Revenue Multiple Method</h4>
        <p>Compare the company's revenue with similar listed companies and apply industry multiples.</p>
        <p><strong>Formula:</strong> Valuation = Revenue × Industry P/S Ratio</p>

        <h4>2. Discounted Cash Flow (DCF)</h4>
        <p>Project future cash flows and discount them to present value.</p>
        <ul>
          <li>Estimate future cash flows for 5-10 years</li>
          <li>Apply appropriate discount rate</li>
          <li>Calculate terminal value</li>
        </ul>

        <h4>3. Asset-Based Valuation</h4>
        <p>Sum up all assets and subtract liabilities to get book value.</p>

        <h4>4. Comparable Company Analysis</h4>
        <p>Compare with similar companies in terms of:</p>
        <ul>
          <li>Business model</li>
          <li>Market size</li>
          <li>Growth rate</li>
          <li>Profitability</li>
        </ul>

        <h4>Key Factors to Consider:</h4>
        <ul>
          <li>Management quality and track record</li>
          <li>Market opportunity and competition</li>
          <li>Financial health and burn rate</li>
          <li>Regulatory environment</li>
        </ul>
      `
    },
    {
      id: 3,
      title: "Risks in Unlisted Share Trading",
      description: "Understand the various risks involved in trading unlisted shares and how to mitigate them.",
      category: "RISK",
      type: "article",
      duration: "7 min read",
      difficulty: "Beginner",
      content: `
        <h3>Understanding Risks in Unlisted Share Trading</h3>
        <p>While unlisted shares offer potential for high returns, they come with significant risks that investors must understand.</p>
        
        <h4>1. Liquidity Risk</h4>
        <ul>
          <li>Difficult to find buyers when you want to sell</li>
          <li>No organized market for price discovery</li>
          <li>May have to sell at significant discount</li>
        </ul>

        <h4>2. Information Risk</h4>
        <ul>
          <li>Limited financial disclosure requirements</li>
          <li>Lack of regular financial reporting</li>
          <li>Difficulty in verifying company claims</li>
        </ul>

        <h4>3. Valuation Risk</h4>
        <ul>
          <li>No market price for reference</li>
          <li>Subjective valuation methods</li>
          <li>Risk of overpaying for shares</li>
        </ul>

        <h4>4. Business Risk</h4>
        <ul>
          <li>High failure rate of startups</li>
          <li>Regulatory changes affecting business</li>
          <li>Competition from established players</li>
        </ul>

        <h4>Risk Mitigation Strategies:</h4>
        <ul>
          <li><strong>Diversification:</strong> Don't put all money in one company</li>
          <li><strong>Due Diligence:</strong> Research thoroughly before investing</li>
          <li><strong>Small Allocation:</strong> Limit exposure to 5-10% of portfolio</li>
          <li><strong>Long-term View:</strong> Be prepared to hold for 3-5 years</li>
          <li><strong>Professional Advice:</strong> Consult financial advisors</li>
        </ul>
      `
    },
    {
      id: 4,
      title: "How to Trade Unlisted Shares",
      description: "Step-by-step guide on how to buy and sell unlisted shares through our platform.",
      category: "TRADING",
      type: "guide",
      duration: "8 min read",
      difficulty: "Beginner",
      content: `
        <h3>Trading Unlisted Shares on Unlisted Edge</h3>
        <p>Our platform makes it easy to trade unlisted shares with a simple, secure process.</p>
        
        <h4>Step 1: Account Setup</h4>
        <ul>
          <li>Register with email and basic details</li>
          <li>Complete KYC verification (if required)</li>
          <li>Add funds to your wallet</li>
        </ul>

        <h4>Step 2: Research Companies</h4>
        <ul>
          <li>Browse available companies in marketplace</li>
          <li>Read company details and financials</li>
          <li>Check recent trading activity</li>
          <li>Use AI insights for analysis</li>
        </ul>

        <h4>Step 3: Place Orders</h4>
        <ul>
          <li><strong>Market Order:</strong> Buy/sell at current market price</li>
          <li><strong>Limit Order:</strong> Set your desired price and wait for match</li>
          <li>Specify quantity and review total amount</li>
        </ul>

        <h4>Step 4: Order Execution</h4>
        <ul>
          <li>Orders are matched automatically with counter-parties</li>
          <li>Funds and shares are transferred instantly upon match</li>
          <li>Track order status in your order history</li>
        </ul>

        <h4>Step 5: Portfolio Management</h4>
        <ul>
          <li>Monitor your holdings in portfolio section</li>
          <li>Track profit/loss and performance</li>
          <li>Set alerts for price movements</li>
        </ul>

        <h4>Trading Tips:</h4>
        <ul>
          <li>Start with small amounts to learn the process</li>
          <li>Use limit orders to control your entry/exit prices</li>
          <li>Keep some cash for opportunities</li>
          <li>Review and rebalance portfolio regularly</li>
        </ul>
      `
    },
    {
      id: 5,
      title: "Tax Implications of Unlisted Shares",
      description: "Understand the tax treatment of unlisted share investments in India.",
      category: "TAX",
      type: "article",
      duration: "6 min read",
      difficulty: "Intermediate",
      content: `
        <h3>Tax Treatment of Unlisted Shares in India</h3>
        <p>Understanding tax implications is crucial for unlisted share investments. Here's what you need to know:</p>
        
        <h4>Capital Gains Tax</h4>
        <p>Unlisted shares are treated as non-equity investments for tax purposes.</p>
        
        <h5>Short-term Capital Gains (STCG)</h5>
        <ul>
          <li><strong>Holding Period:</strong> Less than 24 months</li>
          <li><strong>Tax Rate:</strong> Added to income and taxed at slab rates</li>
          <li><strong>No Indexation:</strong> Not available for STCG</li>
        </ul>

        <h5>Long-term Capital Gains (LTCG)</h5>
        <ul>
          <li><strong>Holding Period:</strong> More than 24 months</li>
          <li><strong>Tax Rate:</strong> 20% with indexation benefit</li>
          <li><strong>Indexation:</strong> Cost adjusted for inflation using Cost Inflation Index</li>
        </ul>

        <h4>Dividend Taxation</h4>
        <ul>
          <li>Dividends from unlisted companies are taxable in hands of recipient</li>
          <li>Added to total income and taxed at applicable slab rates</li>
          <li>TDS may be deducted by company if dividend exceeds ₹5,000</li>
        </ul>

        <h4>Tax Planning Tips</h4>
        <ul>
          <li><strong>Hold for 24+ months:</strong> To get LTCG treatment and indexation</li>
          <li><strong>Stagger Sales:</strong> Spread sales across financial years</li>
          <li><strong>Set-off Losses:</strong> Use capital losses to offset gains</li>
          <li><strong>Maintain Records:</strong> Keep detailed purchase/sale records</li>
        </ul>

        <h4>Important Note</h4>
        <p>Tax laws are subject to change. Always consult a qualified tax advisor for personalized advice based on your specific situation.</p>
      `
    }
  ];

  const categories = ['ALL', 'BASICS', 'VALUATION', 'RISK', 'TRADING', 'TAX'];

  const filteredContent = educationContent.filter(content => 
    selectedCategory === 'ALL' || content.category === selectedCategory
  );

  const getDifficultyColor = (difficulty: string) => {
    const colors: { [key: string]: string } = {
      'Beginner': 'bg-green-500/20 text-green-300',
      'Intermediate': 'bg-yellow-500/20 text-yellow-300',
      'Advanced': 'bg-red-500/20 text-red-300'
    };
    return colors[difficulty] || 'bg-gray-500/20 text-gray-300';
  };

  const getTypeIcon = (type: string) => {
    const icons: { [key: string]: string } = {
      'article': '📄',
      'video': '🎥',
      'guide': '📋'
    };
    return icons[type] || '📄';
  };

  if (selectedContent) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-900 to-purple-900">
        {/* Header */}
        <header className="bg-black/20 backdrop-blur-sm border-b border-white/10">
          <div className="container mx-auto px-4 py-4">
            <div className="flex justify-between items-center">
              <Link href="/" className="text-xl md:text-2xl font-bold text-white">
                Unlisted Edge
              </Link>
              <button
                onClick={() => setSelectedContent(null)}
                className="text-white/70 hover:text-white"
              >
                ← Back to Education
              </button>
            </div>
          </div>
        </header>

        {/* Content */}
        <main className="container mx-auto px-4 py-8 max-w-4xl">
          <div className="bg-white/10 backdrop-blur-sm rounded-lg p-8 border border-white/20">
            <div className="flex items-center gap-4 mb-6">
              <span className="text-2xl">{getTypeIcon(selectedContent.type)}</span>
              <div>
                <h1 className="text-3xl font-bold text-white mb-2">{selectedContent.title}</h1>
                <div className="flex gap-4 text-sm">
                  <span className={`px-3 py-1 rounded-full ${getDifficultyColor(selectedContent.difficulty)}`}>
                    {selectedContent.difficulty}
                  </span>
                  <span className="text-white/70">{selectedContent.duration}</span>
                </div>
              </div>
            </div>
            
            <div 
              className="prose prose-invert max-w-none text-white/80"
              dangerouslySetInnerHTML={{ __html: selectedContent.content }}
            />
          </div>
        </main>
      </div>
    );
  }

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
              <Link href="/news" className="text-white/70 hover:text-white">News</Link>
              <Link href="/about" className="text-white/70 hover:text-white">About</Link>
            </nav>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        {/* Page Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-white mb-4">
            Education Center
          </h1>
          <p className="text-xl text-blue-200">
            Learn everything about unlisted share trading and investing
          </p>
        </div>

        {/* Category Filter */}
        <div className="flex flex-wrap gap-3 mb-8 justify-center">
          {categories.map((category) => (
            <button
              key={category}
              onClick={() => setSelectedCategory(category)}
              className={`px-4 py-2 rounded-full text-sm font-semibold transition-colors ${
                selectedCategory === category
                  ? 'bg-blue-600 text-white'
                  : 'bg-white/10 text-white/70 hover:bg-white/20'
              }`}
            >
              {category}
            </button>
          ))}
        </div>

        {/* Content Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredContent.map((content) => (
            <div
              key={content.id}
              className="bg-white/10 backdrop-blur-sm rounded-lg p-6 border border-white/20 hover:bg-white/15 transition-all duration-200 cursor-pointer"
              onClick={() => setSelectedContent(content)}
            >
              {/* Content Type & Difficulty */}
              <div className="flex justify-between items-start mb-4">
                <span className="text-2xl">{getTypeIcon(content.type)}</span>
                <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getDifficultyColor(content.difficulty)}`}>
                  {content.difficulty}
                </span>
              </div>

              {/* Content Info */}
              <h3 className="text-lg font-bold text-white mb-3">
                {content.title}
              </h3>
              
              <p className="text-white/80 text-sm mb-4 line-clamp-3">
                {content.description}
              </p>

              {/* Duration & Category */}
              <div className="flex justify-between items-center">
                <span className="text-white/50 text-xs">
                  {content.duration}
                </span>
                <span className="text-blue-300 text-xs font-medium">
                  {content.category}
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* Learning Path */}
        <div className="mt-12 bg-gradient-to-r from-purple-500/20 to-blue-500/20 backdrop-blur-sm rounded-lg p-8 border border-white/20">
          <h3 className="text-2xl font-bold text-white mb-6 text-center">Recommended Learning Path</h3>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            {['BASICS', 'VALUATION', 'RISK', 'TRADING', 'TAX'].map((step, index) => (
              <div key={step} className="text-center">
                <div className="bg-white/10 rounded-full w-12 h-12 flex items-center justify-center mx-auto mb-3">
                  <span className="text-white font-bold">{index + 1}</span>
                </div>
                <h4 className="text-white font-semibold mb-2">{step}</h4>
                <p className="text-white/70 text-sm">
                  {step === 'BASICS' && 'Start here'}
                  {step === 'VALUATION' && 'Learn to value'}
                  {step === 'RISK' && 'Understand risks'}
                  {step === 'TRADING' && 'Start trading'}
                  {step === 'TAX' && 'Tax planning'}
                </p>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}