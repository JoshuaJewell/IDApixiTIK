// Network Desktop - Main hacking interface (Debug View)

open Pixi
open PixiUI
open DeviceTypes

// Asset bundles for this popup
let assetBundles = ["desktop"]

// Network zone types for layout
type networkZone = LAN | VLAN | External | Internet

// Get zone from IP address
let getZone = (ip: string): networkZone => {
  if String.startsWith(ip, "192.168.") {
    LAN
  } else if String.startsWith(ip, "10.0.0.") {
    VLAN
  } else {
    External
  }
}

// Network Device Icon on the desktop
module DeviceIcon = {
  type t = {
    container: Container.t,
    ipAddress: string,
    zone: networkZone,
  }

  let createDeviceGraphic = (deviceType: deviceType, iconBg: Graphics.t): unit => {
    let indicator = Graphics.make()

    switch deviceType {
    | Laptop =>
      let _ = indicator
        ->Graphics.rect(20.0, 30.0, 40.0, 25.0)
        ->Graphics.fill({"color": 0xffffff})
      let _ = indicator
        ->Graphics.rect(30.0, 55.0, 20.0, 3.0)
        ->Graphics.fill({"color": 0xffffff})
    | Router =>
      let _ = indicator
        ->Graphics.circle(40.0, 40.0, 15.0)
        ->Graphics.fill({"color": 0xffffff})
      let _ = indicator
        ->Graphics.rect(38.0, 25.0, 4.0, 15.0)
        ->Graphics.fill({"color": 0xffffff})
    | Server =>
      let _ = indicator
        ->Graphics.rect(20.0, 25.0, 40.0, 8.0)
        ->Graphics.fill({"color": 0xffffff})
      let _ = indicator
        ->Graphics.rect(20.0, 37.0, 40.0, 8.0)
        ->Graphics.fill({"color": 0xffffff})
      let _ = indicator
        ->Graphics.rect(20.0, 49.0, 40.0, 8.0)
        ->Graphics.fill({"color": 0xffffff})
    | IotCamera =>
      let _ = indicator
        ->Graphics.circle(40.0, 35.0, 12.0)
        ->Graphics.fill({"color": 0xffffff})
      let _ = indicator
        ->Graphics.rect(35.0, 47.0, 10.0, 8.0)
        ->Graphics.fill({"color": 0xffffff})
    | Terminal =>
      let _ = indicator
        ->Graphics.rect(15.0, 25.0, 50.0, 30.0)
        ->Graphics.fill({"color": 0x000000})
      let termText = Text.make({
        "text": ">_",
        "style": {"fill": 0x00ff00, "fontSize": 16},
      })
      Text.setX(termText, 20.0)
      Text.setY(termText, 30.0)
      let _ = Graphics.addChild(indicator, termText)
    | PowerStation =>
      // Power station icon - lightning bolt
      let _ = indicator
        ->Graphics.rect(25.0, 25.0, 30.0, 35.0)
        ->Graphics.fill({"color": 0xffffff})
      let _ = indicator
        ->Graphics.rect(30.0, 35.0, 20.0, 5.0)
        ->Graphics.fill({"color": 0xFFEB3B})
      let _ = indicator
        ->Graphics.rect(30.0, 42.0, 20.0, 5.0)
        ->Graphics.fill({"color": 0xFFEB3B})
      let _ = indicator
        ->Graphics.rect(30.0, 49.0, 20.0, 5.0)
        ->Graphics.fill({"color": 0xFFEB3B})
    | UPS =>
      // UPS icon - battery
      let _ = indicator
        ->Graphics.rect(20.0, 30.0, 35.0, 25.0)
        ->Graphics.fill({"color": 0xffffff})
      let _ = indicator
        ->Graphics.rect(55.0, 37.0, 5.0, 10.0)
        ->Graphics.fill({"color": 0xffffff})
      let _ = indicator
        ->Graphics.rect(25.0, 35.0, 10.0, 15.0)
        ->Graphics.fill({"color": 0x00ff00})
      let _ = indicator
        ->Graphics.rect(37.0, 35.0, 10.0, 15.0)
        ->Graphics.fill({"color": 0x00ff00})
    }

    let _ = Graphics.addChild(iconBg, indicator)
  }

