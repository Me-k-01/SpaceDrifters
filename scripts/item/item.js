function Item(pos, color="#d7b128", w=10, vertNum=4) {
  // Body
  this.body = new RegBody(pos.x+ Math.random()*w*4-w*2, pos.y+Math.random()*w*4-w*2, vertNum, w);
  const rb = this.body;
  // Velocity
  this.velocity = new Vector();
  this.velocity.angle = 0.05;
  const vel = this.velocity;
  this.speed = 1;
  this.color = color;
  this.tag = "upgrade";

  const bounciness = 1/2;

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
  };
  this.moveToward = (entity, dist) => {
    vel.x += (entity.body.x-rb.x) * this.speed/dist;
    vel.y += (entity.body.y-rb.y) * this.speed/dist;
  };
  this.destroy = function () {
    game.remove("items", this.tag, this);
  };
  this.effect = (entity) => { };
  this.addToDrop = function (player) {
    player.drop[this.constructor.name] = 1;
  };
  this.update = function (ms) {
    const {entity, distance} = rb.getClosest("player");
    if (entity && distance < entity.grabRadius && ! entity.drop[this.constructor.name]) {
      if (pointInsidePoly(rb, entity.body.vertices)) {
        this.effect(entity);
        new Particles(rb, 10, 2, color=this.color);
        this.destroy();
      } else
        this.moveToward(entity, distance);
    }
    // Rebond
    if (game.outsideBoundaryX(rb.x + vel.x)){
      vel.x = - (vel.x)*bounciness;
    }
    if (game.outsideBoundaryY(rb.y + vel.y)){
      vel.y = - (vel.y)*bounciness;
    }
    rb.move(vel);
  };

}
function Upgrade (pos, prop, val,  color="#fae634") {
  Item.call(this, pos, color=color);
  this.tag = "upgrade";
  this.property = prop;
  this.value = val;
  this.effect = function (player) {
    player[this.property] += this.value;
    this.addToDrop(player);
  };
}
function FixedUpgrade (pos, prop, val,  color="#fae634") {
  // Upgrade applicable une seul fois
  Item.call(this, pos, color=color);
  this.tag = "upgrade";
  this.property = prop;
  this.value = val;
  this.effect = function (player) {
    player[this.property] = this.value;
    this.addToDrop(player);
  };
}
