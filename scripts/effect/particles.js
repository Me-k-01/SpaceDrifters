function Particle(x, y) {
  this.x = x;
  this.y = y;
  const w = 2;
  const speed = 4;
  const vel = {
    x: (Math.random()*2-1)*speed,
    y: (Math.random()*2-1)*speed
  };
  const friction = 0.05;
  this.render = ctx => {
    ctx.fillRect(this.x, this.y, w, w);
  };
  this.update = () => {
    vel.x = applyFriction(vel.x, friction);
    vel.y = applyFriction(vel.y, friction);

    this.x += vel.x;
    this.y += vel.y;
  };
}

function ParticleReverse(x, y) {

}

function Particles(positionCenter, quantity=10, duration=1, color="#d7b128", reverse=false) {
  this.x = positionCenter.x;
  this.y = positionCenter.y;

  // Ajout de l'effet
  game.effects.particles.push(this);

  this.array = []; // Liste de chacune des particules
  // Durée de vie
  const birthTime = performance.now();
  const lifeTime = duration*1000;

  for (let i=0; i<quantity; i++) {
    this.array[i] = new Particle(this.x, this.y);
  }

  this.render = ctx => {
    ctx.fillStyle = color;
    this.array.forEach(particle => particle.render(ctx));
  };
  this.update = ms => {
    this.array.forEach(particle => particle.update());
    // On detruit les particules une par une a chaque update.
    if (birthTime+lifeTime < ms) {
      this.array.shift();
      if (this.array.length === 0 )
        game.remove("effects", "particles", this);
    }
  };
}
