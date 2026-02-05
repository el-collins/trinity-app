'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface LoanType {
  id: string;
  name: string;
  description: string;
  tier: number;
  estimatedTime: number;
  benefits: string[];
  bestFor: string[];
}

interface LoanTypeSelectionProps {
  onSelectLoanType: (loanTypeId: string) => void;
  className?: string;
}

const LOAN_TYPES: LoanType[] = [
  {
    id: 'sba',
    name: 'Small Business Administration (SBA)',
    description: 'Government-backed loans with favorable terms and lower interest rates',
    tier: 1,
    estimatedTime: 20,
    benefits: [
      'Lower interest rates',
      'Longer repayment terms',
      'Higher loan amounts available',
      'Government backing'
    ],
    bestFor: [
      'Established businesses (2+ years)',
      'Strong credit (680+)',
      'Need large amounts ($50K+)',
      'Long-term investments'
    ]
  },
  {
    id: 'line_of_credit',
    name: 'Line of Credit',
    description: 'Flexible access to capital - draw funds as needed and only pay interest on what you use',
    tier: 1,
    estimatedTime: 15,
    benefits: [
      'Flexible access to funds',
      'Pay interest only on what you use',
      'Revolving credit line',
      'Quick access to working capital'
    ],
    bestFor: [
      'Managing cash flow gaps',
      'Seasonal businesses',
      'Unexpected expenses',
      'Ongoing operational needs'
    ]
  },
  {
    id: 'equipment_finance',
    name: 'Equipment Financing',
    description: 'Finance specific equipment purchases or lease-back existing equipment',
    tier: 2,
    estimatedTime: 20,
    benefits: [
      'Equipment serves as collateral',
      'Preserve working capital',
      'Tax advantages',
      'Flexible terms'
    ],
    bestFor: [
      'Purchasing new equipment',
      'Upgrading machinery',
      'Technology investments',
      'Vehicle fleets'
    ]
  },
  {
    id: 'mca',
    name: 'Merchant Cash Advance (MCA)',
    description: 'Fast funding based on your future credit card sales',
    tier: 1,
    estimatedTime: 15,
    benefits: [
      'Fastest approval (24-48 hours)',
      'Based on revenue, not credit',
      'Flexible repayment (% of daily sales)',
      'No fixed monthly payments'
    ],
    bestFor: [
      'Immediate funding needs',
      'High credit card volume',
      'Less-than-perfect credit',
      'Short-term capital needs'
    ]
  },
  {
    id: 'invoice_financing',
    name: 'Invoice Financing',
    description: 'Use unpaid invoices as collateral while you retain control of collections',
    tier: 3,
    estimatedTime: 25,
    benefits: [
      'You control customer relationships',
      'Access cash immediately',
      'Flexible funding',
      'Lower cost than factoring'
    ],
    bestFor: [
      'B2B businesses with $1M+ invoices',
      'Net-30/60/90 payment terms',
      'Want to maintain customer control',
      'Strong customer base'
    ]
  },
  {
    id: 'invoice_factoring',
    name: 'Invoice Factoring',
    description: 'Sell your invoices and let the factor handle collections',
    tier: 3,
    estimatedTime: 25,
    benefits: [
      'Immediate cash (within 24-48 hours)',
      'No collections responsibility',
      'Easier qualification',
      'Helps with inconsistent cash flow'
    ],
    bestFor: [
      'Slow-paying customers',
      'Limited collections resources',
      'Credit-worthy customers',
      'Need fast cash'
    ]
  },
  {
    id: 'general',
    name: 'I Need Help Deciding',
    description: 'Not sure which loan type is best? We\'ll review your situation and recommend the best option',
    tier: 1,
    estimatedTime: 20,
    benefits: [
      'Expert guidance',
      'Personalized recommendations',
      'Multiple options compared',
      'No commitment required'
    ],
    bestFor: [
      'First-time borrowers',
      'Unsure of best fit',
      'Want expert advice',
      'Compare multiple options'
    ]
  }
];

const INVOICE_COMPARISON = {
  financing: {
    title: 'Invoice Financing',
    description: 'You use your unpaid invoices as collateral to borrow funds while keeping full control of invoicing and collections.',
    pros: [
      'You keep control of customer communication and collections',
      'Flexible access to working capital',
      'Customers never know you\'re using financing',
      'Typically less expensive than factoring'
    ],
    cons: [
      'You\'re responsible for collecting payments from customers',
      'Approval may require stronger financials',
      'You must repay the borrowed amount even if customers pay late',
      'Usually requires at least $1 Million in Invoices to be financed'
    ]
  },
  factoring: {
    title: 'Invoice Factoring',
    description: 'You sell your invoices to a factoring company, receive an advance, and the factor handles collecting payment from your customers.',
    pros: [
      'Fast access to cash',
      'Factor handles collections for you',
      'Easier qualification—works well for businesses with credit-worthy customers',
      'Helpful if collections are time-consuming or inconsistent'
    ],
    cons: [
      'Customers will know a factor is involved',
      'Can be more expensive than financing',
      'You give up control over customer collections',
      'Not ideal if customer relationships are sensitive'
    ]
  }
};

