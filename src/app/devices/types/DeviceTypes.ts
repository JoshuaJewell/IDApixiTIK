/** Device types for hacking gameplay */
export enum DeviceType {
  LAPTOP = "LAPTOP",
  ROUTER = "ROUTER",
  SERVER = "SERVER",
  IOT_CAMERA = "IOT_CAMERA",
  TERMINAL = "TERMINAL"
}

/** Device icon colors */
export const DEVICE_COLORS = {
  [DeviceType.LAPTOP]: 0x2196F3,      // Blue
  [DeviceType.ROUTER]: 0xFF9800,       // Orange
  [DeviceType.SERVER]: 0x9C27B0,       // Purple
  [DeviceType.IOT_CAMERA]: 0xF44336,   // Red
  [DeviceType.TERMINAL]: 0x4CAF50      // Green
};

/** Security levels */
export type SecurityLevel = "OPEN" | "WEAK" | "MEDIUM" | "STRONG";

/** Device information */
export interface DeviceInfo {
  name: string;
  type: DeviceType;
  ipAddress: string;
  securityLevel: SecurityLevel;
}

/** Base device interface */
export interface IDevice {
  getInfo(): DeviceInfo;
  openGUI(): void;
}
