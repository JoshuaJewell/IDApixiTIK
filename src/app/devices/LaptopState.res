// Shared Laptop State - Filesystem and Process Manager
// Uses unified Storage model (Gq) - inspired by Uplink

// ============================================
// Filesystem Types and Implementation
// ============================================

// File size in Gq (game units)
// Small files: 1 Gq, medium: 2 Gq, large: 3-4 Gq
type rec fileNode =
  | Dir({mutable contents: Dict.t<fileNode>})
  | File({mutable content: string, mutable locked: bool, size: int}) // size in Gq

type filesystem = {
  root: fileNode,
}

// Helper to calculate file size based on content length
let calcFileSize = (content: string): int => {
  let len = String.length(content)
  if len < 100 { 1 }
  else if len < 500 { 2 }
  else if len < 1000 { 3 }
  else { 4 }
}

// Create the default filesystem
let createFilesystem = (): filesystem => {
  root: Dir({
    contents: Dict.fromArray([
      ("C:", Dir({
        contents: Dict.fromArray([
          ("Users", Dir({
            contents: Dict.fromArray([
              ("Admin", Dir({
                contents: Dict.fromArray([
                  ("Documents", Dir({
                    contents: Dict.fromArray([
                      ("notes.txt", File({
                        content: `Meeting Notes:
- Server maintenance scheduled for Friday
- Update firewall rules
- Check database backup integrity
- Admin password: [REDACTED]
- VPN key stored in C:\\sys\\keys\\vpn.key`,
                        locked: false,
                        size: 1,
                      })),
                      ("passwords.txt", File({
                        content: "admin:P@ssw0rd123\nroot:toor\ndbuser:mysql_secure_2024",
                        locked: true,
                        size: 1,
                      })),
                    ]),
                  })),
                  ("Downloads", Dir({contents: Dict.make()})),
                  ("Desktop", Dir({contents: Dict.make()})),
                ]),
              })),
            ]),
          })),
          ("Program Files", Dir({
            contents: Dict.fromArray([
              ("readme.txt", File({
                content: "System programs directory",
                locked: true,
                size: 1,
              })),
            ]),
          })),
          ("sys", Dir({
            contents: Dict.fromArray([
              ("keys", Dir({
                contents: Dict.fromArray([
                  ("vpn.key", File({
                    content: "-----BEGIN VPN KEY-----\nMIIEvgIBADANBgkqhkiG9w0BAQEF\nAASCBKgwggSkAgEAAoIBAQC7x2\n-----END VPN KEY-----",
                    locked: true,
                    size: 1,
                  })),
                ]),
              })),
              ("config", Dir({
                contents: Dict.fromArray([
                  ("network.conf", File({
                    content: "INTERFACE=eth0\nDHCP=enabled\nDNS=8.8.8.8",
                    locked: true,
                    size: 1,
                  })),
                ]),
              })),
            ]),
          })),
          ("Windows", Dir({
            contents: Dict.fromArray([
              ("System32", Dir({
                contents: Dict.fromArray([
                  ("config.sys", File({
                    content: "SYSTEM CONFIGURATION\nDO NOT MODIFY",
                    locked: true,
                    size: 1,
                  })),
                ]),
              })),
            ]),
          })),
          ("secret_keys.dat", File({
            content: "ENCRYPTED KEY DATA\n---BEGIN KEY---\nABCDEF1234567890\n---END KEY---",
            locked: true,
            size: 1,
          })),
        ]),
      })),
    ]),
  }),
}

// Calculate total storage used by filesystem (recursive)
let rec getNodeSize = (node: fileNode): int => {
  switch node {
  | File({size}) => size
  | Dir({contents}) =>
    Dict.valuesToArray(contents)->Array.reduce(0, (acc, child) => acc + getNodeSize(child))
  }
}

let getFilesystemUsage = (fs: filesystem): int => {
  getNodeSize(fs.root)
}

