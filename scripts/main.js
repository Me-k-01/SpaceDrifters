
const canvas = document.getElementById('main-canvas');
const ctx = canvas.getContext('2d');

canvas.width  = window.innerWidth -20;
canvas.height = window.innerHeight -20;

const ui = {
  lives: new Lives(),
  loading: new Loading()
};
game = new Game(ui);
game.addClient("host", keys, "#34dcfa");
game.changeLevelMap(levels);
game.run();
