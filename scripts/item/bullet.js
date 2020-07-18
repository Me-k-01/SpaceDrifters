function Bullet(coord, vel, direction, dealDmgTo="player", color="#3cf3ff") {
  const self = this;
  // Body
  this.x = coord.x;
  this.y = coord.y;
  this.radius = 5;
  const rad = this.radius;

  // Movement
  this.speed = 8;
  this.velocity = {
    x: vel.x + direction.x * this.speed,
    y: vel.y + direction.y * this.speed
  };

  let bounce = 0;
  const bounceMax = 2;
  const bounciness = 1/2;
  this.damage = 1;
  this.color = color;

  this.update = function () {
    this.x += this.velocity.x;
    this.y += this.velocity.y;
    for (const entity of game.entities[dealDmgTo]) {
      const targetBody = entity.body;
      if (targetBody.x - targetBody.radius < this.x && this.x < targetBody.x + targetBody.radius) { // Optimisation
        if (pointInsidePoly(this, targetBody.vertices)) {
          entity.takeDamage(this.damage);
          this.destroy();
        }
      }
    }
    // Rebond
    if (game.outsideBoundaryX(this.x + this.velocity.x)) {
      this.velocity.x = - (this.velocity.x)*bounciness;
      bounce++;
      new Particles(this, 3, 1, this.color);
      if (bounce > bounceMax)
        this.destroy();
    }
    if (game.outsideBoundaryY(this.y + this.velocity.y)) {
      this.velocity.y = - (this.velocity.y)*bounciness;
      bounce++;
      new Particles(this, 3, 1, this.color);
      if (bounce > bounceMax)
        this.destroy();
    }
  };

  this.render = function (ctx) {
    ctx.fillStyle = this.color;
    ctx.fillRect(this.x-rad, this.y-rad, rad, rad);
  };
  this.destroy = function () {
    new Particles(this, 5, 2, this.color);
    game.remove("items", "bullet", this);
  };
}

function shoot(rb, vel, toward, dealDmgTo, color) {
  game.items.bullet.push(new Bullet(toward, vel, {
    x: (toward.x - rb.x ) / rb.radius, // Normaliser par la distance pour pas que la vitesse change suivant la taille de l'entité qui tire.
    y: (toward.y - rb.y ) / rb.radius
  }, dealDmgTo, color));
}
