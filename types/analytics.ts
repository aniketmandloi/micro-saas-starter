export interface UsageMetric {
  metricName: string
  quantity: number
  timestamp: Date
  metadata?: Record<string, any>
}

export interface AnalyticsData {
  totalApiCalls: number
  activeUsers: number
  usageByDay: Array<{
    date: string
    value: number
  }>
  topEndpoints: Array<{
    endpoint: string
    count: number
  }>
}