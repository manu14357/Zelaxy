export async function parseDagsterResponse(response: Response) {
  const text = await response.text()
  if (!response.ok) throw new Error(`Dagster API error: ${response.status} ${text}`)
  const data = JSON.parse(text)
  if (data.errors?.length) {
    throw new Error(data.errors.map((e: { message: string }) => e.message).join('; '))
  }
  return data
}

export function dagsterHeaders(params: { host: string; apiKey?: string }) {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' }
  if (params.apiKey) headers['Dagster-Cloud-Api-Token'] = params.apiKey
  return headers
}
