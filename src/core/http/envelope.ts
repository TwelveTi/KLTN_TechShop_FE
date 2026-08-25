export type ApiResponse<T> = {
  code: number
  message: string
  requestId?: string
  data?: T
}
