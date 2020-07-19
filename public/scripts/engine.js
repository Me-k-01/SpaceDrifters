const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');

function Engine(fps = 60) {
  const self = this;
  let isPaused;
  // Tick
  this.fps = fps;
  this.width = 500;
  this.height = 500;
  this.scale = 1;
  this.lives = 4;

  let tickLength = 1000/this.fps;
  let lastTick;
  this.gameObjects = {
    player: [],
    enemy: [],
    bullet: [],
    item: [],
  };
  this.setFrameRate = function (fps) {
    self.fps = fps;
    tickLength = 1000/self.fps;
  };
  this.resetCanvasDim = function () {
    if (window.innerWidth/self.width < window.innerHeight/self.height) 
      self.scale = window.innerWidth / self.width;
    else
      self.scale = window.innerHeight / self.height;
    canvas.width = self.width*self.scale;
    canvas.height = self.height*self.scale;
  };
  const render = function () {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    for (const tag in self.gameObjects) {
      for (const gameObj of self.gameObjects[tag]) {
        gameObj.render(ctx);
      }
    }
  };
  const update = function (ms) {
    for (const tag in self.gameObjects) {
      for (const gameObj of self.gameObjects[tag]) {
        gameObj.update(ms);
      }
    }
  };

  const mainLoop = now => {
    if (isPaused)
      return;

    if (now-lastTick > 5000) {
      console.log("The game was put to sleep");
    }
    while (lastTick+tickLength < now) { // On réitére l'update pour chaque fois necessaire.
      lastTick+=tickLength;
      update(lastTick);
    }
    render();
    window.requestAnimationFrame(mainLoop);
  };

  this.run = () => {
    isPaused = false;
    lastTick=performance.now();
    mainLoop(lastTick);
  };
  this.stop = () => {
    isPaused = true;
  };

  this.outsideBoundaryX = x => 0>x || x>canvas.width;
  this.outsideBoundaryY = y => 0>y || y>canvas.height;
  this.outsideBoundary = function (pos) {
    return this.outsideBoundaryX(pos.x) || this.outsideBoundaryY(pos.y);
  };
}
const game = new Engine();
window.onresize = game.resetCanvasDim;
game.run();
