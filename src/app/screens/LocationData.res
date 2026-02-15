// Location data and device distribution for the world map system

type location = {
  id: string,
  name: string,
  description: string,
  devicePositions: array<(string, float)>, // (IP address, x position)
  environment: string,
  worldWidth: float,
  backgroundColor: int,
}

// Define all locations in the game world
let allLocations: array<location> = [
  {
    id: "field",
    name: "Rural Outpost",
    description: "A quiet home network in the countryside",
    devicePositions: [
      ("192.168.2.1", 800.0),     // Rural Router
      ("192.168.2.100", 1600.0),  // Rural Laptop
    ],
    environment: "field",
    worldWidth: 3000.0,
    backgroundColor: 0x87CEEB, // Sky blue
  },
  {
    id: "city",
    name: "Downtown Office",
    description: "Corporate network with critical servers",
    devicePositions: [
      ("192.168.1.1", 300.0),     // Main Router
      ("192.168.1.102", 600.0),   // Corp Laptop 42
      ("192.168.1.103", 900.0),   // Corp Laptop 17
      ("192.168.1.105", 1200.0),  // Security Camera
      ("192.168.1.200", 1500.0),  // Admin Panel
      ("192.168.1.251", 1800.0),  // UPS
      ("10.0.0.25", 2100.0),      // Mail server
      ("10.0.0.50", 2400.0),      // DB server
    ],
    environment: "city",
    worldWidth: 3000.0,
    backgroundColor: 0x4A4A4A, // Urban gray
  },
  {
    id: "lab",
    name: "Research Facility",
    description: "High-security infrastructure with power systems",
    devicePositions: [
      ("192.168.1.250", 800.0),   // Power Station
      ("10.0.0.77", 1400.0),      // Dev terminal
      ("10.0.0.99", 2000.0),      // Secret server
      ("10.0.0.100", 2600.0),     // Corp intranet
    ],
    environment: "lab",
    worldWidth: 3000.0,
    backgroundColor: 0x1a1a2e, // Dark lab
  },
  {
    id: "atlas",
    name: "Atlas Data Center",
    description: "Public DNS and web services provider",
    devicePositions: [
      ("8.8.8.1", 400.0),         // Atlas Router
      ("8.8.8.8", 1100.0),        // Atlas DNS
      ("142.250.80.46", 1900.0),  // Atlas Web
    ],
    environment: "datacenter",
    worldWidth: 3000.0,
    backgroundColor: 0x4285F4, // Blue
  },
  {
    id: "nexus",
    name: "Nexus CDN",
    description: "Global content delivery network",
    devicePositions: [
      ("1.1.1.254", 400.0),       // Nexus Router
      ("1.1.1.1", 1100.0),        // Nexus DNS
      ("104.16.132.229", 1900.0), // Nexus Web
    ],
    environment: "datacenter",
    worldWidth: 3000.0,
    backgroundColor: 0xF38020, // Orange
  },
  {
    id: "devhub",
    name: "DevHub Repository",
    description: "Source code hosting platform",
    devicePositions: [
      ("140.82.121.1", 700.0),    // DevHub Router
      ("140.82.121.4", 1600.0),   // DevHub Web
    ],
    environment: "datacenter",
    worldWidth: 3000.0,
    backgroundColor: 0x24292e, // Dark
  },
  {
    id: "rural-isp",
    name: "Rural ISP",
    description: "Local internet service provider",
    devicePositions: [
      ("100.64.1.1", 800.0),      // Rural ISP Router
    ],
    environment: "datacenter",
    worldWidth: 2000.0,
    backgroundColor: 0x1a4d2e, // Dark green
  },
  {
    id: "business-isp",
    name: "Business ISP",
    description: "Enterprise connectivity provider",
    devicePositions: [
      ("100.64.2.1", 800.0),      // Business ISP Router
    ],
    environment: "datacenter",
    worldWidth: 2000.0,
    backgroundColor: 0x1e3a5f, // Dark blue
  },
  {
    id: "regional-isp",
    name: "Regional ISP",
    description: "Regional network aggregation point",
    devicePositions: [
      ("198.51.100.1", 800.0),    // Regional ISP Router
    ],
    environment: "datacenter",
    worldWidth: 2000.0,
    backgroundColor: 0x4a1e4a, // Dark purple
  },
  {
    id: "backbone",
    name: "Internet Backbone",
    description: "Tier 1 core internet infrastructure",
    devicePositions: [
      ("203.0.113.1", 800.0),     // Tier 1 Backbone Router
    ],
    environment: "datacenter",
    worldWidth: 2000.0,
    backgroundColor: 0x2e1a1a, // Dark red
  },
]

// Get location by ID
let getLocationById = (id: string): option<location> => {
  Array.find(allLocations, loc => loc.id == id)
}

// Get all location IDs
let getAllLocationIds = (): array<string> => {
  Array.map(allLocations, loc => loc.id)
}

// Get location count
let getLocationCount = (): int => {
  Array.length(allLocations)
}

// Check if location exists
let locationExists = (id: string): bool => {
  Array.some(allLocations, loc => loc.id == id)
}
