export async function GET() {
  const res = await fetch(process.env.GOOGLE_SHEET_API as string)
  const data = await res.json()
  return Response.json(data)
}

export async function POST(req: Request) {
  const body = await req.json()

  const res = await fetch(process.env.GOOGLE_SHEET_API as string, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })

  const data = await res.json()
  return Response.json(data)
}