  let make = (networkManager: NetworkManager.t, ipAddress: string): option<t> => {
    switch NetworkManager.getDevice(networkManager, ipAddress) {
    | None => None
    | Some(device) =>
      let info = device.getInfo()
      let container = Container.make()
      Container.setEventMode(container, "static")
      Container.setCursor(container, "pointer")

      // Device icon background
      let iconBg = Graphics.make()
      let _ = iconBg
        ->Graphics.rect(0.0, 0.0, 80.0, 80.0)
        ->Graphics.fill({"color": getDeviceColor(info.deviceType)})
      let _ = iconBg
        ->Graphics.rect(2.0, 2.0, 76.0, 76.0)
        ->Graphics.stroke({"width": 2, "color": 0x000000})
      let _ = Container.addChildGraphics(container, iconBg)

      // Device type indicator
      createDeviceGraphic(info.deviceType, iconBg)

      // Security indicator
      let securityDot = Graphics.make()
      let _ = securityDot
        ->Graphics.circle(70.0, 10.0, 5.0)
        ->Graphics.fill({"color": getSecurityColor(info.securityLevel)})
      let _ = Container.addChildGraphics(container, securityDot)

      // Device name label
      let nameText = Text.make({
        "text": info.name,
        "style": {"fontSize": 11, "fill": 0xffffff, "align": "center", "fontWeight": "bold"},
      })
      ObservablePoint.set(Text.anchor(nameText), 0.5, ~y=0.0)
      Text.setX(nameText, 40.0)
      Text.setY(nameText, 85.0)
      let _ = Container.addChildText(container, nameText)

      // IP Address
      let ipText = Text.make({
        "text": info.ipAddress,
        "style": {"fontSize": 9, "fill": 0xaaaaaa, "align": "center"},
      })
      ObservablePoint.set(Text.anchor(ipText), 0.5, ~y=0.0)
      Text.setX(ipText, 40.0)
      Text.setY(ipText, 100.0)
      let _ = Container.addChildText(container, ipText)

      // Click to open device
      Container.on(container, "pointertap", _ => {
        switch NetworkManager.getDevice(networkManager, ipAddress) {
        | None => ()
        | Some(d) =>
          let window = d.openGUI()
          switch Container.parent(container)->Nullable.toOption {
          | Some(parent) =>
            let _ = Container.addChild(parent, window.container)
          | None => ()
          }
        }
      })

      Some({container, ipAddress, zone: getZone(ipAddress)})
    }
  }
}

