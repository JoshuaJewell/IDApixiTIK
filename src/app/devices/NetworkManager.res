// Central network manager for all devices
// Implements star topology with router at center

open DeviceTypes

// Network topology: star with router at center
// 192.168.1.x subnet (LAN) - all devices connect to router
// 10.0.0.x subnet (Server VLAN) - connects through router
// Router bridges both subnets

// DNS record type
type dnsRecord = {
  hostname: string,
  ip: string,
}

// DNS server configuration
type dnsServer = {
  ip: string,
  records: array<dnsRecord>,
  isOnline: bool,
}

type t = {
  devices: Dict.t<device>,
  // Device states for SSH connections (keyed by IP)
  deviceStates: Dict.t<LaptopState.laptopState>,
  // Router IP (center of star)
  routerIp: string,
  // DNS server IP configured on router (can be changed)
  mutable configuredDnsIp: string,
  // DNS servers on the network (keyed by IP)
  dnsServers: Dict.t<dnsServer>,
}

// Get subnet from IP address (e.g., "192.168.1" from "192.168.1.102")
let getSubnet = (ip: string): string => {
  let parts = String.split(ip, ".")
  if Array.length(parts) >= 3 {
    let first3 = Array.slice(parts, ~start=0, ~end=3)
    Array.join(first3, ".")
  } else {
    ip
  }
}

// Check if two IPs are on the same subnet
let sameSubnet = (ip1: string, ip2: string): bool => {
  getSubnet(ip1) == getSubnet(ip2)
}

// Check if device is the router
let isRouter = (ip: string, routerIp: string): bool => {
  ip == routerIp
}

// Initialize DNS servers
let initializeDnsServers = (manager: t): unit => {
  // Google DNS server at 8.8.8.8 (external, always reachable via router)
  Dict.set(manager.dnsServers, "8.8.8.8", {
    ip: "8.8.8.8",
    isOnline: true,
    records: [
      {hostname: "google.com", ip: "142.250.80.46"},
      {hostname: "www.google.com", ip: "142.250.80.46"},
      {hostname: "github.com", ip: "140.82.121.4"},
      {hostname: "www.github.com", ip: "140.82.121.4"},
      {hostname: "corp-intranet.local", ip: "10.0.0.100"},
      {hostname: "mail.corp.local", ip: "10.0.0.25"},
      {hostname: "files.corp.local", ip: "10.0.0.50"},
      {hostname: "dev.corp.local", ip: "10.0.0.77"},
      {hostname: "admin-panel.local", ip: "192.168.1.200"},
      {hostname: "secret-server.local", ip: "10.0.0.99"},
    ],
  })
  // Secondary DNS (Cloudflare) - also external
  Dict.set(manager.dnsServers, "1.1.1.1", {
    ip: "1.1.1.1",
    isOnline: true,
    records: [
      {hostname: "google.com", ip: "142.250.80.46"},
      {hostname: "github.com", ip: "140.82.121.4"},
      {hostname: "cloudflare.com", ip: "104.16.132.229"},
    ],
  })
}

