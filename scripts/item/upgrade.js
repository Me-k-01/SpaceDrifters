
function Magnet (pos) {
  Upgrade.call(this, pos, "grabRadius", 400, "#3c77fa");
}
function ShootDelay (pos) {
  FixedUpgrade.call(this, pos, "shootDelay", 200, "#b603ff");
}
function ShootEverywhere (pos) {
  FixedUpgrade.call(this, pos, "shootIndex", [0, 1, 2], "#b603ff");
}
function HealthPack(pos) {
  const hp = Math.trunc(Math.random()*3+1);
  Item.call(this, pos, color="#53d748", 2+hp*2, 3);
  this.effect= (player) => {
    player.restoreHealth(hp);
  };
}
function Life(pos) {
  Item.call(this, pos, color="#53d748", 10);
  this.effect= () => {
    game.ui.lives.quantity++;
  };
}