// Resolve a path to a node
let resolvePath = (fs: filesystem, path: string): option<fileNode> => {
  let normalizedPath = String.replaceRegExp(path, %re("/\//g"), "\\")
  let parts = String.split(normalizedPath, "\\")->Array.filter(p => p != "" && p != ".")

  if Array.length(parts) == 0 {
    Some(fs.root)
  } else {
    let current = ref(fs.root)
    let found = ref(true)

    Array.forEach(parts, part => {
      if found.contents && part != ".." {
        switch current.contents {
        | Dir({contents}) =>
          switch Dict.get(contents, part) {
          | Some(node) => current := node
          | None => found := false
          }
        | File(_) => found := false
        }
      }
    })

    if found.contents { Some(current.contents) } else { None }
  }
}

// List directory contents - now includes size
let listDir = (fs: filesystem, path: string): option<array<(string, bool, bool, int)>> => {
  switch resolvePath(fs, path) {
  | Some(Dir({contents})) =>
    let items = Dict.toArray(contents)->Array.map(((name, node)) => {
      switch node {
      | Dir(d) => (name, true, false, getNodeSize(Dir(d))) // (name, isDir, isLocked, size)
      | File({locked, size}) => (name, false, locked, size)
      }
    })
    Some(items)
  | _ => None
  }
}

// Read file content
let readFile = (fs: filesystem, path: string): result<string, string> => {
  switch resolvePath(fs, path) {
  | None => Error(`File not found: ${path}`)
  | Some(Dir(_)) => Error(`Is a directory: ${path}`)
  | Some(File({locked: true, _})) => Error(`Permission denied: ${path}`)
  | Some(File({content, locked: false})) => Ok(content)
  }
}

// Get file info (for stat command)
let getFileInfo = (fs: filesystem, path: string): option<(bool, bool, int, int)> => {
  switch resolvePath(fs, path) {
  | None => None
  | Some(Dir(d)) => Some((true, false, getNodeSize(Dir(d)), 0)) // (isDir, isLocked, size, contentLen)
  | Some(File({locked, size, content})) => Some((false, locked, size, String.length(content)))
  }
}

// Write file content
let writeFile = (fs: filesystem, path: string, content: string): result<unit, string> => {
  switch resolvePath(fs, path) {
  | None => Error(`File not found: ${path}`)
  | Some(Dir(_)) => Error(`Is a directory: ${path}`)
  | Some(File({locked: true, _})) => Error(`Permission denied: ${path}`)
  | Some(File(file)) =>
    file.content = content
    Ok()
  }
}

// Create a new file
let createFile = (fs: filesystem, dirPath: string, fileName: string, content: string): result<unit, string> => {
  switch resolvePath(fs, dirPath) {
  | None => Error(`Directory not found: ${dirPath}`)
  | Some(File(_)) => Error(`Not a directory: ${dirPath}`)
  | Some(Dir(dir)) =>
    if Dict.get(dir.contents, fileName)->Option.isSome {
      Error(`File already exists: ${fileName}`)
    } else {
      Dict.set(dir.contents, fileName, File({content, locked: false, size: calcFileSize(content)}))
      Ok()
    }
  }
}

// Create a new directory
let createDir = (fs: filesystem, dirPath: string, dirName: string): result<unit, string> => {
  switch resolvePath(fs, dirPath) {
  | None => Error(`Directory not found: ${dirPath}`)
  | Some(File(_)) => Error(`Not a directory: ${dirPath}`)
  | Some(Dir(dir)) =>
    if Dict.get(dir.contents, dirName)->Option.isSome {
      Error(`Already exists: ${dirName}`)
    } else {
      Dict.set(dir.contents, dirName, Dir({contents: Dict.make()}))
      Ok()
    }
  }
}

