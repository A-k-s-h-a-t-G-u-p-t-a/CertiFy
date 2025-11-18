import { FileBadge2, Inbox, Star } from "lucide-react"
import { cn } from "@/lib/utils"

export default function DigiLockerSidebar({
  counts,
}: {
  counts: { total: number; issued: number; uploaded: number }
}) {
  const itemCls =
    "flex items-center justify-between rounded-md px-3 py-2 hover:bg-secondary hover:text-secondary-foreground transition-colors"

  return (
    <nav aria-label="Sections" className="p-3">
      <ul className="space-y-1">
        <li>
          <div className={cn(itemCls, "bg-secondary/50")}>
            <span className="inline-flex items-center gap-2">
              <FileBadge2 className="h-4 w-4" aria-hidden="true" />
              <span>All Documents</span>
            </span>
            <span className="text-xs text-muted-foreground">{counts.total}</span>
          </div>
        </li>
        <li>
          <div className={itemCls}>
            <span className="inline-flex items-center gap-2">
              <Inbox className="h-4 w-4" aria-hidden="true" />
              <span>Issued</span>
            </span>
            <span className="text-xs text-muted-foreground">{counts.issued}</span>
          </div>
        </li>
        <li>
          <div className={itemCls}>
            <span className="inline-flex items-center gap-2">
              <Star className="h-4 w-4" aria-hidden="true" />
              <span>Uploaded</span>
            </span>
            <span className="text-xs text-muted-foreground">{counts.uploaded}</span>
          </div>
        </li>
      </ul>
    </nav>
  )
}
