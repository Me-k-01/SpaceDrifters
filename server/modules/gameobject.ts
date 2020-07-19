import { Vector, Vertex } from "./vector.ts";
import { game , GameObjectInfo } from "./game.ts"
import { Controller, User } from "./socket.ts"

export enum Tags {
    enemy,
    player,
    item,
    bullet,
}
export type Tag = keyof typeof Tags;

export class Polygon {
  public vertices: Array<Vertex>;
  public radius: number;
  public sqrRadius: number;
  private angle = 0;
  private theta: number;

  constructor(verticesNumber=3, radius=30) {
    this.radius = radius;
    this.sqrRadius = this.radius * this.radius; // For optimisation on distance calculation
    this.theta = Math.PI*2/verticesNumber;
    this.vertices = new Array<Vertex>(verticesNumber);
    for (let i=0; i < verticesNumber; i++) {
      this.vertices[i]= {
        x: this.radius * Math.cos(this.angle + this.theta*i),
        y: this.radius * Math.cos(this.angle + this.theta*i)
      };
    }
  }
  rotate(angle: number) {
    this.angle = angle;
    for (let i=0; i<this.vertices.length; i++) {
      this.vertices[i].x = this.radius * Math.cos(this.angle + this.theta*i);
      this.vertices[i].y = this.radius * Math.sin(this.angle + this.theta*i);
    }
  }
  contains(polygonVector: Vertex, vertex: Vertex): boolean {
    // Test si un point donné est à l'intérieur d'un polygone.
    let prevSide: "LEFT" | "RIGHT" | undefined;
    const vertNum = this.vertices.length;
    for (let i=0; i<vertNum; i++) {
      const a = Vector.add(polygonVector, this.vertices[i]);
      const b = Vector.add(polygonVector, this.vertices[(i+1)%vertNum]);

      const affineSegment = Vector.sub(b, a);
      const affinePoint = Vector.sub(vertex, a);

      const currSide = this.getSide(affineSegment, affinePoint);
      if (! currSide)
        return false; //outside or over an edge
      if (! prevSide) //first segment
        prevSide = currSide;
      else if (prevSide !== currSide)
        return false;
    }
    return true;
  }

  private getSide(a: Vertex, b:Vertex): "LEFT" | "RIGHT" | undefined {
    // Cross product
    const x = (a.x*b.y)-(a.y*b.x);
    if (x < 0)
      return "LEFT";
    if (x > 0)
      return "RIGHT";
  }

}
export class GameObject {
  public tag: Tag;

  public position: Vector;
  public velocity = new Vector();
  public speed = new Vector(0.08, 0.08, 0.0045);
  public friction = new Vector(0.008, 0.008, 0.0017);

  public polygon:Polygon;
  public color:string;

  constructor(position: Vector, tag: Tag, polygon=new Polygon(), color="#4acaf4") {
    this.position = position;
    this.tag = tag;
    this.polygon = polygon;
    this.color = color;
  }

  // Called each update
  logic(_: number) {}
  update(ms: number) {
    this.velocity.applyFriction(this.friction);
    this.bounce(1/3);
    this.move();
    this.logic(ms);
  }
  move() {
    if (! this.velocity.isNull()) { // if is moving
      this.position.add(this.velocity);
      if (this.velocity.angle !== 0)
        this.polygon.rotate(this.position.angle);
      game.move(this);
    }
  }
  // Util
  nextCoord() {
    return {x: this.position.x+this.velocity.x, y: this.position.y+this.velocity.y};
  }
  bounce(power=1) {
    // Bounce against the map border limit
    let hasBounced = false;
    const {x, y} = this.nextCoord();
    if (game.outsideBoundsX(x)) {
      this.velocity.x = - this.velocity.x * power;
      hasBounced = true;
    }
    if (game.outsideBoundsY(y)) {
      this.velocity.y = - this.velocity.y * power;
      hasBounced = true;
    }
    if (hasBounced) {
      // TODO: game.Particle
    }
    return hasBounced;
  }
  // Requiered in game events
  destroy() {
    game.remove(this);
  }
  info(i: number): GameObjectInfo {
    /* create a Json friendly data packet of every info necessary for
      the replication of the current GameObject for the client.*/
    return {
      i: i,
      tag: this.tag,
      position: this.position,
      velocity: this.velocity,
      friction: this.friction,
      radius: this.polygon.radius,
      vertNumber: this.polygon.vertices.length,
      color: this.color,
    };
  }
}
//////////////////////////////////////////////////////////////////////
// Bullets
export class Bullet extends GameObject {
  private whoDamage: Tag;
  private damage: number;
  private bounceState: number;
  private bounceMax: number;
  private bouncePower=1/2;

