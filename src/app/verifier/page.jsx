"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function HomePage() {
  const [year, setYear] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!year) {
      alert("Please enter a year");
      return;
    }

    const yearNum = parseInt(year, 10);
    setLoading(true);

    // Simulate processing time (optional delay)
    setTimeout(() => {
      if (yearNum < 2025) {
        router.push("/verifier1");
      } else {
        router.push("/verifier2");
      }
    }, 1200); // 1.2s delay for loader effect
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#f8f6f1] via-[#e8f5e8] to-[#d4f4dd] p-4">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-1/2 -left-1/2 w-96 h-96 bg-gradient-to-br from-[#a7d7b8]/20 to-[#66b2a0]/20 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-1/2 -right-1/2 w-96 h-96 bg-gradient-to-br from-[#4e796b]/20 to-[#a7d7b8]/20 rounded-full blur-3xl"></div>
      </div>

      <div className="relative bg-[#e1eae5]/90 backdrop-blur-lg p-8 rounded-3xl shadow-2xl border border-[#a7d7b8]/20 w-full max-w-md text-center transform transition-all duration-300 hover:shadow-3xl">
        {/* Header with icon */}
        <div className="mb-8">
          <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-r from-[#4e796b] to-[#66b2a0] rounded-2xl flex items-center justify-center shadow-lg">
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-[#4e796b] to-[#2d5a47] bg-clip-text text-transparent mb-2">
            Certificate Verification
          </h1>
          <p className="text-[#4e796b] text-sm">
            Enter the year your certificate was issued to proceed
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="relative">
            <label className="block text-left text-sm font-medium text-[#4e796b] mb-2">
              Certificate Year
            </label>
            <div className="relative">
              <input
                type="number"
                value={year}
                onChange={(e) => setYear(e.target.value.slice(0, 4))}
                placeholder="e.g., 2023"
                className="w-full px-4 py-4 rounded-2xl border-2 border-[#a7d7b8] bg-[#f8f6f1]/50 backdrop-blur-sm outline-none transition-all duration-300 focus:border-[#66b2a0] focus:ring-4 focus:ring-[#a7d7b8]/30 focus:bg-[#f8f6f1] text-lg font-medium placeholder:text-[#4e796b]/60 disabled:opacity-60 disabled:cursor-not-allowed"
                disabled={loading}
                min="1900"
                max="2030"
              />
              <div className="absolute right-4 top-1/2 transform -translate-y-1/2">
                <svg className="w-5 h-5 text-[#66b2a0]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className={`w-full py-4 rounded-2xl font-semibold text-lg transition-all duration-300 transform hover:scale-[1.02] active:scale-[0.98] shadow-lg
              ${loading 
                ? "bg-gray-400 cursor-not-allowed text-slate-500 shadow-none" 
                : "bg-gradient-to-r from-[#a7d7b8] to-[#66b2a0] text-white hover:from-[#66b2a0] hover:to-[#4e796b] hover:shadow-xl"
              }`}
          >
            {loading ? (
              <div className="flex items-center justify-center space-x-2">
                <div className="w-5 h-5 border-2 border-slate-400 border-t-transparent rounded-full animate-spin"></div>
                <span>Processing...</span>
              </div>
            ) : (
              <div className="flex items-center justify-center space-x-2">
                <span>Continue Verification</span>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </div>
            )}
          </button>
        </form>

        {/* Enhanced loader with progress indication */}
        {loading && (
          <div className="mt-8">
            <div className="flex justify-center mb-4">
              <div className="relative">
                <div className="h-12 w-12 border-4 border-[#a7d7b8]/40 rounded-full"></div>
                <div className="absolute top-0 left-0 h-12 w-12 border-4 border-[#66b2a0] border-t-transparent rounded-full animate-spin"></div>
              </div>
            </div>
            <div className="space-y-2">
              <div className="w-full bg-[#a7d7b8]/30 rounded-full h-2 overflow-hidden">
                <div className="bg-gradient-to-r from-[#66b2a0] to-[#4e796b] h-2 rounded-full animate-pulse" style={{width: "60%"}}></div>
              </div>
              <p className="text-sm text-[#4e796b] animate-pulse">
                Analyzing certificate year...
              </p>
            </div>
          </div>
        )}

        {/* Additional info */}
        <div className="mt-8 pt-6 border-t border-[#a7d7b8]/40">
          <p className="text-xs text-[#4e796b]/70">
            Certificates issued before 2025 use legacy verification
          </p>
        </div>
      </div>
    </div>
  );
}
