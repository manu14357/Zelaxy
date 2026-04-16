export async function getJiraCloudId(domain: string, accessToken: string): Promise<string> {
  const normalizedDomainInput = domain.trim()
  const domainWithProtocol = /^https?:\/\//i.test(normalizedDomainInput)
    ? normalizedDomainInput
    : `https://${normalizedDomainInput}`
  const inputUrl = new URL(domainWithProtocol)
  const inputHost = inputUrl.hostname.toLowerCase()

  const response = await fetch('https://api.atlassian.com/oauth/token/accessible-resources', {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      Accept: 'application/json',
    },
  })

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(
      `Failed to fetch Jira accessible resources (${response.status} ${response.statusText}): ${errorText || 'empty response'}`
    )
  }

  const resources = await response.json()

  if (!Array.isArray(resources)) {
    throw new Error('Invalid Jira resources response from Atlassian API')
  }

  // If we have resources, find the matching one
  if (resources.length > 0) {
    const matchedResource = resources.find((resource) => {
      try {
        return new URL(resource.url).hostname.toLowerCase() === inputHost
      } catch {
        return false
      }
    })

    if (matchedResource) {
      return matchedResource.id
    }
  }

  // If we couldn't find a match, return the first resource's ID
  // This is a fallback in case the URL matching fails
  if (resources.length > 0) {
    return resources[0].id
  }

  throw new Error(
    `No Jira resources found for domain ${inputHost}. Reconnect your Jira credential and ensure this Atlassian site is authorized.`
  )
}
