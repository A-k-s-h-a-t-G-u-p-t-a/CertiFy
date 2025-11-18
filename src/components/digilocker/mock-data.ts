import type { DocItem } from "./types"

export const mockDocuments: DocItem[] = [
  {
    id: "CERT-2024-0001",
    title: "Completion Certificate - MongoDB Online Training",
    issuer: "tutorialspoint",
    issueDate: "2024-01-01",
    type: "issued",
    category: "Education",
    tags: ["certificate", "education", "mongodb"],
  },
  {
    id: "CERT-2024-0002",
    title: "Identity Proof - PAN",
    issuer: "Income Tax Department",
    issueDate: "2023-04-01",
    type: "uploaded",
    category: "Identity",
    tags: ["KYC", "identity"],
  },
  {
    id: "CERT-2024-0003",
    title: "Vaccination Certificate - COVID-19",
    issuer: "Ministry of Health & Family Welfare",
    issueDate: "2021-10-23",
    type: "issued",
    category: "Health",
    tags: ["health", "covid19", "vaccination"],
  },
  {
    id: "CERT-2025-0107",
    title: "Course Certificate - Data Structures",
    issuer: "State Technical Board",
    issueDate: "2025-02-15",
    type: "issued",
    category: "Education",
    tags: ["certificate", "computer science"],
  },
]
