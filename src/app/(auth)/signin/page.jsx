'use client';
import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Shield, Lock, User, Building2, ArrowRight, CheckCircle, Loader2 } from "lucide-react";

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
      // Show specific error messages based on what failed
      if (res.error === "CredentialsSignin") {
        setError("Invalid username or password. Please try again.");
      } else {
        setError(res.error || "Invalid credentials");
      }
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
    <div className="min-h-screen flex bg-[#f8f6f1]">
      {/* Left Panel - Decorative & Branding */}
      <div className="hidden lg:flex w-1/2 bg-[#4e796b] relative overflow-hidden items-center justify-center p-12">
        {/* Abstract Background Shapes */}
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
          <div className="absolute top-[-10%] left-[-10%] w-96 h-96 bg-[#66b2a0] rounded-full mix-blend-multiply filter blur-3xl opacity-50 animate-blob"></div>
          <div className="absolute top-[-10%] right-[-10%] w-96 h-96 bg-[#a7d7b8] rounded-full mix-blend-multiply filter blur-3xl opacity-50 animate-blob animation-delay-2000"></div>
          <div className="absolute bottom-[-20%] left-[20%] w-96 h-96 bg-[#2d5a47] rounded-full mix-blend-multiply filter blur-3xl opacity-50 animate-blob animation-delay-4000"></div>
        </div>

        <div className="relative z-10 text-center text-white max-w-lg">
          <div className="mb-8 flex justify-center">
            <div className="w-24 h-24 bg-white/10 backdrop-blur-md rounded-3xl flex items-center justify-center border border-white/20 shadow-2xl">
              <Shield className="w-12 h-12 text-white" />
            </div>
          </div>
          <h1 className="text-5xl font-bold mb-6 tracking-tight">CertiFy</h1>
          <p className="text-xl text-[#d4f4dd] mb-8 leading-relaxed">
            The next generation of secure, blockchain-based certificate verification and management.
          </p>
          
          <div className="grid grid-cols-2 gap-4 text-left">
            <div className="bg-white/10 backdrop-blur-sm p-4 rounded-2xl border border-white/10">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-[#a7d7b8]/20 rounded-lg">
                  <Shield className="w-5 h-5 text-[#a7d7b8]" />
                </div>
                <span className="font-semibold">Secure</span>
              </div>
              <p className="text-sm text-white/70">Tamper-proof records on the blockchain</p>
            </div>
            <div className="bg-white/10 backdrop-blur-sm p-4 rounded-2xl border border-white/10">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-[#a7d7b8]/20 rounded-lg">
                  <CheckCircle className="w-5 h-5 text-[#a7d7b8]" />
                </div>
                <span className="font-semibold">Verified</span>
              </div>
              <p className="text-sm text-white/70">Instant authenticity checks</p>
            </div>
          </div>
        </div>
      </div>

      {/* Right Panel - Sign In Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 relative">
        {/* Mobile Background Decoration */}
        <div className="absolute inset-0 lg:hidden overflow-hidden pointer-events-none">
          <div className="absolute -top-24 -right-24 w-64 h-64 bg-[#a7d7b8]/20 rounded-full blur-3xl"></div>
          <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-[#4e796b]/10 rounded-full blur-3xl"></div>
        </div>

        <div className="w-full max-w-md bg-white/80 backdrop-blur-xl rounded-3xl shadow-2xl border border-[#a7d7b8]/30 p-8 lg:p-10 relative z-10">
          <div className="text-center mb-10">
            <h2 className="text-3xl font-bold text-[#2d5a47] mb-2">Welcome Back</h2>
            <p className="text-[#4e796b]/80">Please sign in to your account</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="p-4 rounded-xl bg-red-50 border border-red-200 animate-shake">
                <p className="text-sm text-red-600 flex items-center gap-2 font-medium">
                  <Shield className="w-4 h-4" />
                  {error}
                </p>
              </div>
            )}

            {/* Role Selection */}
            <div className="space-y-2">
              <label className="text-sm font-semibold text-[#4e796b] ml-1">Login as</label>
              <div className="relative">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-[#4e796b]/50 pointer-events-none">
                  {role === 'admin' ? <Shield className="w-5 h-5" /> : <Building2 className="w-5 h-5" />}
                </div>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  className="w-full pl-12 pr-4 py-3.5 rounded-xl border-2 border-[#a7d7b8]/50 bg-white/50 text-[#2d5a47] font-medium focus:border-[#4e796b] focus:ring-4 focus:ring-[#4e796b]/10 outline-none transition-all appearance-none cursor-pointer hover:bg-white"
                >
                  <option value="admin">Admin</option>
                  <option value="organisation">Organisation</option>
                </select>
                <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none">
                  <svg className="w-4 h-4 text-[#4e796b]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>
            </div>

            {/* Username Input */}
            <div className="space-y-2">
              <label className="text-sm font-semibold text-[#4e796b] ml-1">Username</label>
              <div className="relative group">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-[#4e796b]/50 group-focus-within:text-[#4e796b] transition-colors">
                  <User className="w-5 h-5" />
                </div>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Enter your username"
                  required
                  className="w-full pl-12 pr-4 py-3.5 rounded-xl border-2 border-[#a7d7b8]/50 bg-white/50 text-[#2d5a47] placeholder-[#4e796b]/40 focus:border-[#4e796b] focus:ring-4 focus:ring-[#4e796b]/10 outline-none transition-all hover:bg-white"
                />
              </div>
            </div>

            {/* Password Input */}
            <div className="space-y-2">
              <label className="text-sm font-semibold text-[#4e796b] ml-1">Password</label>
              <div className="relative group">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-[#4e796b]/50 group-focus-within:text-[#4e796b] transition-colors">
                  <Lock className="w-5 h-5" />
                </div>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  required
                  className="w-full pl-12 pr-4 py-3.5 rounded-xl border-2 border-[#a7d7b8]/50 bg-white/50 text-[#2d5a47] placeholder-[#4e796b]/40 focus:border-[#4e796b] focus:ring-4 focus:ring-[#4e796b]/10 outline-none transition-all hover:bg-white"
                />
              </div>
            </div>

            {/* Sign In Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 bg-gradient-to-r from-[#4e796b] to-[#66b2a0] text-white font-bold rounded-xl shadow-lg hover:shadow-xl hover:shadow-[#4e796b]/20 transition-all duration-300 transform hover:scale-[1.02] active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed disabled:transform-none flex items-center justify-center gap-2 group"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>Signing in...</span>
                </>
              ) : (
                <>
                  <span>Sign In</span>
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </button>
          </form>

          {/* Footer */}
          <div className="mt-8 pt-6 border-t border-[#a7d7b8]/30 text-center">
            <p className="text-[#4e796b]/80 text-sm">
              Looking for user login?{' '}
              <Link 
                href="/user-signin" 
                className="text-[#2d5a47] font-bold hover:text-[#4e796b] hover:underline decoration-2 underline-offset-4 transition-all"
              >
                User Login
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