  constructor( position: Vector, velocity: Vector, owner: Entity ) {
    super(position, "bullet", new Polygon(4, 5), owner.color);
    if (owner.tag === "player")
      this.whoDamage = "enemy";
    else
      this.whoDamage = "player";
    this.damage = owner.damage;
    this.bounceState = 0;
    this.bounceMax = owner.bulletBounce;
    this.velocity = velocity;
    this.friction = new Vector() // No friction for bullets
  }
  update(ms: number) {
    // No need for friction for bullets
    // We do the bouncing ourself to know if it has bounced against the map border
    this.move();
    this.logic(ms);
  }
  logic(_: number) {
    if (this.bounce(this.bouncePower)) {
      this.bounceState++;
      if (this.bounceState > this.bounceMax) {
        this.destroy();
        return;
      }
    }
    const closestOutput = game.getClosest(this.position, this.whoDamage);
    if (! closestOutput ) return;
    const {gameObject: entity, sqrDist} = closestOutput;
    if (sqrDist<entity.polygon.sqrRadius) {
      if (entity.polygon.contains(entity.position, this.position)) {
        entity.getDamaged(this.damage);
        this.destroy();
        return;
      }
    }
  }
}
export class Grenade extends GameObject {
  private whoDamage: Tag;
  private owner: Entity;
  private bulletSpeed = 8;

  constructor( position: Vector, velocity: Vector, owner: Entity ) {
    super(position, "bullet", new Polygon(4, 10), owner.color);
    if (owner.tag === "player")
      this.whoDamage = "enemy";
    else
      this.whoDamage = "player";
    this.owner = owner;
    this.velocity = velocity;
  }
  update(ms: number) {
    this.velocity.applyFriction(this.friction);
    // We do the bouncing ourself to know if it has bounced against the map border
    this.move();
    this.logic(ms);
  }
  explode() {
    this.polygon.vertices.forEach(vert => {
      game.add(new Bullet(
        new Vector(
          this.position.x+vert.x,
          this.position.y+vert.y,
          this.position.angle
        ),
        new Vector(
          this.velocity.x + vert.x/this.polygon.radius * this.bulletSpeed,
          this.velocity.y + vert.y/this.polygon.radius * this.bulletSpeed,
        ), this.owner
      ));
    });
    this.destroy();
  }
  logic(_: number) {
    if (this.bounce() || this.velocity.isNull()) {
      this.explode();
      return;
    }
    const closestOutput = game.getClosest(this.position, this.whoDamage);
    if (! closestOutput ) return;
    const {gameObject: entity, sqrDist} = closestOutput;
    if (sqrDist<entity.polygon.sqrRadius) {
      if (entity.polygon.contains(entity.position, this.position)) {
        this.explode();
        return;
      }
    }
  }
}
//////////////////////////////////////////////////////////////////////
// Items
export class Drop {
  public item: any;
  public quantity: number;
  public probability: number;
  constructor(item: any, quantity: number, probability: number) {
    this.item = item;
    this.quantity = quantity;
    this.probability = probability;
  }
}
export class Item extends GameObject {
  public isStorable = true;
  public stackCap = 3;
  // For the drop table of the player when picked.
  public chance = 1;
  private areaRadius = 50; // spawning area
  // Life Time
  public lifeTime = 50000; // In ms
  public birthTime: number;

