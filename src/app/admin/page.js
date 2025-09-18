"use client";

import { useState } from "react";
import { motion } from "motion/react"; 
import { LampContainer } from "@/components/ui/lamp"; 

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
      const res = await fetch("/api/organizations", {
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

      {/* Lamp section now only 1/3 of screen height */}
      <LampContainer className="h-[30vh]">
        <motion.h1
          initial={{ opacity: 0.5, y: 100 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{
            delay: 0.3,
            duration: 0.8,
            ease: "easeInOut",
          }}
          className="mt-8 bg-gradient-to-br from-slate-300 to-slate-500 py-4 bg-clip-text text-center text-4xl font-bold tracking-tight text-transparent md:text-6xl"
        >
          Admin Dashboard
        </motion.h1>
      </LampContainer>

          {/* Toggle Form Button */}
      <button
        onClick={() => setShowForm(!showForm)}
        className="px-5 py-2 rounded-lg shadow transition mt-6"
        style={{
          backgroundColor: "#66b2a0",
          color: "#fff",
        }}
      >
        {showForm ? "Cancel" : "Create Organization"}
      </button>

     
       {/* Form Section */}
      {showForm && (
        <form
          onSubmit={handleSubmit}
          className="mt-6 p-6 rounded-xl shadow-lg w-full max-w-md space-y-4"
        >
          <div>
            <label className="block font-medium" style={{ color: "#4e796b" }}>
              Organization Name
            </label>
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
            <label className="block font-medium" style={{ color: "#4e796b" }}>
              Email
            </label>
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
            <label className="block font-medium" style={{ color: "#4e796b" }}>
              Address
            </label>
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

//           <div>
//             <label className="block font-medium" style={{ color: "#4e796b" }}>Email</label>
//             <input
//               type="email"
//               name="email"
//               value={formData.email}
//               onChange={handleChange}
//               required
//               className="w-full border p-2 rounded-md mt-1"
//               style={{ borderColor: "#a7d7b8" }}
//             />
//           </div>

//           <div>
//             <label className="block font-medium" style={{ color: "#4e796b" }}>Address</label>
//             <textarea
//               name="address"
//               value={formData.address}
//               onChange={handleChange}
//               required
//               className="w-full border p-2 rounded-md mt-1"
//               style={{ borderColor: "#a7d7b8" }}
//             />
//           </div>

//           <button
//             type="submit"
//             disabled={loading}
//             className="w-full py-2 rounded-lg transition"
//             style={{
//               backgroundColor: "#66b2a0",
//               color: "#fff",
//             }}
//           >
//             {loading ? "Saving..." : "Create Organization"}
//           </button>
//         </form>
//       )}

//       {message && (
//         <p className="mt-4 text-lg" style={{ color: "#4e796b" }}>
//           {message}
//         </p>
//       )}
//     </div>
//   );
// }

