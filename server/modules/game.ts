import { Vector, Vertex } from "./vector.ts";
import { Tag, Tags, GameObject, Enemy, Entity, Player } from "./gameobject.ts";
import { broadcast, User } from "./socket.ts";
import { Engine } from "./engine.ts";
import { config } from "../config.ts";

interface EnemyGroup {
  quantity: number,
  type?: string,
  property?: Object,
}
interface Level {
  enemies: Array<EnemyGroup>,
}

export interface GameObjectInfo { // Data format to changes on a GameObject
  i: number,
  tag: Tag,
  position: Vector,
  velocity: Vector,
  friction: Vector,
  radius: number,
  vertNumber: number,
  color: string,
  name?: string,
  health?: number,
}
interface Dictionary<T> {
    [key: string]: T,
}
interface BroadcastData {
  create?: Array<GameObjectInfo>,
  move?: Array<{i: number, tag: Tag, position: Vector, velocity: Vector}>,
  health?: Array<{i: number, tag: Tag, health: number}>,
  destroy?: Array<{i: number, tag: Tag}>,
  lives?: number,
  // effect?: Array<EffectInfo>,
}

export class Game {
  public width = config.width;
  public height = config.height;
  // Gloabal Player details
  public spawnPoint = config.spawnPoint;
  public livesLeft = 4;
  // Level loading
  public loadingStart=0;
  public isLoading=false;
  public loadingDelay = 5000;

  public gameObjects: Dictionary<Array<GameObject>> = {};
  public level: Level = {enemies: []}; // Current level reference loaded by the game.
  private levels: Array<Level>;
  private levelIndex = -1;

  public dataToBroadcast: BroadcastData = {};

  constructor(levels = new Array<Level>()) {
    for (const tag in Tags) {
      if (isNaN(Number(tag))) // Filter to only get the string values as keys
        this.gameObjects[tag] = new Array<GameObject>();
    }
    this.levels = levels;
    this.nextLevel();
  }
  // Level
  nextLevel() {
    this.levelIndex++;
    if (this.levelIndex < this.levels.length) {
      this.level = this.levels[this.levelIndex];
      this.loadingStart = performance.now();
      this.isLoading = true;
    }
  }
  load() {
    // Spawn enemies
    for (const enemy of this.level.enemies) {
      const {quantity, type, property} = enemy;
      for (let i=0; i<quantity; i++) {
        if (type) {
          this.spawn(this.rdmPosition(), Enemy[type as keyof typeof Enemy], property)
        }
      }
    }
  }
  // gameobject methods
  outsideBoundsX(x:number):boolean  {
    return ( 0>x || x>this.width);
  }
  outsideBoundsY(y:number):boolean {
    return ( 0>y || y>this.height);
  }
  outsideBounds(vertex: Vertex):boolean {
    return this.outsideBoundsX(vertex.x) || this.outsideBoundsY(vertex.y);
  }
  addLife(quantity=1) {
    this.livesLeft += quantity;
    this.dataToBroadcast.lives = this.livesLeft;
  }
  respawn(user: User) {
    // Respawn a user by creating a new player avatar.
    if (this.livesLeft <= 0) return;
    this.addLife(-1);
    const player = new Player(new Vector(this.spawnPoint.x, this.spawnPoint.y), user);
    this.add(player);
  }
  spawn(position: Vector, _Entity: any, property: Dictionary<any>={}) {
    const entity = new _Entity(position);
    type p = keyof typeof entity;
    for (const [k, v] of Object.entries(property)) {
      (<any>entity)[k as p] = v;
    }
    this.add(entity);
  }
  rdmPosition() {
    // Return a random position
    return new Vector(Math.trunc(Math.random()*this.width), Math.trunc(Math.random()*this.height));
  }

  getClosest(position: Vector, tag: Tag): any {
    let closestObj: GameObject;
    let smallestSqrDist = Infinity;
    this.gameObjects[tag].forEach((gameObj: GameObject) => {
      const dif = new Vector(
        position.x-gameObj.position.x,
        position.y-gameObj.position.y
      );
      const sqrDist = dif.sqrLength();
      if ( sqrDist < smallestSqrDist) {
        closestObj = gameObj;
        smallestSqrDist = sqrDist;
      }
    });
    if (closestObj!)
      return {gameObject: closestObj!, sqrDist: smallestSqrDist};
  }
  findIndexOf(gameObj: GameObject): number {
    return this.gameObjects[gameObj.tag].indexOf(gameObj);
  }
  // WebSocket data management
  add(gameObj: GameObject) {
    if (! this.dataToBroadcast.create)
      this.dataToBroadcast.create = [];
    this.dataToBroadcast.create.push(gameObj.info(this.gameObjects[gameObj.tag].length));
    this.gameObjects[gameObj.tag].push(gameObj);
  }
  remove(gameObj: GameObject) {
    if (! this.dataToBroadcast.destroy)
      this.dataToBroadcast.destroy = [];
    const i = this.findIndexOf(gameObj);
    this.gameObjects[gameObj.tag].splice(i, 1);
    this.dataToBroadcast.destroy.push({i, tag: gameObj.tag});
  }
  move(gameObj: GameObject) {
    if (! this.dataToBroadcast.move)
      this.dataToBroadcast.move = [];
    const i = this.findIndexOf(gameObj);
    this.dataToBroadcast.move.push({i, tag: gameObj.tag, position: gameObj.position, velocity: gameObj.velocity});
  }
  healthChange(entity: Entity) {
    if (! this.dataToBroadcast.health)
      this.dataToBroadcast.health = [];
    const i = this.findIndexOf(entity);
    this.dataToBroadcast.health.push({i, tag: entity.tag, health: entity.health/entity.healthMax});
  }
  broadcast() {
    // Send to every client the new state of every gameobject if it has changed
    const strData = JSON.stringify(this.dataToBroadcast);
    if (strData === "{}") return; // If there is nothing to send, we send nothing.
    broadcast(strData);
    this.dataToBroadcast = {};
  }
  getInfo(): Array<GameObjectInfo> {
    // Returns every game object info in the current world
    const dataInfo: Array<GameObjectInfo> = [];
    for (const tag in game.gameObjects) {
      this.gameObjects[tag].forEach((gameObj: GameObject, i: number) => {
        dataInfo.push(gameObj.info(i));
      });
    }
    return dataInfo;
  }
}
export const game = new Game(JSON.parse(await Deno.readTextFile(config.level)));
export const engine = new Engine(config.frameRate);
engine.run();
