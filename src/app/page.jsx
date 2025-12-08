"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { LampContainer } from "@/components/ui/lamp";
import { useSession } from "next-auth/react";
import { 
  Shield, 
  ChevronRight, 
  Star, 
  Lock, 
  Brain, 
  Database, 
  FileCheck, 
  Zap, 
  Award, 
  Users, 
  CheckCircle, 
  ArrowRight,
  Sparkles,
  Eye,
  Cpu,
  Globe,
  TrendingUp,
  Code,
  Layers,
  Hash,
  FileImage,
  Search,
  Workflow,
  Building2,
  GraduationCap,
  FileText
} from "lucide-react";
import Link from "next/link";

export default function LandingPage() {
  const { data: session } = useSession();
  const [currentFeature, setCurrentFeature] = useState(0);
  const [isVisible, setIsVisible] = useState({});

  // Auto-rotate features
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentFeature((prev) => (prev + 1) % 4);
    }, 1000); // Reduced from 4000ms to 2000ms
    return () => clearInterval(interval);
  }, []);

  // Intersection observer for animations
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          setIsVisible((prev) => ({
            ...prev,
            [entry.target.id]: entry.isIntersecting
          }));
        });
      },
      { threshold: 0.1 }
    );

    const sections = document.querySelectorAll('[id^="section-"]');
    sections.forEach((section) => observer.observe(section));

    return () => observer.disconnect();
  }, []);

  const features = [
    {
      icon: <Brain className="h-8 w-8" />,
      title: "AI-Powered Deep Learning",
      description: "Advanced neural networks extract and verify certificate data with 99.7% accuracy",
      color: "from-purple-500 to-pink-500"
    },
    {
      icon: <Shield className="h-8 w-8" />,
      title: "Blockchain Security",
      description: "Immutable verification on secure blockchain infrastructure using Ethereum",
      color: "from-blue-500 to-cyan-500"
    },
    {
      icon: <FileImage className="h-8 w-8" />,
      title: "Legacy Certificate Support",
      description: "Works with both digital and physical certificates from any era",
      color: "from-green-500 to-emerald-500"
    },
    {
      icon: <Zap className="h-8 w-8" />,
      title: "Instant Verification",
      description: "Real-time certificate validation in seconds, not days",
      color: "from-orange-500 to-red-500"
    }
  ];

  const stats = [
    { value: "99.7%", label: "Accuracy Rate", icon: <CheckCircle className="h-5 w-5" /> },
    { value: "10M+", label: "Certificates Verified", icon: <Award className="h-5 w-5" /> },
    { value: "500+", label: "Organizations", icon: <Building2 className="h-5 w-5" /> },
    { value: "<3s", label: "Verification Time", icon: <Zap className="h-5 w-5" /> }
  ];

  const techStack = [
    { name: "Deep Learning", icon: <Brain className="h-6 w-6" />, desc: "PyTorch & TensorFlow" },
    { name: "Blockchain", icon: <Layers className="h-6 w-6" />, desc: "Ethereum & Solidity" },
    { name: "OCR Engine", icon: <Eye className="h-6 w-6" />, desc: "Advanced Text Recognition" },
    { name: "Perceptual Hash", icon: <Hash className="h-6 w-6" />, desc: "Image Fingerprinting" },
    { name: "React/Next.js", icon: <Code className="h-6 w-6" />, desc: "Modern Web Frontend" },
    { name: "Smart Contracts", icon: <FileCheck className="h-6 w-6" />, desc: "Automated Verification" }
  ];

  const useCases = [
    {
      icon: <GraduationCap className="h-12 w-12" />,
      title: "Educational Institutions",
      description: "Universities, colleges, and schools can issue and verify academic credentials",
      features: ["Degree verification", "Academic transcripts", "Professional certifications"]
    },
    {
      icon: <Building2 className="h-12 w-12" />,
      title: "Corporations",
      description: "Companies can verify employee qualifications and issue internal certifications",
      features: ["Employee credentials", "Training certificates", "Skill validations"]
    },
    {
      icon: <Award className="h-12 w-12" />,
      title: "Certification Bodies",
      description: "Professional certification organizations can ensure credential authenticity",
      features: ["Industry certifications", "Professional licenses", "Compliance documents"]
    }
  ];

  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden bg-white pt-20">
        <div className="max-w-6xl mx-auto px-4 py-32">
          <motion.div 
            className="text-center space-y-6"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="flex justify-center mb-8"
            >
              <div className="p-3 bg-slate-900 rounded-2xl shadow-lg">
                <Shield className="h-10 w-10 text-white" />
              </div>
            </motion.div>

            <motion.h1 
              className="text-5xl md:text-6xl lg:text-7xl font-bold text-slate-900 leading-tight tracking-tight"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
            >
              CertiFy
            </motion.h1>

            <motion.p 
              className="text-xl md:text-2xl text-slate-600 max-w-2xl mx-auto font-light"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
            >
              AI-powered certificate verification with blockchain security
            </motion.p>

            <motion.div 
              className="flex flex-col sm:flex-row justify-center gap-4 pt-8"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
            >
              <Link href="/verifier2">
                <Button size="lg" className="bg-slate-900 hover:bg-slate-800 text-white px-8 py-6 text-base font-medium rounded-xl shadow-sm hover:shadow-md transition-all">
                  Start Verifying
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </Link>
              
              {!session ? (
                <Link href="/signup">
                  <Button variant="outline" size="lg" className="border-2 border-slate-200 text-slate-900 hover:bg-slate-50 px-8 py-6 text-base font-medium rounded-xl transition-all">
                    Get Started
                  </Button>
                </Link>
              ) : session.user?.role === "user" ? (
                <Link href="/userportal">
                  <Button variant="outline" size="lg" className="border-2 border-slate-200 text-slate-900 hover:bg-slate-50 px-8 py-6 text-base font-medium rounded-xl transition-all">
                    View My Certificates
                  </Button>
                </Link>
              ) : session.user?.role === "organisation" ? (
                <Link href="/upload-certificates">
                  <Button variant="outline" size="lg" className="border-2 border-slate-200 text-slate-900 hover:bg-slate-50 px-8 py-6 text-base font-medium rounded-xl transition-all">
                    Issue Certificates
                  </Button>
                </Link>
              ) : session.user?.role === "admin" ? (
                <Link href="/admin">
                  <Button variant="outline" size="lg" className="border-2 border-slate-200 text-slate-900 hover:bg-slate-50 px-8 py-6 text-base font-medium rounded-xl transition-all">
                    View Admin Profile
                  </Button>
                </Link>
              ) : null}
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Stats Section */}
      <section id="section-stats" className="py-24 bg-slate-50 border-y border-slate-100">
        <div className="max-w-6xl mx-auto px-4">
          <motion.div 
            className="grid grid-cols-2 lg:grid-cols-4 gap-12"
            initial={{ opacity: 0, y: 30 }}
            animate={isVisible["section-stats"] ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6 }}
          >
            {stats.map((stat, index) => (
              <motion.div
                key={index}
                className="text-center"
                initial={{ opacity: 0, y: 20 }}
                animate={isVisible["section-stats"] ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.5, delay: index * 0.1 }}
              >
                <h3 className="text-4xl font-bold text-slate-900 mb-2">{stat.value}</h3>
                <p className="text-slate-600 text-sm">{stat.label}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Features Section */}
      <section id="section-features" className="py-24 bg-white">
        <div className="max-w-6xl mx-auto px-4">
          <motion.div 
            className="text-center mb-16"
            initial={{ opacity: 0, y: 30 }}
            animate={isVisible["section-features"] ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6 }}
          >
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">
              How It Works
            </h2>
            <p className="text-lg text-slate-600 max-w-2xl mx-auto">
              Enterprise-grade verification powered by AI and blockchain
            </p>
          </motion.div>

          <motion.div 
            className="grid md:grid-cols-4 gap-8"
            initial={{ opacity: 0, y: 30 }}
            animate={isVisible["section-features"] ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6 }}
          >
            {features.map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={isVisible["section-features"] ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="text-center"
              >
                <div className="inline-flex p-4 bg-slate-100 rounded-2xl mb-4">
                  <div className="text-slate-700">
                    {feature.icon}
                  </div>
                </div>
                <h3 className="text-lg font-semibold text-slate-900 mb-2">{feature.title}</h3>
                <p className="text-sm text-slate-600">
                  {feature.description}
                </p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>



      {/* Use Cases */}
      <section id="section-use-cases" className="py-24 bg-slate-50">
        <div className="max-w-6xl mx-auto px-4">
          <motion.div 
            className="text-center mb-16"
            initial={{ opacity: 0, y: 30 }}
            animate={isVisible["section-use-cases"] ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6 }}
          >
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">
              Trusted by Organizations
            </h2>
            <p className="text-lg text-slate-600 max-w-2xl mx-auto">
              From universities to corporations, CertiFy delivers secure verification
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8">
            {useCases.map((useCase, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 30 }}
                animate={isVisible["section-use-cases"] ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.6, delay: index * 0.1 }}
              >
                <div className="bg-white rounded-2xl p-8 border border-slate-200 h-full hover:border-slate-300 transition-colors">
                  <div className="text-slate-700 mb-6">
                    {useCase.icon}
                  </div>
                  <h3 className="text-xl font-semibold text-slate-900 mb-3">{useCase.title}</h3>
                  <p className="text-slate-600 mb-6 text-sm">{useCase.description}</p>
                  <div className="space-y-2">
                    {useCase.features.map((feature, fIndex) => (
                      <div key={fIndex} className="flex items-center space-x-2">
                        <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full flex-shrink-0" />
                        <span className="text-slate-700 text-sm">{feature}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>



      {/* CTA Section */}
      <section className="py-24 bg-slate-900">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
          >
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              Start Verifying Today
            </h2>
            <p className="text-lg text-slate-400 mb-8 max-w-xl mx-auto">
              Join organizations using CertiFy for instant, secure certificate verification
            </p>
            <div className="flex flex-col sm:flex-row justify-center gap-4">
              <Link href="/verifier2">
                <Button size="lg" className="bg-white text-slate-900 hover:bg-slate-100 px-8 py-6 text-base font-medium rounded-xl transition-all">
                  Start Verifying
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </Link>
              
              {!session ? (
                <Link href="/signup">
                  <Button variant="outline" size="lg" className="border-2 border-slate-700 text-white hover:bg-slate-800 px-8 py-6 text-base font-medium rounded-xl transition-all">
                    Get Started
                  </Button>
                </Link>
              ) : session.user?.role === "user" ? (
                <Link href="/userportal">
                  <Button variant="outline" size="lg" className="border-2 border-slate-700 text-white hover:bg-slate-800 px-8 py-6 text-base font-medium rounded-xl transition-all">
                    View My Certificates
                  </Button>
                </Link>
              ) : session.user?.role === "organisation" ? (
                <Link href="/upload-certificates">
                  <Button variant="outline" size="lg" className="border-2 border-slate-700 text-white hover:bg-slate-800 px-8 py-6 text-base font-medium rounded-xl transition-all">
                    Issue Certificates
                  </Button>
                </Link>
              ) : session.user?.role === "admin" ? (
                <Link href="/admin">
                  <Button variant="outline" size="lg" className="border-2 border-slate-700 text-white hover:bg-slate-800 px-8 py-6 text-base font-medium rounded-xl transition-all">
                    View Admin Profile
                  </Button>
                </Link>
              ) : null}
            </div>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 py-12">
        <div className="max-w-6xl mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="flex items-center space-x-2 mb-6 md:mb-0">
              <div className="p-2 bg-emerald-500 rounded-lg">
                <Shield className="h-5 w-5 text-white" />
              </div>
              <span className="text-xl font-bold text-slate-900">CertiFy</span>
            </div>
            <div className="flex flex-wrap justify-center gap-6 text-sm text-slate-600">
              <Link href="/verifier2" className="hover:text-slate-900 transition-colors">
                Verify
              </Link>
              <Link href="/certificate-generator" className="hover:text-slate-900 transition-colors">
                Generate
              </Link>
              <Link href="/org" className="hover:text-slate-900 transition-colors">
                Organizations
              </Link>
              <span className="hover:text-slate-900 transition-colors cursor-pointer">About</span>
              <span className="hover:text-slate-900 transition-colors cursor-pointer">Contact</span>
            </div>
          </div>
          <div className="border-t border-slate-100 mt-8 pt-8 text-center text-sm text-slate-500">
            <p>&copy; 2025 CertiFy. Secured by blockchain technology.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
