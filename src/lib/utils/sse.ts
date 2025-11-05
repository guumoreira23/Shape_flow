import { NextResponse } from "next/server"

export function createSSEStream(
  stream: ReadableStream<Uint8Array>,
  init?: ResponseInit
): NextResponse {
  return new NextResponse(stream, {
    ...init,
    headers: {
      ...init?.headers,
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  })
}

export function formatSSEMessage(data: string, event?: string): string {
  if (event) {
    return `event: ${event}\ndata: ${data}\n\n`
  }
  return `data: ${data}\n\n`
}

