
let name = "Anon";
let ip = 'ws://0.tcp.eu.ngrok.io:12965/socket'
// ip = 'ws://localhost:3000/socket'
let ws = new WebSocket(ip, name);

ws.onerror = function(err) {
  console.log('Socket encountered error: ', err, 'Closing socket');
  ws.close();
};

ws.onmessage = function (event) {
  if ( typeof event.data !== "string" ) return;
  if (event.data === "incorrect password") {
    ws.send(prompt("password"));
    return;
  }

  const data = JSON.parse(event.data);
  if (data.create) {
    data.create.forEach((gameObjInfo) => {
      const { i, tag, position, velocity, friction, radius, vertNumber, color, name, health } = gameObjInfo;
      const newGameObj = new GameObject(
        position,
        velocity,
        friction,
        new Polygon(vertNumber, radius, position.angle),
        color
      );
      newGameObj.setProp(name, health); // Additional property for the entities
      game.gameObjects[tag][i] = newGameObj;

    });
  }
  try {
    if (data.move) {
        data.move.forEach((gameObjInfo) => {
          const { i, tag, position, velocity } = gameObjInfo;
          game.gameObjects[tag][i].move(position, velocity);
        });

    }
    if (data.health) {
      data.health.forEach((gameObjInfo) => {
        const { i, tag, health } = gameObjInfo;
        game.gameObjects[tag][i].healthUpdate(health);
      });
    }
    if (data.destroy) {
      data.destroy.forEach((gameObjInfo) => {
        const { i, tag } = gameObjInfo;
        game.gameObjects[tag].splice(i, 1);

      });
      // TODO: effect
    }
  } catch (err) { // Retrieve data
    if (err.message === "game.gameObjects[tag][i] is undefined") {
      ws.send("packet-loss");
    } else {
      throw err;
    }
  }
  if (data.lives) { // TODO
    game.lives = data.lives;
  }
  if (data.fps) {
    game.setFrameRate(data.fps);
  }
  if (data.dim) { // TODO
    game.width = data.dim.width;
    game.height = data.dim.height;
    game.resetCanvasDim();
  }
};