// Initialize the network with default devices
let initializeNetwork = (manager: t): unit => {
  // ========================================
  // LOCAL NETWORK (192.168.1.x) - LAN
  // ========================================

  // WiFi Router (connects all 192.168.1.x devices, gateway to internet)
  Dict.set(manager.devices, "192.168.1.1", DeviceFactory.createDevice(
    ~deviceType=Router,
    ~name="WIFI-ROUTER",
    ~ipAddress="192.168.1.1",
    ~securityLevel=Weak,
  ))
  // First laptop (player's main laptop)
  Dict.set(manager.devices, "192.168.1.102", DeviceFactory.createDevice(
    ~deviceType=Laptop,
    ~name="CORP-LAPTOP-42",
    ~ipAddress="192.168.1.102",
    ~securityLevel=Medium,
  ))
  // Second laptop (target laptop on the same network)
  Dict.set(manager.devices, "192.168.1.103", DeviceFactory.createDevice(
    ~deviceType=Laptop,
    ~name="CORP-LAPTOP-17",
    ~ipAddress="192.168.1.103",
    ~securityLevel=Weak,
  ))
  // Security camera (worldX matches position in WorldScreen devicePositions)
  Dict.set(manager.devices, "192.168.1.105", DeviceFactory.createDevice(
    ~deviceType=IotCamera,
    ~name="CAM-ENTRANCE",
    ~ipAddress="192.168.1.105",
    ~securityLevel=Open,
    ~worldX=1050.0,
  ))
  // Admin panel (internal web server)
  Dict.set(manager.devices, "192.168.1.200", DeviceFactory.createDevice(
    ~deviceType=Server,
    ~name="ADMIN-PANEL",
    ~ipAddress="192.168.1.200",
    ~securityLevel=Medium,
  ))

  // ========================================
  // POWER INFRASTRUCTURE
  // ========================================

  // Main Power Station (powers everything)
  Dict.set(manager.devices, "192.168.1.250", DeviceFactory.createDevice(
    ~deviceType=PowerStation,
    ~name="MAIN-PWR-STATION",
    ~ipAddress="192.168.1.250",
    ~securityLevel=Medium,
  ))

  // UPS Unit (connected to power station, protects router and servers)
  Dict.set(manager.devices, "192.168.1.251", DeviceFactory.createDevice(
    ~deviceType=UPS,
    ~name="UPS-CRITICAL",
    ~ipAddress="192.168.1.251",
    ~securityLevel=Open,
    ~connectedStationIp="192.168.1.250",
  ))

  // Connect critical devices to UPS
  PowerManager.connectDeviceToUPS("192.168.1.1", "192.168.1.251")    // Router
  PowerManager.connectDeviceToUPS("192.168.1.200", "192.168.1.251")  // Admin panel
  PowerManager.connectDeviceToUPS("10.0.0.25", "192.168.1.251")      // Mail server
  PowerManager.connectDeviceToUPS("10.0.0.50", "192.168.1.251")      // DB server

  // ========================================
  // CORPORATE VLAN (10.0.0.x) - Server Network
  // ========================================

  // Mail server
  Dict.set(manager.devices, "10.0.0.25", DeviceFactory.createDevice(
    ~deviceType=Server,
    ~name="MAIL-SERVER",
    ~ipAddress="10.0.0.25",
    ~securityLevel=Strong,
  ))
  // Database server (files.corp.local)
  Dict.set(manager.devices, "10.0.0.50", DeviceFactory.createDevice(
    ~deviceType=Server,
    ~name="DB-SERVER-01",
    ~ipAddress="10.0.0.50",
    ~securityLevel=Strong,
  ))
  // Development terminal (dev.corp.local)
  Dict.set(manager.devices, "10.0.0.77", DeviceFactory.createDevice(
    ~deviceType=Terminal,
    ~name="DEV-TERMINAL",
    ~ipAddress="10.0.0.77",
    ~securityLevel=Weak,
  ))
  // Secret server (hidden)
  Dict.set(manager.devices, "10.0.0.99", DeviceFactory.createDevice(
    ~deviceType=Server,
    ~name="SECRET-SERVER",
    ~ipAddress="10.0.0.99",
    ~securityLevel=Strong,
  ))
  // Corporate intranet
  Dict.set(manager.devices, "10.0.0.100", DeviceFactory.createDevice(
    ~deviceType=Server,
    ~name="CORP-INTRANET",
    ~ipAddress="10.0.0.100",
    ~securityLevel=Medium,
  ))

  // ========================================
  // EXTERNAL INTERNET (Public IPs)
  // ========================================

  // DNS Servers
  Dict.set(manager.devices, "8.8.8.8", DeviceFactory.createDevice(
    ~deviceType=Server,
    ~name="GOOGLE-DNS",
    ~ipAddress="8.8.8.8",
    ~securityLevel=Strong,
  ))
  Dict.set(manager.devices, "1.1.1.1", DeviceFactory.createDevice(
    ~deviceType=Server,
    ~name="CLOUDFLARE-DNS",
    ~ipAddress="1.1.1.1",
    ~securityLevel=Strong,
  ))

  // External web servers
  Dict.set(manager.devices, "142.250.80.46", DeviceFactory.createDevice(
    ~deviceType=Server,
    ~name="GOOGLE-WEB",
    ~ipAddress="142.250.80.46",
    ~securityLevel=Strong,
  ))
  Dict.set(manager.devices, "140.82.121.4", DeviceFactory.createDevice(
    ~deviceType=Server,
    ~name="GITHUB-WEB",
    ~ipAddress="140.82.121.4",
    ~securityLevel=Strong,
  ))
  Dict.set(manager.devices, "104.16.132.229", DeviceFactory.createDevice(
    ~deviceType=Server,
    ~name="CLOUDFLARE-WEB",
    ~ipAddress="104.16.132.229",
    ~securityLevel=Strong,
  ))

  // Initialize DNS servers (records for hostname resolution)
  initializeDnsServers(manager)
}

