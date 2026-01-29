'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import toast from 'react-hot-toast';

interface Application {
  id: string;
  loanTypeId: string;
  status: string;
  submittedAt: string;
  businessName: string;
  contactName: string;
  email: string;
  phone: string;
  requestedAmount: number | null;
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

const STATUS_COLORS: Record<string, string> = {
  submitted: 'bg-blue-100 text-blue-800',
  under_review: 'bg-yellow-100 text-yellow-800',
  approved: 'bg-green-100 text-green-800',
  declined: 'bg-red-100 text-red-800',
  funded: 'bg-purple-100 text-purple-800',
};

const LOAN_TYPE_LABELS: Record<string, string> = {
  mca: 'Merchant Cash Advance',
  line_of_credit: 'Line of Credit',
  sba: 'SBA Loan',
  equipment_finance: 'Equipment Finance',
  invoice_factoring: 'Invoice Factoring',
  invoice_financing: 'Invoice Financing',
  general: 'General Loan',
};

export default function ApplicationsListPage() {
  const [applications, setApplications] = useState<Application[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [loanTypeFilter, setLoanTypeFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [isExportingGSheets, setIsExportingGSheets] = useState(false);
  const exportMenuRef = useRef<HTMLDivElement>(null);

  // Close export menu on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (exportMenuRef.current && !exportMenuRef.current.contains(event.target as Node)) {
        setShowExportMenu(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const fetchApplications = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams();
      params.set('page', currentPage.toString());
      params.set('limit', '25');
      if (search) params.set('search', search);
      if (statusFilter) params.set('status', statusFilter);
      if (loanTypeFilter) params.set('loanType', loanTypeFilter);

      const response = await fetch(`/api/admin/applications?${params}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch applications');
      }

      setApplications(data.applications);
      setPagination(data.pagination);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchApplications();
  }, [currentPage, statusFilter, loanTypeFilter]);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      if (currentPage === 1) {
        fetchApplications();
      } else {
        setCurrentPage(1);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [search]);

  const handleExport = async (format: 'excel' | 'googlesheets' = 'excel') => {
    const params = new URLSearchParams();
    params.set('format', format);
    if (statusFilter) params.set('status', statusFilter);
    if (loanTypeFilter) params.set('loanType', loanTypeFilter);

    if (format === 'googlesheets') {
      // Google Sheets export - fetch and get the URL
      setIsExportingGSheets(true);
      setShowExportMenu(false);

      try {
        const response = await fetch(`/api/admin/export?${params}`);
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.message || data.error || 'Failed to create Google Sheet');
        }

        // Open the Google Sheet in a new tab
        window.open(data.spreadsheetUrl, '_blank');
        toast.success(`Google Sheet created with ${data.totalRecords} applications`);
      } catch (err) {
        toast.error(err instanceof Error ? err.message : 'Failed to create Google Sheet');
      } finally {
        setIsExportingGSheets(false);
      }
    } else {
      // Excel export - direct download
      window.open(`/api/admin/export?${params}`, '_blank');
    }
  };

  const formatCurrency = (amount: number | null) => {
    if (amount === null) return 'N/A';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Applications</h1>
          <p className="text-gray-500 mt-1">
            Manage and review loan applications
          </p>
        </div>
        <div className="relative inline-block" ref={exportMenuRef}>
          <button
            onClick={() => setShowExportMenu(!showExportMenu)}
            className="inline-flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
          >
            <svg
              className="w-5 h-5 mr-2"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
            Export
            <svg
              className={`w-4 h-4 ml-2 transition-transform ${showExportMenu ? 'rotate-180' : ''}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 9l-7 7-7-7"
              />
            </svg>
          </button>

          {/* Dropdown Menu */}
          {showExportMenu && (
            <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-10">
              <button
                onClick={() => {
                  handleExport('excel');
                  setShowExportMenu(false);
                }}
                className="w-full px-4 py-2 text-left text-gray-700 hover:bg-gray-100 flex items-center"
              >
                <svg
                  className="w-5 h-5 mr-3 text-green-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>
                <div>
                  <p className="font-medium">Excel (.xlsx)</p>
                  <p className="text-xs text-gray-500">Formatted spreadsheet</p>
                </div>
              </button>
              <button
                onClick={() => handleExport('googlesheets')}
                disabled={isExportingGSheets}
                className="w-full px-4 py-2 text-left text-gray-700 hover:bg-gray-100 flex items-center disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isExportingGSheets ? (
                  <svg
                    className="animate-spin w-5 h-5 mr-3 text-green-600"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    />
                  </svg>
                ) : (
                  <svg
                    className="w-5 h-5 mr-3"
                    viewBox="0 0 24 24"
                    fill="none"
                  >
                    <path
                      d="M19.5 3H4.5C3.67 3 3 3.67 3 4.5v15c0 .83.67 1.5 1.5 1.5h15c.83 0 1.5-.67 1.5-1.5v-15c0-.83-.67-1.5-1.5-1.5z"
                      fill="#0F9D58"
                    />
                    <path d="M7.5 7.5h9v2h-9zM7.5 11h9v2h-9zM7.5 14.5h6v2h-6z" fill="white" />
                  </svg>
                )}
                <div>
                  <p className="font-medium">
                    {isExportingGSheets ? 'Creating...' : 'Google Sheets'}
                  </p>
                  <p className="text-xs text-gray-500">
                    {isExportingGSheets ? 'Please wait' : 'Opens in new tab'}
                  </p>
                </div>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Search */}
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Search
            </label>
            <div className="relative">
              <svg
                className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by name, email, or ID..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Status Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Status
            </label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">All Statuses</option>
              <option value="submitted">Submitted</option>
              <option value="under_review">Under Review</option>
              <option value="approved">Approved</option>
              <option value="declined">Declined</option>
              <option value="funded">Funded</option>
            </select>
          </div>

          {/* Loan Type Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Loan Type
            </label>
            <select
              value={loanTypeFilter}
              onChange={(e) => setLoanTypeFilter(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">All Types</option>
              <option value="mca">Merchant Cash Advance</option>
              <option value="line_of_credit">Line of Credit</option>
              <option value="sba">SBA Loan</option>
              <option value="equipment_finance">Equipment Finance</option>
              <option value="invoice_factoring">Invoice Factoring</option>
              <option value="invoice_financing">Invoice Financing</option>
              <option value="general">General Loan</option>
            </select>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="p-12 text-center">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-500">Loading applications...</p>
          </div>
        ) : error ? (
          <div className="p-12 text-center">
            <p className="text-red-600">{error}</p>
            <button
              onClick={fetchApplications}
              className="mt-4 text-blue-600 hover:text-blue-700"
            >
              Try again
            </button>
          </div>
        ) : applications.length === 0 ? (
          <div className="p-12 text-center">
            <svg
              className="w-16 h-16 text-gray-300 mx-auto mb-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
            <p className="text-gray-500">No applications found</p>
          </div>
        ) : (
          <>
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Application
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Contact
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Loan Type
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Amount
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Submitted
                  </th>
                  <th className="px-6 py-4 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {applications.map((app) => (
                  <tr key={app.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4">
                      <div>
                        <p className="font-medium text-gray-900">
                          {app.businessName}
                        </p>
                        <p className="text-sm text-gray-500 font-mono">
                          {app.id.slice(0, 12)}...
                        </p>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div>
                        <p className="text-gray-900">{app.contactName}</p>
                        <p className="text-sm text-gray-500">{app.email}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-gray-900">
                        {LOAN_TYPE_LABELS[app.loanTypeId] || app.loanTypeId}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-gray-900 font-medium">
                        {formatCurrency(app.requestedAmount)}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex px-2.5 py-1 rounded-full text-xs font-medium ${
                          STATUS_COLORS[app.status] || 'bg-gray-100 text-gray-800'
                        }`}
                      >
                        {app.status.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {formatDate(app.submittedAt)}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <Link
                        href={`/admin/applications/${app.id}`}
                        className="text-blue-600 hover:text-blue-700 font-medium text-sm"
                      >
                        View Details
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Pagination */}
            {pagination && pagination.totalPages > 1 && (
              <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex items-center justify-between">
                <p className="text-sm text-gray-500">
                  Showing {(pagination.page - 1) * pagination.limit + 1} to{' '}
                  {Math.min(pagination.page * pagination.limit, pagination.total)} of{' '}
                  {pagination.total} applications
                </p>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className="px-3 py-1 border border-gray-300 rounded-lg text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100"
                  >
                    Previous
                  </button>
                  <span className="text-sm text-gray-600">
                    Page {pagination.page} of {pagination.totalPages}
                  </span>
                  <button
                    onClick={() =>
                      setCurrentPage((p) => Math.min(pagination.totalPages, p + 1))
                    }
                    disabled={currentPage === pagination.totalPages}
                    className="px-3 py-1 border border-gray-300 rounded-lg text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
