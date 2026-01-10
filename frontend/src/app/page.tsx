'use client';

import Link from 'next/link';

export default function HomePage() {
  const loanTypes = [
    {
      id: 'mca',
      name: 'Merchant Cash Advance',
      description: 'Quick funding based on your daily credit card sales',
      tier: 1,
      estimatedTime: '10-15 minutes',
      icon: '💳',
    },
    {
      id: 'sba', // Updated ID to match backend
      name: 'SBA Loan',
      description: 'Government-backed loan with competitive rates',
      tier: 1,
      estimatedTime: '15-20 minutes',
      icon: '🇺🇸',
    },
    {
      id: 'line_of_credit',
      name: 'Line of Credit',
      description: 'Flexible access to funds when you need them',
      tier: 1,
      estimatedTime: '10-15 minutes',
      icon: '💰',
    },
    {
      id: 'equipment_finance',
      name: 'Equipment Financing',
      description: 'Financing for business equipment and machinery',
      tier: 2,
      estimatedTime: '15-20 minutes',
      icon: '🏗️',
    },
    {
      id: 'invoice_factoring',
      name: 'Invoice Factoring',
      description: 'Get immediate cash for your outstanding invoices',
      tier: 3,
      estimatedTime: '20-25 minutes',
      icon: '📄',
    },
    {
      id: 'invoice_financing',
      name: 'Invoice Financing',
      description: 'Use invoices as collateral for funding',
      tier: 3,
      estimatedTime: '25-30 minutes',
      icon: '📊',
    },
    {
      id: 'general',
      name: 'General Application',
      description: 'For applicants unsure of loan type',
      tier: 1,
      estimatedTime: '15 minutes',
      icon: '🤔',
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <h1 className="text-3xl font-bold text-gray-900">Trinity Finance</h1>
          <p className="text-gray-600 mt-1">Smart Business Financing Solutions</p>
        </div>
      </header>

      {/* Hero Section */}
      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold text-gray-900 mb-4">
            Apply for Business Financing
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Choose the financing option that best fits your business needs. Our smart form adapts to your loan type for a streamlined application process.
          </p>
        </div>

        {/* Loan Type Cards */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {loanTypes.map((loanType) => (
            <Link
              key={loanType.id}
              href={`/apply/${loanType.id}`}
              className="bg-white rounded-lg shadow-md hover:shadow-xl transition-shadow p-6 cursor-pointer group"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="text-4xl">{loanType.icon}</div>
                <span className="text-xs font-medium px-2 py-1 bg-blue-100 text-blue-800 rounded">
                  Tier {loanType.tier}
                </span>
              </div>
              
              <h3 className="text-xl font-bold text-gray-900 mb-2 group-hover:text-blue-600 transition-colors">
                {loanType.name}
              </h3>
              
              <p className="text-gray-600 mb-4 text-sm">
                {loanType.description}
              </p>
              
              <div className="flex items-center text-sm text-gray-500">
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                {loanType.estimatedTime}
              </div>
              
              <div className="mt-4 flex items-center text-blue-600 font-medium group-hover:translate-x-2 transition-transform">
                Start Application
                <svg className="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </Link>
          ))}
        </div>

        {/* Features Section */}
        <div className="mt-16 grid md:grid-cols-3 gap-8">
          <div className="text-center">
            <div className="bg-blue-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Fast & Easy</h3>
            <p className="text-gray-600 text-sm">
              Complete your application in minutes with our intelligent form system
            </p>
          </div>
          
          <div className="text-center">
            <div className="bg-green-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Secure & Private</h3>
            <p className="text-gray-600 text-sm">
              Your data is encrypted and stored securely in compliance with industry standards
            </p>
          </div>
          
          <div className="text-center">
            <div className="bg-purple-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Competitive Rates</h3>
            <p className="text-gray-600 text-sm">
              Access to multiple lenders ensures you get the best rates available
            </p>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-white mt-16 border-t border-gray-200">
        <div className="max-w-7xl mx-auto px-4 py-8 text-center text-gray-600 text-sm">
          <p>© 2026 Trinity Finance. All rights reserved.</p>
          <p className="mt-2">
            Need help? Contact us at{' '}
            <a href="mailto:support@trinityfinance.com" className="text-blue-600 hover:underline">
              support@trinityfinance.com
            </a>
          </p>
        </div>
      </footer>
    </div>
  );
}
