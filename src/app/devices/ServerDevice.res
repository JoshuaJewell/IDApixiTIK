// Server Device with CLI interface

open Pixi
open DeviceTypes

type t = {
  name: string,
  ipAddress: string,
  securityLevel: securityLevel,
}

let make = (~name: string, ~ipAddress: string, ~securityLevel: securityLevel, ()): t => {
  name,
  ipAddress,
  securityLevel,
}

let getInfo = (device: t): deviceInfo => {
  name: device.name,
  deviceType: Server,
  ipAddress: device.ipAddress,
  securityLevel: device.securityLevel,
}

let securityLevelToString = (level: securityLevel): string => {
  switch level {
  | Open => "OPEN"
  | Weak => "WEAK"
  | Medium => "MEDIUM"
  | Strong => "STRONG"
  }
}

let openGUI = (device: t): DeviceWindow.t => {
  let win = DeviceWindow.make(
    ~title=`SERVER - ${device.name} [${device.ipAddress}] SEC:${securityLevelToString(device.securityLevel)}`,
    ~width=500.0,
    ~height=400.0,
    ~titleBarColor=getDeviceColor(Server),
    ~backgroundColor=0x000000,
    (),
  )

  let terminal = Terminal.make(~width=490.0, ~height=360.0, ~prompt="root@server:~# ", ~ipAddress=device.ipAddress, ())
  let _ = Container.addChild(DeviceWindow.getContent(win), terminal.container)

  win
}

// Create device interface
let toDevice = (t: t): device => {
  getInfo: () => getInfo(t),
  openGUI: () => openGUI(t),
}
