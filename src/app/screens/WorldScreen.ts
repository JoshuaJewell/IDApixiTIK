// TypeScript wrapper for WorldScreen (ReScript)
// Adapts the ReScript module to work with the TypeScript Navigation system

import type { Ticker } from "pixi.js";
import { Container } from "pixi.js";
import { constructor as worldScreenConstructor } from "./WorldScreen.res.mjs";

// Type for the screen instance returned by the ReScript make function
interface ReScriptScreen {
  container: Container;
  prepare?: () => void;
  show?: () => Promise<void>;
  hide?: () => Promise<void>;
  pause?: () => Promise<void>;
  resume?: () => Promise<void>;
  reset?: () => void;
  update?: (ticker: Ticker) => void;
  resize?: (width: number, height: number) => void;
  blur?: () => void;
  focus?: () => void;
  onLoad?: (progress: number) => void;
}

/**
 * WorldScreen adapter class that bridges the ReScript module with TypeScript Navigation.
 * The TypeScript Navigation expects a class constructor (new ctor()),
 * while ReScript modules export a { make, assetBundles } structure.
 */
export class WorldScreen extends Container {
  /** Assets bundles required by this screen */
  public static assetBundles = worldScreenConstructor.assetBundles;

  private screen: ReScriptScreen;

  constructor() {
    super();
    // Create the ReScript screen instance
    this.screen = worldScreenConstructor.make();
    // Add the screen's container as a child
    this.addChild(this.screen.container);
  }

  public prepare(): void {
    this.screen.prepare?.();
  }

  public async show(): Promise<void> {
    await this.screen.show?.();
  }

  public async hide(): Promise<void> {
    await this.screen.hide?.();
  }

  public async pause(): Promise<void> {
    await this.screen.pause?.();
  }

  public async resume(): Promise<void> {
    await this.screen.resume?.();
  }

  public reset(): void {
    this.screen.reset?.();
  }

  public update(ticker: Ticker): void {
    this.screen.update?.(ticker);
  }

  public resize(width: number, height: number): void {
    this.screen.resize?.(width, height);
  }

  public blur(): void {
    this.screen.blur?.();
  }

  public focus(): void {
    this.screen.focus?.();
  }

  public onLoad(progress: number): void {
    this.screen.onLoad?.(progress);
  }
}
