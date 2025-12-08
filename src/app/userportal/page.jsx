'use client';

import { useSession } from 'next-auth/react';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { User, Calendar, Award, Building2, ExternalLink, Search, FileText, ArrowRight, TrendingUp, BookOpen } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';

export default function UserPortalPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [certificates, setCertificates] = useState([]);
  const [userDetails, setUserDetails] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [analytics, setAnalytics] = useState(null);
  const [analyticsLoading, setAnalyticsLoading] = useState(true);

  useEffect(() => {
    // Wait for session loading to complete
    if (status === 'loading') return;
    
    // If no session, redirect to signin
    if (!session) {
      router.push('/signin');
      return;
    }
    
    // If user is not of role 'user', redirect to home
    if (session.user.role !== 'user') {
      router.push('/');
      return;
    }
    
    // If everything is good, fetch certificates and analytics
    fetchUserCertificates();
    fetchUserAnalytics();
  }, [session, status, router]);

  const fetchUserCertificates = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/user-certificates');
      
      if (!response.ok) {
        throw new Error('Failed to fetch certificates');
      }
      
      const data = await response.json();
      setCertificates(data.certificates);
      setUserDetails(data.user);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchUserAnalytics = async () => {
    try {
      setAnalyticsLoading(true);
      const response = await fetch('/api/user-analytics');
      
      if (!response.ok) {
        throw new Error('Failed to fetch analytics');
      }
      
      const data = await response.json();
      setAnalytics(data);
    } catch (err) {
      console.error('Analytics error:', err);
    } finally {
      setAnalyticsLoading(false);
    }
  };

  // Use analytics certificates (Certificate2) for display
  const displayCertificates = analytics?.certificates || [];
  
  const filteredCertificates = displayCertificates.filter(cert =>
    cert?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    cert?.certificateId?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    cert?.courseName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    cert?.courseDomain?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    } catch (error) {
      return 'N/A';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50/30 via-white to-teal-50/30 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-emerald-200 border-t-emerald-600 mx-auto mb-4"></div>
          <p className="text-slate-600 text-sm font-medium">Loading certificates...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50/30 via-white to-teal-50/30 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-500 text-sm mb-2">Something went wrong</div>
          <p className="text-slate-600 text-sm">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50/30 via-white to-teal-50/30">
      {/* Header */}
      <div className="bg-gradient-to-r from-white via-emerald-50/20 to-white border-b border-emerald-100 shadow-sm">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-slate-900">My Certificates</h1>
              <p className="text-slate-500 text-sm mt-1">View and manage your credentials</p>
            </div>
            <a
              href="/req-certf"
              className="inline-flex items-center px-4 py-2 bg-emerald-600 text-white text-sm font-medium rounded-lg hover:bg-emerald-700 transition-colors"
            >
              Request Certificate
              <ArrowRight className="w-4 h-4 ml-2" />
            </a>
          </div>

          {/* User Info */}
          <div className="mt-6 flex items-center gap-4 p-4 bg-gradient-to-br from-emerald-50/50 via-white to-teal-50/50 rounded-xl border border-emerald-100 shadow-sm">
            <div className="p-3 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-xl shadow-md">
              <User className="w-5 h-5 text-white" />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-3">
                <h2 className="text-lg font-semibold text-slate-900">{session?.user?.name || userDetails?.name}</h2>
                <span className="text-xs text-emerald-700 font-medium bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">Student</span>
              </div>
              <div className="mt-1 flex items-center gap-2 text-sm">
                <span className="text-slate-500">APAAR ID:</span>
                <span className="font-mono font-medium text-slate-700">
                  {session?.user?.username || userDetails?.apaarId}
                </span>
              </div>
            </div>
            <div className="text-right text-sm text-slate-500">
              Member since {userDetails ? formatDate(userDetails.createdAt) : ''}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Analytics Section */}
        {!analyticsLoading && analytics && analytics.totalCertificates > 0 && (
          <div className="mb-8">
            <h2 className="text-lg font-semibold text-slate-900 mb-4">Your Learning Analytics</h2>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Total Credits Card */}
              <div className="bg-gradient-to-br from-white via-emerald-50/30 to-white rounded-xl border border-emerald-100 p-6 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 bg-gradient-to-br from-emerald-100 to-emerald-50 rounded-lg">
                    <TrendingUp className="w-5 h-5 text-emerald-600" />
                  </div>
                  <h3 className="text-base font-semibold text-slate-900">Total Credits Earned</h3>
                </div>
                <div className="text-4xl font-bold text-emerald-600 mb-2">
                  {analytics.totalCredits}
                </div>
                <p className="text-sm text-slate-500">
                  Across {analytics.totalCertificates} certificate{analytics.totalCertificates !== 1 ? 's' : ''}
                </p>
              </div>

              {/* Pie Chart Card */}
              <div className="bg-gradient-to-br from-white via-teal-50/30 to-white rounded-xl border border-teal-100 p-6 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 bg-gradient-to-br from-teal-100 to-teal-50 rounded-lg">
                    <BookOpen className="w-5 h-5 text-teal-600" />
                  </div>
                  <h3 className="text-base font-semibold text-slate-900">Course Distribution</h3>
                </div>
                
                {analytics.domainData && analytics.domainData.length > 0 ? (
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={analytics.domainData}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="value"
                        >
                          {analytics.domainData.map((entry, index) => {
                            const colors = ['#10b981', '#3b82f6', '#f59e0b', '#8b5cf6', '#ec4899', '#14b8a6'];
                            return <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />;
                          })}
                        </Pie>
                        <Tooltip 
                          content={({ active, payload }) => {
                            if (active && payload && payload.length) {
                              const data = payload[0].payload;
                              return (
                                <div className="bg-white p-3 rounded-lg border border-slate-200 shadow-sm">
                                  <p className="font-semibold text-slate-900">{data.name}</p>
                                  <p className="text-sm text-slate-600">{data.value} course{data.value !== 1 ? 's' : ''}</p>
                                  <p className="text-sm text-emerald-600">{data.credits} credits</p>
                                </div>
                              );
                            }
                            return null;
                          }}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <p className="text-sm text-slate-500 text-center py-8">No domain data available</p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Stats */}
        <div className="grid grid-cols-3 gap-6 mb-8">
          <div className="bg-gradient-to-br from-white via-emerald-50/40 to-white rounded-xl border border-emerald-100 p-5 shadow-sm hover:shadow-md transition-shadow">
            <div className="text-3xl font-bold text-emerald-600">{analytics?.totalCertificates || 0}</div>
            <div className="text-sm text-slate-500 mt-1">Total Certificates</div>
          </div>
          
          <div className="bg-gradient-to-br from-white via-teal-50/40 to-white rounded-xl border border-teal-100 p-5 shadow-sm hover:shadow-md transition-shadow">
            <div className="text-3xl font-bold text-teal-600">
              {analytics?.domainData?.length || 0}
            </div>
            <div className="text-sm text-slate-500 mt-1">Course Domains</div>
          </div>
          
          <div className="bg-gradient-to-br from-white via-cyan-50/40 to-white rounded-xl border border-cyan-100 p-5 shadow-sm hover:shadow-md transition-shadow">
            <div className="text-lg font-semibold text-cyan-600">
              {displayCertificates.length > 0 
                ? formatDate(displayCertificates[0]?.createdAt)
                : 'N/A'
              }
            </div>
            <div className="text-sm text-slate-500 mt-1">Latest Certificate</div>
          </div>
        </div>

        {/* Search */}
        <div className="relative mb-6">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            className="w-full pl-10 pr-4 py-2.5 bg-gradient-to-r from-white via-emerald-50/20 to-white border border-emerald-200 rounded-xl text-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent shadow-sm"
            placeholder="Search by name, ID, or organization..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        {/* Certificates List */}
        <div className="bg-gradient-to-br from-white via-slate-50/30 to-white rounded-xl border border-slate-200 shadow-md">
          <div className="px-5 py-4 border-b border-slate-100">
            <h2 className="text-sm font-semibold text-slate-900">
              Certificates ({filteredCertificates.length})
            </h2>
          </div>
          
          {filteredCertificates.length === 0 ? (
            <div className="text-center py-16">
              <FileText className="mx-auto h-10 w-10 text-slate-300" />
              <h3 className="mt-3 text-sm font-medium text-slate-900">
                {searchTerm ? 'No certificates found' : 'No certificates yet'}
              </h3>
              <p className="mt-1 text-sm text-slate-500">
                {searchTerm 
                  ? 'Try adjusting your search terms.' 
                  : 'Your certificates will appear here once issued.'
                }
              </p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {filteredCertificates.map((certificate) => (
                <div key={certificate.id} className="p-5 hover:bg-gradient-to-r hover:from-emerald-50/30 hover:to-teal-50/30 transition-all">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="p-2 bg-gradient-to-br from-emerald-100 to-emerald-50 rounded-lg shadow-sm">
                          <Award className="w-4 h-4 text-emerald-600" />
                        </div>
                        <h3 className="text-base font-semibold text-slate-900">
                          {certificate.name}
                        </h3>
                        {certificate.certificateId && (
                          <span className="text-xs font-mono text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                            {certificate.certificateId}
                          </span>
                        )}
                      </div>
                      
                      <div className="flex flex-wrap items-center gap-4 text-sm text-slate-600">
                        {certificate.courseDomain && (
                          <div className="flex items-center gap-1.5">
                            <Building2 className="w-3.5 h-3.5 text-slate-400" />
                            <span>{certificate.courseDomain}</span>
                          </div>
                        )}
                        
                        {certificate.courseCredits && (
                          <div className="flex items-center gap-1.5">
                            <Award className="w-3.5 h-3.5 text-slate-400" />
                            <span>{certificate.courseCredits} credits</span>
                          </div>
                        )}
                        
                        {certificate.courseName && (
                          <div className="flex items-center gap-1.5">
                            <span className="text-slate-400">•</span>
                            <span>{certificate.courseName}</span>
                          </div>
                        )}
                        
                        {certificate.marks && certificate.maxMarks && (
                          <div className="flex items-center gap-1.5">
                            <span className="text-slate-400">•</span>
                            <span>{certificate.marks}/{certificate.maxMarks}</span>
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <a
                      href={certificate.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center px-3 py-1.5 text-sm font-medium text-slate-700 bg-slate-100 rounded-lg hover:bg-slate-200 transition-colors"
                    >
                      <ExternalLink className="w-3.5 h-3.5 mr-1.5" />
                      View
                    </a>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}