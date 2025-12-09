"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import {
    Award,
    BookOpen,
    Clock,
    CheckCircle2,
    Shield,
    Search,
    User,
    Menu,
    ChevronRight,
    Download,
    ExternalLink,
    Star,
    TrendingUp,
    Target,
    GraduationCap,
    Briefcase
} from "lucide-react";
import Link from "next/link";

// Mock skill credentials data
const mockSkillCredentials = [
    {
        id: "SKILL-2024-001",
        name: "Advanced Web Development",
        issuer: "NIELIT",
        issueDate: "2024-08-15",
        validUntil: "2027-08-15",
        level: "Level 5 (NSQF)",
        credits: 12,
        status: "verified",
        sector: "IT-ITES",
        blockchainHash: "0x7a9f...3e2b",
        image: "https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=400&h=300&fit=crop"
    },
    {
        id: "SKILL-2024-002",
        name: "Data Analytics Professional",
        issuer: "NASSCOM",
        issueDate: "2024-06-20",
        validUntil: "2027-06-20",
        level: "Level 6 (NSQF)",
        credits: 15,
        status: "verified",
        sector: "IT-ITES",
        blockchainHash: "0x3c8d...9f1a",
        image: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=400&h=300&fit=crop"
    },
    {
        id: "SKILL-2024-003",
        name: "Electrician (Domestic)",
        issuer: "ITI Mumbai",
        issueDate: "2024-03-10",
        validUntil: "2029-03-10",
        level: "Level 4 (NSQF)",
        credits: 8,
        status: "verified",
        sector: "Electrical",
        blockchainHash: "0x5e2f...1c4d",
        image: "https://images.unsplash.com/photo-1621905251189-08b45d6a269e?w=400&h=300&fit=crop"
    },
    {
        id: "SKILL-2024-004",
        name: "Digital Marketing Specialist",
        issuer: "Sector Skill Council",
        issueDate: "2024-01-05",
        validUntil: "2027-01-05",
        level: "Level 5 (NSQF)",
        credits: 10,
        status: "verified",
        sector: "Media & Entertainment",
        blockchainHash: "0x9b7e...6a8c",
        image: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=400&h=300&fit=crop"
    }
];

// Mock learning activities
const mockLearningActivities = [
    { id: 1, title: "Python for Data Science", progress: 85, platform: "SWAYAM", hours: 40 },
    { id: 2, title: "Cloud Computing Basics", progress: 60, platform: "NPTEL", hours: 25 },
    { id: 3, title: "Workplace Safety", progress: 100, platform: "eSkill India", hours: 8 },
];

