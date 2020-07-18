function TriEnemy(x, y, customProp) {
  Entity.call(this, x, y, 3, color = "#e92f2f");
  this.tag = "enemy";
  const rb = this.body,
    vel = this.velocity;

  rb.angle -= Math.PI;
  rb.update();

  this.drop = {
    HealthPack: 0.2,
    Magnet: 0.08,
    ShootEverywhere: 0.01,
    ShootDelay: 0.01,
    Life: 0.01,
  };
  const shootDelay = 2000;
  let timeSinceShoot = 0;
  let timeSinceReTarget = -4000;
  const targetDelay = 2000;
  let target, targetAngle=rb.angle;

  this.aim = function () {
    targetAngle = Math.atan2(
        this.target.body.y-rb.y,
        this.target.body.x-rb.x
      ) + Math.PI;
    if (Math.abs(rb.angle-targetAngle) < 0.2)   // au boup d'un certain angle pas besoin de reaim
      targetAngle = rb.angle;
  };

  this.logic = function (ms) {
    if (timeSinceReTarget+targetDelay < ms) {
      this.target = rb.getClosest("player").entity;
      timeSinceReTarget = performance.now();
      if (! this.target)
        targetAngle = rb.angle + Math.PI/3;
    }
    if (this.target)
      this.aim();
    const abs = Math.abs(vel.angle);
    if (rb.angle < targetAngle && abs < this.maxAngleSpeed) {
      vel.angle += this.angleSpeed;
    }
    else if (rb.angle > targetAngle && abs < this.maxAngleSpeed) {
      vel.angle -= this.angleSpeed;
    }
    if (rb.angle === targetAngle && timeSinceShoot + shootDelay < ms ) {
      // We take the shot
      this.shootIndex.forEach(i => {
        shoot(rb, vel, rb.vertices[i], "player", this.color);
      });
      timeSinceShoot = performance.now();
    }
    this.foward();
  };
  this.whenKilled = function () {
    if (game.noEnemy()) {
      game.nextLevel();
    }
  };
  for (const key in customProp) {
    this[key] = customProp[key];
  }
}
