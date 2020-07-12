function RectBody(x, y, w=50, h=50) {
  // Body de formes rectanglulaire
  // Coordonée du milieu du rectangle
  this.x = x+w/2;
  this.y = y+h/2;
  this.w = w;
  this.h = h;

  this.angle = 0; // En rad
  const theta = Math.atan(this.h/2 / (this.w/2));
  this.radius= Math.hypot(this.w/2, this.h/2); // Radius of the body

  this.update = function () {
    this.vertices[0].x = this.x - this.radius* Math.cos(this.angle + theta);
    this.vertices[0].y = this.y - this.radius* Math.sin(this.angle + theta);
    this.vertices[1].x = this.x - this.radius* Math.cos(this.angle - theta);
    this.vertices[1].y = this.y - this.radius* Math.sin(this.angle - theta);
    this.vertices[2].x = this.x - this.radius* Math.cos(this.angle + theta + Math.PI);
    this.vertices[2].y = this.y - this.radius* Math.sin(this.angle + theta + Math.PI);
    this.vertices[3].x = this.x - this.radius* Math.cos(this.angle - theta + Math.PI);
    this.vertices[3].y = this.y - this.radius* Math.sin(this.angle - theta + Math.PI);
  };

  this.move = function (force) {
    this.x += force.x;
    this.y += force.y;
    this.angle += force.angle;
    this.angle %=  Math.PI * 2;
    this.update();
  };

  this.update();

}
function RegBody(x, y, n=3, r=25) {
  // Body en forme de polygone a n coté regulier, circonscrit au cercle.
  // Coordonée du milieu du cercle
  this.x = x+50;
  this.y = y+50;
  this.radius= r;

  this.angle = Math.PI/2; // En degré
  const theta = Math.PI*2/n;

  this.vertices = [];
  for (let i=0; i<n; i++) {
    this.vertices[i] = {};
  }
  let lastAngle;

  this.getClosest = function (type="player") {
    let closest;
    let smallestDist = Infinity;
    for (const entity of game.entities[type]) {
      const dist = Math.hypot(this.x-entity.body.x, this.y-entity.body.y);
      if ( dist < smallestDist) {
        closest = entity;
        smallestDist = dist;
      }
    }
    return {entity: closest, distance: smallestDist};
  };

  this.update = function () {
    if (this.angle != lastAngle)  { // Optimisation
      this.vertices.forEach((vert, i) => {
        vert.x = this.x - this.radius* Math.cos(this.angle + theta * i);
        vert.y = this.y - this.radius* Math.sin(this.angle + theta * i);
      });
    }
  };

  this.move = function (force) {
    this.x += force.x;
    this.y += force.y;
    this.angle += force.angle;
    this.angle %=  Math.PI * 2;

    this.update();
  };

  this.update();
}

function Entity(x, y, sideNum, color = "#d7b128") {
  // Body
  this.color = color;
  this.body = new RegBody(x, y, sideNum); // body rectangulaire de l'entité
  const rb = this.body;
  // Velocity
  this.velocity = new Vector();
  this.velocity.angle = 0;
  const vel = this.velocity;
  const bounciness = 1/2;

  this.speed = 0.1;
  this.maxSpeed = 10;
  this.friction = 0.02;
  this.angleSpeed = 0.01;
  this.maxAngleSpeed = 0.2;
  this.angleFriction = 0.005;

  this.shootIndex = [0]; // Indices de par quelle vertex l'entité peut tirer

  // Vie
  this.healthMax = 10;
  this.health = this.healthMax;
  this.healthBar = new StatBar(rb);
  this.healthBar.setProgress(1);
  this.healthBar.offsetY = -rb.radius-20;

  // Drop
  this.drop = {};

  this.render = function (ctx) {
    ctx.fillStyle = this.color;
    // Dessine le polygone //
    ctx.beginPath();
    ctx.moveTo(rb.vertices[0].x, rb.vertices[0].y);
    ctx.strokeStyle = this.color;
    for (let i=1; i<rb.vertices.length; i++)
      ctx.lineTo(rb.vertices[i].x, rb.vertices[i].y);
    ctx.fill();
    ctx.closePath();
    // ***************** //
    // Bar de vie
    this.healthBar.setPosition(rb);
    this.healthBar.render(ctx);
    //////////////////////
    // Debug Vertices
    // ctx.fillStyle = "#40bfcf";
    // for (const vertex of rb.vertices) {
    //   ctx.fillRect(vertex.x-5, vertex.y-5, 10, 10);
    // }
    // ctx.fillStyle = "#b62e2e";
    // for (const i of this.shootIndex) {
    //   const vertex = rb.vertices[i];
    //   ctx.fillRect(vertex.x-5, vertex.y-5, 10, 10);
    // }
    //////////////////////
  };
  this.whenKilled = function () { };
  this.takeDamage = function (dmg) {
    this.health -= dmg;
    this.healthBar.setProgress(this.health/this.healthMax);
    if (this.health <= 0) {
      this.destroy();
      this.whenKilled();
    }
  };
  this.restoreHealth = function (hp) {
    this.health += hp;
    if (this.health > this.healthMax)
      this.health = this.healthMax;
    this.healthBar.setProgress(this.health/this.healthMax);
  };
  this.destroy = function () {
    new Particles(rb, 20, 3, this.color);
    for (const [drop, chance] of Object.entries(this.drop)) {
      if (chance===1 || Math.random() < chance) {
        game.drop(rb, eval(drop));
      }
    }
    game.remove("entities", this.tag, this);
  };
  this.foward = function (mult=1) {
    if (vel.isSmaller(this.maxSpeed)) {
      const dir = Vector.subVec(rb.vertices[0], rb);
      dir.mult( this.speed * mult / rb.radius);
      vel.addVec(dir);
    }
  };
  this.bounce = function () {
    if (game.outsideBoundaryX(rb.x + vel.x)) {
      vel.x = - vel.x * bounciness;
      new Particles(this.body, 3, 1, this.color);
    }
    if (game.outsideBoundaryY(rb.y + vel.y)) {
      vel.y = - vel.y * bounciness;
      new Particles(this.body, 3, 1, this.color);
    }
  };
  this.logic = () => { };
  this.applyFriction = function () {
    vel.x = applyFriction(vel.x, this.friction);
    vel.y = applyFriction(vel.y, this.friction);
    vel.angle = applyFriction(vel.angle, this.angleFriction);
  };
  this.update = function (ms) {
    this.logic(ms);
    this.applyFriction();
    this.bounce();
    rb.move(vel);
  };
}