export default function SkillIndiaMockPage() {
    const [selectedCredential, setSelectedCredential] = useState(mockSkillCredentials[0]);
    const [searchQuery, setSearchQuery] = useState("");

    const totalCredits = mockSkillCredentials.reduce((acc, cred) => acc + cred.credits, 0);
    const totalHours = mockLearningActivities.reduce((acc, act) => acc + act.hours, 0);

    const filteredCredentials = mockSkillCredentials.filter(cred =>
        cred.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        cred.issuer.toLowerCase().includes(searchQuery.toLowerCase()) ||
        cred.sector.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-blue-50">
            {/* Header - Skill India Branding */}
            <header className="bg-gradient-to-r from-orange-500 via-orange-600 to-blue-600 text-white shadow-lg">
                <div className="max-w-7xl mx-auto px-4 py-3">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                            <div className="flex items-center space-x-2">
                                <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center">
                                    <Target className="w-6 h-6 text-orange-600" />
                                </div>
                                <div>
                                    <h1 className="text-xl font-bold">Skill India Digital</h1>
                                    <p className="text-xs text-orange-100">कौशल भारत - कुशल भारत</p>
                                </div>
                            </div>
                            <span className="hidden md:inline-block px-3 py-1 bg-white/20 rounded-full text-xs font-medium backdrop-blur-sm">
                                MOCK DEMONSTRATION
                            </span>
                        </div>
                        <div className="flex items-center space-x-4">
                            <div className="hidden md:flex items-center space-x-2 bg-white/10 rounded-lg px-3 py-2">
                                <Shield className="w-4 h-4 text-green-300" />
                                <span className="text-sm">Powered by CertiFy Blockchain</span>
                            </div>
                            <div className="flex items-center space-x-2 bg-white/20 rounded-lg px-3 py-2">
                                <User className="w-5 h-5" />
                                <span className="hidden sm:inline">Rahul Sharma</span>
                            </div>
                            <Menu className="w-6 h-6 md:hidden cursor-pointer" />
                        </div>
                    </div>
                </div>

                {/* Navigation */}
                <nav className="bg-blue-700/50 backdrop-blur-sm">
                    <div className="max-w-7xl mx-auto px-4">
                        <div className="flex space-x-6 overflow-x-auto">
                            {["Dashboard", "My Skills", "Courses", "Jobs", "Certifications"].map((item, i) => (
                                <button
                                    key={item}
                                    className={`py-3 px-2 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${i === 0 ? "border-white text-white" : "border-transparent text-blue-100 hover:text-white hover:border-white/50"
                                        }`}
                                >
                                    {item}
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
                        { icon: Award, label: "Certifications", value: mockSkillCredentials.length, color: "from-orange-500 to-orange-600" },
                        { icon: Star, label: "Total Credits", value: totalCredits, color: "from-blue-500 to-blue-600" },
                        { icon: Clock, label: "Learning Hours", value: totalHours, color: "from-green-500 to-green-600" },
                        { icon: TrendingUp, label: "NSQF Level", value: "Level 6", color: "from-purple-500 to-purple-600" }
                    ].map((stat, index) => (
                        <motion.div
                            key={stat.label}
                            className="bg-white rounded-xl shadow-md p-4 border border-gray-100 hover:shadow-lg transition-shadow"
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ duration: 0.3, delay: index * 0.1 }}
                        >
                            <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${stat.color} flex items-center justify-center mb-3`}>
                                <stat.icon className="w-5 h-5 text-white" />
                            </div>
                            <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                            <p className="text-sm text-gray-500">{stat.label}</p>
                        </motion.div>
                    ))}
                </motion.div>

                <div className="grid lg:grid-cols-3 gap-8">
                    {/* Credentials List */}
                    <div className="lg:col-span-1">
                        <div className="bg-white rounded-xl shadow-md border border-gray-100 overflow-hidden">
                            <div className="p-4 border-b border-gray-100">
                                <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                                    <GraduationCap className="w-5 h-5 text-orange-600" />
                                    My Skill Credentials
                                </h2>
                                <div className="mt-3 relative">
                                    <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                                    <input
                                        type="text"
                                        placeholder="Search credentials..."
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        className="w-full pl-10 pr-4 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                                    />
                                </div>
                            </div>

                            <div className="divide-y divide-gray-100 max-h-[500px] overflow-y-auto">
                                {filteredCredentials.map((cred) => (
                                    <motion.button
                                        key={cred.id}
                                        onClick={() => setSelectedCredential(cred)}
                                        className={`w-full p-4 text-left hover:bg-orange-50 transition-colors ${selectedCredential?.id === cred.id ? "bg-orange-50 border-l-4 border-orange-500" : ""
                                            }`}
                                        whileHover={{ x: 4 }}
                                    >
                                        <div className="flex items-start gap-3">
                                            <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-orange-100 to-blue-100 flex items-center justify-center flex-shrink-0">
                                                <Award className="w-6 h-6 text-orange-600" />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <h3 className="font-medium text-gray-900 truncate">{cred.name}</h3>
                                                <p className="text-sm text-gray-500">{cred.issuer}</p>
                                                <div className="flex items-center gap-2 mt-1">
                                                    <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-green-100 text-green-700 text-xs rounded-full">
                                                        <CheckCircle2 className="w-3 h-3" />
                                                        Verified
                                                    </span>
                                                    <span className="text-xs text-gray-400">{cred.level}</span>
                                                </div>
                                            </div>
                                            <ChevronRight className="w-5 h-5 text-gray-400 flex-shrink-0" />
                                        </div>
                                    </motion.button>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Credential Detail */}
                    <div className="lg:col-span-2">
                        <motion.div
                            className="bg-white rounded-xl shadow-md border border-gray-100 overflow-hidden"
                            key={selectedCredential?.id}
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ duration: 0.3 }}
                        >
                            {selectedCredential ? (
                                <>
                                    {/* Certificate Preview */}
                                    <div className="relative h-48 bg-gradient-to-br from-orange-400 via-orange-500 to-blue-600">
                                        <div className="absolute inset-0 bg-black/20" />
                                        <div className="absolute inset-0 flex items-center justify-center">
                                            <div className="text-center text-white">
                                                <Award className="w-16 h-16 mx-auto mb-2 drop-shadow-lg" />
                                                <h2 className="text-2xl font-bold drop-shadow-lg">{selectedCredential.name}</h2>
                                                <p className="text-orange-100">{selectedCredential.issuer}</p>
                                            </div>
                                        </div>
                                        <div className="absolute top-4 right-4 flex items-center gap-2 bg-green-500 text-white px-3 py-1.5 rounded-full text-sm font-medium shadow-lg">
                                            <Shield className="w-4 h-4" />
                                            Blockchain Verified
                                        </div>
                                    </div>

                                    {/* Certificate Details */}
                                    <div className="p-6">
                                        <div className="grid md:grid-cols-2 gap-6">
                                            <div className="space-y-4">
                                                <div>
                                                    <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Certificate ID</label>
                                                    <p className="text-gray-900 font-mono">{selectedCredential.id}</p>
                                                </div>
                                                <div>
                                                    <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Issue Date</label>
                                                    <p className="text-gray-900">{new Date(selectedCredential.issueDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
                                                </div>
                                                <div>
                                                    <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Valid Until</label>
                                                    <p className="text-gray-900">{new Date(selectedCredential.validUntil).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
                                                </div>
                                                <div>
                                                    <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Sector</label>
                                                    <p className="text-gray-900">{selectedCredential.sector}</p>
                                                </div>
                                            </div>
                                            <div className="space-y-4">
                                                <div>
                                                    <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">NSQF Level</label>
                                                    <p className="text-gray-900 font-semibold">{selectedCredential.level}</p>
                                                </div>
                                                <div>
                                                    <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Credits Earned</label>
                                                    <p className="text-gray-900">{selectedCredential.credits} Credits</p>
                                                </div>
                                                <div>
                                                    <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Blockchain Hash</label>
                                                    <p className="text-gray-900 font-mono text-sm break-all">{selectedCredential.blockchainHash}</p>
                                                </div>
                                                <div>
                                                    <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Verification Status</label>
                                                    <div className="flex items-center gap-2 mt-1">
                                                        <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-medium">
                                                            <CheckCircle2 className="w-4 h-4" />
                                                            Verified on CertiFy Blockchain
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Action Buttons */}
                                        <div className="flex flex-wrap gap-3 mt-6 pt-6 border-t border-gray-100">
                                            <button className="inline-flex items-center gap-2 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors">
                                                <Download className="w-4 h-4" />
                                                Download Certificate
                                            </button>
                                            <button className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                                                <ExternalLink className="w-4 h-4" />
                                                Share to DigiLocker
                                            </button>
                                            <Link
                                                href="/verifier2"
                                                className="inline-flex items-center gap-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                                            >
                                                <Shield className="w-4 h-4" />
                                                Verify on CertiFy
                                            </Link>
                                        </div>
                                    </div>
                                </>
                            ) : (
                                <div className="p-12 text-center text-gray-500">
                                    <Award className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                                    <p>Select a credential to view details</p>
                                </div>
                            )}
                        </motion.div>

                        {/* Learning Activities */}
                        <motion.div
                            className="mt-6 bg-white rounded-xl shadow-md border border-gray-100 p-6"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.5, delay: 0.2 }}
                        >
                            <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2 mb-4">
                                <BookOpen className="w-5 h-5 text-blue-600" />
                                Active Learning
                            </h3>
                            <div className="space-y-4">
                                {mockLearningActivities.map((activity) => (
                                    <div key={activity.id} className="flex items-center gap-4">
                                        <div className="flex-1">
                                            <div className="flex items-center justify-between mb-1">
                                                <span className="font-medium text-gray-900">{activity.title}</span>
                                                <span className="text-sm text-gray-500">{activity.progress}%</span>
                                            </div>
                                            <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                                                <motion.div
                                                    className={`h-full rounded-full ${activity.progress === 100
                                                            ? "bg-green-500"
                                                            : "bg-gradient-to-r from-orange-500 to-blue-500"
                                                        }`}
                                                    initial={{ width: 0 }}
                                                    animate={{ width: `${activity.progress}%` }}
                                                    transition={{ duration: 1, delay: 0.5 }}
                                                />
                                            </div>
                                            <div className="flex items-center gap-3 mt-1 text-xs text-gray-500">
                                                <span>{activity.platform}</span>
                                                <span>•</span>
                                                <span>{activity.hours} hours</span>
                                            </div>
                                        </div>
                                        {activity.progress === 100 && (
                                            <CheckCircle2 className="w-6 h-6 text-green-500 flex-shrink-0" />
                                        )}
                                    </div>
                                ))}
                            </div>
                        </motion.div>
                    </div>
                </div>

                {/* CertiFy Integration Banner */}
                <motion.div
                    className="mt-8 bg-gradient-to-r from-emerald-600 to-teal-600 rounded-xl p-6 text-white"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.4 }}
                >
                    <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                        <div className="flex items-center gap-4">
                            <div className="w-14 h-14 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
                                <Shield className="w-8 h-8" />
                            </div>
                            <div>
                                <h3 className="text-xl font-bold">CertiFy Blockchain Integration</h3>
                                <p className="text-emerald-100">All your skill credentials are secured and verifiable on the CertiFy blockchain network</p>
                            </div>
                        </div>
                        <Link
                            href="/verifier2"
                            className="px-6 py-3 bg-white text-emerald-600 rounded-lg font-semibold hover:bg-emerald-50 transition-colors flex items-center gap-2"
                        >
                            Verify Credentials
                            <ChevronRight className="w-5 h-5" />
                        </Link>
                    </div>
                </motion.div>
            </main>

            {/* Footer */}
            <footer className="mt-12 bg-gray-900 text-gray-400 py-8">
                <div className="max-w-7xl mx-auto px-4 text-center">
                    <p className="text-sm">
                        This is a <span className="text-orange-400 font-medium">mock demonstration</span> of Skill India Digital integration with CertiFy.
                    </p>
                    <p className="text-xs mt-2">
                        Skill India Digital is a Government of India initiative. This page is for demonstration purposes only.
                    </p>
                </div>
            </footer>
        </div>
    );
}
