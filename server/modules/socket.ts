import { WebSocket, isWebSocketCloseEvent} from "https://deno.land/std/ws/mod.ts"
import { v4 } from "https://deno.land/std/uuid/mod.ts";
import { game } from "./game.ts";
import { config } from "../config.ts";


export class Controller {
  up:-1|0|1=0;
  right:-1|0|1=0;
  pickup:-1|0|1=0;
  shoot=false;
}
function rdmGrad(val=0) {
  return Math.trunc(Math.random()*(255-val)+val);
}
function rdmColor() {
  return `rgb(${rdmGrad(50)}, ${rdmGrad(50)}, ${rdmGrad(50)})`;
}
export class User {
  name: string;
  isPlaying: boolean = false;
  color = rdmColor();
  controller = new Controller();

  constructor(name: string, i=0) {
    const str = i===0?'':`-${i}`;
    this.name = name + str;
  }
  changeName(name: string) {
    this.name = name;
  }
  changeColor(color: string) {
    this.color = color;
  }
}
export class Client {
  ws: WebSocket;
  users: Array<User>;
  name: string;

  constructor(ws: WebSocket, name: string) {
    this.ws = ws;
    this.name = name;
    this.users = [new User(name), new User(name, 1)];
  }
}
export const clients = new Map<string, Client>()

async function askPsw(ws: WebSocket) {
  let token = '';
  if (token !== config.password)
    ws.send("incorrect password");
  else
    return;
  for await (const ev of ws) {
    if (isWebSocketCloseEvent(ev))
      return;
    if (typeof ev === 'string')
      token = ev;
    if (token !== config.password)
      ws.send("incorrect password");
    else
      return;
  }
}
export async function broadcast(data: string) {
  clients.forEach((client: Client) => {
    client.ws.send(data);
  });
}

export const socketHandler = async (ws: WebSocket, clientName: string) => {
  await askPsw(ws);

  const clientID = v4.generate();
  const client = new Client(ws, clientName);
  clients.set(clientID, client);
  ws.send(JSON.stringify({ fps: config.frameRate, dim: {width: config.width, height: config.height}}));
  ws.send(JSON.stringify({create: game.getInfo()}));

  for await (const ev of ws) {
    if ( isWebSocketCloseEvent(ev) ) {
      clients.delete(clientID);
      return;
    }
    if (typeof ev === 'string') {
      if (ev === "packet-loss") {
        ws.send(JSON.stringify({create: game.getInfo()}));
        continue;
      }
      const data = JSON.parse(ev);
      // TODO: test de validité du packet recu.
      const user = client.users[data[0]];
      if (user) {
        switch (data[1]) {
          case "y":
            user.controller.up = data[2]; // as -1|0|1;
            if (user.controller.up === 1) {
              if (! user.isPlaying) {
                game.respawn(user);
              }
            }
            break;
          case "x":
            user.controller.right = data[2];
            break;
          case "shoot":
            user.controller.shoot = data[2];
            break;
          case "pickup":
            user.controller.pickup = data[2];
            break;
          case "name":
            user.changeName(data[2]);
            break;
          case "color":
            user.changeColor(data[2]);
            break;
        }
      }
    }
  }
};
