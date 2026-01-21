// Network Router Device

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
  deviceType: Router,
  ipAddress: device.ipAddress,
  securityLevel: device.securityLevel,
}

// Create a simple input background
let createInputBg = (~width: float=200.0, ()): Graphics.t => {
  let bg = Graphics.make()
  let _ = bg
    ->Graphics.rect(0.0, 0.0, width, 25.0)
    ->Graphics.fill({"color": 0xffffff})
    ->Graphics.stroke({"width": 1, "color": 0x000000})
  bg
}

// Network manager interface type for router access
type networkManagerInterface = {
  getConnectedDevices: unit => array<(string, string, string)>,
  getConfiguredDns: unit => string,
  setConfiguredDns: string => unit,
}

// Global network manager reference (set by NetworkDesktop)
let globalNetworkManagerRef: ref<option<networkManagerInterface>> = ref(None)

let setGlobalNetworkManager = (manager: networkManagerInterface): unit => {
  globalNetworkManagerRef := Some(manager)
}

let createRouterInterface = (container: Container.t, ipAddress: string): unit => {
  let headerStyle = {"fontFamily": "Arial", "fontSize": 14, "fill": 0xffffff, "fontWeight": "bold"}
  let labelStyle = {"fontFamily": "Arial", "fontSize": 12, "fill": 0xdddddd}

  let header = Text.make({"text": "Router Configuration", "style": headerStyle})
  Text.setX(header, 20.0)
  Text.setY(header, 15.0)
  let _ = Container.addChildText(container, header)

  // Get current DNS from network manager
  let currentDns = switch globalNetworkManagerRef.contents {
  | Some(nm) => nm.getConfiguredDns()
  | None => "8.8.8.8"
  }

  // DNS Settings
  let yPos = ref(50.0)
  let dnsLabel = Text.make({"text": "DNS Server:", "style": labelStyle})
  Text.setX(dnsLabel, 20.0)
  Text.setY(dnsLabel, yPos.contents)
  let _ = Container.addChildText(container, dnsLabel)

  // Use @pixi/ui Input component
  let dnsInput = PixiUI.Input.make({
    "bg": createInputBg(),
    "placeholder": "Enter DNS...",
    "value": currentDns,
    "textStyle": {"fontSize": 11, "fill": 0x000000},
    "padding": 5,
  })
  PixiUI.Input.setX(dnsInput, 150.0)
  PixiUI.Input.setY(dnsInput, yPos.contents -. 5.0)
  let _ = Container.addChild(container, PixiUI.Input.toContainer(dnsInput))

  // Update DNS when Enter is pressed
  PixiUI.Signal.connect(PixiUI.Input.onEnter(dnsInput), newDns => {
    switch globalNetworkManagerRef.contents {
    | Some(nm) => nm.setConfiguredDns(newDns)
    | None => ()
    }
  })

  // DNS status indicator
  let dnsStatusRef = ref(Text.make({"text": "", "style": {"fontSize": 9, "fill": 0x00ff00}}))
  Text.setX(dnsStatusRef.contents, 360.0)
  Text.setY(dnsStatusRef.contents, yPos.contents +. 3.0)
  let _ = Container.addChildText(container, dnsStatusRef.contents)

  // Apply button for DNS
  let applyBtn = Graphics.make()
  let _ = applyBtn
    ->Graphics.rect(360.0, yPos.contents -. 5.0, 60.0, 25.0)
    ->Graphics.fill({"color": 0x0078d4})
    ->Graphics.stroke({"width": 1, "color": 0x005a9e})
  Graphics.setEventMode(applyBtn, "static")
  Graphics.setCursor(applyBtn, "pointer")
  let _ = Container.addChildGraphics(container, applyBtn)

  let applyText = Text.make({
    "text": "Apply",
    "style": {"fontSize": 10, "fill": 0xffffff, "fontWeight": "bold"},
  })
  Text.setX(applyText, 375.0)
  Text.setY(applyText, yPos.contents)
  let _ = Graphics.addChild(applyBtn, applyText)

  Graphics.on(applyBtn, "pointertap", _ => {
    let newDns = PixiUI.Input.value(dnsInput)
    switch globalNetworkManagerRef.contents {
    | Some(nm) => nm.setConfiguredDns(newDns)
    | None => ()
    }
  })

  // DHCP Toggle
  yPos := yPos.contents +. 40.0
  let dhcpLabel = Text.make({"text": "DHCP:", "style": labelStyle})
  Text.setX(dhcpLabel, 20.0)
  Text.setY(dhcpLabel, yPos.contents)
  let _ = Container.addChildText(container, dhcpLabel)

  let dhcpBtn = Graphics.make()
  let _ = dhcpBtn
    ->Graphics.rect(150.0, yPos.contents -. 5.0, 80.0, 25.0)
    ->Graphics.fill({"color": 0x00ff00})
    ->Graphics.stroke({"width": 1, "color": 0x000000})
  Graphics.setEventMode(dhcpBtn, "static")
  Graphics.setCursor(dhcpBtn, "pointer")
  let _ = Container.addChildGraphics(container, dhcpBtn)

  let dhcpText = Text.make({
    "text": "ENABLED",
    "style": {"fontSize": 11, "fill": 0x000000, "fontWeight": "bold"},
  })
  Text.setX(dhcpText, 158.0)
  Text.setY(dhcpText, yPos.contents)
  let _ = Graphics.addChild(dhcpBtn, dhcpText)

  // Connected Devices section
  yPos := yPos.contents +. 45.0
  let devHeader = Text.make({"text": "Connected Devices:", "style": headerStyle})
  Text.setX(devHeader, 20.0)
  Text.setY(devHeader, yPos.contents)
  let _ = Container.addChildText(container, devHeader)

  // Column headers
  yPos := yPos.contents +. 25.0
  let colHeaders = Text.make({
    "text": "NAME                 IP ADDRESS        MAC ADDRESS",
    "style": {"fontSize": 10, "fill": 0x888888, "fontFamily": "monospace"},
  })
  Text.setX(colHeaders, 20.0)
  Text.setY(colHeaders, yPos.contents)
  let _ = Container.addChildText(container, colHeaders)

  // Get connected devices from network manager
  let devices = switch globalNetworkManagerRef.contents {
  | Some(nm) => nm.getConnectedDevices()
  | None => []
  }

  yPos := yPos.contents +. 18.0
  Array.forEach(devices, ((name, ip, mac)) => {
    let nameStr = String.padEnd(name, 20, " ")
    let ipStr = String.padEnd(ip, 18, " ")
    let devText = Text.make({
      "text": `${nameStr}${ipStr}${mac}`,
      "style": {"fontSize": 10, "fill": 0xaaaaaa, "fontFamily": "monospace"},
    })
    Text.setX(devText, 20.0)
    Text.setY(devText, yPos.contents)
    let _ = Container.addChildText(container, devText)
    yPos := yPos.contents +. 18.0
  })

  // Show message if no devices
  if Array.length(devices) == 0 {
    let noDevText = Text.make({
      "text": "(no devices connected)",
      "style": {"fontSize": 10, "fill": 0x666666, "fontStyle": "italic"},
    })
    Text.setX(noDevText, 20.0)
    Text.setY(noDevText, yPos.contents)
    let _ = Container.addChildText(container, noDevText)
  }

  // Power button at bottom right
  let powerBtnY = 340.0
  let powerBtn = Graphics.make()
  let isShutdown = PowerManager.isDeviceShutdown(ipAddress)
  let powerBtnColor = if isShutdown { 0x00aa00 } else { 0xaa0000 }
  let _ = powerBtn
    ->Graphics.rect(350.0, powerBtnY, 100.0, 30.0)
    ->Graphics.fill({"color": powerBtnColor})
    ->Graphics.stroke({"width": 1, "color": 0x000000})
  Graphics.setEventMode(powerBtn, "static")
  Graphics.setCursor(powerBtn, "pointer")
  let _ = Container.addChildGraphics(container, powerBtn)

  let powerText = Text.make({
    "text": if isShutdown { "POWER ON" } else { "POWER OFF" },
    "style": {"fontSize": 10, "fill": 0xffffff, "fontWeight": "bold"},
  })
  ObservablePoint.set(Text.anchor(powerText), 0.5, ~y=0.5)
  Text.setX(powerText, 400.0)
  Text.setY(powerText, powerBtnY +. 15.0)
  let _ = Container.addChildText(container, powerText)

  Graphics.on(powerBtn, "pointertap", _ => {
    let currentlyShutdown = PowerManager.isDeviceShutdown(ipAddress)
    if currentlyShutdown {
      // Boot the device
      if PowerManager.deviceHasPower(ipAddress) {
        PowerManager.bootDevice(ipAddress)
        Text.setText(powerText, "POWER OFF")
        Graphics.clear(powerBtn)->ignore
        let _ = powerBtn
          ->Graphics.rect(350.0, powerBtnY, 100.0, 30.0)
          ->Graphics.fill({"color": 0xaa0000})
          ->Graphics.stroke({"width": 1, "color": 0x000000})
      }
    } else {
      // Shutdown the device
      PowerManager.manualShutdownDevice(ipAddress)
      Text.setText(powerText, "POWER ON")
      Graphics.clear(powerBtn)->ignore
      let _ = powerBtn
        ->Graphics.rect(350.0, powerBtnY, 100.0, 30.0)
        ->Graphics.fill({"color": 0x00aa00})
        ->Graphics.stroke({"width": 1, "color": 0x000000})
    }
  })
}

let openGUI = (device: t): DeviceWindow.t => {
  let win = DeviceWindow.make(
    ~title=`ROUTER - ${device.name} [${device.ipAddress}]`,
    ~width=500.0,
    ~height=400.0,
    ~titleBarColor=getDeviceColor(Router),
    ~backgroundColor=0x1a1a1a,
    (),
  )

  createRouterInterface(DeviceWindow.getContent(win), device.ipAddress)
  win
}

// Create device interface
let toDevice = (t: t): device => {
  getInfo: () => getInfo(t),
  openGUI: () => openGUI(t),
}