export default function LoanTypeSelection({ onSelectLoanType, className }: LoanTypeSelectionProps) {
  const [selectedType, setSelectedType] = useState<string | null>(null);
  const [showInvoiceComparison, setShowInvoiceComparison] = useState(false);

  const handleSelect = (loanTypeId: string) => {
    setSelectedType(loanTypeId);

    // Show comparison if selecting invoice financing or factoring
    if (loanTypeId === 'invoice_financing' || loanTypeId === 'invoice_factoring') {
      setShowInvoiceComparison(true);
    } else {
      onSelectLoanType(loanTypeId);
    }
  };

  const handleConfirmInvoiceType = () => {
    if (selectedType) {
      onSelectLoanType(selectedType);
    }
  };

  if (showInvoiceComparison) {
    return (
      <div className={cn('max-w-6xl mx-auto px-4 py-8', className)}>
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            Invoice Financing vs Factoring
          </h1>
          <p className="text-gray-600 max-w-3xl mx-auto">
            To ensure you've picked the right option between 'Invoice Financing' and 'Invoice Factoring' for your business,
            here's how each function. If you're sure about your selection, simply click continue below!
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6 mb-8">
          {/* Invoice Financing */}
          <Card className={cn(
            'border-2 transition-all',
            selectedType === 'invoice_financing' ? 'border-blue-600 shadow-lg' : 'border-gray-200'
          )}>
            <CardHeader>
              <CardTitle className="text-xl">{INVOICE_COMPARISON.financing.title}</CardTitle>
              <CardDescription className="text-base">
                {INVOICE_COMPARISON.financing.description}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="font-semibold text-green-700 mb-2">Pros</h4>
                <ul className="space-y-1">
                  {INVOICE_COMPARISON.financing.pros.map((pro, idx) => (
                    <li key={idx} className="text-sm text-gray-700 flex items-start">
                      <span className="text-green-600 mr-2">✓</span>
                      {pro}
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <h4 className="font-semibold text-red-700 mb-2">Cons</h4>
                <ul className="space-y-1">
                  {INVOICE_COMPARISON.financing.cons.map((con, idx) => (
                    <li key={idx} className="text-sm text-gray-700 flex items-start">
                      <span className="text-red-600 mr-2">✗</span>
                      {con}
                    </li>
                  ))}
                </ul>
              </div>
              {selectedType !== 'invoice_financing' && (
                <button
                  onClick={() => setSelectedType('invoice_financing')}
                  className="w-full mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Select Invoice Financing
                </button>
              )}
            </CardContent>
          </Card>

          {/* Invoice Factoring */}
          <Card className={cn(
            'border-2 transition-all',
            selectedType === 'invoice_factoring' ? 'border-blue-600 shadow-lg' : 'border-gray-200'
          )}>
            <CardHeader>
              <CardTitle className="text-xl">{INVOICE_COMPARISON.factoring.title}</CardTitle>
              <CardDescription className="text-base">
                {INVOICE_COMPARISON.factoring.description}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="font-semibold text-green-700 mb-2">Pros</h4>
                <ul className="space-y-1">
                  {INVOICE_COMPARISON.factoring.pros.map((pro, idx) => (
                    <li key={idx} className="text-sm text-gray-700 flex items-start">
                      <span className="text-green-600 mr-2">✓</span>
                      {pro}
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <h4 className="font-semibold text-red-700 mb-2">Cons</h4>
                <ul className="space-y-1">
                  {INVOICE_COMPARISON.factoring.cons.map((con, idx) => (
                    <li key={idx} className="text-sm text-gray-700 flex items-start">
                      <span className="text-red-600 mr-2">✗</span>
                      {con}
                    </li>
                  ))}
                </ul>
              </div>
              {selectedType !== 'invoice_factoring' && (
                <button
                  onClick={() => setSelectedType('invoice_factoring')}
                  className="w-full mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Select Invoice Factoring
                </button>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="flex justify-center gap-4">
          <button
            onClick={() => {
              setShowInvoiceComparison(false);
              setSelectedType(null);
            }}
            className="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors font-medium"
          >
            ← Back to Loan Types
          </button>
          <button
            onClick={handleConfirmInvoiceType}
            disabled={!selectedType}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Continue with {selectedType === 'invoice_financing' ? 'Invoice Financing' : 'Invoice Factoring'}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={cn('max-w-6xl mx-auto px-4 py-8', className)}>
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">
          Choose Your Loan Type
        </h1>
        <p className="text-gray-600 max-w-2xl mx-auto">
          Based on your Quick Application, select the type of financing that best fits your needs.
          Not sure? Select "I Need Help Deciding" and we'll guide you.
        </p>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {LOAN_TYPES.map((loanType) => (
          <Card
            key={loanType.id}
            className={cn(
              'cursor-pointer transition-all hover:shadow-xl hover:scale-105 border-2',
              selectedType === loanType.id ? 'border-blue-600 shadow-lg' : 'border-gray-200 hover:border-blue-300'
            )}
            onClick={() => handleSelect(loanType.id)}
          >
            <CardHeader>
              <div className="flex justify-between items-start mb-2">
                <CardTitle className="text-lg">{loanType.name}</CardTitle>
                <span className="px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded-full whitespace-nowrap">
                  ~{loanType.estimatedTime} min
                </span>
              </div>
              <CardDescription className="text-sm">
                {loanType.description}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="font-semibold text-sm text-gray-900 mb-2">Benefits:</h4>
                <ul className="space-y-1">
                  {loanType.benefits.map((benefit, idx) => (
                    <li key={idx} className="text-xs text-gray-700 flex items-start">
                      <span className="text-green-600 mr-1">✓</span>
                      {benefit}
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <h4 className="font-semibold text-sm text-gray-900 mb-2">Best For:</h4>
                <ul className="space-y-1">
                  {loanType.bestFor.map((item, idx) => (
                    <li key={idx} className="text-xs text-gray-600 flex items-start">
                      <span className="text-blue-600 mr-1">•</span>
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
              <button
                className="w-full mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium text-sm"
              >
                Select This Loan
              </button>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="mt-8 text-center">
        <p className="text-sm text-gray-500">
          Still have questions? <a href="mailto:iq@financetrinity.com" className="text-blue-600 hover:underline">Contact us</a> for personalized guidance.
        </p>
      </div>
    </div>
  );
}
