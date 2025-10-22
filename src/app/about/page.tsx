'use client';

import Link from 'next/link';

export default function AboutPage() {
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
              <Link href="/education" className="text-white/70 hover:text-white">Education</Link>
            </nav>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        {/* Hero Section */}
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-6">
            About Unlisted Edge
          </h1>
          <p className="text-xl text-blue-200 max-w-3xl mx-auto">
            India's premier platform for trading unlisted shares and accessing pre-IPO investment opportunities
          </p>
        </div>

        {/* Mission Section */}
        <div className="bg-white/10 backdrop-blur-sm rounded-lg p-8 border border-white/20 mb-8">
          <h2 className="text-3xl font-bold text-white mb-6">Our Mission</h2>
          <p className="text-white/80 text-lg leading-relaxed mb-6">
            Unlisted Edge democratizes access to pre-IPO investments by providing a secure, transparent, and efficient marketplace for unlisted shares. We bridge the gap between promising startups and retail investors, enabling everyone to participate in India's growth story.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="text-4xl mb-3">🚀</div>
              <h3 className="text-xl font-semibold text-white mb-2">Innovation</h3>
              <p className="text-blue-200">Cutting-edge technology for seamless trading experience</p>
            </div>
            <div className="text-center">
              <div className="text-4xl mb-3">🔒</div>
              <h3 className="text-xl font-semibold text-white mb-2">Security</h3>
              <p className="text-blue-200">Bank-grade security for all transactions and data</p>
            </div>
            <div className="text-center">
              <div className="text-4xl mb-3">📈</div>
              <h3 className="text-xl font-semibold text-white mb-2">Growth</h3>
              <p className="text-blue-200">Empowering investors to participate in startup success</p>
            </div>
          </div>
        </div>

        {/* Platform Features */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6 border border-white/20">
            <h3 className="text-2xl font-bold text-white mb-4">What We Offer</h3>
            <ul className="space-y-3 text-white/80">
              <li className="flex items-center">
                <span className="text-green-400 mr-3">✓</span>
                Access to 10+ verified unlisted companies
              </li>
              <li className="flex items-center">
                <span className="text-green-400 mr-3">✓</span>
                Real-time order matching and execution
              </li>
              <li className="flex items-center">
                <span className="text-green-400 mr-3">✓</span>
                Comprehensive portfolio management
              </li>
              <li className="flex items-center">
                <span className="text-green-400 mr-3">✓</span>
                AI-powered investment insights
              </li>
              <li className="flex items-center">
                <span className="text-green-400 mr-3">✓</span>
                Educational resources and market news
              </li>
              <li className="flex items-center">
                <span className="text-green-400 mr-3">✓</span>
                Secure wallet and fund management
              </li>
            </ul>
          </div>

          <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6 border border-white/20">
            <h3 className="text-2xl font-bold text-white mb-4">Why Choose Us</h3>
            <div className="space-y-4">
              <div>
                <h4 className="text-lg font-semibold text-white mb-2">Verified Companies</h4>
                <p className="text-white/70">All listed companies undergo thorough due diligence and verification</p>
              </div>
              <div>
                <h4 className="text-lg font-semibold text-white mb-2">Transparent Pricing</h4>
                <p className="text-white/70">Real-time market prices with complete order book visibility</p>
              </div>
              <div>
                <h4 className="text-lg font-semibold text-white mb-2">Expert Support</h4>
                <p className="text-white/70">Dedicated support team to guide your investment journey</p>
              </div>
            </div>
          </div>
        </div>

        {/* Regulatory Disclaimer */}
        <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-6 mb-8">
          <h3 className="text-xl font-bold text-yellow-300 mb-4">⚠️ Important Disclaimer</h3>
          <div className="text-yellow-200/80 space-y-2 text-sm">
            <p>• Unlisted shares are high-risk investments and may result in partial or total loss of capital.</p>
            <p>• These investments are illiquid and may not be easily sold or transferred.</p>
            <p>• Past performance does not guarantee future results.</p>
            <p>• Please consult with a financial advisor before making investment decisions.</p>
            <p>• This platform is for demonstration purposes and not regulated by SEBI.</p>
          </div>
        </div>

        {/* Contact Information */}
        <div className="bg-white/10 backdrop-blur-sm rounded-lg p-8 border border-white/20">
          <h3 className="text-2xl font-bold text-white mb-6 text-center">Get In Touch</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-center">
            <div>
              <div className="text-3xl mb-3">📧</div>
              <h4 className="text-lg font-semibold text-white mb-2">Email Support</h4>
              <p className="text-blue-200">support@unlistededge.com</p>
              <p className="text-white/50 text-sm">Response within 24 hours</p>
            </div>
            <div>
              <div className="text-3xl mb-3">📞</div>
              <h4 className="text-lg font-semibold text-white mb-2">Phone Support</h4>
              <p className="text-blue-200">+91-9876543210</p>
              <p className="text-white/50 text-sm">Mon-Fri, 9 AM - 6 PM IST</p>
            </div>
            <div>
              <div className="text-3xl mb-3">💬</div>
              <h4 className="text-lg font-semibold text-white mb-2">Live Chat</h4>
              <p className="text-blue-200">Available on platform</p>
              <p className="text-white/50 text-sm">Real-time assistance</p>
            </div>
          </div>
        </div>

        {/* CTA Section */}
        <div className="text-center mt-12">
          <h3 className="text-2xl font-bold text-white mb-4">Ready to Start Trading?</h3>
          <p className="text-blue-200 mb-6">Join thousands of investors accessing pre-IPO opportunities</p>
          <div className="flex gap-4 justify-center">
            <Link
              href="/companies"
              className="bg-green-600 hover:bg-green-700 text-white font-semibold py-3 px-8 rounded-lg transition-colors"
            >
              Browse Companies
            </Link>
            <Link
              href="/education"
              className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-8 rounded-lg transition-colors"
            >
              Learn More
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}