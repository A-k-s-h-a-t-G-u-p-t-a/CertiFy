"use client"

import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import {
  Download,
  Share2,
  ShieldCheck,
  FileText,
  Calendar,
  Building2,
  Hash,
  Tag,
  CheckCircle2,
  ExternalLink,
  QrCode,
  Eye
} from "lucide-react"
import Link from "next/link"
import type { DocItem } from "./types"

export default function DocumentViewer({ doc }: { doc?: DocItem }) {
  if (!doc) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
        <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
          <FileText className="w-8 h-8 text-gray-400" />
        </div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">No document selected</h3>
        <p className="text-gray-500">Select a document from the list to preview</p>
      </div>
    )
  }

  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      Education: "from-blue-500 to-indigo-600",
      Identity: "from-purple-500 to-pink-600",
      Health: "from-green-500 to-emerald-600",
      Finance: "from-amber-500 to-orange-600",
      Government: "from-red-500 to-rose-600",
    }
    return colors[category] || "from-gray-500 to-slate-600"
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
      {/* Header with gradient */}
      <div className={`relative bg-gradient-to-br ${getCategoryColor(doc.category)} px-6 py-8`}>
        <div className="absolute inset-0 bg-black/10" />
        <div className="relative">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-start gap-4">
              <div className="w-14 h-14 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
                <FileText className="w-7 h-7 text-white" />
              </div>
              <div className="text-white">
                <h2 className="text-xl font-bold drop-shadow-sm">{doc.title}</h2>
                <p className="text-white/80 mt-1">{doc.issuer}</p>
              </div>
            </div>
            {doc.type === "issued" && (
              <div className="flex items-center gap-2 bg-green-500 text-white px-3 py-1.5 rounded-full text-sm font-medium shadow-lg">
                <ShieldCheck className="w-4 h-4" />
                Verified
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-6">
        {/* Document Preview */}
        <div className="grid gap-6 lg:grid-cols-5">
          <div className="lg:col-span-3">
            <div className="rounded-xl border-2 border-dashed border-gray-200 bg-gray-50 overflow-hidden">
              <div className="aspect-[4/3] flex items-center justify-center p-4">
                <img
                  src="/certificate-preview-with-security-watermark.jpg"
                  alt="Certificate preview"
                  className="max-w-full max-h-full object-contain rounded-lg shadow-md"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none'
                    e.currentTarget.nextElementSibling?.classList.remove('hidden')
                  }}
                />
                <div className="hidden text-center">
                  <FileText className="w-16 h-16 mx-auto mb-3 text-gray-300" />
                  <p className="text-gray-400">Document preview not available</p>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="flex flex-wrap gap-2 mt-4">
              <Button variant="outline" size="sm" className="flex-1 sm:flex-none">
                <Eye className="w-4 h-4 mr-2" />
                Full View
              </Button>
              <Button variant="outline" size="sm" className="flex-1 sm:flex-none">
                <QrCode className="w-4 h-4 mr-2" />
                QR Code
              </Button>
            </div>
          </div>

          {/* Document Details */}
          <div className="lg:col-span-2 space-y-4">
            <h3 className="font-semibold text-gray-900 flex items-center gap-2">
              <Hash className="w-4 h-4 text-blue-600" />
              Document Details
            </h3>

            <div className="space-y-3">
              <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                <Building2 className="w-4 h-4 text-gray-400 mt-0.5" />
                <div>
                  <p className="text-xs text-gray-500 uppercase tracking-wide">Issuer</p>
                  <p className="font-medium text-gray-900">{doc.issuer}</p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                <Calendar className="w-4 h-4 text-gray-400 mt-0.5" />
                <div>
                  <p className="text-xs text-gray-500 uppercase tracking-wide">Issue Date</p>
                  <p className="font-medium text-gray-900">
                    {new Date(doc.issueDate).toLocaleDateString('en-IN', {
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric'
                    })}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                <Tag className="w-4 h-4 text-gray-400 mt-0.5" />
                <div>
                  <p className="text-xs text-gray-500 uppercase tracking-wide">Category</p>
                  <p className="font-medium text-gray-900">{doc.category}</p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                <Hash className="w-4 h-4 text-gray-400 mt-0.5" />
                <div>
                  <p className="text-xs text-gray-500 uppercase tracking-wide">Document ID</p>
                  <p className="font-mono text-sm text-gray-900">{doc.id}</p>
                </div>
              </div>

              {doc.tags?.length ? (
                <div className="p-3 bg-gray-50 rounded-lg">
                  <p className="text-xs text-gray-500 uppercase tracking-wide mb-2">Tags</p>
                  <div className="flex flex-wrap gap-2">
                    {doc.tags.map((t) => (
                      <span
                        key={t}
                        className="px-2 py-1 bg-blue-100 text-blue-700 rounded-md text-xs font-medium"
                      >
                        {t}
                      </span>
                    ))}
                  </div>
                </div>
              ) : null}
            </div>
          </div>
        </div>

        <Separator className="my-6" />

        {/* Action Buttons */}
        <div className="flex flex-wrap gap-3">
          <Button className="bg-blue-600 hover:bg-blue-700">
            <Download className="w-4 h-4 mr-2" />
            Download
          </Button>
          <Button variant="outline">
            <Share2 className="w-4 h-4 mr-2" />
            Share
          </Button>
          <Link href="/verifier2">
            <Button variant="outline" className="border-green-200 text-green-700 hover:bg-green-50">
              <ShieldCheck className="w-4 h-4 mr-2" />
              Verify on CertiFy
            </Button>
          </Link>
        </div>

        {/* CertiFy Integration Banner */}
        <div className="mt-6 bg-gradient-to-r from-emerald-600 to-teal-600 rounded-xl p-4 text-white">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center backdrop-blur-sm">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <p className="font-semibold">Blockchain Verified</p>
                <p className="text-sm text-emerald-100">This document is secured on the CertiFy blockchain</p>
              </div>
            </div>
            <Link
              href="/verifier2"
              className="hidden sm:inline-flex items-center gap-2 px-4 py-2 bg-white text-emerald-600 rounded-lg text-sm font-medium hover:bg-emerald-50 transition-colors"
            >
              View Details
              <ExternalLink className="w-4 h-4" />
            </Link>
          </div>
        </div>

        {/* Disclaimer */}
        <div className="mt-4 flex items-center gap-2 text-xs text-gray-400">
          <CheckCircle2 className="w-4 h-4" />
          <p>This is a mock DigiLocker interface for demonstration purposes.</p>
        </div>
      </div>
    </div>
  )
}
