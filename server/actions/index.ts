// Server actions will be implemented in subsequent steps
export type ActionResult<T> = {
  success: true
  data: T
} | {
  success: false
  error: string
}