// Delete a file or empty directory
let deleteNode = (fs: filesystem, dirPath: string, nodeName: string): result<unit, string> => {
  switch resolvePath(fs, dirPath) {
  | None => Error(`Directory not found: ${dirPath}`)
  | Some(File(_)) => Error(`Not a directory: ${dirPath}`)
  | Some(Dir(dir)) =>
    switch Dict.get(dir.contents, nodeName) {
    | None => Error(`Not found: ${nodeName}`)
    | Some(File({locked: true, _})) => Error(`Permission denied: ${nodeName}`)
    | Some(Dir({contents})) =>
      if Dict.keysToArray(contents)->Array.length > 0 {
        Error(`Directory not empty: ${nodeName}`)
      } else {
        Dict.delete(dir.contents, nodeName)
        Ok()
      }
    | Some(File(_)) =>
      Dict.delete(dir.contents, nodeName)
      Ok()
    }
  }
}

// Copy a file
let copyFile = (fs: filesystem, srcPath: string, destDirPath: string, destName: string): result<unit, string> => {
  switch resolvePath(fs, srcPath) {
  | None => Error(`Source not found: ${srcPath}`)
  | Some(Dir(_)) => Error(`Cannot copy directory: ${srcPath}`)
  | Some(File({locked: true, _})) => Error(`Permission denied: ${srcPath}`)
  | Some(File({content, size, _})) =>
    switch resolvePath(fs, destDirPath) {
    | None => Error(`Destination directory not found: ${destDirPath}`)
    | Some(File(_)) => Error(`Not a directory: ${destDirPath}`)
    | Some(Dir(dir)) =>
      if Dict.get(dir.contents, destName)->Option.isSome {
        Error(`File already exists: ${destName}`)
      } else {
        Dict.set(dir.contents, destName, File({content, locked: false, size}))
        Ok()
      }
    }
  }
}

// Move/rename a file
let moveFile = (fs: filesystem, srcDirPath: string, srcName: string, destDirPath: string, destName: string): result<unit, string> => {
  switch resolvePath(fs, srcDirPath) {
  | None => Error(`Source directory not found: ${srcDirPath}`)
  | Some(File(_)) => Error(`Not a directory: ${srcDirPath}`)
  | Some(Dir(srcDir)) =>
    switch Dict.get(srcDir.contents, srcName) {
    | None => Error(`Not found: ${srcName}`)
    | Some(File({locked: true, _})) => Error(`Permission denied: ${srcName}`)
    | Some(node) =>
      switch resolvePath(fs, destDirPath) {
      | None => Error(`Destination directory not found: ${destDirPath}`)
      | Some(File(_)) => Error(`Not a directory: ${destDirPath}`)
      | Some(Dir(destDir)) =>
        if Dict.get(destDir.contents, destName)->Option.isSome {
          Error(`Already exists: ${destName}`)
        } else {
          Dict.delete(srcDir.contents, srcName)
          Dict.set(destDir.contents, destName, node)
          Ok()
        }
      }
    }
  }
}

// Change file locked status (for chmod)
let setFileLocked = (fs: filesystem, path: string, locked: bool): result<unit, string> => {
  switch resolvePath(fs, path) {
  | None => Error(`File not found: ${path}`)
  | Some(Dir(_)) => Error(`Is a directory: ${path}`)
  | Some(File(file)) =>
    file.locked = locked
    Ok()
  }
}

// ============================================
// Process Manager Types and Implementation
// Unified Storage Model (Gq)
// ============================================

type processInfo = {
  pid: int,
  name: string,
  mutable cpuPercent: float,
  sizeGq: int, // Storage used by this process in Gq
  isSystem: bool,
}

type systemSpec = {
  totalStorageGq: int, // Total storage in Gq
  cpuCores: int,
}

type processManager = {
  spec: systemSpec,
  mutable nextPid: int,
  mutable processes: array<processInfo>,
  mutable openApps: Dict.t<int>, // app name -> pid
  mutable windowClosers: Dict.t<unit => unit>, // pid -> close callback
  mutable cpuSpike: float, // Temporary CPU spike from commands
  mutable lastSpikeTime: float, // For decay calculation
}

