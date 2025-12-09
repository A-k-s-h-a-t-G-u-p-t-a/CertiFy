import { FileBadge2, Inbox, Star, Upload, Shield, Clock, FileCheck, TrendingUp } from "lucide-react"
import { cn } from "@/lib/utils"

export default function DigiLockerSidebar({
  counts,
}: {
  counts: { total: number; issued: number; uploaded: number }
}) {
  const menuItems = [
    { icon: FileBadge2, label: "All Documents", count: counts.total, active: true },
    { icon: Inbox, label: "Issued Documents", count: counts.issued, active: false },
    { icon: Upload, label: "Uploaded", count: counts.uploaded, active: false },
    { icon: Star, label: "Starred", count: 0, active: false },
  ]

  return (
    <div className="h-full flex flex-col">
      {/* Stats Cards */}
      <div className="p-4 space-y-3 border-b border-border">
        <div className="grid grid-cols-2 gap-2">
          <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg p-3 text-white">
            <FileCheck className="w-5 h-5 mb-1 opacity-80" />
            <p className="text-2xl font-bold">{counts.total}</p>
            <p className="text-xs text-blue-100">Total Docs</p>
          </div>
          <div className="bg-gradient-to-br from-green-500 to-emerald-600 rounded-lg p-3 text-white">
            <Shield className="w-5 h-5 mb-1 opacity-80" />
            <p className="text-2xl font-bold">{counts.issued}</p>
            <p className="text-xs text-green-100">Verified</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav aria-label="Sections" className="flex-1 p-3">
        <p className="px-3 mb-2 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Documents</p>
        <ul className="space-y-1">
          {menuItems.map((item) => (
            <li key={item.label}>
              <button
                className={cn(
                  "w-full flex items-center justify-between rounded-lg px-3 py-2.5 text-sm transition-all",
                  item.active
                    ? "bg-blue-100 text-blue-700 font-medium shadow-sm"
                    : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                )}
              >
                <span className="inline-flex items-center gap-3">
                  <item.icon className={cn("h-4 w-4", item.active && "text-blue-600")} aria-hidden="true" />
                  <span>{item.label}</span>
                </span>
                {item.count > 0 && (
                  <span className={cn(
                    "px-2 py-0.5 rounded-full text-xs font-medium",
                    item.active ? "bg-blue-600 text-white" : "bg-muted text-muted-foreground"
                  )}>
                    {item.count}
                  </span>
                )}
              </button>
            </li>
          ))}
        </ul>

        <div className="mt-6">
          <p className="px-3 mb-2 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Quick Links</p>
          <ul className="space-y-1">
            <li>
              <button className="w-full flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-muted-foreground hover:bg-secondary hover:text-foreground transition-all">
                <Clock className="h-4 w-4" />
                <span>Recent Activity</span>
              </button>
            </li>
            <li>
              <button className="w-full flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-muted-foreground hover:bg-secondary hover:text-foreground transition-all">
                <TrendingUp className="h-4 w-4" />
                <span>Analytics</span>
              </button>
            </li>
          </ul>
        </div>
      </nav>

      {/* CertiFy Integration */}
      <div className="p-4 border-t border-border">
        <div className="bg-gradient-to-br from-emerald-50 to-teal-50 rounded-lg p-3 border border-emerald-200">
          <div className="flex items-center gap-2 mb-2">
            <Shield className="w-4 h-4 text-emerald-600" />
            <span className="text-xs font-semibold text-emerald-700">CertiFy Protected</span>
          </div>
          <p className="text-xs text-emerald-600">
            All documents verified on blockchain
          </p>
        </div>
      </div>
    </div>
  )
}
