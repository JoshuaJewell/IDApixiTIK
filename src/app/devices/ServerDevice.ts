import { DeviceWindow } from "./common/DeviceWindow";
import { DeviceType, SecurityLevel, DeviceInfo, IDevice, DEVICE_COLORS } from "./types/DeviceTypes";
import { Terminal } from "./Terminal";

/**
 * Server Device with CLI interface
 */
export class ServerDevice implements IDevice {
  constructor(
    private name: string,
    private ipAddress: string,
    private securityLevel: SecurityLevel
  ) {}

  getInfo(): DeviceInfo {
    return {
      name: this.name,
      type: DeviceType.SERVER,
      ipAddress: this.ipAddress,
      securityLevel: this.securityLevel
    };
  }

  openGUI(): DeviceWindow {
    const win = new DeviceWindow(
      `SERVER - ${this.name} [${this.ipAddress}] SEC:${this.securityLevel}`,
      500,
      400,
      DEVICE_COLORS[DeviceType.SERVER],
      0x000000
    );

    const terminal = new Terminal(490, 360, "root@server:~# ");
    win.getContent().addChild(terminal);

    return win;
  }
}
