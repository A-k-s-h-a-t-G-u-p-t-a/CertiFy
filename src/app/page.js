import { NavbarDemo } from "@/components/NavbarContent";
import Image from "next/image";
import { ShieldCheck, Zap, CheckCircle2 } from "lucide-react";

export default function Home() {
  return (
    <div className="min-h-screen font-sans bg-[#f8f6f1] text-[#4e796b] flex flex-col">
      {/* Navbar */}
      <NavbarDemo />

     
      {/*Hero Section*/}
      <section className="flex flex-col items-center justify-center text-center gap-6 px-6 sm:px-20 py-20 bg-[#e1eae5] rounded-b-3xl shadow-lg">
        <h1 className="text-4xl sm:text-5xl font-bold text-[#4e796b]">
          Certify
        </h1>
        <p className="text-lg sm:text-xl text-[#66b2a0] max-w-xl">
          Academic Certificate Authenticity Validator – Secure, Reliable, and Fast.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 mt-4">
          <a
            href="#get-started"
            className="px-6 py-3 rounded-full bg-[#a7d7b8] hover:bg-[#66b2a0] text-white font-semibold transition"
          >
            Get Started
          </a>
          <a
            href="#learn-more"
            className="px-6 py-3 rounded-full border-2 border-[#4e796b] hover:bg-[#4e796b] hover:text-white transition font-semibold"
          >
            Learn More
          </a>
        </div>
      </section>

      {/* Features Section */}
      <section className="flex flex-col sm:flex-row justify-around items-center gap-10 px-6 sm:px-20 py-20">
        <div className="bg-[#f8f6f1] rounded-2xl p-6 shadow-md flex flex-col items-center gap-3 w-60 text-center">
          <ShieldCheck className="w-10 h-10 text-[#4e796b]" />

          <h3 className="text-xl font-bold text-[#4e796b]">Secure</h3>
          <p className="text-[#66b2a0] text-sm">
            Your certificate data is protected with top-tier security measures.
          </p>
        </div>
        <div className="bg-[#f8f6f1] rounded-2xl p-6 shadow-md flex flex-col items-center gap-3 w-60 text-center">
          <Zap className="w-10 h-10 text-[#4e796b]" />
          <h3 className="text-xl font-bold text-[#4e796b]">Fast</h3>
          <p className="text-[#66b2a0] text-sm">
            Verify academic credentials instantly with minimal effort.
          </p>
        </div>
        <div className="bg-[#f8f6f1] rounded-2xl p-6 shadow-md flex flex-col items-center gap-3 w-60 text-center">
          <CheckCircle2 className="w-10 h-10 text-[#4e796b]" />
          <h3 className="text-xl font-bold text-[#4e796b]">Reliable</h3>
          <p className="text-[#66b2a0] text-sm">
            Accurate verification ensuring complete authenticity and trust.
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-[#4e796b] text-white flex flex-col sm:flex-row justify-between items-center px-6 sm:px-20 py-4 fixed bottom-0 left-0 w-full">
        <p>&copy; {new Date().getFullYear()} Certify. All rights reserved.</p>
        <div className="flex gap-4">
          <a href="#learn-more" className="hover:underline">
            About
          </a>
          <a href="#contact" className="hover:underline">
            Contact
          </a>
          <a href="#docs" className="hover:underline">
            Docs
          </a>
        </div>
      </footer>
    </div>
  );
}

