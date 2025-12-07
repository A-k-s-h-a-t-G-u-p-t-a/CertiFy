'use client';

import { useState } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function UserSignInPage() {
  const router = useRouter();
  const [loginMethod, setLoginMethod] = useState('mobile'); // 'mobile' or 'apaarId'
  const [formData, setFormData] = useState({
    mobile: '',
    apaarId: '',
    password: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const identifier = loginMethod === 'mobile' ? formData.mobile : formData.apaarId;
      const password = formData.password;

      if (!identifier || !password) {
        setError('Please fill in all fields');
        setLoading(false);
        return;
      }

      // For mobile login, use mobile as username; for apaarId, use apaarId
      // The backend will validate that it's a user with matching password
      const result = await signIn('credentials', {
        username: identifier,
        password,
        role: 'user',
        redirect: false
      });

      if (result?.ok) {
        router.push('/userportal');
      } else {
        setError(result?.error || 'Invalid credentials');
      }
    } catch (err) {
      setError('Sign in failed. Please try again.');
    }

    setLoading(false);
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 px-4">
      <div className="w-full max-w-md rounded-2xl bg-white/90 backdrop-blur-lg p-8 shadow-2xl border border-white/20">
        {/* Header */}
        <div className="mb-8 text-center">
          <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg">
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h2 className="text-3xl font-bold bg-gradient-to-r from-slate-800 to-slate-600 bg-clip-text text-transparent">
            User Login
          </h2>
          <p className="text-slate-600 text-sm mt-2">Access your certificate dashboard</p>
        </div>

        {/* Login Method Toggle */}
        <div className="mb-6 flex gap-3">
          <button
            type="button"
            onClick={() => {
              setLoginMethod('mobile');
              setFormData({ ...formData, apaarId: '', mobile: '' });
            }}
            className={`flex-1 py-3 rounded-xl font-semibold transition-all ${
              loginMethod === 'mobile'
                ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            <svg className="w-4 h-4 inline mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
            </svg>
            Mobile
          </button>
          <button
            type="button"
            onClick={() => {
              setLoginMethod('apaarId');
              setFormData({ ...formData, apaarId: '', mobile: '' });
            }}
            className={`flex-1 py-3 rounded-xl font-semibold transition-all ${
              loginMethod === 'apaarId'
                ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            <svg className="w-4 h-4 inline mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H5a2 2 0 00-2 2v10a2 2 0 002 2h5m0 0h5a2 2 0 002-2v-5m0 0h2a2 2 0 012 2v3a2 2 0 01-2 2h-2.5" />
            </svg>
            APAAR ID
          </button>
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

          {/* Mobile or APAAR ID Input */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">
              {loginMethod === 'mobile' ? 'Mobile Number' : 'APAAR ID'}
            </label>
            <input
              type={loginMethod === 'mobile' ? 'tel' : 'text'}
              name={loginMethod === 'mobile' ? 'mobile' : 'apaarId'}
              value={loginMethod === 'mobile' ? formData.mobile : formData.apaarId}
              onChange={handleChange}
              placeholder={loginMethod === 'mobile' ? '10-digit mobile number' : 'Enter your APAAR ID'}
              pattern={loginMethod === 'mobile' ? '[0-9]{10}' : undefined}
              maxLength={loginMethod === 'mobile' ? '10' : undefined}
              required
              className="w-full rounded-xl border-2 border-slate-200 bg-white/50 px-4 py-3 shadow-sm focus:border-blue-400 focus:ring-4 focus:ring-blue-100 outline-none transition-all"
            />
          </div>

          {/* Password Input */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">Password</label>
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="Enter your password"
              required
              className="w-full rounded-xl border-2 border-slate-200 bg-white/50 px-4 py-3 shadow-sm focus:border-blue-400 focus:ring-4 focus:ring-blue-100 outline-none transition-all"
            />
          </div>

          {/* Sign In Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl bg-gradient-to-r from-blue-500 to-purple-600 p-3 text-white font-semibold hover:from-blue-600 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl transition-all transform hover:scale-[1.02] active:scale-[0.98]"
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
          <p className="text-center text-slate-600 text-sm">
            Don't have an account?{' '}
            <Link href="/signup" className="text-blue-600 font-semibold hover:text-blue-700">
              Sign up
            </Link>
          </p>
          <p className="text-center text-slate-600 text-sm">
            <Link href="/signin" className="text-blue-600 font-semibold hover:text-blue-700">
              Sign in as Admin/Organization
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}