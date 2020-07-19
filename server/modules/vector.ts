
export interface Vertex {
  x: number,
  y: number,
}
export class Vector {
  public x: number;
  public y: number;
  public angle: number;

  static clone({x, y, angle}: {x: number, y:number, angle?: number}): Vector {
    if (angle === undefined)
      return new Vector(x, y);
    else
      return new Vector(x, y, angle);
  }

  static sub(a: Vertex, b: Vertex) {
    return {
      x: a.x-b.x,
      y: a.y-b.y
    };
  }
  static add(a: Vertex, b: Vertex) {
    return {
      x: a.x+b.x,
      y: a.y+b.y
    };
  }

  constructor(x=0, y=0, angle=0) {
    this.x = x;
    this.y = y;
    this.angle = angle;
  }
  add(vector:Vector) {
    this.x += vector.x;
    this.y += vector.y;
    this.angle += vector.angle;
    this.angle %= Math.PI*2;
  }
  isNull() {
    return (this.x === 0 && this.y === 0 && this.angle === 0)
  }
  sqrLength(): number {
    return this.x * this.x + this.y * this.y;
  }
  // Vector Math
  private applyFrictionAxis(vel: number, fric: number) {
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
  }
  applyFriction(fric: Vector) {
    // Apply friction for velocity "vectors"
    this.x = this.applyFrictionAxis(this.x, fric.x);
    this.y = this.applyFrictionAxis(this.y, fric.y);
    this.angle = this.applyFrictionAxis(this.angle, fric.angle);
  }
}
