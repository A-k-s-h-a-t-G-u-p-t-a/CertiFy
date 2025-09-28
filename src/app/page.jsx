"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { LampContainer } from "@/components/ui/lamp";
//import { redirect } from 'next/navigation';
//import "../i18";
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
  Certificate
} from "lucide-react";
import Link from "next/link";
import "./globals.css";

export default function LandingPage() {
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
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50 pt-20">
        <div className="max-w-7xl mx-auto pb-40 pt-16">
          <motion.div 
            className="text-center space-y-8 px-4"
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <motion.div
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="flex justify-center mb-6"
            >
              <div className="relative p-4 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full shadow-2xl">
                <Shield className="h-12 w-12 text-white" />
                <div className="absolute inset-0 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full animate-ping opacity-20"></div>
              </div>
            </motion.div>

            <motion.h1 
              className="text-4xl md:text-6xl lg:text-7xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-cyan-600 bg-clip-text text-transparent leading-tight"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.4 }}
            >
              CertiFy
            </motion.h1>

            <motion.p 
              className="text-xl md:text-2xl lg:text-3xl text-gray-700 max-w-4xl mx-auto leading-relaxed"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.6 }}
            >
              The Future of Certificate Verification
              <br />
              <span className="text-gradient bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent font-semibold">
                AI-Powered • Blockchain-Secured • Universally Compatible
              </span>
            </motion.p>

            <motion.p 
              className="text-lg md:text-xl text-gray-600 max-w-3xl mx-auto"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.8 }}
            >
              Revolutionary certificate verification using deep learning, blockchain technology, 
              and advanced OCR. Verify any certificate - legacy or digital - in seconds with 99.7% accuracy.
            </motion.p>

            <motion.div 
              className="flex flex-col sm:flex-row justify-center gap-4 pt-8"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 1 }}
            >
              <Link href="/verifier2">
                <Button size="lg" className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-8 py-3 text-lg font-semibold shadow-xl hover:shadow-2xl transform hover:scale-105 transition-all duration-300">
                  <Shield className="h-5 w-5 mr-2" />
                  Start Verifying
                  <ChevronRight className="h-5 w-5 ml-2" />
                </Button>
              </Link>
              <Link href="/certificate-generator">
                <Button variant="outline" size="lg" className="border-2 border-purple-600 text-purple-600 hover:bg-purple-50 px-8 py-3 text-lg font-semibold shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300">
                  <Award className="h-5 w-5 mr-2" />
                  Issue Certificates
                </Button>
              </Link>
            </motion.div>
          </motion.div>
        </div>

        {/* Floating Elements */}
        <div className="absolute inset-0 pointer-events-none">
          <motion.div
            className="absolute top-20 left-10 text-blue-400 opacity-20"
            animate={{ 
              y: [0, -20, 0],
              rotate: [0, 5, 0]
            }}
            transition={{ duration: 6, repeat: Infinity }}
          >
            <Brain className="h-16 w-16" />
          </motion.div>
          <motion.div
            className="absolute top-32 right-16 text-purple-400 opacity-20"
            animate={{ 
              y: [0, 20, 0],
              rotate: [0, -5, 0]
            }}
            transition={{ duration: 8, repeat: Infinity }}
          >
            <Shield className="h-12 w-12" />
          </motion.div>
          <motion.div
            className="absolute bottom-32 left-16 text-cyan-400 opacity-20"
            animate={{ 
              y: [0, -15, 0],
              x: [0, 10, 0]
            }}
            transition={{ duration: 7, repeat: Infinity }}
          >
            <FileCheck className="h-14 w-14" />
          </motion.div>
        </div>
      </section>

      {/* Stats Section */}
      <section id="section-stats" className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4">
          <motion.div 
            className="grid grid-cols-2 lg:grid-cols-4 gap-8"
            initial={{ opacity: 0, y: 50 }}
            animate={isVisible["section-stats"] ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.8 }}
          >
            {stats.map((stat, index) => (
              <motion.div
                key={index}
                className="text-center"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={isVisible["section-stats"] ? { opacity: 1, scale: 1 } : {}}
                transition={{ duration: 0.6, delay: index * 0.1 }}
              >
                <div className="bg-white rounded-2xl p-6 shadow-lg hover:shadow-xl transition-shadow duration-300">
                  <div className="flex justify-center mb-4">
                    <div className="p-3 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full text-white">
                      {stat.icon}
                    </div>
                  </div>
                  <h3 className="text-3xl font-bold text-gray-900 mb-2">{stat.value}</h3>
                  <p className="text-gray-600">{stat.label}</p>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Features Section */}
      <section id="section-features" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4">
          <motion.div 
            className="text-center mb-16"
            initial={{ opacity: 0, y: 50 }}
            animate={isVisible["section-features"] ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.8 }}
          >
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
              Revolutionary Technology Stack
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Built with cutting-edge AI and blockchain technology to deliver unmatched accuracy and security
            </p>
          </motion.div>

          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Interactive Feature Display */}
            <motion.div
              className="space-y-4"
              initial={{ opacity: 0, x: -50 }}
              animate={isVisible["section-features"] ? { opacity: 1, x: 0 } : {}}
              transition={{ duration: 0.8 }}
            >
              {features.map((feature, index) => (
                <motion.div
                  key={index}
                  className={`p-6 rounded-xl cursor-pointer transition-all duration-100 ${
                    currentFeature === index 
                      ? 'bg-gradient-to-r ' + feature.color + ' text-white shadow-xl scale-105' 
                      : 'bg-gray-50 hover:bg-gray-100 text-gray-900'
                  }`}
                  onClick={() => setCurrentFeature(index)}
                  whileHover={{ scale: currentFeature === index ? 1.05 : 1.02 }}
                >
                  <div className="flex items-center space-x-4">
                    <div className={`p-3 rounded-lg ${
                      currentFeature === index ? 'bg-white/20' : 'bg-white'
                    }`}>
                      <div className={currentFeature === index ? 'text-white' : 'text-gray-600'}>
                        {feature.icon}
                      </div>
                    </div>
                    <div>
                      <h3 className="text-xl font-semibold mb-1">{feature.title}</h3>
                      <p className={`text-sm ${
                        currentFeature === index ? 'text-white/90' : 'text-gray-600'
                      }`}>
                        {feature.description}
                      </p>
                    </div>
                  </div>
                </motion.div>
              ))}
            </motion.div>

            {/* Visual Demo */}
            <motion.div
              className="relative"
              initial={{ opacity: 0, x: 50 }}
              animate={isVisible["section-features"] ? { opacity: 1, x: 0 } : {}}
              transition={{ duration: 0.8 }}
            >
              <div className="bg-gradient-to-br from-green-800 to-emerald-900 rounded-2xl p-8 text-white shadow-2xl">
                <div className="flex items-center justify-between mb-6">
                  <h4 className="text-lg font-semibold">CertiFy Verification Engine</h4>
                  <div className="flex space-x-2">
                    <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                    <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                    <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <div className="flex items-center space-x-3">
                    <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                    <span className="text-sm">Initializing AI verification...</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse"></div>
                    <span className="text-sm">Processing certificate image...</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <div className="w-2 h-2 bg-purple-400 rounded-full animate-pulse"></div>
                    <span className="text-sm">Extracting data with OCR...</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <div className="w-2 h-2 bg-yellow-400 rounded-full animate-pulse"></div>
                    <span className="text-sm">Verifying on blockchain...</span>
                  </div>
                  <div className="mt-6 p-4 bg-green-800/50 rounded-lg border-l-4 border-green-400">
                    <div className="flex items-center space-x-2">
                      <CheckCircle className="h-5 w-5 text-green-400" />
                      <span className="text-green-400 font-semibold">Verification Complete</span>
                    </div>
                    <p className="text-sm text-green-300 mt-1">Certificate authenticated in 2.3 seconds</p>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Technology Stack */}
      <section id="section-tech" className="py-20 bg-gradient-to-br from-blue-50 to-purple-50">
        <div className="max-w-7xl mx-auto px-4">
          <motion.div 
            className="text-center mb-16"
            initial={{ opacity: 0, y: 50 }}
            animate={isVisible["section-tech"] ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.8 }}
          >
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
              Powered by Advanced Technology
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Our cutting-edge tech stack ensures maximum accuracy, security, and performance
            </p>
          </motion.div>

          <motion.div 
            className="grid md:grid-cols-2 lg:grid-cols-3 gap-8"
            initial={{ opacity: 0, y: 50 }}
            animate={isVisible["section-tech"] ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.8 }}
          >
            {techStack.map((tech, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={isVisible["section-tech"] ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                whileHover={{ y: -5 }}
                className="group"
              >
                <Card className="h-full hover:shadow-xl transition-shadow duration-300 group-hover:shadow-2xl">
                  <CardContent className="p-6">
                    <div className="flex items-center space-x-4 mb-4">
                      <div className="p-3 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg text-white group-hover:scale-110 transition-transform duration-300">
                        {tech.icon}
                      </div>
                      <div>
                        <h3 className="font-semibold text-lg text-gray-900">{tech.name}</h3>
                        <p className="text-gray-600 text-sm">{tech.desc}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Use Cases */}
      <section id="section-use-cases" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4">
          <motion.div 
            className="text-center mb-16"
            initial={{ opacity: 0, y: 50 }}
            animate={isVisible["section-use-cases"] ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.8 }}
          >
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
              Trusted by Organizations Worldwide
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              From universities to corporations, CertiFy serves diverse verification needs
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8">
            {useCases.map((useCase, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 50 }}
                animate={isVisible["section-use-cases"] ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.8, delay: index * 0.2 }}
                whileHover={{ y: -10 }}
                className="group"
              >
                <Card className="h-full hover:shadow-2xl transition-all duration-300 border-2 hover:border-purple-200 group-hover:bg-gradient-to-br group-hover:from-blue-50 group-hover:to-purple-50">
                  <CardContent className="p-8">
                    <div className="text-center mb-6">
                      <div className="inline-flex p-4 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full text-white mb-4 group-hover:scale-110 transition-transform duration-300">
                        {useCase.icon}
                      </div>
                      <h3 className="text-2xl font-bold text-gray-900 mb-3">{useCase.title}</h3>
                      <p className="text-gray-600 mb-6">{useCase.description}</p>
                    </div>
                    <div className="space-y-3">
                      {useCase.features.map((feature, fIndex) => (
                        <div key={fIndex} className="flex items-center space-x-3">
                          <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0" />
                          <span className="text-gray-700">{feature}</span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="section-how-it-works" className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4">
          <motion.div 
            className="text-center mb-16"
            initial={{ opacity: 0, y: 50 }}
            animate={isVisible["section-how-it-works"] ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.8 }}
          >
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
              How CertiFy Works
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Simple, secure, and lightning-fast certificate verification in four steps
            </p>
          </motion.div>

          <div className="grid md:grid-cols-4 gap-8">
            {[
              {
                step: "01",
                title: "Upload Certificate",
                description: "Upload any certificate - physical scan or digital file",
                icon: <FileImage className="h-8 w-8" />,
                color: "from-blue-500 to-cyan-500"
              },
              {
                step: "02", 
                title: "AI Processing",
                description: "Our AI extracts and analyzes certificate data using OCR and deep learning",
                icon: <Brain className="h-8 w-8" />,
                color: "from-purple-500 to-pink-500"
              },
              {
                step: "03",
                title: "Blockchain Verification", 
                description: "Compare against immutable records stored on the blockchain",
                icon: <Shield className="h-8 w-8" />,
                color: "from-green-500 to-emerald-500"
              },
              {
                step: "04",
                title: "Instant Results",
                description: "Get verification results with detailed authenticity report",
                icon: <CheckCircle className="h-8 w-8" />,
                color: "from-orange-500 to-red-500"
              }
            ].map((step, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 50 }}
                animate={isVisible["section-how-it-works"] ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.8, delay: index * 0.2 }}
                className="text-center group"
              >
                <div className="relative mb-6">
                  <div className={`w-20 h-20 mx-auto bg-gradient-to-br ${step.color} rounded-full flex items-center justify-center text-white shadow-lg group-hover:shadow-xl group-hover:scale-110 transition-all duration-300`}>
                    {step.icon}
                  </div>
                  <div className="absolute -top-2 -right-2 w-8 h-8 bg-gray-900 text-white rounded-full flex items-center justify-center text-sm font-bold">
                    {step.step}
                  </div>
                  {index < 3 && (
                    <div className="hidden md:block absolute top-10 left-24 w-full h-0.5 bg-gradient-to-r from-gray-300 to-gray-400"></div>
                  )}
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">{step.title}</h3>
                <p className="text-gray-600">{step.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-br from-blue-600 via-purple-600 to-cyan-600">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
          >
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
              Ready to Secure Your Certificates?
            </h2>
            <p className="text-xl text-white/90 mb-8 max-w-2xl mx-auto">
              Join thousands of organizations already using CertiFy for secure, 
              instant certificate verification powered by AI and blockchain technology.
            </p>
            <div className="flex flex-col sm:flex-row justify-center gap-4">
              <Link href="/verifier2">
                <Button size="lg" className="bg-white text-blue-600 hover:bg-gray-100 px-8 py-3 text-lg font-semibold shadow-xl hover:shadow-2xl transform hover:scale-105 transition-all duration-300">
                  <Shield className="h-5 w-5 mr-2" />
                  Start Verifying Now
                  <ArrowRight className="h-5 w-5 ml-2" />
                </Button>
              </Link>
              <Link href="/org">
                <Button variant="outline" size="lg" className="border-2 border-white text-white hover:bg-white hover:text-blue-600 px-8 py-3 text-lg font-semibold shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300">
                  <Building2 className="h-5 w-5 mr-2" />
                  Organization Dashboard
                </Button>
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gradient-to-br from-green-800 to-emerald-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <Shield className="h-8 w-8 text-green-400" />
                <span className="text-2xl font-bold">CertiFy</span>
              </div>
              <p className="text-green-100">
                The future of certificate verification through AI and blockchain technology.
              </p>
            </div>
            <div>
              <h3 className="font-semibold mb-4">Platform</h3>
              <div className="space-y-2">
                <Link href="/verifier2" className="block text-green-200 hover:text-white transition-colors">
                  Verify Certificates
                </Link>
                <Link href="/certificate-generator" className="block text-green-200 hover:text-white transition-colors">
                  Generate Certificates
                </Link>
                <Link href="/org" className="block text-green-200 hover:text-white transition-colors">
                  Organization Portal
                </Link>
              </div>
            </div>
            <div>
              <h3 className="font-semibold mb-4">Technology</h3>
              <div className="space-y-2">
                <span className="block text-green-200">Deep Learning AI</span>
                <span className="block text-green-200">Blockchain Security</span>
                <span className="block text-green-200">Advanced OCR</span>
                <span className="block text-green-200">Perceptual Hashing</span>
              </div>
            </div>
            <div>
              <h3 className="font-semibold mb-4">Company</h3>
              <div className="space-y-2">
                <span className="block text-green-200">About Us</span>
                <span className="block text-green-200">Contact</span>
                <span className="block text-green-200">Privacy Policy</span>
                <span className="block text-green-200">Terms of Service</span>
              </div>
            </div>
          </div>
          <div className="border-t border-green-700 mt-12 pt-8 text-center text-green-200">
            <p>&copy; 2025 CertiFy. All rights reserved. Secured by blockchain technology.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}

// export default function Page() {
//   redirect('/en'); // default language
// }
