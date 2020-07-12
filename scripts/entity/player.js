const keys = {
  move: { foward: 0, angle: 0 },
  shoot: false,
  down (event) {
    switch (event.keyCode) {
      case 90:
        keys.move.foward = 1;
        break;
      case 83:
        keys.move.foward = -1;
        break;
      case 68:
        keys.move.angle = 1;
        break;
      case 81:
        keys.move.angle = -1;
        break;
      case 32:
        keys.shoot = true;
        break;
      case 69:
        game.newPlayer();
        break;
    }
  },
  up (event) {
    switch (event.keyCode) {
      case 90:
        keys.move.foward = 0;
        break;
      case 83:
        keys.move.foward = 0;
        break;
      case 68:
        keys.move.angle = 0;
        break;
      case 81:
        keys.move.angle = 0;
        break;
      case 32:
        keys.shoot = false;
        break;
    }
  }
};
function Player(x, y, client) {
  Entity.call(this, x, y, 3, color=client.color);
  const controller = client.controller;
  const self = this,
    rb = this.body,
    vel = this.velocity;
  rb.angle = Math.PI/2;
  rb.update();

  self.tag = "player";
  self.grabRadius = 200;

  self.healthMax = 10;
  self.health = self.healthMax;
  self.shootDelay = 1000;
  let timeSinceShoot = 0;
  self.whenKilled = () => {
    client.isPlaying = false;
  };
  self.logic = ms => {
    if (Math.abs(vel.angle) < this.maxAngleSpeed) {
      vel.angle += this.angleSpeed * controller.move.angle;
    }
    self.foward(controller.move.foward);
    if (controller.shoot && timeSinceShoot+self.shootDelay < ms) {
      // We take the shot
      self.shootIndex.forEach(i => {
        shoot(rb, rb.vertices[i], "enemy", self.color);
      });
      timeSinceShoot = performance.now();
    }
  };
}
window.addEventListener("keydown", keys.down, false);
window.addEventListener("keyup", keys.up, false);