// Create a new network manager
let make = (): t => {
  let manager = {
    devices: Dict.make(),
    deviceStates: Dict.make(),
    routerIp: "192.168.1.1",
    configuredDnsIp: "8.8.8.8",
    dnsServers: Dict.make(),
  }
  initializeNetwork(manager)
  manager
}

// Get configured DNS server IP
let getConfiguredDns = (manager: t): string => manager.configuredDnsIp

// Set configured DNS server IP (called from router config)
let setConfiguredDns = (manager: t, dnsIp: string): unit => {
  manager.configuredDnsIp = dnsIp
}

// Resolve hostname to IP using configured DNS
// Returns None if DNS server is unreachable or hostname not found
let resolveHostname = (manager: t, hostname: string): option<string> => {
  // First check if it's already an IP address
  let parts = String.split(hostname, ".")
  let isIp = Array.length(parts) == 4 && Array.every(parts, part => {
    switch Int.fromString(part) {
    | Some(n) => n >= 0 && n <= 255
    | None => false
    }
  })

  if isIp {
    Some(hostname) // Already an IP
  } else {
    // Need to query DNS server
    // Check if DNS server is reachable (router must be up for external DNS)
    switch Dict.get(manager.devices, manager.routerIp) {
    | None => None // Router down, can't reach DNS
    | Some(_) =>
      // Check if configured DNS server exists and is online
      switch Dict.get(manager.dnsServers, manager.configuredDnsIp) {
      | None => None // DNS server not found
      | Some(dns) =>
        if !dns.isOnline {
          None // DNS server offline
        } else {
          // Look up the hostname
          Array.find(dns.records, r => r.hostname == hostname)
          ->Option.map(r => r.ip)
        }
      }
    }
  }
}

// Get all connected devices (for router display)
let getConnectedDevices = (manager: t): array<(string, string, string)> => {
  // Returns array of (name, ip, mac) for all devices except the router itself
  Dict.toArray(manager.devices)
  ->Array.filter(((ip, _)) => ip != manager.routerIp)
  ->Array.map(((ip, device)) => {
    let info = device.getInfo()
    // Generate a fake MAC based on IP for consistency
    let ipParts = String.split(ip, ".")
    let lastOctet = Array.get(ipParts, 3)->Option.getOr("0")
    let mac = `AA:BB:CC:DD:EE:${String.padStart(lastOctet, 2, "0")}`
    (info.name, ip, mac)
  })
  ->Array.toSorted(((_, ip1, _), (_, ip2, _)) => String.compare(ip1, ip2))
}

// Add a device to the network
let addDevice = (
  manager: t,
  ~name: string,
  ~deviceType: deviceType,
  ~ipAddress: string,
  ~securityLevel: securityLevel,
): unit => {
  let device = DeviceFactory.createDevice(~deviceType, ~name, ~ipAddress, ~securityLevel)
  Dict.set(manager.devices, ipAddress, device)
}

// Get a device by IP address
let getDevice = (manager: t, ipAddress: string): option<device> => {
  Dict.get(manager.devices, ipAddress)
}

// Get all devices
let getAllDevices = (manager: t): array<device> => {
  Dict.valuesToArray(manager.devices)
}

// Remove a device from the network
let removeDevice = (manager: t, ipAddress: string): bool => {
  switch Dict.get(manager.devices, ipAddress) {
  | Some(_) =>
    Dict.delete(manager.devices, ipAddress)
    true
  | None => false
  }
}

// Scan network (returns all devices)
let scanNetwork = (manager: t): array<device> => {
  getAllDevices(manager)
}

