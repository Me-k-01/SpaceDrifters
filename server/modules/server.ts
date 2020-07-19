import { serve } from "https://deno.land/std/http/server.ts";
import { WebSocket, acceptWebSocket, acceptable} from "https://deno.land/std/ws/mod.ts"
import { socketHandler } from "./socket.ts";
import { config } from "../config.ts";

const server = serve({port: config.port});
console.log(`Server is running on port ${config.port}`)

for await (const req of server) {
  if (req.url === '/socket')  {
    let clientName = req.headers.get("sec-websocket-protocol") as string;

    if (acceptable(req) && clientName) {
      acceptWebSocket({
        conn: req.conn,
        bufReader: req.r,
        bufWriter: req.w,
        headers: req.headers,
      })
      .then((ws: WebSocket) => socketHandler(ws, clientName))
      .catch(async (err:Error) => {
        console.error(`Failed to accept websocket: ${err}`);
        await req.respond({ status: 400 });
      });
    }
  }
}
