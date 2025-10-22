'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

interface NewsArticle {
  id: number;
  title: string;
  summary: string;
  source: string;
  published_date: string;
  category: string;
  company_id?: number;
  company_name?: string;
  image_url?: string;
}

export default function NewsPage() {
  const [news, setNews] = useState<NewsArticle[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');

  useEffect(() => {
    fetchNews();
  }, []);

  const fetchNews = async () => {
    try {
      // Sample news data for demo
      const sampleNews: NewsArticle[] = [
        {
          id: 1,
          title: "BYJU'S Raises $200M in Series F Funding Round",
          summary: "EdTech giant BYJU'S secures additional funding to expand global operations and enhance AI-powered learning platform.",
          source: "TechCrunch India",
          published_date: new Date(Date.now() - 86400000).toISOString(),
          category: "FUNDING",
          company_id: 1,
          company_name: "BYJU'S"
        },
        {
          id: 2,
          title: "Dream11 Becomes Official Partner of IPL 2024",
          summary: "Fantasy sports platform Dream11 announces multi-year partnership deal with Indian Premier League.",
          source: "Economic Times",
          published_date: new Date(Date.now() - 172800000).toISOString(),
          category: "PARTNERSHIPS",
          company_id: 4,
          company_name: "Dream11"
        },
        {
          id: 3,
          title: "Razorpay Launches New Payment Gateway for SMEs",
          summary: "Fintech startup introduces simplified payment solutions targeting small and medium enterprises across India.",
          source: "Business Standard",
          published_date: new Date(Date.now() - 259200000).toISOString(),
          category: "PRODUCT",
          company_id: 5,
          company_name: "Razorpay"
        },
        {
          id: 4,
          title: "Unlisted Share Market Sees 40% Growth in Q4 2024",
          summary: "Pre-IPO trading volume reaches all-time high as retail investors show increased interest in startup investments.",
          source: "Mint",
          published_date: new Date(Date.now() - 345600000).toISOString(),
          category: "MARKET",
        },
        {
          id: 5,
          title: "SEBI Proposes New Guidelines for Unlisted Securities",
          summary: "Market regulator introduces framework to enhance transparency and investor protection in unlisted share trading.",
          source: "Livemint",
          published_date: new Date(Date.now() - 432000000).toISOString(),
          category: "REGULATORY",
        },
        {
          id: 6,
          title: "Swiggy Reports 25% Revenue Growth in FY2024",
          summary: "Food delivery platform shows strong financial performance ahead of anticipated public listing.",
          source: "Reuters India",
          published_date: new Date(Date.now() - 518400000).toISOString(),
          category: "EARNINGS",
          company_id: 2,
          company_name: "Swiggy"
        }
      ];

      setNews(sampleNews);
      setLoading(false);
    } catch (err) {
      setLoading(false);
    }
  };

  const categories = ['ALL', 'FUNDING', 'PARTNERSHIPS', 'PRODUCT', 'MARKET', 'REGULATORY', 'EARNINGS'];

  const filteredNews = news.filter(article => 
    selectedCategory === 'ALL' || article.category === selectedCategory
  );

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getCategoryColor = (category: string) => {
    const colors: { [key: string]: string } = {
      'FUNDING': 'bg-green-500/20 text-green-300',
      'PARTNERSHIPS': 'bg-blue-500/20 text-blue-300',
      'PRODUCT': 'bg-purple-500/20 text-purple-300',
      'MARKET': 'bg-orange-500/20 text-orange-300',
      'REGULATORY': 'bg-red-500/20 text-red-300',
      'EARNINGS': 'bg-yellow-500/20 text-yellow-300'
    };
    return colors[category] || 'bg-gray-500/20 text-gray-300';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-900 to-purple-900 flex items-center justify-center">
        <div className="text-white text-xl">Loading news...</div>
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
              <Link href="/about" className="text-white/70 hover:text-white">About</Link>
              <Link href="/education" className="text-white/70 hover:text-white">Education</Link>
            </nav>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        {/* Page Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-white mb-4">
            Market News & Updates
          </h1>
          <p className="text-xl text-blue-200">
            Stay informed with the latest developments in unlisted markets
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

        {/* News Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredNews.map((article) => (
            <div
              key={article.id}
              className="bg-white/10 backdrop-blur-sm rounded-lg p-6 border border-white/20 hover:bg-white/15 transition-all duration-200"
            >
              {/* Category Badge */}
              <div className="flex justify-between items-start mb-4">
                <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getCategoryColor(article.category)}`}>
                  {article.category}
                </span>
                <span className="text-white/50 text-xs">{formatDate(article.published_date)}</span>
              </div>

              {/* Article Content */}
              <h3 className="text-lg font-bold text-white mb-3 line-clamp-2">
                {article.title}
              </h3>
              
              <p className="text-white/80 text-sm mb-4 line-clamp-3">
                {article.summary}
              </p>

              {/* Company Link */}
              {article.company_id && (
                <div className="mb-4">
                  <Link
                    href={`/companies/${article.company_id}`}
                    className="text-blue-300 hover:text-blue-200 text-sm font-medium"
                  >
                    📈 {article.company_name} →
                  </Link>
                </div>
              )}

              {/* Source & Actions */}
              <div className="flex justify-between items-center">
                <span className="text-white/50 text-xs">
                  Source: {article.source}
                </span>
                <button className="text-blue-300 hover:text-blue-200 text-sm font-medium">
                  Read More →
                </button>
              </div>
            </div>
          ))}
        </div>

        {filteredNews.length === 0 && (
          <div className="text-center py-12">
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-8 border border-white/20">
              <h3 className="text-xl font-bold text-white mb-4">No News Found</h3>
              <p className="text-white/70">No articles found for the selected category.</p>
            </div>
          </div>
        )}

        {/* Newsletter Signup */}
        <div className="mt-12 bg-gradient-to-r from-blue-500/20 to-purple-500/20 backdrop-blur-sm rounded-lg p-8 border border-white/20 text-center">
          <h3 className="text-2xl font-bold text-white mb-4">Stay Updated</h3>
          <p className="text-blue-200 mb-6">Get the latest market news and company updates delivered to your inbox</p>
          <div className="flex gap-4 max-w-md mx-auto">
            <input
              type="email"
              placeholder="Enter your email"
              className="flex-1 px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-6 py-3 rounded-lg transition-colors">
              Subscribe
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}