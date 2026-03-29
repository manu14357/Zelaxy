/** * Telemetry API - DISABLED * * All telemetry functionality has been removed. */ export async function POST() {
  return new Response(JSON.stringify({ message: 'Telemetry disabled' }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  })
}
