'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function SignUpPage() {
  const router = useRouter();
  const [apaarId, setApaarId] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/register', {
        method: 'POST',
        body: JSON.stringify({ apaarId, password }),
        headers: { 'Content-Type': 'application/json' },
      });

      if (res.ok) {
        router.push('/signin');
      } else {
        const data = await res.json();
        setError(data.message || 'Something went wrong');
      }
    } catch {
      setError('Failed to register');
    }

    setLoading(false);
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-100 dark:bg-gray-900 px-4">
      <div className="w-full max-w-md rounded-xl bg-white p-8 shadow-lg dark:bg-zinc-900">
        <h2 className="mb-6 text-center text-2xl font-bold text-gray-900 dark:text-white">
          Create User Account
        </h2>

        <form onSubmit={handleSubmit} className="space-y-6">
          {error && <p className="text-sm text-red-500">{error}</p>}

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Apaar ID</label>
            <input
              type="text"
              required
              value={apaarId}
              onChange={(e) => setApaarId(e.target.value)}
              className="mt-1 w-full rounded-md border border-gray-300 p-2 shadow-sm focus:border-blue-500 focus:ring focus:ring-blue-200 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
              placeholder="Enter your Apaar ID"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Password</label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1 w-full rounded-md border border-gray-300 p-2 shadow-sm focus:border-blue-500 focus:ring focus:ring-blue-200 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
              placeholder="••••••••"
            />
          </div>

          <button
            type="submit"
            className="w-full rounded-md bg-blue-600 p-2 text-white hover:bg-blue-700 disabled:opacity-50"
            disabled={loading}
          >
            {loading ? 'Signing up...' : 'Sign Up'}
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
