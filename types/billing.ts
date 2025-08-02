export type SubscriptionStatus = 
  | "ACTIVE" 
  | "CANCELED" 
  | "INCOMPLETE" 
  | "INCOMPLETE_EXPIRED" 
  | "PAST_DUE" 
  | "TRIALING" 
  | "UNPAID"

export interface SubscriptionPlan {
  id: string
  name: string
  description: string
  priceAmount: number
  priceCurrency: string
  interval: "month" | "year"
  features: string[]
  limits: Record<string, number>
}