import { ProgressBar } from "@pixi/ui";
import { animate } from "motion";
import type { ObjectTarget } from "motion/react";
import { Container, Sprite, Texture } from "pixi.js";

/** Screen shown while loading assets */
export class LoadScreen extends Container {
  /** Assets bundles required by this screen */
  public static assetBundles = ["preload"];
  /** The PixiJS logo */
  private pixiLogo: Sprite;
  /** Progress Bar */
  private progressBar: ProgressBar;

  constructor() {
    super();

    this.progressBar = new ProgressBar({
      bg: "icon-pause.png",
      fill: "icon-settings.png",
      progress: 0,
    });

    this.progressBar.scale.set(2);

    this.addChild(this.progressBar);

    this.pixiLogo = new Sprite({
      texture: Texture.from("logo.svg"),
      anchor: 0.5,
      scale: 0.2,
    });
    this.addChild(this.pixiLogo);
  }

  public onLoad(progress: number) {
    this.progressBar.progress = progress;
  }

  /** Resize the screen, fired whenever window size changes  */
  public resize(width: number, height: number) {
    this.pixiLogo.position.set(width * 0.5, height * 0.5);
    this.progressBar.position.set(width * 0.5, height * 0.5);
  }

  /** Show screen with animations */
  public async show() {
    this.alpha = 1;
  }

  /** Hide screen with animations */
  public async hide() {
    await animate(this, { alpha: 0 } as ObjectTarget<this>, {
      duration: 0.3,
      ease: "linear",
      delay: 1,
    });
  }
}
