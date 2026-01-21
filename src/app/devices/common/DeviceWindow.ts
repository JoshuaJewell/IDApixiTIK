import { Container, Graphics, Text, FederatedPointerEvent } from "pixi.js";

/**
 * Base draggable window for device interfaces
 */
export class DeviceWindow extends Container {
  protected titleBar: Graphics;
  protected content: Container;
  protected closeBtn: Graphics;
  private isDragging = false;
  private dragOffset = { x: 0, y: 0 };
  private onDragBound: (e: FederatedPointerEvent) => void;
  private onPointerUpBound: () => void;

  constructor(
    protected title: string,
    protected width: number,
    protected height: number,
    protected titleBarColor: number = 0x0078D4,
    protected backgroundColor: number = 0x1a1a1a
  ) {
    super();
    this.eventMode = 'static';
    this.zIndex = 10;
    this.x = 100 + Math.random() * 100;
    this.y = 100 + Math.random() * 50;

    this.onDragBound = this.onDrag.bind(this);
    this.onPointerUpBound = this.onPointerUp.bind(this);

    this.createWindow();
  }

  private createWindow() {
    // Window background
    const bg = new Graphics();
    bg.rect(0, 0, this.width, this.height)
      .fill(this.backgroundColor)
      .stroke({ width: 2, color: 0x000000 });
    this.addChild(bg);

    // Title bar
    this.titleBar = new Graphics();
    this.titleBar.rect(0, 0, this.width, 30).fill(this.titleBarColor);
    this.titleBar.eventMode = 'static';
    this.titleBar.cursor = 'grab';
    this.addChild(this.titleBar);

    // Title text
    const titleText = new Text({
      text: this.title,
      style: { fontSize: 12, fill: 0xffffff, fontFamily: 'monospace' }
    });
    titleText.x = 10;
    titleText.y = 8;
    this.titleBar.addChild(titleText);

    // Close button
    this.closeBtn = new Graphics();
    this.closeBtn.rect(this.width - 30, 5, 25, 20).fill(0xff0000);
    this.closeBtn.eventMode = 'static';
    this.closeBtn.cursor = 'pointer';

    const closeX = new Text({
      text: "X",
      style: { fontSize: 14, fill: 0xffffff, fontWeight: 'bold' }
    });
    closeX.x = this.width - 22;
    closeX.y = 7;
    this.closeBtn.addChild(closeX);

    this.closeBtn.on("pointertap", () => this.close());
    this.titleBar.addChild(this.closeBtn);

    // Content container
    this.content = new Container();
    this.content.y = 30;
    this.addChild(this.content);

    // Setup dragging
    this.titleBar.on("pointerdown", (e) => this.startDrag(e));
  }

  private startDrag(e: FederatedPointerEvent) {
    this.isDragging = true;
    this.titleBar.cursor = 'grabbing';
    this.dragOffset = {
      x: e.global.x - this.x,
      y: e.global.y - this.y
    };

    if (this.parent) {
      this.parent.on("pointermove", this.onDragBound);
      this.parent.on("pointerup", this.onPointerUpBound);
      this.parent.on("pointerupoutside", this.onPointerUpBound);
    }
  }

  private onDrag(e: FederatedPointerEvent) {
    if (!this.isDragging) return;
    this.x = e.global.x - this.dragOffset.x;
    this.y = e.global.y - this.dragOffset.y;
  }

  private onPointerUp() {
    this.isDragging = false;
    this.titleBar.cursor = 'grab';

    if (this.parent) {
      this.parent.off("pointermove", this.onDragBound);
      this.parent.off("pointerup", this.onPointerUpBound);
      this.parent.off("pointerupoutside", this.onPointerUpBound);
    }
  }

  public close() {
    if (this.parent) {
      this.parent.off("pointermove", this.onDragBound);
      this.parent.off("pointerup", this.onPointerUpBound);
      this.parent.off("pointerupoutside", this.onPointerUpBound);
    }
    this.destroy();
  }

  public getContent(): Container {
    return this.content;
  }
}
