export function databricksHost(host: string) {
  return host.replace(/^https?:\/\//, '').replace(/\/$/, '')
}

export function databricksHeaders(params: { token: string }) {
  return {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${params.token}`,
  }
}

export async function parseDatabricksResponse(response: Response) {
  const data = await response.json()
  if (!response.ok) {
    throw new Error(data.message || data.error?.message || `HTTP ${response.status}`)
  }
  return data
}
