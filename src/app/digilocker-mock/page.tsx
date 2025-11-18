import type { Metadata } from "next"
import DigiLockerPage from "@/components/digilocker/page"

export const metadata: Metadata = {
  title: "DigiLocker (Mock)",
  description: "Mock DigiLocker interface for previewing certificates",
}

// App Router passes searchParams to RSC
export default function Page({
  searchParams,
}: {
  searchParams: { [key: string]: string | string[] | undefined }
}) {
  const docIdParam = searchParams?.docId
  const initialSelectedId =
    typeof docIdParam === "string" ? docIdParam : Array.isArray(docIdParam) ? docIdParam[0] : undefined

  return <DigiLockerPage initialSelectedId={initialSelectedId} />
}
