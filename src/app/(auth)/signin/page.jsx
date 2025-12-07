'use client';
import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function SignInPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("organisation");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    const res = await signIn("credentials", {
      redirect: false,
      username,
      password,
      role,
    });

    if (res?.error) {
      setError("Invalid credentials");
      setLoading(false);
    } else {
      // Route based on role
      if (role === "admin") {
        router.push("/admin");
      } else if (role === "organisation") {
        router.push("/upload");
      }
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 px-4">
      <div className="w-full max-w-md rounded-2xl bg-white/90 backdrop-blur-lg p-8 shadow-2xl border border-white/20">
        {/* Header */}
        <div className="mb-8 text-center">
          <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-r from-slate-700 to-slate-900 rounded-2xl flex items-center justify-center shadow-lg">
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <h2 className="text-3xl font-bold bg-gradient-to-r from-slate-800 to-slate-600 bg-clip-text text-transparent">
            Admin & Organization
          </h2>
          <p className="text-slate-600 text-sm mt-2">Secure login portal</p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-5">
          {error && (
            <div className="p-4 rounded-xl bg-red-50 border border-red-200">
              <p className="text-sm text-red-600 flex items-center gap-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4v.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                {error}
              </p>
            </div>
          )}

          {/* Role Selection */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">Login as</label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value)}
              className="w-full rounded-xl border-2 border-slate-200 bg-white/50 px-4 py-3 shadow-sm focus:border-slate-400 focus:ring-4 focus:ring-slate-100 outline-none transition-all"
            >
              <option value="admin">Admin</option>
              <option value="organisation">Organisation</option>
            </select>
          </div>

          {/* Username Input */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">Username</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Enter your username"
              required
              className="w-full rounded-xl border-2 border-slate-200 bg-white/50 px-4 py-3 shadow-sm focus:border-slate-400 focus:ring-4 focus:ring-slate-100 outline-none transition-all"
            />
          </div>

          {/* Password Input */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
              required
              className="w-full rounded-xl border-2 border-slate-200 bg-white/50 px-4 py-3 shadow-sm focus:border-slate-400 focus:ring-4 focus:ring-slate-100 outline-none transition-all"
            />
          </div>

          {/* Sign In Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl bg-gradient-to-r from-slate-700 to-slate-900 p-3 text-white font-semibold hover:from-slate-800 hover:to-slate-950 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl transition-all transform hover:scale-[1.02] active:scale-[0.98]"
          >
            {loading ? (
              <div className="flex items-center justify-center gap-2">
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                Signing in...
              </div>
            ) : (
              'Sign In'
            )}
          </button>
        </form>

        {/* Footer */}
        <div className="mt-8 pt-6 border-t border-slate-200 space-y-4">
          <div className="text-center">
            <p className="text-slate-600 text-sm">
              Looking for user login?{' '}
              <Link href="/user-signin" className="text-blue-600 font-semibold hover:text-blue-700">
                User Login
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