  constructor(position: Vector, velocity = new Vector(), polygon=new Polygon(), color="#d1cd6b") {
    super(position, "item", polygon, color);
    this.position = position;
    this.velocity = velocity;
    this.speed = new Vector(4, 4, 0.2);
    this.friction.angle = 0;
    this.position.x += Math.trunc(Math.random()*this.areaRadius-this.areaRadius/2);
    this.position.y += Math.trunc(Math.random()*this.areaRadius-this.areaRadius/2);
    this.position.angle += Math.trunc(Math.random()*Math.PI);
    this.velocity.x += Math.trunc(Math.random()*this.speed.x-this.speed.x/2);
    this.velocity.y += Math.trunc(Math.random()*this.speed.y-this.speed.y/2);
    this.velocity.angle += Math.trunc(Math.random()*this.speed.angle - this.speed.angle/2);
    this.birthTime = performance.now();
  }
  effect(_: Player) {
  }
  logic(ms: number) {
    // Lifetime of the item
    if (this.birthTime + this.lifeTime < ms) {
      this.destroy();
      return;
    }
  }
  // Move toward an entity
  moveTowards(entity: Entity, dist: number) {
    const {x, y} = entity.nextCoord(); // We anticipate the entity movements
    this.velocity.y += (y-this.position.y)/dist * this.speed.y;
    this.velocity.x += (x-this.position.x)/dist * this.speed.x;
  }
}
export class HealthPack extends Item {
  private healthAmount = Math.trunc(Math.random()*3+1);

  constructor(position: Vector, velocity=new Vector(), healthAmount = Math.trunc(Math.random()*3+1)) {
    super(position, velocity, new Polygon(3, healthAmount*5), "#53d748");
    this.healthAmount = healthAmount;
    this.isStorable = false;
  }
  effect(player: Player) {
    player.getDamaged(-this.healthAmount);
  }
}
export class Life extends Item {
  private lifeAmount: number;

  constructor(position: Vector, velocity=new Vector(), lifeAmount = 1) {
    super(position, velocity, new Polygon(4, 20), "#53d748");
    this.lifeAmount = lifeAmount;
    this.isStorable = false;
  }
  effect(_: Player) {
    game.addLife(this.lifeAmount);
  }
}
export class Magnet extends Item {
  private grabRadius: number;

  constructor(position: Vector, velocity=new Vector(), grabRadius=100) {
    super(position, velocity, new Polygon(4, 5), "#3c77fa");
    this.grabRadius = grabRadius;
  }
  effect(player: Player) {
    player.grabRadius += this.grabRadius;
    player.sqrGrabRadius = player.grabRadius*player.grabRadius;
  }
  reverse(player: Player) {
    player.grabRadius -= this.grabRadius;
    player.sqrGrabRadius = player.grabRadius*player.grabRadius;
  }
}
export class Gun extends Item {
  private gunAmount: number;

  constructor(position: Vector, velocity=new Vector(), gunAmount=2) {
    super(position, velocity, new Polygon(4, 10), "#14d3d9");
    this.gunAmount = gunAmount;
    this.stackCap = 1;
  }
  effect(player: Player) {
    player.gunAmount += this.gunAmount;
  }
  reverse(player: Player) {
    player.gunAmount -= this.gunAmount;
  }
}
export class BulletGrenade extends Item {
  constructor(position: Vector, velocity=new Vector() ) {
    super(position, velocity, new Polygon(4, 10), "#e49436");
    this.stackCap = 1;
  }
  effect(player: Player) {
    player.BulletType = Grenade;
    player.bulletDelay += 400;
    player.bulletSpeed -= 6;
  }
  reverse(player: Player) {
    player.BulletType = Bullet;
    player.bulletDelay -= 400;
    player.bulletSpeed += 6;
  }
}
export class SpeedTrigger extends Item {
  private bulletDelay: number;

  constructor(position: Vector, velocity=new Vector(), bulletDelay=100) {
    super(position, velocity, new Polygon(4, 10), "#f63cfa");
    this.bulletDelay = bulletDelay;
  }
  effect(player: Player) {
    player.bulletDelay -= this.bulletDelay;
  }
}
//////////////////////////////////////////////////////////////////////
// Entities
export class Entity extends GameObject {
  // Status
  public health = 10;
  public healthMax = 10;
  // Inventory
  public inventory = new Array<Drop>();
  // Shoot
  public gunAmount = 1; // Number of vertices that can shoot (use odd number)
  public damage = 1;
  public bulletDelay = 670; // 670
  public bulletSpeed = 8;
  public bulletBounce = 3;
  public lastBulletTime: number;
  public name: string;
  public speedMax = new Vector(20, 20, 0.2);
  public BulletType: any = Bullet;

