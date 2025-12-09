"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    GraduationCap,
    Building2,
    Wallet,
    CheckCircle2,
    Shield,
    Search,
    User,
    Menu,
    ChevronRight,
    ArrowRight,
    ArrowLeftRight,
    Download,
    ExternalLink,
    BookOpen,
    Calendar,
    CreditCard,
    TrendingUp,
    Award,
    FileText
} from "lucide-react";
import Link from "next/link";

// Mock credit data
const mockAcademicCredits = [
    {
        id: "ABC-2024-001",
        courseName: "Data Structures and Algorithms",
        institution: "IIT Delhi",
        institutionLogo: "IIT",
        semester: "Semester 3",
        year: "2024",
        credits: 4,
        grade: "A",
        gradePoints: 9,
        status: "verified",
        category: "Core",
        blockchainHash: "0x8f3a...2e4b"
    },
    {
        id: "ABC-2024-002",
        courseName: "Machine Learning Fundamentals",
        institution: "NPTEL (IIT Madras)",
        institutionLogo: "NPTEL",
        semester: "MOOC",
        year: "2024",
        credits: 3,
        grade: "Elite",
        gradePoints: 10,
        status: "verified",
        category: "Elective",
        blockchainHash: "0x5c2d...9f1e"
    },
    {
        id: "ABC-2024-003",
        courseName: "Technical Communication",
        institution: "IGNOU",
        institutionLogo: "IGNOU",
        semester: "Open Elective",
        year: "2023",
        credits: 2,
        grade: "A+",
        gradePoints: 10,
        status: "verified",
        category: "Open Elective",
        blockchainHash: "0x7e9f...3c8a"
    },
    {
        id: "ABC-2024-004",
        courseName: "Database Management Systems",
        institution: "Delhi University",
        institutionLogo: "DU",
        semester: "Semester 4",
        year: "2024",
        credits: 4,
        grade: "A",
        gradePoints: 9,
        status: "verified",
        category: "Core",
        blockchainHash: "0x1a4b...6d2f"
    },
    {
        id: "ABC-2024-005",
        courseName: "Entrepreneurship Development",
        institution: "SWAYAM (IIM Bangalore)",
        institutionLogo: "SWAYAM",
        semester: "MOOC",
        year: "2023",
        credits: 2,
        grade: "Distinction",
        gradePoints: 9,
        status: "verified",
        category: "Value Added",
        blockchainHash: "0x3b7c...8e5a"
    },
    {
        id: "ABC-2024-006",
        courseName: "Computer Networks",
        institution: "NIT Trichy",
        institutionLogo: "NIT",
        semester: "Semester 5",
        year: "2024",
        credits: 4,
        grade: "B+",
        gradePoints: 8,
        status: "verified",
        category: "Core",
        blockchainHash: "0x9d2e...4f7b"
    }
];

// Mock redemption history
const mockRedemptions = [
    {
        id: "RDM-001",
        from: "NPTEL (IIT Madras)",
        to: "IIT Delhi",
        credits: 3,
        course: "Machine Learning Fundamentals",
        date: "2024-06-15",
        status: "completed"
    },
    {
        id: "RDM-002",
        from: "SWAYAM",
        to: "Delhi University",
        credits: 2,
        course: "Entrepreneurship Development",
        date: "2024-03-20",
        status: "completed"
    }
];