// Create process manager with system specs
let createProcessManager = (): processManager => {
  let spec = {
    totalStorageGq: 8192, // 8192 Gq total storage
    cpuCores: 4,
  }

  // System processes that are always running (minimal, all 1 Gq)
  let systemProcesses = [
    {pid: 1, name: "System", cpuPercent: 0.5, sizeGq: 1, isSystem: true},
    {pid: 4, name: "smss.exe", cpuPercent: 0.1, sizeGq: 1, isSystem: true},
    {pid: 128, name: "csrss.exe", cpuPercent: 0.2, sizeGq: 1, isSystem: true},
    {pid: 256, name: "services.exe", cpuPercent: 0.3, sizeGq: 1, isSystem: true},
    {pid: 512, name: "lsass.exe", cpuPercent: 0.2, sizeGq: 1, isSystem: true},
    {pid: 768, name: "svchost.exe", cpuPercent: 0.8, sizeGq: 1, isSystem: true},
    {pid: 1024, name: "explorer.exe", cpuPercent: 1.5, sizeGq: 2, isSystem: true},
    {pid: 1280, name: "dwm.exe", cpuPercent: 1.2, sizeGq: 1, isSystem: true},
    {pid: 1536, name: "secmon.exe", cpuPercent: 0.5, sizeGq: 1, isSystem: true},
  ]

  {
    spec,
    nextPid: 2000,
    processes: systemProcesses,
    openApps: Dict.make(),
    windowClosers: Dict.make(),
    cpuSpike: 0.0,
    lastSpikeTime: 0.0,
  }
}

// App storage requirements (in Gq) - all basic apps are 1-2 Gq
let appSize = (appName: string): int => {
  switch appName {
  | "explorer.exe" => 2   // File Manager
  | "notepad.exe" => 1    // Notepad
  | "netman.exe" => 1     // Network Manager
  | "taskmgr.exe" => 1    // Process Explorer
  | "cmd.exe" => 1        // Terminal
  | "recyclebin.exe" => 1 // Recycle Bin
  | _ => 1
  }
}

// Open an application (returns pid)
let openApp = (pm: processManager, appName: string): int => {
  // Check if already open
  switch Dict.get(pm.openApps, appName) {
  | Some(pid) => pid
  | None =>
    let pid = pm.nextPid
    pm.nextPid = pm.nextPid + 1

    // Base CPU usage for app (low, will spike with activity)
    let cpuPercent = 0.3 +. Int.toFloat(mod(pid, 10)) /. 20.0

    let process = {
      pid,
      name: appName,
      cpuPercent,
      sizeGq: appSize(appName),
      isSystem: false,
    }

    pm.processes = Array.concat(pm.processes, [process])
    Dict.set(pm.openApps, appName, pid)
    pid
  }
}

// Register a window closer callback for a PID
let registerWindowCloser = (pm: processManager, pid: int, closer: unit => unit): unit => {
  Dict.set(pm.windowClosers, Int.toString(pid), closer)
}

// Close an application
let closeApp = (pm: processManager, appName: string): unit => {
  switch Dict.get(pm.openApps, appName) {
  | None => ()
  | Some(pid) =>
    pm.processes = Array.filter(pm.processes, p => p.pid != pid)
    Dict.delete(pm.openApps, appName)
    Dict.delete(pm.windowClosers, Int.toString(pid))
  }
}

// Kill a process by PID
let killProcess = (pm: processManager, pid: int): result<unit, string> => {
  switch Array.find(pm.processes, p => p.pid == pid) {
  | None => Error(`No such process: ${Int.toString(pid)}`)
  | Some(proc) =>
    if proc.isSystem {
      Error(`Cannot kill system process: ${proc.name}`)
    } else {
      // Call the window closer if registered
      switch Dict.get(pm.windowClosers, Int.toString(pid)) {
      | Some(closer) => closer()
      | None => ()
      }
      pm.processes = Array.filter(pm.processes, p => p.pid != pid)
      // Also remove from openApps if it's there
      Dict.toArray(pm.openApps)->Array.forEach(((name, appPid)) => {
        if appPid == pid {
          Dict.delete(pm.openApps, name)
        }
      })
      Dict.delete(pm.windowClosers, Int.toString(pid))
      Ok()
    }
  }
}

