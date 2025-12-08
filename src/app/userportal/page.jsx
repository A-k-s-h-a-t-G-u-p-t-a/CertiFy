'use client';

import { useSession } from 'next-auth/react';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { User, Calendar, Award, Building2, ExternalLink, Search, FileText, ArrowRight } from 'lucide-react';

export default function UserPortalPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [certificates, setCertificates] = useState([]);
  const [userDetails, setUserDetails] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

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
    
    // If everything is good, fetch certificates
    fetchUserCertificates();
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

  const filteredCertificates = certificates.filter(cert =>
    cert?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    cert?.certificateId?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    cert?.organisation?.name?.toLowerCase().includes(searchTerm.toLowerCase())
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
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-slate-200 border-t-slate-900 mx-auto mb-4"></div>
          <p className="text-slate-500 text-sm">Loading certificates...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-500 text-sm mb-2">Something went wrong</div>
          <p className="text-slate-600 text-sm">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-white border-b border-slate-200">
        <div className="border-t-2 border-emerald-500"></div>
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
          <div className="mt-6 flex items-center gap-4 p-4 bg-slate-50 rounded-xl border border-slate-200">
            <div className="p-3 bg-emerald-500 rounded-xl">
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
        {/* Stats */}
        <div className="grid grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-xl border border-slate-200 p-5">
            <div className="text-3xl font-bold text-emerald-600">{certificates.length}</div>
            <div className="text-sm text-slate-500 mt-1">Total Certificates</div>
          </div>
          
          <div className="bg-white rounded-xl border border-slate-200 p-5">
            <div className="text-3xl font-bold text-emerald-600">
              {new Set(certificates.filter(cert => cert?.organisation?.name).map(cert => cert.organisation.name)).size}
            </div>
            <div className="text-sm text-slate-500 mt-1">Organizations</div>
          </div>
          
          <div className="bg-white rounded-xl border border-slate-200 p-5">
            <div className="text-lg font-semibold text-emerald-600">
              {certificates.length > 0 
                ? formatDate(certificates[0]?.dateIssued || certificates[0]?.createdAt)
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
            className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
            placeholder="Search by name, ID, or organization..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        {/* Certificates List */}
        <div className="bg-white rounded-xl border border-slate-200">
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
                <div key={certificate.id} className="p-5 hover:bg-slate-50 transition-colors">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="p-2 bg-emerald-50 rounded-lg">
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
                        <div className="flex items-center gap-1.5">
                          <Building2 className="w-3.5 h-3.5 text-slate-400" />
                          <span>{certificate.organisation.name}</span>
                        </div>
                        
                        {certificate.year && (
                          <div className="flex items-center gap-1.5">
                            <Calendar className="w-3.5 h-3.5 text-slate-400" />
                            <span>{certificate.year}</span>
                          </div>
                        )}
                        
                        {certificate.courseName && (
                          <div className="flex items-center gap-1.5">
                            <span className="text-slate-400">•</span>
                            <span>{certificate.courseName}</span>
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