// Check if a device is reachable FROM a specific source IP
// Star topology: all traffic goes through router
// Same subnet: source -> router -> destination (or direct if same switch segment)
// Different subnet: source -> router -> destination
let isReachableFrom = (manager: t, sourceIp: string, destIp: string): bool => {
  // Can't reach yourself (well, you can, but let's keep it simple)
  if sourceIp == destIp {
    true
  } else {
    // Check if router is up (required for all traffic in star topology)
    switch Dict.get(manager.devices, manager.routerIp) {
    | None => false // Router down = network down
    | Some(_) =>
      // Check if destination is a local device
      switch Dict.get(manager.devices, destIp) {
      | Some(_) =>
        // Local device - reachable through router
        true
      | None =>
        // Not a local device - check if it's an external address
        // External addresses (like DNS servers, internet hosts) are reachable through the router
        // The router acts as the gateway to the internet
        true
      }
    }
  }
}

// Legacy function - checks global reachability (used for device existence)
let isReachable = (manager: t, ipAddress: string): bool => {
  Dict.get(manager.devices, ipAddress)->Option.isSome
}

// Get device info for ping/ssh
let getDeviceInfo = (manager: t, ipAddress: string): option<deviceInfo> => {
  switch Dict.get(manager.devices, ipAddress) {
  | Some(device) => Some(device.getInfo())
  | None => None
  }
}

// Check if SSH is available on a device (simplified: only terminals and servers have SSH)
let hasSSH = (manager: t, ipAddress: string): bool => {
  switch Dict.get(manager.devices, ipAddress) {
  | Some(device) =>
    let info = device.getInfo()
    switch info.deviceType {
    | Terminal | Server | Laptop => true
    | Router | IotCamera | PowerStation | UPS => false
    }
  | None => false
  }
}

// Get all reachable hosts (for network scanning) - legacy, returns all
let getReachableHosts = (manager: t): array<string> => {
  Dict.keysToArray(manager.devices)
}

// Get hosts reachable from a specific source IP
let getReachableHostsFrom = (manager: t, sourceIp: string): array<string> => {
  Dict.keysToArray(manager.devices)->Array.filter(destIp =>
    isReachableFrom(manager, sourceIp, destIp)
  )
}

// Get trace route from source to destination
// Returns array of (ip, hostname, latency_ms)
let getTraceRoute = (manager: t, sourceIp: string, destIp: string): array<(string, string, int)> => {
  // In star topology, all traffic goes through router
  // trace: source -> router -> (external DNS if needed) -> destination

  let hops = ref([])

  // Check if destination is reachable
  if !isReachableFrom(manager, sourceIp, destIp) {
    [] // Not reachable
  } else {
    // Hop 1: Router (if source is not the router)
    if sourceIp != manager.routerIp {
      hops := Array.concat(hops.contents, [(manager.routerIp, "WIFI-ROUTER", 1)])
    }

    // Check if destination is external (not on local network)
    let isExternal = Dict.get(manager.devices, destIp)->Option.isNone

    if isExternal {
      // Add internet gateway hop (simulated)
      hops := Array.concat(hops.contents, [("10.255.255.1", "isp-gateway", 12)])
      // Add a few internet hops
      hops := Array.concat(hops.contents, [("72.14.215.85", "core-router-1", 18)])
      hops := Array.concat(hops.contents, [("209.85.251.9", "edge-router", 24)])
    } else {
      // Local destination - direct through router
      // If different subnet, show the routing
      if !sameSubnet(sourceIp, destIp) && sourceIp != manager.routerIp {
        // Already added router hop above
        ()
      }
    }

    // Final hop: destination
    let destName = switch Dict.get(manager.devices, destIp) {
    | Some(device) => device.getInfo().name
    | None => destIp // Use IP if external
    }
    let finalLatency = if isExternal { 32 } else { 2 }
    hops := Array.concat(hops.contents, [(destIp, destName, finalLatency)])

    hops.contents
  }
}

// Forward declaration for createNetworkInterfaceFor (needed for recursive setup)
let createNetworkInterfaceForRef: ref<option<(t, string) => LaptopState.networkInterface>> = ref(None)

