import { Container, Graphics, Text, TextStyle, Ticker } from "pixi.js";
import { animate } from "motion";
import { DeviceType, DEVICE_COLORS } from "../devices/types/DeviceTypes";
import { NetworkManager } from "../devices/NetworkManager";
import { DeviceWindow } from "../devices/common/DeviceWindow";

/**
 * Network Device Icon on the desktop
 */
class DeviceIcon extends Container {
  constructor(
    private networkManager: NetworkManager,
    private ipAddress: string
  ) {
    super();
    const device = networkManager.getDevice(ipAddress);
    if (!device) return;

    const info = device.getInfo();

    this.eventMode = 'static';
    this.cursor = 'pointer';

    // Device icon background
    const iconBg = new Graphics();
    iconBg.rect(0, 0, 80, 80).fill(DEVICE_COLORS[info.type]);
    iconBg.rect(2, 2, 76, 76).stroke({ width: 2, color: 0x000000 });
    this.addChild(iconBg);

    // Device type indicator
    this.createDeviceIcon(info.type, iconBg);

    // Security indicator
    const securityColor = {
      "OPEN": 0x00ff00,
      "WEAK": 0xffff00,
      "MEDIUM": 0xff9800,
      "STRONG": 0xff0000
    }[info.securityLevel];

    const securityDot = new Graphics();
    securityDot.circle(70, 10, 5).fill(securityColor);
    this.addChild(securityDot);

    // Device name label
    const nameText = new Text({
      text: info.name,
      style: { fontSize: 11, fill: 0xffffff, align: 'center', fontWeight: 'bold' as const }
    });
    nameText.anchor.set(0.5, 0);
    nameText.x = 40;
    nameText.y = 85;
    this.addChild(nameText);

    // IP Address
    const ipText = new Text({
      text: info.ipAddress,
      style: { fontSize: 9, fill: 0xaaaaaa, align: 'center' }
    });
    ipText.anchor.set(0.5, 0);
    ipText.x = 40;
    ipText.y = 100;
    this.addChild(ipText);

    // Click to open device
    this.on("pointertap", () => this.openDevice());
  }

  private createDeviceIcon(type: DeviceType, container: Graphics) {
    const indicator = new Graphics();

    switch(type) {
      case DeviceType.LAPTOP:
        indicator.rect(20, 30, 40, 25).fill(0xffffff);
        indicator.rect(30, 55, 20, 3).fill(0xffffff);
        break;
      case DeviceType.ROUTER:
        indicator.circle(40, 40, 15).fill(0xffffff);
        indicator.rect(38, 25, 4, 15).fill(0xffffff);
        break;
      case DeviceType.SERVER:
        indicator.rect(20, 25, 40, 8).fill(0xffffff);
        indicator.rect(20, 37, 40, 8).fill(0xffffff);
        indicator.rect(20, 49, 40, 8).fill(0xffffff);
        break;
      case DeviceType.IOT_CAMERA:
        indicator.circle(40, 35, 12).fill(0xffffff);
        indicator.rect(35, 47, 10, 8).fill(0xffffff);
        break;
      case DeviceType.TERMINAL:
        indicator.rect(15, 25, 50, 30).fill(0x000000);
        const termText = new Text({
          text: ">_",
          style: { fill: 0x00ff00, fontSize: 16 }
        });
        termText.x = 20;
        termText.y = 30;
        indicator.addChild(termText);
        break;
    }

    container.addChild(indicator);
  }

  private openDevice() {
    const device = this.networkManager.getDevice(this.ipAddress);
    if (!device) return;

    const window = device.openGUI() as DeviceWindow;
    if (this.parent) {
      this.parent.addChild(window);
    }
  }
}

/**
 * Network Desktop - Main hacking interface
 */
export class NetworkDesktop extends Container {
  public static assetBundles = ["desktop"];

  private desktopBg!: Graphics;
  private icons: DeviceIcon[] = [];
  private networkManager: NetworkManager;

  constructor() {
    super();
    this.sortableChildren = true;
    this.eventMode = 'static';
    this.interactiveChildren = true;
    // Enable hit testing across entire container for dragging
    this.hitArea = { contains: () => true } as any;

    this.networkManager = new NetworkManager();

    this.createDesktop();
    this.createDeviceIcons();
  }

  private createDesktop() {
    this.desktopBg = new Graphics();
    this.desktopBg.eventMode = 'static';
    this.addChild(this.desktopBg);
  }

  public resize(width: number, height: number) {
    this.desktopBg.clear();

    // Dark hacker-themed background
    this.desktopBg.rect(0, 0, width, height).fill({ color: 0x0a0a0a, alpha: 1 });

    // Grid pattern
    const gridGraphics = new Graphics();
    for (let x = 0; x < width; x += 50) {
      gridGraphics.moveTo(x, 0).lineTo(x, height).stroke({ width: 1, color: 0x1a1a1a, alpha: 0.3 });
    }
    for (let y = 0; y < height; y += 50) {
      gridGraphics.moveTo(0, y).lineTo(width, y).stroke({ width: 1, color: 0x1a1a1a, alpha: 0.3 });
    }
    this.desktopBg.addChild(gridGraphics);

    // Reposition icons
    this.icons.forEach((icon, i) => {
      icon.x = 50 + (i % 4) * 130;
      icon.y = 50 + Math.floor(i / 4) * 140;
    });
  }

  private createDeviceIcons() {
    const devices = this.networkManager.getAllDevices();

    devices.forEach((device) => {
      const info = device.getInfo();
      const icon = new DeviceIcon(this.networkManager, info.ipAddress);
      this.addChild(icon);
      this.icons.push(icon);
    });
  }

  async show(): Promise<void> {
    this.alpha = 0;
    await animate(this, { alpha: 1 } as any, { duration: 0.5, ease: "easeOut" });
  }

  async hide(): Promise<void> {
    await animate(this, { alpha: 0 } as any, { duration: 0.3 });
  }

  public update(_time: Ticker) {
    // Future: Update device statuses, etc.
  }
}
