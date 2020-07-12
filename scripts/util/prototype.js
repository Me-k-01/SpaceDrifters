
Object.defineProperty(Array.prototype, 'remove', {
  value (i) {this.splice(i, 1);},
  writable: false
});
