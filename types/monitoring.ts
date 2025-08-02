export type CheckStatus = "UP" | "DOWN" | "TIMEOUT" | "ERROR"
export type IncidentStatus = "OPEN" | "INVESTIGATING" | "IDENTIFIED" | "MONITORING" | "RESOLVED"

export interface Monitor {
  id: string
  organizationId: string
  name: string
  url: string
  method: string
  headers: Record<string, string>
  expectedStatus: number
  timeout: number
  interval: number
  isActive: boolean
  createdAt: Date
  updatedAt: Date
}

export interface MonitorCheck {
  id: string
  monitorId: string
  status: CheckStatus
  responseTime?: number
  statusCode?: number
  errorMessage?: string
  checkedAt: Date
}

export interface Incident {
  id: string
  monitorId: string
  title: string
  status: IncidentStatus
  startedAt: Date
  resolvedAt?: Date
  createdAt: Date
  updatedAt: Date
}