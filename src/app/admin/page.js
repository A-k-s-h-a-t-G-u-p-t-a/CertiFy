"use client";

import { useState } from "react";

export default function AdminDashboard() {
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    address: ""
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

    
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    try {
      const res = fetch("/api/organizations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData)
      });

      const data = res.json();

      if (res.ok) {
        setMessage("Organization created successfully!");
        setFormData({ name: "", email: "", address: "" });
        setShowForm(false);
      } else {
        setMessage("Error: " + data.error);
      }
    } catch (error) {
      setMessage("Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center p-10" style={{ backgroundColor: "#f8f6f1" }}>
      <h1 className="text-3xl font-bold mb-6" style={{ color: "#4e796b" }}>Admin Dashboard</h1>

      <button
        onClick={() => setShowForm(!showForm)}
        className="px-5 py-2 rounded-lg shadow transition"
         style={{
          backgroundColor: "#66b2a0",
          color: "#fff",
        }}
      >
        {showForm ? "Cancel" : "Create Organization"}
      </button>

      {showForm && (
        <form
          onSubmit={handleSubmit}
          className="mt-6 p-6 rounded-xl shadow-lg w-full max-w-md space-y-4"
        >
          <div>
            <label className="block font-medium" style={{ color: "#4e796b" }}>Organization Name</label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              required
              className="w-full border p-2 rounded-md mt-1"
              style={{ borderColor: "#a7d7b8" }}
            />
          </div>

          <div>
            <label className="block font-medium" style={{ color: "#4e796b" }}>Email</label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              required
              className="w-full border p-2 rounded-md mt-1"
              style={{ borderColor: "#a7d7b8" }}
            />
          </div>

          <div>
            <label className="block font-medium" style={{ color: "#4e796b" }}>Address</label>
            <textarea
              name="address"
              value={formData.address}
              onChange={handleChange}
              required
              className="w-full border p-2 rounded-md mt-1"
              style={{ borderColor: "#a7d7b8" }}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2 rounded-lg transition"
            style={{
              backgroundColor: "#66b2a0",
              color: "#fff",
            }}
          >
            {loading ? "Saving..." : "Create Organization"}
          </button>
        </form>
      )}

      {message && (
        <p className="mt-4 text-lg" style={{ color: "#4e796b" }}>
          {message}
        </p>
      )}
    </div>
  );
}

