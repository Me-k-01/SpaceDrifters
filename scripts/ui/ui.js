class Lives {
  constructor() {
    this.w = 20;
    this.x = 50;
    this.y = canvas.height-50;
    this.color = "#53d748";
    this.quantity = 4;
  }
  getLastPos () {
    return {x: this.x + this.w *this.quantity *2+this.w/2, y: this.y+this.w/2};
  }
  render (ctx) {
    ctx.fillStyle = this.color;
    for (let i=0; i<this.quantity; i++) {
      ctx.fillRect(this.x+i*this.w*2, this.y, this.w, this.w);
    }
  }
  add (n=1) {
    this.quantity+=n;
    new Particles(this.getLastPos(), 5, 2, this.color);
  }
  sub (n=1) {
    this.quantity-=n;
    new Particles(this.getLastPos(), 5, 2, this.color);
  }
}

/////////////////////////////////////

function dispModal(i=0) {
  const popup = document.getElementsByClassName("modal-bg")[i];
  popup.style.visibility = 'visible';
}
function closeModal(i=0) {
  const popup = document.getElementsByClassName("modal-bg")[i];
  popup.style.visibility = 'hidden';
}
function joinGame() {

  sessionStorage.setItem('ip', document.getElementById('ip').value);
}
