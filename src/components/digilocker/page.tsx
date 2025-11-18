"use client"

import { useMemo, useState } from "react"
import DigiLockerHeader from "./header"
import DigiLockerSidebar from "./sidebar"
import DocumentList from "./list"
import DocumentViewer from "./viewer"
import { mockDocuments } from "./mock-data"
import type { DocItem } from "./types"

export default function DigiLockerPage({ initialSelectedId }: { initialSelectedId?: string }) {
  const items = useMemo<DocItem[]>(() => mockDocuments, [])
  const initial =
    (initialSelectedId && items.find((d) => d.id === initialSelectedId)) || (items.length ? items[0] : undefined)
  const [selected, setSelected] = useState<DocItem | undefined>(initial)
  const [query, setQuery] = useState("")

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return items
    return items.filter(
      (d) =>
        d.title.toLowerCase().includes(q) ||
        d.issuer.toLowerCase().includes(q) ||
        (d.tags?.some((t) => t.toLowerCase().includes(q)) ?? false),
    )
  }, [items, query])

  return (
    <div className="min-h-dvh flex flex-col bg-background">
      <DigiLockerHeader />
      <div className="flex flex-1">
        <aside className="hidden md:block w-64 shrink-0 border-r border-border bg-card">
          <DigiLockerSidebar
            counts={{
              total: items.length,
              issued: items.filter((i) => i.type === "issued").length,
              uploaded: items.filter((i) => i.type === "uploaded").length,
            }}
          />
        </aside>

        <main className="flex-1 p-4 md:p-6">
          <div className="grid gap-4 md:gap-6 md:grid-cols-3">
            <section className="md:col-span-1">
              <DocumentList
                items={filtered}
                selectedId={selected?.id}
                onSelect={(id) => {
                  const next = items.find((i) => i.id === id)
                  if (next) setSelected(next)
                }}
                query={query}
                onQueryChange={setQuery}
              />
            </section>

            <section className="md:col-span-2">
              <DocumentViewer doc={selected} />
            </section>
          </div>
        </main>
      </div>
    </div>
  )
}
