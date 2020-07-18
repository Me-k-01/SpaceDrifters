function Game(ui={}) {
  const self = this;
  self.fps = 60;

  let lastTick, lastRender;
  const tickLength = 1000 / self.fps; // self sets your simulation to run at 20Hz (50ms)
  let stopRunning = false;
  self.entities = {
    player: [],
    enemy: []
  };
  self.items = {
    bullet: [],
    upgrade: [],
  };
  self.effects = {
    particles: [],
  };
  self.ui = ui;
  let clients = {};
  self.init = function () {
    // Initialisation
    for (const type in self.entities) {
      for (const entity of self.entities[type]) {
        if (entity.init)
          entity.init();
      }
    }
    for (const type in self.items) {
      for (const item of self.items[type]) {
        if (item.init)
          item.init();
      }
    }

  };
  self.update = function (ms) {
    // Update est appellé 60 fois par seconde
    for (const type in self.entities) {
      for (const entity of self.entities[type]) {
        entity.update(ms);
      }
    }
    for (const type in self.items) {
      for (const item of self.items[type]) {
        item.update(ms);
      }
    }
    for (const type in self.effects) {
      for (const effect of self.effects[type]) {
        effect.update(ms);
      }
    }
    for (const element in self.ui) {
      if (self.ui[element].update)
        self.ui[element].update(ms);
    }
  };
  self.render = function (ms) {
    ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);
    for (const type in self.effects) {
      for (const effect of self.effects[type]) {
        effect.render(ctx);
      }
    }
    for (const type in self.entities) {
      for (const entity of self.entities[type]) {
        entity.render(ctx);
      }
    }
    for (const type in self.items) {
      for (const item of self.items[type]) {
        item.render(ctx);
      }
    }
    for (const element in self.ui) {
      self.ui[element].render(ctx);
    }
  };

  const mainLoop = function (tFrame) {
    if (stopRunning)
      return;
    window.requestAnimationFrame( mainLoop );

    let nextTick = lastTick + tickLength;
    let numTicks = 0; // Nombre de tick a effectuer dans l'update
    if (tFrame > nextTick) {
      const deltaTime = tFrame - lastTick;
      numTicks = Math.trunc( deltaTime / tickLength );
      if (numTicks > 100)  // Si numTicks est trop grands, la page a été en veille ou le jeu ram.
        console.log("The game was asleep");
    }
    for(var i=0; i < numTicks; i++) { // On réitére l'update pour chaque fois necessaire.
      lastTick += tickLength; // Le dernier tick devient l'actuel.
      self.update( lastTick );
    }
    self.render( tFrame );
    lastRender = tFrame;
  };
  self.run = function () {
    self.init();
    self.play();
  };
  self.play = () => {
    stopRunning = false;
    lastTick = performance.now();
    lastRender = lastTick;
    mainLoop(performance.now()); // Start the cycle
  };
  self.stop = () => {
    stopRunning = true;
  };
  // LEVEL MAP
  self.changeLevelMap = function (levelMap) {
    self.currLevel = 0;
    self.levelMap = levelMap;
    self.load();
  };
  self.loadLevel = function (i) {
    self.currLevel = i;
    self.load();
  };
  self.nextLevel = function () {
    self.currLevel++;
    let func;
    if (self.currLevel<self.levelMap.length)
      func = self.load;
    else
      func = () => self.spawn({quantity:self.currLevel});
    self.ui.loading.start(5000, func);
  };
  self.load = function () {
    const level = self.levelMap[self.currLevel];
    for (const args of level.enemy) {
      self.spawn(args);
    }
  };

  self.outsideBoundaryX = (x) => {
    return ( 0>x || x>canvas.width);
  };
  self.outsideBoundaryY = (y) => {
    return ( 0>y || y>canvas.height);
  };
  self.outsideBoundary = function (pos) {
    return self.outsideBoundaryX(pos.x) || self.outsideBoundaryY(pos.y);
  };
  //////////////////////////////
  self.addClient = function (id, controller, color="#34dcfa") {
    clients[id] = {
      controller: controller,
      color: color,
    };
  };
  self.drop = function (position, Item) {
    self.items.upgrade.push(new Item(position));
  };
  self.spawn = function ({quantity=1, Enemy=TriEnemy,  y=0, customProperty}) {
    const w = (canvas.width-50)/quantity;
    for (let i=0; i<quantity; i++) {
      self.entities.enemy.push(new Enemy(w/2 + w*i, y, customProperty));
    }
  };
  self.remove = function (obj, type, item) {
    const i = self[obj][type].indexOf(item);
    self[obj][type].remove(i);
  };
  self.noEnemy = function () {
    return (self.entities.enemy.length === 0);
  };
  self.newPlayer = function (id="host") {
    const client = clients[id];
    if (! client.isPlaying && self.ui.lives.quantity > 0 ) {
      self.ui.lives.sub(1);
      client.isPlaying = true;
      self.entities.player.push(new Player(canvas.width/2, canvas.height/2, client));
    }
  };
}