// Get all processes
let getProcesses = (pm: processManager): array<processInfo> => pm.processes

// Get storage usage (processes + can be extended for files)
let getProcessStorageUsage = (pm: processManager): int => {
  Array.reduce(pm.processes, 0, (acc, p) => acc + p.sizeGq)
}

// Get total storage usage (processes + filesystem)
let getTotalStorageUsage = (pm: processManager, fs: filesystem): (int, int) => {
  let processUsage = getProcessStorageUsage(pm)
  let fileUsage = getFilesystemUsage(fs)
  (processUsage + fileUsage, pm.spec.totalStorageGq)
}

// Add CPU spike (called when running commands)
let addCpuSpike = (pm: processManager, amount: float): unit => {
  pm.cpuSpike = pm.cpuSpike +. amount
  // Cap at reasonable max
  if pm.cpuSpike > 50.0 {
    pm.cpuSpike = 50.0
  }
}

// Update CPU spike decay (call this periodically, e.g., every frame)
let updateCpuSpike = (pm: processManager, deltaSeconds: float): unit => {
  // Decay spike over time (lose ~20% per second)
  pm.cpuSpike = pm.cpuSpike *. (1.0 -. deltaSeconds *. 2.0)
  if pm.cpuSpike < 0.1 {
    pm.cpuSpike = 0.0
  }
}

// Get CPU usage (base + spike)
let getCpuUsage = (pm: processManager): float => {
  let base = Array.reduce(pm.processes, 0.0, (acc, p) => acc +. p.cpuPercent)
  let total = base +. pm.cpuSpike
  let maxCpu = Int.toFloat(pm.spec.cpuCores) *. 100.0
  if total < maxCpu { total } else { maxCpu }
}

// ============================================
// Global Laptop State
// ============================================

// Forward declaration for SSH session support
type rec laptopState = {
  filesystem: filesystem,
  processManager: processManager,
  mutable commandHistory: array<string>,
  mutable loginHistory: array<(string, string)>, // (user, timestamp)
  mutable currentUser: string,
  mutable bootTime: float,
  mutable ipAddress: string,
  mutable hostname: string,
  mutable networkInterface: option<networkInterface>,
}

// Network interface for terminal commands
and networkInterface = {
  ping: string => bool,  // Returns true if host is reachable
  getHostInfo: string => option<(string, string)>,  // Returns (hostname, deviceType)
  hasSSH: string => bool, // Returns true if host has SSH
  getAllHosts: unit => array<string>, // Returns all IPs on the network
  getRemoteState: string => option<laptopState>, // Get remote device state for SSH
  resolveDns: string => option<string>, // Resolve hostname to IP
  traceRoute: string => array<(string, string, int)>, // Get trace route to destination (ip, name, latency)
}

// Create a new laptop state with configurable IP and hostname
let createLaptopState = (~ipAddress: string="192.168.1.102", ~hostname: string="WORKSTATION-PC", ()): laptopState => {
  filesystem: createFilesystem(),
  processManager: createProcessManager(),
  commandHistory: [],
  loginHistory: [("Admin", "Dec 07 22:15:32"), ("Admin", "Dec 06 10:23:01")],
  currentUser: "Admin",
  bootTime: 0.0, // Will be set when system "boots"
  ipAddress,
  hostname,
  networkInterface: None,
}

// Set the network interface (called after NetworkManager is available)
let setNetworkInterface = (state: laptopState, ni: networkInterface): unit => {
  state.networkInterface = Some(ni)
}

// Add command to history
let addToHistory = (state: laptopState, cmd: string): unit => {
  state.commandHistory = Array.concat(state.commandHistory, [cmd])
}

// Clear command history
let clearHistory = (state: laptopState): unit => {
  state.commandHistory = []
}

// Get command history
let getHistory = (state: laptopState): array<string> => state.commandHistory
