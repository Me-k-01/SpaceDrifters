class Vector {
  constructor(x=0, y=0) {
    this.x = x;
    this.y = y;
  }
  addVec(vector) {
    this.x += vector.x;
    this.y += vector.y;
  }
  subVec(vector) {
    this.x -= vector.x;
    this.y -= vector.y;
  }
  add(number) {
    this.x += number;
    this.y += number;
  }
  mult(number) {
    this.x *= number;
    this.y *= number;
  }
  isSmaller(number) {
    return (Math.abs(this.x)+Math.abs(this.y) < number);
  }
  static addVec(vec1, vec2) {
    return new Vector(vec1.x+vec2.x, vec1.y+vec2.y);
  }
  static subVec(vec1, vec2) {
    return new Vector(vec1.x-vec2.x, vec1.y-vec2.y);
  }
}
const applyFriction = (vel, fric) => {
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
