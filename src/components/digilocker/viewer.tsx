import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Download, Share2, ShieldCheck } from "lucide-react"
import type { DocItem } from "./types"

export default function DocumentViewer({ doc }: { doc?: DocItem }) {
  if (!doc) {
    return (
      <Card aria-live="polite">
        <CardHeader>
          <CardTitle>No document selected</CardTitle>
          <CardDescription>Select a document from the list to preview.</CardDescription>
        </CardHeader>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between gap-4">
          <div>
            <CardTitle className="text-pretty">{doc.title}</CardTitle>
            <CardDescription className="text-pretty">
              Issued by {doc.issuer} on {doc.issueDate}
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm">
              <Share2 className="h-4 w-4 mr-2" aria-hidden="true" />
              Share
            </Button>
            <Button variant="outline" size="sm">
              <ShieldCheck className="h-4 w-4 mr-2" aria-hidden="true" />
              Verify
            </Button>
            <Button size="sm">
              <Download className="h-4 w-4 mr-2" aria-hidden="true" />
              Download
            </Button>
          </div>
        </div>
      </CardHeader>

      <Separator />

      <CardContent className="pt-4">
        <div className="grid gap-4 md:grid-cols-2">
          <div className="rounded-md border border-border bg-card">
            {/* Mock document preview */}
            <img src="/certificate-preview-with-security-watermark.jpg" alt="Mock certificate preview" className="w-full rounded-md" />
          </div>
          <div className="space-y-3">
            <h3 className="text-sm font-semibold">Document Details</h3>
            <dl className="grid grid-cols-3 gap-x-4 gap-y-2 text-sm">
              <dt className="text-muted-foreground">Type</dt>
              <dd className="col-span-2">{doc.category}</dd>

              <dt className="text-muted-foreground">Issuer</dt>
              <dd className="col-span-2">{doc.issuer}</dd>

              <dt className="text-muted-foreground">Issue Date</dt>
              <dd className="col-span-2">{doc.issueDate}</dd>

              <dt className="text-muted-foreground">Document ID</dt>
              <dd className="col-span-2">{doc.id}</dd>

              <dt className="text-muted-foreground">Status</dt>
              <dd className="col-span-2">Available (Mock)</dd>
            </dl>

            {doc.tags?.length ? (
              <div className="pt-2">
                <h4 className="text-sm font-medium mb-2">Tags</h4>
                <div className="flex flex-wrap gap-2">
                  {doc.tags.map((t) => (
                    <span key={t} className="rounded-md bg-secondary px-2 py-1 text-xs text-secondary-foreground">
                      {t}
                    </span>
                  ))}
                </div>
              </div>
            ) : null}
          </div>
        </div>

        <div className="mt-6 rounded-md border border-dashed border-border p-3 text-sm text-muted-foreground">
          This is a mock DigiLocker interface for preview purposes.
        </div>
      </CardContent>
    </Card>
  )
}