export default function ABCMockPage() {
    const [selectedCredit, setSelectedCredit] = useState(mockAcademicCredits[0]);
    const [searchQuery, setSearchQuery] = useState("");
    const [activeTab, setActiveTab] = useState("credits");

    const totalCredits = mockAcademicCredits.reduce((acc, cred) => acc + cred.credits, 0);
    const avgGradePoints = (mockAcademicCredits.reduce((acc, cred) => acc + cred.gradePoints, 0) / mockAcademicCredits.length).toFixed(2);
    const uniqueInstitutions = [...new Set(mockAcademicCredits.map(c => c.institution))].length;

    const filteredCredits = mockAcademicCredits.filter(cred =>
        cred.courseName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        cred.institution.toLowerCase().includes(searchQuery.toLowerCase()) ||
        cred.category.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const getInstitutionColor = (logo: string) => {
        const colors: Record<string, string> = {
            IIT: "from-blue-500 to-indigo-600",
            NPTEL: "from-orange-500 to-red-500",
            IGNOU: "from-green-500 to-emerald-600",
            DU: "from-purple-500 to-pink-500",
            SWAYAM: "from-cyan-500 to-blue-500",
            NIT: "from-amber-500 to-orange-500"
        };
        return colors[logo] || "from-gray-500 to-gray-600";
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-amber-50">
            {/* Header - ABC Branding */}
            <header className="bg-gradient-to-r from-blue-700 via-blue-800 to-indigo-900 text-white shadow-lg">
                <div className="max-w-7xl mx-auto px-4 py-3">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                            <div className="flex items-center space-x-3">
                                <div className="w-12 h-12 bg-white rounded-lg flex items-center justify-center shadow-md">
                                    <Wallet className="w-7 h-7 text-blue-700" />
                                </div>
                                <div>
                                    <h1 className="text-xl font-bold">Academic Bank of Credits</h1>
                                    <p className="text-xs text-blue-200">National Academic Depository • UGC Initiative</p>
                                </div>
                            </div>
                            <span className="hidden md:inline-block px-3 py-1 bg-amber-500/20 text-amber-200 rounded-full text-xs font-medium backdrop-blur-sm border border-amber-400/30">
                                MOCK DEMONSTRATION
                            </span>
                        </div>
                        <div className="flex items-center space-x-4">
                            <div className="hidden md:flex items-center space-x-2 bg-white/10 rounded-lg px-3 py-2">
                                <Shield className="w-4 h-4 text-green-300" />
                                <span className="text-sm">Powered by CertiFy Blockchain</span>
                            </div>
                            <div className="flex items-center space-x-2 bg-white/20 rounded-lg px-4 py-2">
                                <div className="w-8 h-8 bg-amber-400 rounded-full flex items-center justify-center text-blue-900 font-bold">
                                    PS
                                </div>
                                <span className="hidden sm:inline">Priya Singh</span>
                            </div>
                            <Menu className="w-6 h-6 md:hidden cursor-pointer" />
                        </div>
                    </div>
                </div>

                {/* Navigation */}
                <nav className="bg-blue-900/50 backdrop-blur-sm">
                    <div className="max-w-7xl mx-auto px-4">
                        <div className="flex space-x-6 overflow-x-auto">
                            {[
                                { name: "Dashboard", icon: GraduationCap },
                                { name: "My Credits", icon: CreditCard },
                                { name: "Transfer", icon: ArrowLeftRight },
                                { name: "Institutions", icon: Building2 },
                                { name: "Documents", icon: FileText }
                            ].map((item, i) => (
                                <button
                                    key={item.name}
                                    className={`py-3 px-2 text-sm font-medium whitespace-nowrap border-b-2 transition-colors flex items-center gap-2 ${i === 0 ? "border-amber-400 text-white" : "border-transparent text-blue-200 hover:text-white hover:border-white/50"
                                        }`}
                                >
                                    <item.icon className="w-4 h-4" />
                                    {item.name}
                                </button>
                            ))}
                        </div>
                    </div>
                </nav>
            </header>

            <main className="max-w-7xl mx-auto px-4 py-8">
                {/* Stats Dashboard */}
                <motion.div
                    className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                >
                    {[
                        { icon: CreditCard, label: "Total Credits", value: totalCredits, suffix: "", color: "from-blue-500 to-indigo-600" },
                        { icon: TrendingUp, label: "Avg. Grade Points", value: avgGradePoints, suffix: "/10", color: "from-green-500 to-emerald-600" },
                        { icon: Building2, label: "Institutions", value: uniqueInstitutions, suffix: "", color: "from-purple-500 to-pink-500" },
                        { icon: ArrowLeftRight, label: "Credits Transferred", value: mockRedemptions.reduce((acc, r) => acc + r.credits, 0), suffix: "", color: "from-amber-500 to-orange-500" }
                    ].map((stat, index) => (
                        <motion.div
                            key={stat.label}
                            className="bg-white rounded-xl shadow-md p-5 border border-gray-100 hover:shadow-lg transition-all hover:-translate-y-1"
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ duration: 0.3, delay: index * 0.1 }}
                        >
                            <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${stat.color} flex items-center justify-center mb-4 shadow-lg`}>
                                <stat.icon className="w-6 h-6 text-white" />
                            </div>
                            <p className="text-3xl font-bold text-gray-900">
                                {stat.value}<span className="text-lg text-gray-400">{stat.suffix}</span>
                            </p>
                            <p className="text-sm text-gray-500 mt-1">{stat.label}</p>
                        </motion.div>
                    ))}
                </motion.div>

                {/* Tabs */}
                <div className="flex space-x-2 mb-6">
                    {["credits", "transfers"].map((tab) => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            className={`px-5 py-2.5 rounded-lg font-medium text-sm transition-all ${activeTab === tab
                                    ? "bg-blue-600 text-white shadow-lg"
                                    : "bg-white text-gray-600 hover:bg-gray-50 border border-gray-200"
                                }`}
                        >
                            {tab === "credits" ? "My Academic Credits" : "Credit Transfers"}
                        </button>
                    ))}
                </div>

                <AnimatePresence mode="wait">
                    {activeTab === "credits" ? (
                        <motion.div
                            key="credits"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            className="grid lg:grid-cols-3 gap-8"
                        >
                            {/* Credits List */}
                            <div className="lg:col-span-1">
                                <div className="bg-white rounded-xl shadow-md border border-gray-100 overflow-hidden">
                                    <div className="p-4 border-b border-gray-100 bg-gradient-to-r from-blue-50 to-indigo-50">
                                        <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                                            <BookOpen className="w-5 h-5 text-blue-600" />
                                            Credit Repository
                                        </h2>
                                        <div className="mt-3 relative">
                                            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                                            <input
                                                type="text"
                                                placeholder="Search courses, institutions..."
                                                value={searchQuery}
                                                onChange={(e) => setSearchQuery(e.target.value)}
                                                className="w-full pl-10 pr-4 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                            />
                                        </div>
                                    </div>

                                    <div className="divide-y divide-gray-100 max-h-[600px] overflow-y-auto">
                                        {filteredCredits.map((credit) => (
                                            <motion.button
                                                key={credit.id}
                                                onClick={() => setSelectedCredit(credit)}
                                                className={`w-full p-4 text-left hover:bg-blue-50 transition-colors ${selectedCredit?.id === credit.id ? "bg-blue-50 border-l-4 border-blue-600" : ""
                                                    }`}
                                                whileHover={{ x: 4 }}
                                            >
                                                <div className="flex items-start gap-3">
                                                    <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${getInstitutionColor(credit.institutionLogo)} flex items-center justify-center text-white font-bold text-xs flex-shrink-0 shadow`}>
                                                        {credit.institutionLogo}
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <h3 className="font-medium text-gray-900 truncate text-sm">{credit.courseName}</h3>
                                                        <p className="text-xs text-gray-500 truncate">{credit.institution}</p>
                                                        <div className="flex items-center gap-2 mt-1.5">
                                                            <span className="inline-flex items-center px-2 py-0.5 bg-blue-100 text-blue-700 text-xs rounded-full font-medium">
                                                                {credit.credits} Credits
                                                            </span>
                                                            <span className="inline-flex items-center px-2 py-0.5 bg-green-100 text-green-700 text-xs rounded-full font-medium">
                                                                {credit.grade}
                                                            </span>
                                                        </div>
                                                    </div>
                                                    <ChevronRight className="w-5 h-5 text-gray-400 flex-shrink-0" />
                                                </div>
                                            </motion.button>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            {/* Credit Detail */}
                            <div className="lg:col-span-2">
                                <motion.div
                                    className="bg-white rounded-xl shadow-md border border-gray-100 overflow-hidden"
                                    key={selectedCredit?.id}
                                    initial={{ opacity: 0, x: 20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ duration: 0.3 }}
                                >
                                    {selectedCredit ? (
                                        <>
                                            {/* Credit Header */}
                                            <div className={`relative h-40 bg-gradient-to-br ${getInstitutionColor(selectedCredit.institutionLogo)}`}>
                                                <div className="absolute inset-0 bg-black/10" />
                                                <div className="absolute inset-0 flex items-center p-6">
                                                    <div className="flex items-center gap-6">
                                                        <div className="w-20 h-20 bg-white rounded-xl flex items-center justify-center shadow-xl">
                                                            <span className="text-2xl font-bold text-gray-700">{selectedCredit.institutionLogo}</span>
                                                        </div>
                                                        <div className="text-white">
                                                            <h2 className="text-xl font-bold drop-shadow-lg">{selectedCredit.courseName}</h2>
                                                            <p className="text-white/80 mt-1">{selectedCredit.institution}</p>
                                                            <div className="flex items-center gap-2 mt-2">
                                                                <span className="px-3 py-1 bg-white/20 rounded-full text-sm backdrop-blur-sm">
                                                                    {selectedCredit.semester}
                                                                </span>
                                                                <span className="px-3 py-1 bg-white/20 rounded-full text-sm backdrop-blur-sm">
                                                                    {selectedCredit.category}
                                                                </span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="absolute top-4 right-4 flex items-center gap-2 bg-green-500 text-white px-3 py-1.5 rounded-full text-sm font-medium shadow-lg">
                                                    <Shield className="w-4 h-4" />
                                                    Blockchain Verified
                                                </div>
                                            </div>

                                            {/* Credit Details */}
                                            <div className="p-6">
                                                <div className="grid md:grid-cols-3 gap-6">
                                                    <div className="space-y-4">
                                                        <div className="p-4 bg-blue-50 rounded-xl">
                                                            <label className="text-xs font-medium text-blue-600 uppercase tracking-wide">Credits Earned</label>
                                                            <p className="text-3xl font-bold text-blue-900 mt-1">{selectedCredit.credits}</p>
                                                        </div>
                                                        <div>
                                                            <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Grade Achieved</label>
                                                            <p className="text-2xl font-bold text-gray-900">{selectedCredit.grade}</p>
                                                        </div>
                                                    </div>
                                                    <div className="space-y-4">
                                                        <div>
                                                            <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Credit ID</label>
                                                            <p className="text-gray-900 font-mono text-sm">{selectedCredit.id}</p>
                                                        </div>
                                                        <div>
                                                            <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Academic Year</label>
                                                            <p className="text-gray-900">{selectedCredit.year}</p>
                                                        </div>
                                                        <div>
                                                            <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Grade Points</label>
                                                            <p className="text-gray-900">{selectedCredit.gradePoints}/10</p>
                                                        </div>
                                                    </div>
                                                    <div className="space-y-4">
                                                        <div>
                                                            <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Blockchain Hash</label>
                                                            <p className="text-gray-900 font-mono text-sm break-all bg-gray-50 p-2 rounded-lg">{selectedCredit.blockchainHash}</p>
                                                        </div>
                                                        <div>
                                                            <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Verification</label>
                                                            <div className="flex items-center gap-2 mt-1">
                                                                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-green-100 text-green-700 rounded-full text-sm font-medium">
                                                                    <CheckCircle2 className="w-4 h-4" />
                                                                    CertiFy Verified
                                                                </span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Action Buttons */}
                                                <div className="flex flex-wrap gap-3 mt-6 pt-6 border-t border-gray-100">
                                                    <button className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-md">
                                                        <ArrowLeftRight className="w-4 h-4" />
                                                        Transfer Credit
                                                    </button>
                                                    <button className="inline-flex items-center gap-2 px-5 py-2.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors shadow-md">
                                                        <Download className="w-4 h-4" />
                                                        Download Transcript
                                                    </button>
                                                    <Link
                                                        href="/verifier2"
                                                        className="inline-flex items-center gap-2 px-5 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                                                    >
                                                        <Shield className="w-4 h-4" />
                                                        Verify on CertiFy
                                                    </Link>
                                                </div>
                                            </div>
                                        </>
                                    ) : (
                                        <div className="p-12 text-center text-gray-500">
                                            <GraduationCap className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                                            <p>Select a course to view credit details</p>
                                        </div>
                                    )}
                                </motion.div>
                            </div>
                        </motion.div>
                    ) : (
                        <motion.div
                            key="transfers"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            className="bg-white rounded-xl shadow-md border border-gray-100 overflow-hidden"
                        >
                            <div className="p-6 border-b border-gray-100 bg-gradient-to-r from-amber-50 to-orange-50">
                                <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                                    <ArrowLeftRight className="w-5 h-5 text-amber-600" />
                                    Credit Transfer History
                                </h2>
                                <p className="text-sm text-gray-500 mt-1">Track credits transferred between institutions</p>
                            </div>

                            <div className="divide-y divide-gray-100">
                                {mockRedemptions.map((redemption, index) => (
                                    <motion.div
                                        key={redemption.id}
                                        className="p-6 hover:bg-gray-50 transition-colors"
                                        initial={{ opacity: 0, x: -20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: index * 0.1 }}
                                    >
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-6">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-12 h-12 bg-gradient-to-br from-orange-400 to-red-500 rounded-xl flex items-center justify-center text-white font-bold text-xs shadow">
                                                        {redemption.from.split('(')[1]?.replace(')', '') || redemption.from.slice(0, 3).toUpperCase()}
                                                    </div>
                                                    <ArrowRight className="w-5 h-5 text-gray-400" />
                                                    <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center text-white font-bold text-xs shadow">
                                                        {redemption.to.split(' ')[0].slice(0, 3).toUpperCase()}
                                                    </div>
                                                </div>
                                                <div>
                                                    <h3 className="font-medium text-gray-900">{redemption.course}</h3>
                                                    <p className="text-sm text-gray-500">{redemption.from} → {redemption.to}</p>
                                                    <div className="flex items-center gap-3 mt-1 text-xs text-gray-400">
                                                        <span className="flex items-center gap-1">
                                                            <Calendar className="w-3 h-3" />
                                                            {new Date(redemption.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                                                        </span>
                                                        <span>•</span>
                                                        <span>ID: {redemption.id}</span>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <div className="text-2xl font-bold text-blue-600">{redemption.credits} Credits</div>
                                                <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 text-green-700 text-xs rounded-full font-medium">
                                                    <CheckCircle2 className="w-3 h-3" />
                                                    {redemption.status}
                                                </span>
                                            </div>
                                        </div>
                                    </motion.div>
                                ))}
                            </div>

                            {/* Transfer Summary */}
                            <div className="p-6 bg-gradient-to-r from-blue-600 to-indigo-600 text-white">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <h3 className="font-semibold">Total Credits Transferred</h3>
                                        <p className="text-blue-100 text-sm">Successfully verified on CertiFy blockchain</p>
                                    </div>
                                    <div className="text-4xl font-bold">
                                        {mockRedemptions.reduce((acc, r) => acc + r.credits, 0)}
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* CertiFy Integration Banner */}
                <motion.div
                    className="mt-8 bg-gradient-to-r from-blue-700 to-indigo-800 rounded-xl p-6 text-white overflow-hidden relative"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.4 }}
                >
                    <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2" />
                    <div className="relative flex flex-col md:flex-row items-center justify-between gap-4">
                        <div className="flex items-center gap-4">
                            <div className="w-16 h-16 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
                                <Shield className="w-9 h-9" />
                            </div>
                            <div>
                                <h3 className="text-xl font-bold">CertiFy Blockchain Integration</h3>
                                <p className="text-blue-200">All academic credits are immutably stored and instantly verifiable on the CertiFy network</p>
                            </div>
                        </div>
                        <Link
                            href="/verifier2"
                            className="px-6 py-3 bg-amber-400 text-blue-900 rounded-lg font-semibold hover:bg-amber-300 transition-colors flex items-center gap-2 shadow-lg"
                        >
                            Verify Credits
                            <ChevronRight className="w-5 h-5" />
                        </Link>
                    </div>
                </motion.div>
            </main>

            {/* Footer */}
            <footer className="mt-12 bg-gray-900 text-gray-400 py-8">
                <div className="max-w-7xl mx-auto px-4 text-center">
                    <div className="flex items-center justify-center gap-3 mb-4">
                        <Wallet className="w-6 h-6 text-blue-400" />
                        <span className="text-white font-semibold">Academic Bank of Credits</span>
                    </div>
                    <p className="text-sm">
                        This is a <span className="text-amber-400 font-medium">mock demonstration</span> of Academic Bank of Credits integration with CertiFy.
                    </p>
                    <p className="text-xs mt-2">
                        ABC is a UGC initiative under the National Education Policy 2020. This page is for demonstration purposes only.
                    </p>
                </div>
            </footer>
        </div>
    );
}