  constructor(position: Vector, tag: Tag, polygon=new Polygon(), color="#4acaf4") {
    super(position, tag, polygon, color);
    this.lastBulletTime = performance.now();
    this.name = this.tag;
  }
  // Util
  getDamaged(dmgAmount: number) {
    this.health -= dmgAmount;
    if (this.health <= 0) {
      this.destroy();
      this.onKilled();
    } else {
      game.healthChange(this);
    }
  }
  onKilled() { }
  destroy() {
    for (const drop of this.inventory) {
      for (let i=0; i<drop.quantity; i++) {
        if (drop.probability > Math.random()) {
          const item = new drop.item(Vector.clone(this.position), Vector.clone(this.velocity));
          game.add(item);
        }
      }
    }
    game.remove(this);
  }
  shoot() {
    game.add(new this.BulletType(
      new Vector(
        this.position.x+this.polygon.vertices[0].x,
        this.position.y+this.polygon.vertices[0].y,
        this.position.angle
      ),
      new Vector(
        this.velocity.x + this.polygon.vertices[0].x/this.polygon.radius * this.bulletSpeed,
        this.velocity.y + this.polygon.vertices[0].y/this.polygon.radius * this.bulletSpeed,
        Math.random()*0.5-0.25
      ), this
    ));
    for (let i=1; i<(this.gunAmount+1)/2; i++) {
      game.add(new this.BulletType(
        new Vector(
          this.position.x+this.polygon.vertices[i].x,
          this.position.y+this.polygon.vertices[i].y,
          this.position.angle
        ),
        new Vector(
          this.velocity.x + this.polygon.vertices[i].x/this.polygon.radius * this.bulletSpeed,
          this.velocity.y + this.polygon.vertices[i].y/this.polygon.radius * this.bulletSpeed,
          Math.random()*0.5-0.25
        ), this
      ));
      const j = this.polygon.vertices.length-i;
      game.add(new this.BulletType(
        new Vector(
          this.position.x+this.polygon.vertices[j].x,
          this.position.y+this.polygon.vertices[j].y,
          this.position.angle
        ),
        new Vector(
          this.velocity.x + this.polygon.vertices[j].x/this.polygon.radius * this.bulletSpeed,
          this.velocity.y + this.polygon.vertices[j].y/this.polygon.radius * this.bulletSpeed,
        ), this
      ));
    }
  }
  shootIfPossible(ms: number) {
    if (this.lastBulletTime + this.bulletDelay < ms) {
      this.shoot();
      this.lastBulletTime = ms;
    }
  }
  foward(mult=1) {
    if (mult != 0 ) {
      if (this.velocity.sqrLength() < this.speedMax.sqrLength() ) {
        this.velocity.add(new Vector(
          this.polygon.vertices[0].x / this.polygon.radius * this.speed.x * mult, // Normalised dir facing * speed * true dir
          this.polygon.vertices[0].y / this.polygon.radius * this.speed.y * mult
        ));
      }
    }
  }

  info(i: number): GameObjectInfo {
    // Emit info of the current GameObject for the websocket.
    return {
      i: i,
      tag: this.tag,
      position: this.position,
      velocity: this.velocity,
      friction: this.friction,
      radius: this.polygon.radius,
      vertNumber: this.polygon.vertices.length,
      color: this.color,
      health: this.health/this.healthMax,
      name: this.name,
    };
  }
}

export class Player extends Entity {
  public grabRadius = 170;
  public sqrGrabRadius = 170*170;
  private controller: Controller;
  private user: User;

