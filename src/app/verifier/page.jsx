"use client";

import { useRouter } from "next/navigation";

export default function HomePage() {
  const router = useRouter();

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#f8f6f1] via-[#e8f5e8] to-[#d4f4dd] p-4">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-1/2 -left-1/2 w-96 h-96 bg-gradient-to-br from-[#a7d7b8]/20 to-[#66b2a0]/20 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-1/2 -right-1/2 w-96 h-96 bg-gradient-to-br from-[#4e796b]/20 to-[#a7d7b8]/20 rounded-full blur-3xl"></div>
      </div>

      <div className="relative bg-[#e1eae5]/90 backdrop-blur-lg p-8 rounded-3xl shadow-2xl border border-[#a7d7b8]/20 w-full max-w-lg text-center transform transition-all duration-300 hover:shadow-3xl">
        {/* Header with icon */}
        <div className="mb-8">
          <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-r from-[#4e796b] to-[#66b2a0] rounded-2xl flex items-center justify-center shadow-lg">
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-[#4e796b] to-[#2d5a47] bg-clip-text text-transparent mb-2">
            Certificate Services
          </h1>
          <p className="text-[#4e796b] text-sm">
            Choose an option to continue
          </p>
        </div>

        {/* Options Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Option 1: Verify Certificate */}
          <button
            onClick={() => router.push("/verifier2")}
            className="group relative bg-white/80 backdrop-blur-sm p-6 rounded-2xl border-2 border-[#a7d7b8] hover:border-[#66b2a0] transition-all duration-300 transform hover:scale-[1.02] hover:shadow-xl active:scale-[0.98]"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-[#4e796b]/5 to-[#66b2a0]/5 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            
            <div className="relative">
              <div className="w-14 h-14 mx-auto mb-4 bg-gradient-to-r from-[#4e796b] to-[#66b2a0] rounded-xl flex items-center justify-center shadow-lg group-hover:shadow-xl transition-shadow duration-300">
                <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              
              <h3 className="text-xl font-bold text-[#4e796b] mb-2 group-hover:text-[#2d5a47] transition-colors">
                Verify Certificate
              </h3>
              
              <p className="text-sm text-[#4e796b]/70 mb-4">
                Check authenticity of existing certificates
              </p>
              
              <div className="flex items-center justify-center text-[#66b2a0] group-hover:text-[#4e796b] transition-colors">
                <span className="text-sm font-semibold">Continue</span>
                <svg className="w-4 h-4 ml-1 transform group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </div>
          </button>

          {/* Option 2: Request Certificate */}
          <button
            onClick={() => router.push("/verifier1")}
            className="group relative bg-white/80 backdrop-blur-sm p-6 rounded-2xl border-2 border-[#a7d7b8] hover:border-[#66b2a0] transition-all duration-300 transform hover:scale-[1.02] hover:shadow-xl active:scale-[0.98]"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-[#66b2a0]/5 to-[#a7d7b8]/5 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            
            <div className="relative">
              <div className="w-14 h-14 mx-auto mb-4 bg-gradient-to-r from-[#66b2a0] to-[#a7d7b8] rounded-xl flex items-center justify-center shadow-lg group-hover:shadow-xl transition-shadow duration-300">
                <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              
              <h3 className="text-xl font-bold text-[#4e796b] mb-2 group-hover:text-[#2d5a47] transition-colors">
                Request Certificate
              </h3>
              
              <p className="text-sm text-[#4e796b]/70 mb-4">
                Submit a new certificate request
              </p>
              
              <div className="flex items-center justify-center text-[#66b2a0] group-hover:text-[#4e796b] transition-colors">
                <span className="text-sm font-semibold">Continue</span>
                <svg className="w-4 h-4 ml-1 transform group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </div>
          </button>
        </div>

        {/* Additional info */}
        <div className="mt-8 pt-6 border-t border-[#a7d7b8]/40">
          <p className="text-xs text-[#4e796b]/70">
            Choose the appropriate option based on your needs
          </p>
        </div>
      </div>
    </div>
  );
}
