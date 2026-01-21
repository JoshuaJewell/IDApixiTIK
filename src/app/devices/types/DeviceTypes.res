// Device types for hacking gameplay

// Device type enum
type deviceType =
  | Laptop
  | Router
  | Server
  | IotCamera
  | Terminal
  | PowerStation
  | UPS

// Security levels
type securityLevel =
  | Open
  | Weak
  | Medium
  | Strong

// Device icon colors
let getDeviceColor = (deviceType: deviceType): int => {
  switch deviceType {
  | Laptop => 0x2196F3    // Blue
  | Router => 0xFF9800    // Orange
  | Server => 0x9C27B0    // Purple
  | IotCamera => 0xF44336 // Red
  | Terminal => 0x4CAF50  // Green
  | PowerStation => 0xFFEB3B // Yellow
  | UPS => 0x795548       // Brown
  }
}

// Security level colors
let getSecurityColor = (level: securityLevel): int => {
  switch level {
  | Open => 0x00ff00
  | Weak => 0xffff00
  | Medium => 0xff9800
  | Strong => 0xff0000
  }
}

// Device information
type deviceInfo = {
  name: string,
  deviceType: deviceType,
  ipAddress: string,
  securityLevel: securityLevel,
}

// Base device interface
type rec device = {
  getInfo: unit => deviceInfo,
  openGUI: unit => DeviceWindow.t,
}
