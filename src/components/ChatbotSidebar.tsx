"use client"

import { useEffect, useMemo, useRef, useState, useCallback } from "react"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { cn } from "@/lib/utils"

// Add MiniAvatar to replace image-based avatars (no public files)
function MiniAvatar({ label, variant = "ai" }) {
  return (
    <div
      className={cn(
        "h-6 w-6 mt-0.5 rounded-full flex items-center justify-center text-[10px] font-medium",
        variant === "ai" ? "bg-muted text-foreground/80" : "bg-secondary text-secondary-foreground",
      )}
      aria-hidden="true"
    >
      {label}
    </div>
  )
}

export default function ChatbotSidebar({ onImageGenerated }) {
  const [isOpen, setIsOpen] = useState(false)
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState("")
  const [loading, setLoading] = useState(false)
  const [sending, setSending] = useState(false)

  const panelId = "chatbot-sidebar"
  const endRef = useRef(null)
  const inputRef = useRef(null)

  const suggestions = useMemo(
    () => [
      "Gold border with subtle shine",
      "University crest logo centered top",
      "Elegant parchment background",
      "Embossed seal bottom-right",
    ],
    [],
  )

  const applyImageToCertificate = (imageUrl) => {
    if (onImageGenerated) onImageGenerated(imageUrl)
  }

  // Auto-scroll to the bottom when messages change
  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth", block: "end" })
  }, [messages, loading])

  // Close on Escape when open
  useEffect(() => {
    if (!isOpen) return
    const onKeyDown = (e) => {
      if (e.key === "Escape") setIsOpen(false)
    }
    window.addEventListener("keydown", onKeyDown)
    return () => window.removeEventListener("keydown", onKeyDown)
  }, [isOpen])

  const focusInput = () => inputRef.current?.focus()

  const sendMessage = useCallback(async () => {
    if (!input.trim() || sending) return

    const userMsg = { role: "user", text: input }
    setMessages((prev) => [...prev, userMsg])
    setInput("")
    setLoading(true)
    setSending(true)

    try {
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 60000) // 60s timeout

      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: userMsg.text }),
        signal: controller.signal,
      })

      clearTimeout(timeoutId)

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}))
        throw new Error(errorData.error || `HTTP ${res.status}`)
      }

      const data = await res.json()
      if (data?.error) throw new Error(data.error)
      if (!data?.url) throw new Error("No image URL received")

      const botMsg = {
        role: "bot",
        text: "Here's your generated certificate element:",
        img: data.url,
      }
      setMessages((prev) => [...prev, botMsg])

      // Automatically add to certificate
      if (onImageGenerated && data.url) {
        setTimeout(() => onImageGenerated(data.url), 100)
      }
    } catch (err) {
      console.error("Generation error:", err)
      let errorMessage = "Unknown error occurred"
      if (err && err.name === "AbortError") {
        errorMessage = "Request timed out. Please try a simpler prompt."
      } else if (err instanceof Error) {
        errorMessage = err.message
      }

      const errorMsg = {
        role: "bot",
        text: `❌ ${errorMessage}. Try describing specific certificate elements like "gold border" or "university logo".`,
      }
      setMessages((prev) => [...prev, errorMsg])
    } finally {
      setLoading(false)
      setSending(false)
      focusInput()
    }
  }, [input, onImageGenerated, sending])

  const handleSuggestion = (text) => {
    setInput((prev) => (prev ? `${prev} ${text}` : text))
    focusInput()
  }

  const toggleOpen = () => setIsOpen((v) => !v)

  return (
    <>
      {/* Toggle Button */}
      <div className="fixed right-4 top-4 z-50">
        <Button
          onClick={toggleOpen}
          variant={isOpen ? "destructive" : "default"}
          aria-expanded={isOpen}
          aria-controls={panelId}
          className="shadow-md"
        >
          {isOpen ? "Close AI Assistant" : "Open AI Assistant"}
        </Button>
      </div>

      {/* Backdrop */}
      {isOpen && (
        <button
          type="button"
          aria-label="Close AI Assistant"
          onClick={() => setIsOpen(false)}
          className="fixed inset-0 z-40 bg-black/30 backdrop-blur-[2px]"
        />
      )}

      {/* Sidebar Panel */}
      <aside
        id={panelId}
        role="complementary"
        aria-label="AI Certificate Assistant"
        className={cn(
          "fixed right-0 top-0 z-50 h-dvh w-[22rem] md:w-[26rem] border-l",
          "bg-sidebar text-sidebar-foreground border-sidebar-border",
          "transform transition-transform duration-300 ease-out",
          isOpen ? "translate-x-0" : "translate-x-full",
        )}
      >
        {/* Header */}
        <header className="flex items-center justify-between border-b border-sidebar-border px-4 py-3">
          <div className="space-y-0.5">
            <h2 className="text-base font-semibold">AI Certificate Assistant</h2>
            <p className="text-xs text-muted-foreground">Generate logos, borders, and decorative elements.</p>
          </div>
          <Button size="sm" variant="secondary" onClick={toggleOpen} aria-label="Close sidebar">
            Close
          </Button>
        </header>

        {/* Suggestions */}
        <div className="px-4 py-3 border-b border-sidebar-border">
          <div className="flex flex-wrap gap-2">
            {suggestions.map((s, i) => (
              <Button
                key={i}
                type="button"
                size="sm"
                variant="secondary"
                className="rounded-full"
                onClick={() => handleSuggestion(s)}
              >
                {s}
              </Button>
            ))}
          </div>
        </div>

        {/* Chat Window */}
        <section aria-live="polite" className="flex-1 overflow-y-auto px-3 py-3 space-y-3">
          {messages.map((msg, i) => {
            const isUser = msg.role === "user"
            return (
              <div key={i} className={cn("flex gap-2", isUser ? "justify-end" : "justify-start")}>
                {/* Replace image-based Avatar with MiniAvatar that doesn't use public files */}
                {!isUser && <MiniAvatar label="AI" variant="ai" />}

                <div
                  className={cn(
                    "max-w-[75%] rounded-lg px-3 py-2 text-sm",
                    isUser ? "bg-secondary text-secondary-foreground" : "bg-muted text-muted-foreground",
                  )}
                >
                  <p className="whitespace-pre-wrap text-foreground/90">{msg.text}</p>

                  {msg.img && (
                    <div className="mt-2">
                      <Image
                        src={msg.img || "/placeholder.svg"}
                        alt="Generated certificate element"
                        width={320}
                        height={320}
                        unoptimized
                        className="rounded-md border border-sidebar-border"
                      />
                      <Button size="sm" className="mt-2 w-full" onClick={() => applyImageToCertificate(msg.img)}>
                        Add to Certificate
                      </Button>
                    </div>
                  )}
                </div>

                {/* Replace user Avatar with MiniAvatar */}
                {isUser && <MiniAvatar label="U" variant="user" />}
              </div>
            )
          })}

          {loading && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <span className="inline-block h-2 w-2 rounded-full bg-muted-foreground/50 animate-pulse" />
              <span className="inline-block h-2 w-2 rounded-full bg-muted-foreground/50 animate-pulse [animation-delay:120ms]" />
              <span className="inline-block h-2 w-2 rounded-full bg-muted-foreground/50 animate-pulse [animation-delay:240ms]" />
              <span>Generating image...</span>
            </div>
          )}

          <div ref={endRef} />
        </section>

        {/* Composer */}
        <footer className="border-t border-sidebar-border p-3">
          <div className="flex flex-col gap-2">
            <Textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Describe certificate elements (logo, background, decorations)..."
              className="resize-none"
              rows={3}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault()
                  sendMessage()
                }
              }}
            />
            <div className="flex items-center justify-between gap-2">
              <p className="text-xs text-muted-foreground">Press Enter to send • Shift + Enter for a new line</p>
              <Button onClick={sendMessage} disabled={loading || !input.trim() || sending}>
                {loading || sending ? "Generating..." : "Generate"}
              </Button>
            </div>
          </div>
        </footer>
      </aside>
    </>
  )
}