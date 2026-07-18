/**
 * Extracts a meaningful message from any error shape (nested response data, bare objects, strings).
 */
export function extractErrorMessage(error: any): string {
  if (typeof error === 'string') {
    return error
  }
  if (error?.message) {
    return error.message
  }
  if (error?.response?.data) {
    const data = error.response.data
    if (typeof data === 'string') {
      return data
    }
    if (data.message) {
      return data.message
    }
    return JSON.stringify(data)
  }
  if (typeof error === 'object') {
    return JSON.stringify(error)
  }
  return String(error)
}