// Create the network desktop
let make = (): Navigation.appScreen => {
  let container = Container.make()
  Container.setSortableChildren(container, true)
  Container.setEventMode(container, "static")
  Container.setInteractiveChildren(container, true)

  // Use global network manager (shared with WorldScreen)
  let networkManager = GlobalNetworkManager.get()

  // Set up the network interface setter for laptops
  // Each device gets its own network interface based on its IP address
  // This enables proper routing - devices see the network from their perspective
  DesktopDevice.setGlobalNetworkInterfaceSetter((state: LaptopState.laptopState) => {
    // Create network interface from this device's perspective
    let ni = NetworkManager.createNetworkInterfaceFor(networkManager, state.ipAddress)
    LaptopState.setNetworkInterface(state, ni)
  })

  // Set up global state getter so devices use shared state from NetworkManager
  DesktopDevice.setGlobalStateGetter((ipAddress: string) => {
    NetworkManager.getDeviceState(networkManager, ipAddress)
  })

  // Set up the router's network manager reference
  // This allows the router GUI to show connected devices and configure DNS
  RouterDevice.setGlobalNetworkManager({
    getConnectedDevices: () => NetworkManager.getConnectedDevices(networkManager),
    getConfiguredDns: () => NetworkManager.getConfiguredDns(networkManager),
    setConfiguredDns: (dnsIp) => NetworkManager.setConfiguredDns(networkManager, dnsIp),
  })

  // Desktop background
  let desktopBg = Graphics.make()
  Graphics.setEventMode(desktopBg, "static")
  let _ = Container.addChildGraphics(container, desktopBg)

  // Close button to return to world view
  let closeButton = Button.make(~options={text: "Back to World", width: 140.0, height: 40.0}, ())
  Signal.connect(FancyButton.onPress(closeButton), () => {
    switch GetEngine.get() {
    | Some(engine) =>
      let _ = Navigation.dismissPopup(engine.navigation)
    | None => ()
    }
  })
  let _ = Container.addChild(container, FancyButton.toContainer(closeButton))

  // Topology lines container (drawn behind icons)
  let topologyLines = Graphics.make()
  let _ = Container.addChildGraphics(container, topologyLines)

  // Create device icons and organize by zone
  let lanIcons = ref([])
  let vlanIcons = ref([])
  let externalIcons = ref([])
  let routerIcon = ref(None)

  let devices = NetworkManager.getAllDevices(networkManager)
  Array.forEach(devices, device => {
    let info = device.getInfo()
    switch DeviceIcon.make(networkManager, info.ipAddress) {
    | Some(icon) =>
      let _ = Container.addChild(container, icon.container)
      // Categorize icons by zone
      switch info.deviceType {
      | Router => routerIcon := Some(icon)
      | _ =>
        switch icon.zone {
        | LAN => lanIcons := Array.concat(lanIcons.contents, [icon])
        | VLAN => vlanIcons := Array.concat(vlanIcons.contents, [icon])
        | External | Internet => externalIcons := Array.concat(externalIcons.contents, [icon])
        }
      }
    | None => ()
    }
  })

  {
    container,
    prepare: None,
    show: Some(async () => {
      Container.setAlpha(container, 0.0)
      await Motion.animateAsync(container, {"alpha": 1.0}, {duration: 0.5, ease: "easeOut"})
    }),
    hide: Some(async () => {
      await Motion.animateAsync(container, {"alpha": 0.0}, {duration: 0.3})
    }),
    pause: None,
    resume: None,
    reset: None,
    update: Some(_time => ()),
    resize: Some((width, height) => {
      let _ = Graphics.clear(desktopBg)
      let _ = desktopBg
        ->Graphics.rect(0.0, 0.0, width, height)
        ->Graphics.fill({"color": 0x0a0a0a, "alpha": 1.0})

      // Position close button in top-right corner
      FancyButton.setX(closeButton, width -. 80.0)
      FancyButton.setY(closeButton, 30.0)

      // Grid pattern
      let gridGraphics = Graphics.make()
      let x = ref(0.0)
      while x.contents < width {
        let _ = gridGraphics
          ->Graphics.moveTo(x.contents, 0.0)
          ->Graphics.lineTo(x.contents, height)
          ->Graphics.stroke({"width": 1, "color": 0x1a1a1a, "alpha": 0.3})
        x := x.contents +. 50.0
      }
      let y = ref(0.0)
      while y.contents < height {
        let _ = gridGraphics
          ->Graphics.moveTo(0.0, y.contents)
          ->Graphics.lineTo(width, y.contents)
          ->Graphics.stroke({"width": 1, "color": 0x1a1a1a, "alpha": 0.3})
        y := y.contents +. 50.0
      }
      let _ = Graphics.addChild(desktopBg, gridGraphics)

      // Clear and redraw topology lines
      let _ = Graphics.clear(topologyLines)

      // Layout constants
      let iconWidth = 80.0
      let iconHeight = 80.0
      let iconCenterX = iconWidth /. 2.0
      let iconCenterY = iconHeight /. 2.0
      let iconSpacingX = 110.0
      let iconSpacingY = 130.0

      // Router at center-left
      let routerX = 150.0
      let routerY = height /. 2.0 -. 40.0

      switch routerIcon.contents {
      | Some(router) =>
        Container.setX(router.container, routerX)
        Container.setY(router.container, routerY)
      | None => ()
      }

      // Helper to draw a line from router to device
      let drawLine = (toX: float, toY: float, color: int) => {
        let fromX = routerX +. iconCenterX
        let fromY = routerY +. iconCenterY
        let _ = topologyLines
          ->Graphics.moveTo(fromX, fromY)
          ->Graphics.lineTo(toX +. iconCenterX, toY +. iconCenterY)
          ->Graphics.stroke({"width": 2, "color": color, "alpha": 0.5})
      }

      // LAN devices (192.168.1.x) - above router
      let lanStartX = 50.0
      let lanY = 50.0
      Array.forEachWithIndex(lanIcons.contents, (icon, i) => {
        let posX = lanStartX +. Int.toFloat(i) *. iconSpacingX
        Container.setX(icon.container, posX)
        Container.setY(icon.container, lanY)
        drawLine(posX, lanY, 0x00ff00) // Green for LAN
      })

      // VLAN devices (10.0.0.x) - below router
      let vlanStartX = 50.0
      let vlanY = height -. iconSpacingY -. 20.0
      Array.forEachWithIndex(vlanIcons.contents, (icon, i) => {
        let posX = vlanStartX +. Int.toFloat(i) *. iconSpacingX
        Container.setX(icon.container, posX)
        Container.setY(icon.container, vlanY)
        drawLine(posX, vlanY, 0xff9900) // Orange for VLAN
      })

      // External/Internet devices - right side of screen
      let externalX = width -. iconSpacingX -. 50.0
      let externalStartY = 50.0
      Array.forEachWithIndex(externalIcons.contents, (icon, i) => {
        let posY = externalStartY +. Int.toFloat(i) *. iconSpacingY
        Container.setX(icon.container, externalX)
        Container.setY(icon.container, posY)
        drawLine(externalX, posY, 0x00aaff) // Blue for external/internet
      })

      // Draw zone labels
      let labelStyle = {"fontSize": 14, "fill": 0x666666, "fontWeight": "bold"}

      // LAN label
      let lanLabel = Text.make({"text": "LOCAL NETWORK (192.168.1.x)", "style": labelStyle})
      Text.setX(lanLabel, lanStartX)
      Text.setY(lanLabel, lanY -. 25.0)
      let _ = Graphics.addChild(topologyLines, lanLabel)

      // VLAN label
      let vlanLabel = Text.make({"text": "CORPORATE VLAN (10.0.0.x)", "style": labelStyle})
      Text.setX(vlanLabel, vlanStartX)
      Text.setY(vlanLabel, vlanY -. 25.0)
      let _ = Graphics.addChild(topologyLines, vlanLabel)

      // External label
      let extLabel = Text.make({"text": "INTERNET", "style": labelStyle})
      Text.setX(extLabel, externalX)
      Text.setY(extLabel, externalStartY -. 25.0)
      let _ = Graphics.addChild(topologyLines, extLabel)

      // Router label
      let routerLabel = Text.make({"text": "GATEWAY", "style": labelStyle})
      Text.setX(routerLabel, routerX)
      Text.setY(routerLabel, routerY -. 25.0)
      let _ = Graphics.addChild(topologyLines, routerLabel)
    }),
    blur: None,
    focus: None,
    onLoad: None,
  }
}

// Screen constructor
let constructor: Navigation.appScreenConstructor = {
  make,
  assetBundles: Some(assetBundles),
}
