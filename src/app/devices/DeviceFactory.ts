import { DeviceType, SecurityLevel, IDevice } from "./types/DeviceTypes";
import { DesktopDevice } from "./DesktopDevice";
import { RouterDevice } from "./RouterDevice";
import { ServerDevice } from "./ServerDevice";
import { CameraDevice } from "./CameraDevice";
import { TerminalDevice } from "./TerminalDevice";

/**
 * Factory for creating device instances
 */
export class DeviceFactory {
  static createDevice(
    type: DeviceType,
    name: string,
    ipAddress: string,
    securityLevel: SecurityLevel
  ): IDevice {
    switch (type) {
      case DeviceType.LAPTOP:
        return new DesktopDevice(name, ipAddress, securityLevel);
      case DeviceType.ROUTER:
        return new RouterDevice(name, ipAddress, securityLevel);
      case DeviceType.SERVER:
        return new ServerDevice(name, ipAddress, securityLevel);
      case DeviceType.IOT_CAMERA:
        return new CameraDevice(name, ipAddress, securityLevel);
      case DeviceType.TERMINAL:
        return new TerminalDevice(name, ipAddress, securityLevel);
      default:
        throw new Error(`Unknown device type: ${type}`);
    }
  }
}
