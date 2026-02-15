export type EnvVar = {
  id: number
  projectId: string
  key: string
  value: string
  sensitive: boolean | null
  description: string | null
  createdAt: string | null
  updatedAt: string | null
}

export type Project = {
  id: string
  name: string
  url: string | null
  createdAt: string | null
}
