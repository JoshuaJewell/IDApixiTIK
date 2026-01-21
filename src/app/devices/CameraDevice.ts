import { Container, Graphics, Text } from "pixi.js";
import { DeviceWindow } from "./common/DeviceWindow";
import { DeviceType, SecurityLevel, DeviceInfo, IDevice, DEVICE_COLORS } from "./types/DeviceTypes";

/**
 * IoT Camera Device
 */
export class CameraDevice implements IDevice {
  constructor(
    private name: string,
    private ipAddress: string,
    private securityLevel: SecurityLevel
  ) {}

  getInfo(): DeviceInfo {
    return {
      name: this.name,
      type: DeviceType.IOT_CAMERA,
      ipAddress: this.ipAddress,
      securityLevel: this.securityLevel
    };
  }

  openGUI(): DeviceWindow {
    const win = new DeviceWindow(
      `CAMERA - ${this.name} [${this.ipAddress}]`,
      500,
      400,
      DEVICE_COLORS[DeviceType.IOT_CAMERA],
      0x0a0a0a
    );

    this.createCameraInterface(win.getContent());
    return win;
  }

  private createCameraInterface(container: Container) {
    const headerStyle = { fontFamily: 'Arial', fontSize: 14, fill: 0xff0000, fontWeight: 'bold' as const };

    const header = new Text({ text: "● REC - LIVE FEED", style: headerStyle });
    header.x = 20;
    header.y = 15;
    container.addChild(header);

    // Camera feed display
    const feed = new Graphics();
    feed.rect(20, 50, 450, 240).fill(0x000000).stroke({ width: 2, color: 0x00ff00 });
    container.addChild(feed);

    // Crosshair
    feed.moveTo(243, 168).lineTo(247, 168).stroke({ width: 2, color: 0xff0000 });
    feed.moveTo(245, 166).lineTo(245, 170).stroke({ width: 2, color: 0xff0000 });

    // Timestamp overlay
    const timestamp = new Text({
      text: `${new Date().toLocaleString()}`,
      style: { fontSize: 10, fill: 0x00ff00, fontFamily: 'monospace' }
    });
    timestamp.x = 30;
    timestamp.y = 60;
    container.addChild(timestamp);

    // Motion detection status
    const status = new Text({
      text: "MOTION: DETECTED",
      style: { fontSize: 10, fill: 0xff0000, fontFamily: 'monospace' }
    });
    status.x = 30;
    status.y = 270;
    container.addChild(status);

    // Control buttons
    const buttons = [
      { label: "STOP REC", color: 0xff0000, action: () => console.log("Stop recording") },
      { label: "LOOP FEED", color: 0xffaa00, action: () => console.log("Loop feed") },
      { label: "DOWNLOAD", color: 0x0088ff, action: () => console.log("Download footage") },
      { label: "DISABLE", color: 0x666666, action: () => console.log("Disable camera") }
    ];

    let btnX = 20;
    const btnY = 310;

    buttons.forEach(btn => {
      const btnGraphic = new Graphics();
      btnGraphic.rect(btnX, btnY, 100, 30).fill(btn.color).stroke({ width: 1, color: 0x000000 });
      btnGraphic.eventMode = 'static';
      btnGraphic.cursor = 'pointer';
      btnGraphic.on("pointertap", btn.action);

      const btnText = new Text({
        text: btn.label,
        style: { fontSize: 10, fill: 0xffffff, fontWeight: 'bold' as const }
      });
      btnText.anchor.set(0.5);
      btnText.x = btnX + 50;
      btnText.y = btnY + 15;

      container.addChild(btnGraphic);
      container.addChild(btnText);

      btnX += 110;
    });
  }
}
