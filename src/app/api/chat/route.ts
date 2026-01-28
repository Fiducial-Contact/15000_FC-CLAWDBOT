import { NextRequest } from 'next/server';
import { spawn } from 'child_process';

const GATEWAY_HOST = process.env.GATEWAY_SSH_HOST || '46.224.225.164';
const GATEWAY_AGENT = process.env.GATEWAY_AGENT || 'work';
const SESSION_ID = process.env.GATEWAY_SESSION_ID || 'web-chat';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { content, agent = GATEWAY_AGENT } = body;

    if (!content) {
      return Response.json({ error: 'Content is required' }, { status: 400 });
    }

    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      start(controller) {
        const escapedContent = content.replace(/'/g, "'\\''");
        const remoteCmd = `clawdbot agent --agent ${agent} --session-id ${SESSION_ID} --message '${escapedContent}'`;
        
        const args = [
          '-o', 'StrictHostKeyChecking=no',
          '-o', 'BatchMode=yes',
          `root@${GATEWAY_HOST}`,
          remoteCmd,
        ];

        const ssh = spawn('ssh', args, { shell: false });

        ssh.stdout.on('data', (data: Buffer) => {
          const chunk = data.toString();
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'content', content: chunk })}\n\n`));
        });

        ssh.stderr.on('data', (data: Buffer) => {
          console.error('[API] SSH stderr:', data.toString());
        });

        ssh.on('close', () => {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'done' })}\n\n`));
          controller.close();
        });

        ssh.on('error', (err) => {
          console.error('[API] SSH error:', err);
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'error', error: err.message })}\n\n`));
          controller.close();
        });
      },
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        Connection: 'keep-alive',
      },
    });
  } catch (error) {
    console.error('[API] Chat error:', error);
    return Response.json(
      { error: error instanceof Error ? error.message : 'Internal error' },
      { status: 500 }
    );
  }
}
