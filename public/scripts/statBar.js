function StatBar(coord, color="#53d748", w=100, h=10) {
  this.x = coord.x;
  this.y = coord.y;
  this.w = w;
  this.h = h;
  this.yOffset = 0;
  this.color = {
    main: color,
    background: "#333333"
  };
  this.progress = 0;
  this.isVisible = true;
  this.offsetY = 0;
  this.setPosition = function (coord) {
    this.x = coord.x;
    this.y = coord.y - this.yOffset;
  };

  this.setProgress = function (progress) {
    this.progress = progress;
  };

  this.render = function (ctx) {
    //if (this.progress ===1) return;
    ctx.fillStyle = this.color.background;
    ctx.fillRect((this.x-this.w/2)*game.scale, this.y*game.scale, this.w*game.scale, this.h*game.scale);
    ctx.fillStyle = this.color.main;
    ctx.fillRect((this.x-this.w/2)*game.scale, this.y*game.scale, this.w*this.progress*game.scale, this.h*game.scale);
  };
}

function Loading() {
  StatBar.call(this, {x: canvas.width/2, y:0}, "#e92f2f", canvas.width, 5);
  let funcToExecute;
  this.render = function (ctx) {
    ctx.fillStyle = this.color.main;
    ctx.fillRect(this.x-this.w/2, this.y+this.offsetY, this.w*this.progress, this.h);
  };
  this.start = function (ms, func=()=>{}) {
    this.timeAtStart = performance.now(); // Time of the begining of the loading
    this.delay = ms;
    funcToExecute = func;
  };
  this.update = function (ms) {
    if (funcToExecute) {
      if (this.timeAtStart+this.delay < ms) {
        funcToExecute();
        funcToExecute = null;
        this.delay = null;
        this.progress = 0;
      } else {
        this.progress = (ms-this.timeAtStart)/this.delay;
      }

    }
  };
}
