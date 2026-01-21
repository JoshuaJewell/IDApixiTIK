import { DeviceWindow } from "./common/DeviceWindow";
import { DeviceType, SecurityLevel, DeviceInfo, IDevice, DEVICE_COLORS } from "./types/DeviceTypes";
import { Terminal } from "./Terminal";

/**
 * Standalone Terminal Device
 */
export class TerminalDevice implements IDevice {
  constructor(
    private name: string,
    private ipAddress: string,
    private securityLevel: SecurityLevel
  ) {}

  getInfo(): DeviceInfo {
    return {
      name: this.name,
      type: DeviceType.TERMINAL,
      ipAddress: this.ipAddress,
      securityLevel: this.securityLevel
    };
  }

  openGUI(): DeviceWindow {
    const win = new DeviceWindow(
      `TERMINAL - ${this.name} [${this.ipAddress}]`,
      500,
      400,
      DEVICE_COLORS[DeviceType.TERMINAL],
      0x000000
    );

    const terminal = new Terminal(490, 360, "> ");
    win.getContent().addChild(terminal);

    return win;
  }
}
