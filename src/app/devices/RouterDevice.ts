import { Container, Graphics, Text } from "pixi.js";
import { DeviceWindow } from "./common/DeviceWindow";
import { DeviceType, SecurityLevel, DeviceInfo, IDevice, DEVICE_COLORS } from "./types/DeviceTypes";

/**
 * Network Router Device
 */
export class RouterDevice implements IDevice {
  constructor(
    private name: string,
    private ipAddress: string,
    private securityLevel: SecurityLevel
  ) {}

  getInfo(): DeviceInfo {
    return {
      name: this.name,
      type: DeviceType.ROUTER,
      ipAddress: this.ipAddress,
      securityLevel: this.securityLevel
    };
  }

  openGUI(): DeviceWindow {
    const win = new DeviceWindow(
      `ROUTER - ${this.name} [${this.ipAddress}]`,
      500,
      400,
      DEVICE_COLORS[DeviceType.ROUTER],
      0x1a1a1a
    );

    this.createRouterInterface(win.getContent());
    return win;
  }

  private createRouterInterface(container: Container) {
    const headerStyle = { fontFamily: 'Arial', fontSize: 14, fill: 0xffffff, fontWeight: 'bold' as const };
    const labelStyle = { fontFamily: 'Arial', fontSize: 12, fill: 0xdddddd };

    const header = new Text({ text: "Router Configuration", style: headerStyle });
    header.x = 20;
    header.y = 15;
    container.addChild(header);

    // DNS Settings
    let yPos = 50;
    const dnsLabel = new Text({ text: "DNS Server:", style: labelStyle });
    dnsLabel.x = 20;
    dnsLabel.y = yPos;
    container.addChild(dnsLabel);

    const dnsInput = new Graphics();
    dnsInput.rect(150, yPos - 5, 200, 25).fill(0xffffff).stroke({ width: 1, color: 0x000000 });
    container.addChild(dnsInput);

    const dnsText = new Text({ text: "8.8.8.8", style: { fontSize: 11, fill: 0x000000 } });
    dnsText.x = 155;
    dnsText.y = yPos;
    container.addChild(dnsText);

    // DHCP Toggle
    yPos += 40;
    const dhcpLabel = new Text({ text: "DHCP:", style: labelStyle });
    dhcpLabel.x = 20;
    dhcpLabel.y = yPos;
    container.addChild(dhcpLabel);

    const dhcpBtn = new Graphics();
    dhcpBtn.rect(150, yPos - 5, 80, 25).fill(0x00ff00).stroke({ width: 1, color: 0x000000 });
    dhcpBtn.eventMode = 'static';
    dhcpBtn.cursor = 'pointer';
    dhcpBtn.on("pointertap", () => console.log("Toggle DHCP"));
    container.addChild(dhcpBtn);

    const dhcpText = new Text({
      text: "ENABLED",
      style: { fontSize: 11, fill: 0x000000, fontWeight: 'bold' as const }
    });
    dhcpText.x = 158;
    dhcpText.y = yPos;
    dhcpBtn.addChild(dhcpText);

    // Static IP Section
    yPos += 40;
    const staticLabel = new Text({ text: "Static IP Assignments:", style: headerStyle });
    staticLabel.x = 20;
    staticLabel.y = yPos;
    container.addChild(staticLabel);

    // Connected Devices
    yPos += 40;
    const devHeader = new Text({ text: "Connected Devices:", style: headerStyle });
    devHeader.x = 20;
    devHeader.y = yPos;
    container.addChild(devHeader);

    yPos += 25;
    const devices = [
      { name: "LAPTOP-A47", ip: "192.168.1.102", mac: "AA:BB:CC:DD:EE:01" },
      { name: "PHONE-X91", ip: "192.168.1.103", mac: "AA:BB:CC:DD:EE:02" },
      { name: "CAM-01", ip: "192.168.1.105", mac: "AA:BB:CC:DD:EE:03" }
    ];

    devices.forEach(device => {
      const devText = new Text({
        text: `${device.name.padEnd(15)} ${device.ip.padEnd(16)} ${device.mac}`,
        style: { fontSize: 10, fill: 0xaaaaaa, fontFamily: 'monospace' }
      });
      devText.x = 20;
      devText.y = yPos;
      container.addChild(devText);
      yPos += 20;
    });
  }
}
