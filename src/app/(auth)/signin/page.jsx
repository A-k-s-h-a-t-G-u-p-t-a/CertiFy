'use client';
import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";

export default function SignInPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("organisation");
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();

    const res = await signIn("credentials", {
      redirect: false,
      username,
      password,
      role,
    });

    if (res?.error) {
      setError("Invalid credentials");
    } else {
      // Route based on role
      if (role === "admin") {
        router.push("/admin");
      } else if (role === "organisation") {
        router.push("/upload");
      } else if (role === "user") {
        router.push("/"); // Redirect users to homepage or user dashboard
      }
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-100">
      <form onSubmit={handleSubmit} className="bg-white p-8 rounded shadow-md w-full max-w-md">
        <h2 className="text-xl font-bold mb-4">Sign In</h2>

        {error && <p className="text-red-500 mb-4">{error}</p>}

        <label>{role === "user" ? "Apaar ID" : "Username"}</label>
        <input
          type="text"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          required
          className="w-full mb-4 p-2 border rounded"
          placeholder={role === "user" ? "Enter your Apaar ID" : "Enter your username"}
        />

        <label>Password</label>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          className="w-full mb-4 p-2 border rounded"
        />

        <label>Role</label>
        <select value={role} onChange={(e) => setRole(e.target.value)} className="w-full mb-4 p-2 border rounded">
          <option value="admin">Admin</option>
          <option value="organisation">Organisation</option>
          <option value="user">User</option>
        </select>

        <button type="submit" className="w-full p-2 bg-blue-600 text-white rounded">Sign In</button>
        
        <div className="mt-4 text-center text-sm text-gray-600">
          New user? <a href="/signup" className="text-blue-600 hover:underline">Create an account</a>
        </div>
      </form>
    </div>
  );
}
