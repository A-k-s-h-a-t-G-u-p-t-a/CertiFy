"use client"

import { useMemo } from "react"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
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

  return (
    <div className="flex flex-col gap-3">
      <div className="space-y-2">
        <label htmlFor="doc-search" className="text-sm font-medium">
          Search Documents
        </label>
        <Input
          id="doc-search"
          placeholder="Search by title, issuer, or tag"
          value={query}
          onChange={(e) => onQueryChange(e.target.value)}
        />
      </div>

      <div className="rounded-md border border-border bg-card">
        <ul className="max-h-[60vh] overflow-auto divide-y divide-border">
          {empty ? (
            <li className="px-3 py-6 text-center text-sm text-muted-foreground">No documents found</li>
          ) : (
            items.map((doc) => {
              const active = doc.id === selectedId
              return (
                <li key={doc.id}>
                  <button
                    type="button"
                    onClick={() => onSelect(doc.id)}
                    className={cn(
                      "w-full text-left px-3 py-3 transition-colors",
                      active ? "bg-secondary text-secondary-foreground" : "hover:bg-muted",
                    )}
                    aria-current={active ? "true" : "false"}
                    aria-label={`Open ${doc.title}`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="truncate font-medium">{doc.title}</div>
                        <div className="truncate text-xs text-muted-foreground">{doc.issuer}</div>
                        {doc.tags?.length ? (
                          <div className="mt-2 flex flex-wrap gap-1">
                            {doc.tags.slice(0, 3).map((t) => (
                              <Badge key={t} variant="outline" className="text-xs">
                                {t}
                              </Badge>
                            ))}
                          </div>
                        ) : null}
                      </div>
                      <div className="shrink-0 text-xs text-muted-foreground">{doc.issueDate}</div>
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
