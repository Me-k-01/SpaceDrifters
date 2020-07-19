import { game } from "./game.ts";
import { GameObject } from "./gameobject.ts";

export class Engine {
  public fps: number;
  private tickLength:number;
  private isPaused: boolean = true;

  constructor(fps=60) {
    this.fps = fps;
    this.tickLength = 1000/fps;
  }
  update(ms: number) {
    // Executed approximatly 60 times per sec by default
    for (const tag in game.gameObjects) {
      game.gameObjects[tag].forEach((gameObject: GameObject) => {
        gameObject.update(ms);
      });
    }
    game.broadcast();
    // Level loading
    if (game.isLoading) {
      if (game.loadingStart + game.loadingDelay < ms) {
        game.load();
        game.isLoading = false;
      }
    }
  }

  private mainLoop(lastTick: number) {
    if (this.isPaused)
      return;

    if (performance.now()-lastTick > 5000) { // DeltaTime is over 5 sec
      console.log("Performance is trash");
    }

    while (lastTick+this.tickLength<=performance.now()) {
      lastTick+=this.tickLength
      this.update(lastTick);
    }
    setTimeout(()=>this.mainLoop(lastTick), this.tickLength);
  }
  run() {
    this.isPaused = false;
    this.mainLoop(Math.floor(performance.now()));
  }
  pause() {
    this.isPaused = true;
  }
}
