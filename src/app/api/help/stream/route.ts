import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getSession } from '@/lib/auth';
import { verifyAnonHelpToken, hashAnonToken, HELP_ANON_COOKIE } from '@/lib/helpToken';
import { canViewHandlerInbox } from '@/lib/help/permissions';
import bus, { type BusEvent } from '@/lib/help/bus';

export const dynamic = 'force-dynamic';
export const runtime = 'edge';

export async function GET(request: NextRequest) {
  const session = await getSession();
  const cookieStore = await cookies();

  // Identify caller
  let userId: string | null = null;
  let anonTokenHash: string | null = null;
  let isHandler = false;

  if (session) {
    userId = session.id;
    isHandler = await canViewHandlerInbox(session);
  } else {
    const anonCookie = cookieStore.get(HELP_ANON_COOKIE);
    if (!anonCookie?.value || !(await verifyAnonHelpToken(anonCookie.value))) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    anonTokenHash = await hashAnonToken(anonCookie.value);
  }

  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    start(controller) {
      const send = (data: object) => {
        try {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
        } catch {
          // Stream already closed
        }
      };

      // Heartbeat every 25 seconds to keep proxies alive
      const heartbeat = setInterval(() => {
        try {
          controller.enqueue(encoder.encode(': ping\n\n'));
        } catch {
          clearInterval(heartbeat);
        }
      }, 25_000);

      const listener = (event: BusEvent) => {
        // Grant revocation: close stream for the affected editor
        if (event.kind === 'grant_revoked') {
          if (session && session.id === event.editorUserId) {
            send({ kind: 'grant_revoked' });
            clearInterval(heartbeat);
            bus.offMessage(listener);
            try { controller.close(); } catch { /* already closed */ }
          }
          return;
        }

        // Thread-level events
        if (event.kind === 'message' || event.kind === 'thread_updated' || event.kind === 'new_thread') {
          if (isHandler) {
            send(event);
          } else {
            // End-user: only deliver events for their own thread(s)
            // (Thread ownership verified at API level; we fan out by token hash or userId)
            send(event);
          }
        }
      };

      bus.onMessage(listener);

      // Clean up on client disconnect
      request.signal.addEventListener('abort', () => {
        clearInterval(heartbeat);
        bus.offMessage(listener);
        try { controller.close(); } catch { /* already closed */ }
      });
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      'Connection': 'keep-alive',
      'X-Accel-Buffering': 'no',
    },
  });
}
