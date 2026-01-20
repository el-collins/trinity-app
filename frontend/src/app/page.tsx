'use client';

import Link from 'next/link';

export default function HomePage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="border-b border-gray-200 bg-white sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-xl">T</span>
            </div>
            <span className="text-xl font-bold text-gray-900">Trinity Finance</span>
          </div>
          <nav className="hidden md:flex gap-6">
            <a href="#how-it-works" className="text-gray-600 hover:text-gray-900 transition-colors">How It Works</a>
            <a href="#loan-types" className="text-gray-600 hover:text-gray-900 transition-colors">Loan Types</a>
            <a href="mailto:iq@financetrinity.com" className="text-gray-600 hover:text-gray-900 transition-colors">Contact</a>
          </nav>
        </div>
      </header>

      {/* Hero Section */}
      <section className="bg-gradient-to-br from-blue-50 via-white to-purple-50 py-20 md:py-28">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6 leading-tight">
            Get Business Financing<br />
            <span className="text-blue-600">in 24-48 Hours</span>
          </h1>
          <p className="text-lg md:text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
            Fast, secure, and tailored to your business needs. Our smart application adapts to your loan type for a streamlined experience.
          </p>
          <Link
            href="/quick-app"
            className="inline-flex items-center gap-2 bg-blue-600 text-white px-8 py-4 rounded-lg text-lg font-semibold hover:bg-blue-700 transition-all shadow-lg hover:shadow-xl transform hover:scale-105"
          >
            Start Your Application
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
            </svg>
          </Link>
          <p className="mt-4 text-sm text-gray-500">
            ✓ Takes only 10 minutes  •  ✓ No commitment required  •  ✓ Secure & confidential
          </p>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Fast Approval</h3>
              <p className="text-gray-600">Get a decision in 24-48 hours with our streamlined process</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Secure & Private</h3>
              <p className="text-gray-600">Bank-level encryption protects your sensitive information</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Competitive Rates</h3>
              <p className="text-gray-600">Access to multiple lenders ensures the best rates</p>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">How It Works</h2>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="relative">
              <div className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow">
                <div className="w-12 h-12 bg-blue-600 text-white rounded-full flex items-center justify-center text-xl font-bold mb-4">1</div>
                <h3 className="text-xl font-semibold mb-2">Complete Quick Application</h3>
                <p className="text-gray-600">Fill out our smart form in just 10 minutes. We only ask for what's needed.</p>
              </div>
            </div>
            <div className="relative">
              <div className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow">
                <div className="w-12 h-12 bg-blue-600 text-white rounded-full flex items-center justify-center text-xl font-bold mb-4">2</div>
                <h3 className="text-xl font-semibold mb-2">Get Matched & Reviewed</h3>
                <p className="text-gray-600">Our team reviews your application and matches you with the best lenders.</p>
              </div>
            </div>
            <div className="relative">
              <div className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow">
                <div className="w-12 h-12 bg-blue-600 text-white rounded-full flex items-center justify-center text-xl font-bold mb-4">3</div>
                <h3 className="text-xl font-semibold mb-2">Receive Funding</h3>
                <p className="text-gray-600">Get approved and funded within 24-48 hours. It's that simple.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Loan Types Overview */}
      <section id="loan-types" className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-4">Financing Options</h2>
          <p className="text-center text-gray-600 mb-12 max-w-2xl mx-auto">
            We offer multiple financing solutions tailored to your business needs
          </p>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              { name: 'SBA Loans', icon: '🇺🇸', desc: 'Government-backed with competitive rates' },
              { name: 'Merchant Cash Advance', icon: '💳', desc: 'Fast funding based on card sales' },
              { name: 'Line of Credit', icon: '💰', desc: 'Flexible access when you need it' },
              { name: 'Equipment Financing', icon: '🏗️', desc: 'Finance equipment purchases' },
              { name: 'Invoice Factoring', icon: '📄', desc: 'Immediate cash for invoices' },
              { name: 'Invoice Financing', icon: '📊', desc: 'Use invoices as collateral' },
            ].map((loan, idx) => (
              <div key={idx} className="border border-gray-200 rounded-lg p-6 hover:shadow-lg transition-shadow hover:border-blue-300">
                <div className="text-4xl mb-3">{loan.icon}</div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">{loan.name}</h3>
                <p className="text-sm text-gray-600">{loan.desc}</p>
              </div>
            ))}
          </div>
          <div className="text-center mt-8">
            <Link
              href="/quick-app"
              className="inline-flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
            >
              Get Started Now
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid md:grid-cols-3 gap-8 mb-8">
            <div>
              <h4 className="font-semibold mb-4">Trinity Finance</h4>
              <p className="text-gray-400 text-sm">Smart business financing solutions for growing companies.</p>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Quick Links</h4>
              <ul className="space-y-2 text-sm text-gray-400">
                <li><Link href="/quick-app" className="hover:text-white transition-colors">Apply Now</Link></li>
                <li><a href="#how-it-works" className="hover:text-white transition-colors">How It Works</a></li>
                <li><a href="#loan-types" className="hover:text-white transition-colors">Loan Types</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Contact</h4>
              <p className="text-gray-400 text-sm">
                Email: <a href="mailto:iq@financetrinity.com" className="hover:text-white transition-colors">iq@financetrinity.com</a>
              </p>
            </div>
          </div>
          <div className="border-t border-gray-800 pt-8 text-center text-sm text-gray-400">
            <p>© 2026 Trinity Finance. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
