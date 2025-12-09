"use client"

import { useMemo } from "react"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { Search, FileText, Shield, Calendar, ChevronRight } from "lucide-react"
import type { DocItem } from "./types"

export default function DocumentList({
  items,
  selectedId,
  onSelect,
  query,
  onQueryChange,
}: {
  items: DocItem[]
  selectedId?: string
  onSelect: (id: string) => void
  query: string
  onQueryChange: (v: string) => void
}) {
  const empty = useMemo(() => items.length === 0, [items])

  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      Education: "from-blue-500 to-indigo-500",
      Identity: "from-purple-500 to-pink-500",
      Health: "from-green-500 to-emerald-500",
      Finance: "from-amber-500 to-orange-500",
      Government: "from-red-500 to-rose-500",
    }
    return colors[category] || "from-gray-500 to-slate-500"
  }

  const getCategoryIcon = (category: string) => {
    return FileText
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Search Header */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
        <div className="flex items-center gap-2 mb-3">
          <FileText className="w-5 h-5 text-blue-600" />
          <h2 className="font-semibold text-gray-900">My Documents</h2>
        </div>
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <Input
            id="doc-search"
            placeholder="Search by title, issuer, or tag..."
            value={query}
            onChange={(e) => onQueryChange(e.target.value)}
            className="pl-10 bg-gray-50 border-gray-200 focus:bg-white transition-colors"
          />
        </div>
      </div>

      {/* Document List */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <ul className="max-h-[60vh] overflow-auto divide-y divide-gray-100">
          {empty ? (
            <li className="px-4 py-12 text-center">
              <FileText className="w-12 h-12 mx-auto mb-3 text-gray-300" />
              <p className="text-gray-500 font-medium">No documents found</p>
              <p className="text-sm text-gray-400 mt-1">Try adjusting your search</p>
            </li>
          ) : (
            items.map((doc) => {
              const active = doc.id === selectedId
              const IconComponent = getCategoryIcon(doc.category)
              return (
                <li key={doc.id}>
                  <button
                    type="button"
                    onClick={() => onSelect(doc.id)}
                    className={cn(
                      "w-full text-left px-4 py-4 transition-all group",
                      active
                        ? "bg-blue-50 border-l-4 border-blue-600"
                        : "hover:bg-gray-50 border-l-4 border-transparent",
                    )}
                    aria-current={active ? "true" : "false"}
                    aria-label={`Open ${doc.title}`}
                  >
                    <div className="flex items-start gap-3">
                      {/* Category Icon */}
                      <div className={cn(
                        "w-10 h-10 rounded-lg bg-gradient-to-br flex items-center justify-center flex-shrink-0 shadow-sm",
                        getCategoryColor(doc.category)
                      )}>
                        <IconComponent className="w-5 h-5 text-white" />
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <h3 className={cn(
                              "font-medium truncate",
                              active ? "text-blue-900" : "text-gray-900"
                            )}>
                              {doc.title}
                            </h3>
                            <p className="text-sm text-gray-500 truncate">{doc.issuer}</p>
                          </div>
                          <ChevronRight className={cn(
                            "w-5 h-5 flex-shrink-0 transition-transform",
                            active ? "text-blue-600" : "text-gray-300 group-hover:text-gray-400"
                          )} />
                        </div>

                        <div className="flex items-center gap-3 mt-2">
                          {/* Date */}
                          <span className="inline-flex items-center gap-1 text-xs text-gray-400">
                            <Calendar className="w-3 h-3" />
                            {doc.issueDate}
                          </span>

                          {/* Verified Badge */}
                          {doc.type === "issued" && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-green-100 text-green-700 rounded-full text-xs font-medium">
                              <Shield className="w-3 h-3" />
                              Verified
                            </span>
                          )}
                        </div>

                        {/* Tags */}
                        {doc.tags?.length ? (
                          <div className="mt-2 flex flex-wrap gap-1">
                            {doc.tags.slice(0, 3).map((t) => (
                              <Badge
                                key={t}
                                variant="outline"
                                className={cn(
                                  "text-xs transition-colors",
                                  active ? "border-blue-200 text-blue-700" : "border-gray-200"
                                )}
                              >
                                {t}
                              </Badge>
                            ))}
                          </div>
                        ) : null}
                      </div>
                    </div>
                  </button>
                </li>
              )
            })
          )}
        </ul>
      </div>
    </div>
  )
}
