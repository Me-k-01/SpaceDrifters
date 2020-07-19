import { serve } from "https://deno.land/std/http/server.ts";
import { WebSocket, acceptWebSocket, acceptable} from "https://deno.land/std/ws/mod.ts"
import { socketHandler } from "./socket.ts";
import { config } from "../config.ts";

const server = serve({port: config.port});
console.log(`Server is running on port ${config.port}`)

for await (const req of server) {
  switch (req.url) {
    case '/':
      req.respond({
        status: 200,
        body: await Deno.open('../public/client.html')
      })
      break;
    case '/style/stylesheet.css':
      req.respond({
        status: 200,
        body: await Deno.open('../public/style/stylesheet.css')
      });
      break;
    case '/scripts/gameobject.js':
      req.respond({
        status: 200,
        body: await Deno.open('../public/scripts/gameobject.js')
      });
      break;
    case '/scripts/statBar.js':
      req.respond({
        status: 200,
        body: await Deno.open('../public/scripts/statBar.js')
      });
      break;
    case '/scripts/playercontroller.js':
      req.respond({
        status: 200,
        body: await Deno.open('../public/scripts/playercontroller.js')
      });
      break;
    case '/scripts/engine.js':
      req.respond({
        status: 200,
        body: await Deno.open('../public/scripts/engine.js')
      });
      break;
    case '/scripts/client.js':
      req.respond({
        status: 200,
        body: await Deno.open('../public/scripts/client.js')
      });
      break;
    case '/socket':
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
      break;

    default:
      break;
  }
}
