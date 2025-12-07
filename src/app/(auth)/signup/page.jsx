'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function SignUpPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    apaarId: '',
    name: '',
    mobile: '',
    dob: '',
    password: '',
    confirmPassword: ''
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

    // Validate passwords match
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      setLoading(false);
      return;
    }

    // Validate mobile number (10 digits)
    if (!/^\d{10}$/.test(formData.mobile)) {
      setError('Mobile number must be 10 digits');
      setLoading(false);
      return;
    }

    try {
      const res = await fetch('/api/register', {
        method: 'POST',
        body: JSON.stringify({
          apaarId: formData.apaarId,
          name: formData.name,
          mobile: formData.mobile,
          dob: formData.dob,
          password: formData.password
        }),
        headers: { 'Content-Type': 'application/json' },
      });

      if (res.ok) {
        router.push('/signin');
      } else {
        const data = await res.json();
        setError(data.error || 'Something went wrong');
      }
    } catch {
      setError('Failed to register');
    }

    setLoading(false);
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 px-4 py-8">
      <div className="w-full max-w-md rounded-2xl bg-white/90 backdrop-blur-lg p-8 shadow-2xl border border-white/20">
        <div className="mb-6 text-center">
          <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg">
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
            </svg>
          </div>
          <h2 className="text-3xl font-bold bg-gradient-to-r from-slate-800 to-slate-600 bg-clip-text text-transparent">
            Create Account
          </h2>
          <p className="text-slate-600 text-sm mt-2">Join CertiFy to manage your certificates</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="p-3 rounded-xl bg-red-50 border border-red-200">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">APAAR ID</label>
            <input
              type="text"
              name="apaarId"
              required
              value={formData.apaarId}
              onChange={handleChange}
              className="w-full rounded-xl border-2 border-slate-200 bg-white/50 px-4 py-3 shadow-sm focus:border-blue-400 focus:ring-4 focus:ring-blue-100 outline-none transition-all"
              placeholder="Enter your APAAR ID"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">Full Name</label>
            <input
              type="text"
              name="name"
              required
              value={formData.name}
              onChange={handleChange}
              className="w-full rounded-xl border-2 border-slate-200 bg-white/50 px-4 py-3 shadow-sm focus:border-blue-400 focus:ring-4 focus:ring-blue-100 outline-none transition-all"
              placeholder="Enter your full name"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">Mobile Number</label>
            <input
              type="tel"
              name="mobile"
              required
              pattern="[0-9]{10}"
              value={formData.mobile}
              onChange={handleChange}
              className="w-full rounded-xl border-2 border-slate-200 bg-white/50 px-4 py-3 shadow-sm focus:border-blue-400 focus:ring-4 focus:ring-blue-100 outline-none transition-all"
              placeholder="10-digit mobile number"
              maxLength="10"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">Date of Birth</label>
            <input
              type="date"
              name="dob"
              required
              value={formData.dob}
              onChange={handleChange}
              max={new Date().toISOString().split('T')[0]}
              className="w-full rounded-xl border-2 border-slate-200 bg-white/50 px-4 py-3 shadow-sm focus:border-blue-400 focus:ring-4 focus:ring-blue-100 outline-none transition-all"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">Password</label>
            <input
              type="password"
              name="password"
              required
              minLength="6"
              value={formData.password}
              onChange={handleChange}
              className="w-full rounded-xl border-2 border-slate-200 bg-white/50 px-4 py-3 shadow-sm focus:border-blue-400 focus:ring-4 focus:ring-blue-100 outline-none transition-all"
              placeholder="Minimum 6 characters"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">Confirm Password</label>
            <input
              type="password"
              name="confirmPassword"
              required
              minLength="6"
              value={formData.confirmPassword}
              onChange={handleChange}
              className="w-full rounded-xl border-2 border-slate-200 bg-white/50 px-4 py-3 shadow-sm focus:border-blue-400 focus:ring-4 focus:ring-blue-100 outline-none transition-all"
              placeholder="Re-enter your password"
            />
          </div>

          <button
            type="submit"
            className="w-full rounded-xl bg-gradient-to-r from-blue-500 to-purple-600 p-3 text-white font-semibold hover:from-blue-600 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl transition-all transform hover:scale-[1.02] active:scale-[0.98]"
            disabled={loading}
          >
            {loading ? 'Creating Account...' : 'Sign Up'}
          </button>
        </form>



        <p className="mt-6 text-center text-sm text-gray-600 dark:text-gray-300">
          Already have an account?{' '}
          <a href="/signin" className="text-blue-600 hover:underline">
            Sign in
          </a>
        </p>
      </div>
    </div>
  );
}
