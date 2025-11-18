import { Lock } from "lucide-react"
import { Button } from "@/components/ui/button"

export default function DigiLockerHeader() {
  return (
    <header className="w-full border-b border-border bg-card">
      <div className="mx-auto max-w-6xl px-4 md:px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="inline-flex h-8 w-8 items-center justify-center rounded-md bg-primary text-primary-foreground">
            <Lock className="h-5 w-5" aria-hidden="true" />
          </div>
          <div className="flex flex-col">
            <span className="font-semibold leading-none">DigiLocker</span>
            <span className="text-xs text-muted-foreground">Mock Interface</span>
          </div>
        </div>

        <nav aria-label="Primary">
          <ul className="flex items-center gap-2">
            <li>
              <Button variant="ghost" size="sm">
                Home
              </Button>
            </li>
            <li>
              <Button variant="ghost" size="sm">
                Issued Docs
              </Button>
            </li>
            <li>
              <Button variant="ghost" size="sm">
                Uploaded Docs
              </Button>
            </li>
            <li>
              <Button variant="default" size="sm">
                Sign In
              </Button>
            </li>
          </ul>
        </nav>
      </div>
    </header>
  )
}
