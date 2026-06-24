import { Router } from 'express';

const router = Router();

// Store connected SSE clients
const clients = new Set();

// GET /api/events - SSE endpoint for real-time updates
router.get('/', (req, res) => {
  // Set SSE headers
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    Connection: 'keep-alive',
    'Access-Control-Allow-Origin': '*',
  });

  // Send initial connection message
  res.write(`data: ${JSON.stringify({ type: 'connected', message: 'SSE connection established' })}\n\n`);

  // Add client
  clients.add(res);
  console.log(`SSE client connected. Total clients: ${clients.size}`);

  // Keep-alive ping every 30 seconds
  const keepAlive = setInterval(() => {
    res.write(': keepalive\n\n');
  }, 30000);

  // Cleanup on disconnect
  req.on('close', () => {
    clearInterval(keepAlive);
    clients.delete(res);
    console.log(`SSE client disconnected. Total clients: ${clients.size}`);
  });
});

// Broadcast an event to all connected clients
export function broadcastEvent(eventType, data) {
  const payload = JSON.stringify({ type: eventType, data, timestamp: new Date().toISOString() });
  for (const client of clients) {
    client.write(`event: ${eventType}\ndata: ${payload}\n\n`);
  }
}

export default router;
