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
    <div className="min-h-dvh flex flex-col bg-gradient-to-br from-slate-50 via-white to-blue-50">
      <DigiLockerHeader />
      <div className="flex flex-1">
        <aside className="hidden md:block w-72 shrink-0 border-r border-gray-200 bg-white shadow-sm">
          <DigiLockerSidebar
            counts={{
              total: items.length,
              issued: items.filter((i) => i.type === "issued").length,
              uploaded: items.filter((i) => i.type === "uploaded").length,
            }}
          />
        </aside>

        <main className="flex-1 p-4 md:p-6 lg:p-8">
          <div className="max-w-7xl mx-auto">
            <div className="grid gap-6 lg:grid-cols-5">
              <section className="lg:col-span-2">
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

              <section className="lg:col-span-3">
                <DocumentViewer doc={selected} />
              </section>
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}
