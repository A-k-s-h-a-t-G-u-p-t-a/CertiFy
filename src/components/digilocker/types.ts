export type DocItem = {
  id: string
  title: string
  issuer: string
  issueDate: string
  type: "issued" | "uploaded"
  category: string
  tags?: string[]
}
