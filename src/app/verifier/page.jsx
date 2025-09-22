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
    <div className="min-h-screen flex items-center justify-center bg-[#f8f6f1]">
      <div className="bg-[#e1eae5] p-8 rounded-2xl shadow-lg w-full max-w-md text-center">
        <h1 className="text-2xl font-bold text-[#4e796b] mb-6">
          Enter Certificate Year
        </h1>
        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="number"
            value={year}
            onChange={(e) => setYear(e.target.value.slice(0, 4))}
            placeholder="Enter year"
            className="w-full px-3 py-2 rounded-lg border border-[#a7d7b8] bg-[#f8f6f1] outline-none"
            disabled={loading}
          />
          <button
            type="submit"
            disabled={loading}
            className={`w-full py-3 rounded-xl font-semibold text-lg transition-colors 
              ${loading ? "bg-gray-400 cursor-not-allowed" : "bg-[#a7d7b8] text-white hover:bg-[#66b2a0]"}`}
          >
            {loading ? "Processing..." : "Continue"}
          </button>
        </form>

        {/* Loader */}
        {loading && (
          <div className="mt-6 flex justify-center">
            <div className="h-8 w-8 border-4 border-[#a7d7b8] border-t-transparent rounded-full animate-spin"></div>
          </div>
        )}
      </div>
    </div>
  );
}
