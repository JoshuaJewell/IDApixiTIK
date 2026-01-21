import { IDevice, DeviceType, SecurityLevel } from "./types/DeviceTypes";
import { DeviceFactory } from "./DeviceFactory";

/**
 * Central network manager for all devices
 */
export class NetworkManager {
  private devices: Map<string, IDevice> = new Map();

  constructor() {
    this.initializeNetwork();
  }

  /**
   * Initialize the network with default devices
   */
  private initializeNetwork() {
    // Add default devices to the network
    this.addDevice("CORP-LAPTOP-42", DeviceType.LAPTOP, "192.168.1.102", "MEDIUM");
    this.addDevice("WIFI-ROUTER", DeviceType.ROUTER, "192.168.1.1", "WEAK");
    this.addDevice("DB-SERVER-01", DeviceType.SERVER, "10.0.0.50", "STRONG");
    this.addDevice("CAM-ENTRANCE", DeviceType.IOT_CAMERA, "192.168.1.105", "OPEN");
    this.addDevice("DEV-TERMINAL", DeviceType.TERMINAL, "10.0.0.77", "WEAK");
  }

  /**
   * Add a device to the network
   */
  addDevice(
    name: string,
    type: DeviceType,
    ipAddress: string,
    securityLevel: SecurityLevel
  ): void {
    const device = DeviceFactory.createDevice(type, name, ipAddress, securityLevel);
    this.devices.set(ipAddress, device);
  }

  /**
   * Get a device by IP address
   */
  getDevice(ipAddress: string): IDevice | undefined {
    return this.devices.get(ipAddress);
  }

  /**
   * Get all devices
   */
  getAllDevices(): IDevice[] {
    return Array.from(this.devices.values());
  }

  /**
   * Remove a device from the network
   */
  removeDevice(ipAddress: string): boolean {
    return this.devices.delete(ipAddress);
  }

  /**
   * Scan network (returns all devices)
   */
  scanNetwork(): IDevice[] {
    return this.getAllDevices();
  }
}