  constructor (position: Vector, user: User) {
    super(position, "player", new Polygon(), user.color);
    this.controller = user.controller;
    this.name = user.name;
    this.user = user;
    this.user.isPlaying = true;
  }
  onKilled() { // When the player is killed event
    this.user.isPlaying = false;
  }
  tryGrabbing() {
    // Try to grab the closest item.
    const closestItem = game.getClosest(this.position, "item");
    if (! closestItem )
      return
    const item = closestItem.gameObject;
    if (closestItem.sqrDist > this.sqrGrabRadius)
      return;
    // If the center of the item collide with the player
    if (this.polygon.contains(this.position, item.position)) {
      if (item.isStorable) {
        let i = this.inventory.findIndex((drop: Drop) => drop.item.name === item.constructor.name );
        if (i >= 0) { // If the player already has the item
          if (this.inventory[i].quantity >= item.stackCap) // The player can't take more than the item quantity cap
            return;
          this.inventory[i].quantity++;
        } else { // Else we add it to the array
          this.inventory.push(new Drop(item.constructor, 1, item.chance));
        }
      }
      // Activate the item
      item.effect(this);
      item.destroy();
    } else { // Make the item go towards the player if there is no collision.
      item.moveTowards(this, Math.sqrt(closestItem.sqrDist))
    }
  }
  tryDropping() {
    // Drop the last item the player gathered if he has at least one.
    const lastItemIndex = this.inventory.length-1;
    // If the player has no item in its inventoty
    if (lastItemIndex < 0)
      return;
    const drop = this.inventory[lastItemIndex];
    const item = new drop.item(Vector.clone(this.position), Vector.clone(this.velocity));
    item.reverse(this); // Do the reverse effect of the item to the player
    drop.quantity--;
    if (drop.quantity === 0)
      this.inventory.pop();
    game.add(item);
  }
  logic(ms: number) {
    // Move
    if (Math.abs(this.velocity.angle) < this.speedMax.angle  // If we are not exeding max speed
      || this.controller.right * this.velocity.angle < 0) // or it's to go the opposite direction
      this.velocity.angle += this.speed.angle * this.controller.right;
    this.foward(this.controller.up);
    // Shoot
    if (this.controller.shoot)
      this.shootIfPossible(ms);
    // Grab or drop items
    if (this.controller.pickup === 1) // If the user wants to pickup
      this.tryGrabbing();
    else if (this.controller.pickup === -1)  // If the user wants to drop
      this.tryDropping();
  }
}

export namespace Enemy {
  export class Planer extends Entity {
    // Target
    public target: GameObject|undefined;
    public targetAngle = 0;
    public epsAimAngle = 0.19;
    public targetDelay = 1000;
    public lastSearchTime = 0;

    constructor (position: Vector) {
      super(position, "enemy" ,new Polygon(), "#b82929");
      this.bulletDelay = 2000;
      this.inventory = [
        new Drop(HealthPack, 4, 0.07),
        new Drop(Life, 1, 0.01),
        new Drop(Magnet, 1, 0.05),
        new Drop(Gun, 1, 0.02),
        new Drop(BulletGrenade, 6, 0.5),
        new Drop(SpeedTrigger, 1, 0.02),
      ]
    }
    // Update
    private aimTowards(targPos: Vector) {
      // Aim toward target
      let targAngle = Math.atan2(
        targPos.y-this.position.y,
        targPos.x-this.position.x
      );
      if (Math.abs(this.position.angle-targAngle) < this.epsAimAngle)   // au boup d'un certain angle pas besoin de reaim
        targAngle = this.position.angle;
      return targAngle;
    };
    private moveAngle() {
      // Change angular velocity towards the target angle.
      const currAngle = this.position.angle,
        vel = this.velocity;
      if (currAngle < this.targetAngle && vel.angle < this.speedMax.angle)
        vel.angle += this.speed.angle;
      else if (currAngle > this.targetAngle && - vel.angle < this.speedMax.angle)
        vel.angle -= this.speed.angle;
    }
    logic(ms: number) {
      if (this.lastSearchTime+this.targetDelay < ms) {
        this.search("player");
        this.lastSearchTime = ms;
      }
      if (this.target)
        this.targetAngle = this.aimTowards(this.target.position);
      else {
        // TODO: enemy random pattern
      }
      this.moveAngle();
      // If the enemy has found his target angle, we take the shot
      if (this.position.angle === this.targetAngle )
        this.shootIfPossible(ms);

      this.foward();
    }
    onKilled() {
      if (game.gameObjects.enemy.length === 0)
        game.nextLevel();
      }
    // Search the closest gameObject with the tag
    search(tag: Tag) {
      const closestOutput = game.getClosest(this.position, tag);
      if (! closestOutput) {
        this.target = undefined;
        return;
      }
      this.target = closestOutput.gameObject;
    }
  }
}
