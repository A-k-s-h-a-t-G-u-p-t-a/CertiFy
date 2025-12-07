'use client';

import { useSession } from 'next-auth/react';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { User, Calendar, Award, Building2, ExternalLink, Download, Search } from 'lucide-react';

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
        month: 'long',
        day: 'numeric'
      });
    } catch (error) {
      return 'N/A';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#4e796b] mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your certificates...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-500 text-xl mb-4">❌ Error</div>
          <p className="text-gray-600">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-[#4e796b] to-[#66b2a0] shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="bg-white/20 backdrop-blur-sm p-3 rounded-2xl border border-white/30">
                <User className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-white">User Portal</h1>
                <p className="text-white/90 text-sm mt-1">Manage your certificates</p>
              </div>
            </div>
            <div className="text-sm text-white/80">
              Member since {userDetails ? formatDate(userDetails.createdAt) : ''}
            </div>
          </div>

          {/* User Info Box */}
          <div className="mt-6 bg-white/95 backdrop-blur-sm rounded-2xl p-6 shadow-xl border border-white/50">
            <div className="flex items-center gap-4">
              <div className="bg-gradient-to-br from-[#4e796b] to-[#66b2a0] p-4 rounded-xl shadow-lg">
                <User className="w-8 h-8 text-white" />
              </div>
              <div className="flex-1">
                <div className="flex items-baseline gap-3">
                  <h2 className="text-2xl font-bold text-gray-900">{session?.user?.name || userDetails?.name}</h2>
                  <span className="text-sm text-[#4e796b] font-semibold bg-[#a7d7b8]/30 px-2 py-1 rounded-md">Student</span>
                </div>
                <div className="mt-2 flex items-center gap-2">
                  <span className="text-sm font-semibold text-gray-600">APAAR ID:</span>
                  <span className="text-base font-mono font-bold text-[#4e796b] bg-[#a7d7b8]/20 px-3 py-1 rounded-lg border border-[#66b2a0]/30">
                    {session?.user?.username || userDetails?.apaarId}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="bg-[#a7d7b8] p-3 rounded-full">
                <Award className="w-6 h-6 text-white" />
              </div>
              <div className="ml-4">
                <h3 className="text-lg font-semibold text-gray-900">Total Certificates</h3>
                <p className="text-3xl font-bold text-[#4e796b]">{certificates.length}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="bg-[#66b2a0] p-3 rounded-full">
                <Building2 className="w-6 h-6 text-white" />
              </div>
              <div className="ml-4">
                <h3 className="text-lg font-semibold text-gray-900">Organizations</h3>
                <p className="text-3xl font-bold text-[#4e796b]">
                  {new Set(certificates.filter(cert => cert?.organisation?.name).map(cert => cert.organisation.name)).size}
                </p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="bg-[#4e796b] p-3 rounded-full">
                <Calendar className="w-6 h-6 text-white" />
              </div>
              <div className="ml-4">
                <h3 className="text-lg font-semibold text-gray-900">Latest Certificate</h3>
                <p className="text-base font-medium text-[#4e796b]">
                  {certificates.length > 0 
                    ? formatDate(certificates[0]?.dateIssued || certificates[0]?.createdAt)
                    : 'N/A'
                  }
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Search Bar */}
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-[#4e796b] focus:border-[#4e796b]"
              placeholder="Search certificates by name, ID, or organization..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        {/* Certificates Grid */}
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">
              My Certificates ({filteredCertificates.length})
            </h2>
          </div>
          
          {filteredCertificates.length === 0 ? (
            <div className="text-center py-12">
              <Award className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">
                {searchTerm ? 'No certificates found' : 'No certificates yet'}
              </h3>
              <p className="mt-1 text-sm text-gray-500">
                {searchTerm 
                  ? 'Try adjusting your search terms.' 
                  : 'Your certificates will appear here once they are issued.'
                }
              </p>
            </div>
          ) : (
            <div className="grid gap-6 p-6">
              {filteredCertificates.map((certificate) => (
                <div key={certificate.id} className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow bg-white">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center mb-3">
                        <div className="bg-[#4e796b] p-2 rounded-full mr-3">
                          <Award className="w-5 h-5 text-white" />
                        </div>
                        <h3 className="text-xl font-bold text-gray-900">
                          {certificate.name}
                        </h3>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
                        {certificate.certificateId && (
                          <div className="flex items-center text-sm text-gray-600">
                            <span className="font-semibold text-gray-800 mr-2">Certificate ID:</span>
                            <span className="bg-gray-100 px-2 py-1 rounded">{certificate.certificateId}</span>
                          </div>
                        )}
                        
                        <div className="flex items-center text-sm text-gray-600">
                          <Building2 className="w-4 h-4 mr-2 text-[#4e796b]" />
                          <span className="font-semibold mr-2">Organization:</span>
                          <span>{certificate.organisation.name}</span>
                        </div>
                        
                        {certificate.year && (
                          <div className="flex items-center text-sm text-gray-600">
                            <Calendar className="w-4 h-4 mr-2 text-[#4e796b]" />
                            <span className="font-semibold mr-2">Year:</span>
                            <span>{certificate.year}</span>
                          </div>
                        )}
                        
                        {certificate.courseName && (
                          <div className="flex items-center text-sm text-gray-600">
                            <span className="font-semibold mr-2">Course:</span>
                            <span>{certificate.courseName}</span>
                          </div>
                        )}
                        
                        {certificate.courseId && (
                          <div className="flex items-center text-sm text-gray-600">
                            <span className="font-semibold mr-2">Course ID:</span>
                            <span>{certificate.courseId}</span>
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex flex-col space-y-2 ml-6">
                      <a
                        href={certificate.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-[#4e796b] hover:bg-[#66b2a0] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#4e796b] transition-colors"
                      >
                        <ExternalLink className="w-4 h-4 mr-2" />
                        View Certificate
                      </a>
                    </div>
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