// Get or create a device state for SSH connections
// Returns the state for SSH-capable devices (Laptop, Server, Terminal)
// Also sets up the device's network interface based on its IP
let getDeviceState = (manager: t, ipAddress: string): option<LaptopState.laptopState> => {
  switch Dict.get(manager.devices, ipAddress) {
  | None => None
  | Some(device) =>
    let info = device.getInfo()
    switch info.deviceType {
    | Laptop | Server | Terminal =>
      // Check if state already exists
      switch Dict.get(manager.deviceStates, ipAddress) {
      | Some(state) => Some(state)
      | None =>
        // Create new state for this device
        let state = LaptopState.createLaptopState(~ipAddress, ~hostname=info.name, ())
        Dict.set(manager.deviceStates, ipAddress, state)
        // Set up network interface for this device
        switch createNetworkInterfaceForRef.contents {
        | Some(createNI) =>
          let ni = createNI(manager, ipAddress)
          LaptopState.setNetworkInterface(state, ni)
        | None => ()
        }
        Some(state)
      }
    | Router | IotCamera | PowerStation | UPS => None
    }
  }
}

// Helper to check if a string looks like an IP address
let isIpAddress = (host: string): bool => {
  let parts = String.split(host, ".")
  Array.length(parts) == 4 && Array.every(parts, part => {
    switch Int.fromString(part) {
    | Some(n) => n >= 0 && n <= 255
    | None => false
    }
  })
}

// Create a network interface from the perspective of a specific device
// This is what makes SSH work correctly - each device has its own network view
let createNetworkInterfaceFor = (manager: t, sourceIp: string): LaptopState.networkInterface => {
  {
    ping: (destHost) => {
      // First try to resolve hostname if it's not an IP
      if isIpAddress(destHost) {
        // Direct IP - check reachability
        isReachableFrom(manager, sourceIp, destHost)
      } else {
        // Hostname - must resolve via DNS first
        switch resolveHostname(manager, destHost) {
        | Some(destIp) => isReachableFrom(manager, sourceIp, destIp)
        | None => false // DNS resolution failed
        }
      }
    },
    getHostInfo: (destHost) => {
      let destIpOpt = if isIpAddress(destHost) { Some(destHost) } else { resolveHostname(manager, destHost) }
      switch destIpOpt {
      | None => None // DNS resolution failed
      | Some(destIp) =>
        if isReachableFrom(manager, sourceIp, destIp) {
          switch getDeviceInfo(manager, destIp) {
          | Some(info) =>
            let typeStr = switch info.deviceType {
            | Laptop => "laptop"
            | Server => "server"
            | Router => "router"
            | IotCamera => "camera"
            | Terminal => "terminal"
            | PowerStation => "power-station"
            | UPS => "ups"
            }
            Some((info.name, typeStr))
          | None => None
          }
        } else {
          None
        }
      }
    },
    hasSSH: (destHost) => {
      let destIpOpt = if isIpAddress(destHost) { Some(destHost) } else { resolveHostname(manager, destHost) }
      switch destIpOpt {
      | None => false // DNS resolution failed
      | Some(destIp) => isReachableFrom(manager, sourceIp, destIp) && hasSSH(manager, destIp)
      }
    },
    getAllHosts: () => getReachableHostsFrom(manager, sourceIp),
    getRemoteState: (destHost) => {
      let destIpOpt = if isIpAddress(destHost) { Some(destHost) } else { resolveHostname(manager, destHost) }
      switch destIpOpt {
      | None => None // DNS resolution failed
      | Some(destIp) =>
        if isReachableFrom(manager, sourceIp, destIp) {
          getDeviceState(manager, destIp)
        } else {
          None
        }
      }
    },
    resolveDns: (hostname) => resolveHostname(manager, hostname),
    traceRoute: (destHost) => {
      let destIpOpt = if isIpAddress(destHost) { Some(destHost) } else { resolveHostname(manager, destHost) }
      switch destIpOpt {
      | None => [] // DNS resolution failed, no route
      | Some(destIp) => getTraceRoute(manager, sourceIp, destIp)
      }
    },
  }
}

// Initialize the reference at module load time
let _ = createNetworkInterfaceForRef := Some(createNetworkInterfaceFor)
