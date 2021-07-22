import { serve } from "https://deno.land/std/http/server.ts";
import { WebSocket, acceptWebSocket, acceptable} from "https://deno.land/std/ws/mod.ts"
import { socketHandler } from "./socket.ts";
import { config } from "../config.ts";

const server = serve({port: config.port});
console.log(`Server is running on port ${config.port}`)

for await (const req of server) {
  if (req.url === '/')
    req.respond({
      status: 200,
      body: await Deno.open('../public/client.html')
    });
  else if (req.url === '/socket') {
    let clientName = "Anon"
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
  } else {
    Deno.open('../public' + req.url)
      .then(file => req.respond({
        status: 200,
        body: file
      }))
      .catch(err => {
        console.log(err.message);
        req.respond({ status: 400 });
      })
  }
}
