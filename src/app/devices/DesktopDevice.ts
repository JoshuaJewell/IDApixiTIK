import { DeviceWindow } from "./common/DeviceWindow";
import { DeviceType, SecurityLevel, DeviceInfo, IDevice, DEVICE_COLORS } from "./types/DeviceTypes";
import { LaptopGUI } from "./LaptopGUI";

/**
 * Desktop/Laptop Computer Device
 */
export class DesktopDevice implements IDevice {
  constructor(
    private name: string,
    private ipAddress: string,
    private securityLevel: SecurityLevel
  ) {}

  getInfo(): DeviceInfo {
    return {
      name: this.name,
      type: DeviceType.LAPTOP,
      ipAddress: this.ipAddress,
      securityLevel: this.securityLevel
    };
  }

  openGUI(): DeviceWindow {
    const win = new DeviceWindow(
      `LAPTOP - ${this.name} [${this.ipAddress}]`,
      500,
      400,
      DEVICE_COLORS[DeviceType.LAPTOP],
      0x2b5797
    );

    const laptop = new LaptopGUI(490, 360);
    win.getContent().addChild(laptop);

    return win;
  }
}
