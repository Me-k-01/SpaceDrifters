function Polygon(verticesNumber=3, radius=50, angle=0) {
  const theta = Math.PI*2/verticesNumber;
  this.angle = angle;
  this.vertices = [];
  this.radius = radius;

  for (let i=0; i < verticesNumber; i++) {
    this.vertices[i] = {
      x: this.radius * Math.cos(angle + theta*i),
      y: this.radius * Math.sin(angle + theta*i)
    };
  }
  this.rotate = function (angle) {
    if (this.angle !== angle) {
      this.angle = angle;
      for (let i=0; i<this.vertices.length; i++) {
        this.vertices[i].x = this.radius * Math.cos(this.angle + theta*i);
        this.vertices[i].y = this.radius * Math.sin(this.angle + theta*i);
      }
    }
  };
}

function GameObject(position, velocity, friction, polygon, color) {
  this.color = color;
  this.position = position;
  this.velocity = velocity;

  this.setProp = function (name, health) { // Additional propert for entity
    if (typeof name === "string")
      this.name = name;
    if (! isNaN(health)) {
      this.healthBar = new StatBar(this.position);
      this.healthBar.setProgress(health);
      this.healthBar.yOffset = polygon.radius + 20;
    }
  };
  const applyFricAxis = (vel, fric) => {
    // Apply friction for one axe
    if (vel > 0) {
      vel -= fric;
      if (vel < fric)
        vel = 0;
    } else if (vel < 0) {
      vel += fric;
      if (-vel < fric)
        vel = 0;
    }
    return vel;
  };

  this.update = function (ms) {
    this.velocity.x = applyFricAxis(this.velocity.x, friction.x);
    this.velocity.y = applyFricAxis(this.velocity.y, friction.y);
    this.velocity.angle = applyFricAxis(this.velocity.angle, friction.angle);
    this.position.x += this.velocity.x;
    this.position.y += this.velocity.y;
    this.position.angle += this.velocity.angle;
  };

  this.render = function (ctx) {
    const {x, y} = this.position;
    ctx.fillStyle = this.color;
    // Dessine le polygone //
    ctx.beginPath();
    ctx.moveTo((x+polygon.vertices[0].x)*game.scale, (y+polygon.vertices[0].y)*game.scale);
    for (let i=1; i<polygon.vertices.length; i++) {
      ctx.lineTo((x+polygon.vertices[i].x)*game.scale, (y+polygon.vertices[i].y)*game.scale);
    }
    ctx.closePath();
    ctx.fill();

    if (this.name) // If it an entity
      ctx.fillRect((x+polygon.vertices[0].x-5)*game.scale, (y+polygon.vertices[0].y-5)*game.scale, 10*game.scale, 10*game.scale);

    if (this.healthBar && this.healthBar.isVisible) {
      this.healthBar.setPosition(this.position);
      this.healthBar.render(ctx);
    }
  };
  this.move = function (pos, vel) {
    this.position = pos;
    this.velocity = vel;
    polygon.rotate(pos.angle);
  };
  this.healthUpdate = function (proportion) {
    this.healthBar.setProgress(proportion);
  };
}
