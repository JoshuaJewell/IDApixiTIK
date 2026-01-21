// Interactive Terminal Component

open Pixi

type rec fileNode =
  | Dir({contents: Dict.t<fileNode>})
  | File({content: string, locked: bool})

type t = {
  container: Container.t,
  bg: Graphics.t,
  mutable outputLines: array<Text.t>,
  mutable commandHistory: array<string>,
  mutable currentDirectory: string,
  mutable currentInput: string,
  mutable showCursor: bool,
  mutable cursorBlink: float,
  inputLine: Text.t,
  prompt: string,
  width: float,
  height: float,
  maxLines: int,
  lineHeight: float,
  filesystem: fileNode,
  ipAddress: option<string>,  // Optional IP of the device this terminal runs on
}

// Create the filesystem
let createFilesystem = (): fileNode => {
  Dir({
    contents: Dict.fromArray([
      ("home", Dir({
        contents: Dict.fromArray([
          ("user", Dir({
            contents: Dict.fromArray([
              ("documents", Dir({
                contents: Dict.fromArray([
                  ("passwords.txt", File({
                    content: "admin:P@ssw0rd123\nroot:toor\ndbuser:mysql_secure_2024",
                    locked: true,
                  })),
                  ("notes.txt", File({
                    content: "Meeting at 3pm\nRemember to update firewall rules",
                    locked: false,
                  })),
                ]),
              })),
              ("downloads", Dir({contents: Dict.make()})),
            ]),
          })),
        ]),
      })),
      ("sys", Dir({
        contents: Dict.fromArray([
          ("config", Dir({
            contents: Dict.fromArray([
              ("network.conf", File({
                content: "DHCP=enabled\nDNS=8.8.8.8",
                locked: true,
              })),
            ]),
          })),
        ]),
      })),
      ("var", Dir({
        contents: Dict.fromArray([
          ("log", Dir({
            contents: Dict.fromArray([
              ("access.log", File({
                content: "[2024-12-06 10:23] User login: admin\n[2024-12-06 10:45] Failed login attempt: user",
                locked: false,
              })),
            ]),
          })),
        ]),
      })),
    ]),
  })
}

// Resolve a path to a node
let resolvePath = (terminal: t, path: string): option<fileNode> => {
  if path == "/" {
    Some(terminal.filesystem)
  } else {
    let parts = if String.startsWith(path, "/") {
      String.split(String.sliceToEnd(path, ~start=1), "/")->Array.filter(p => p != "")
    } else {
      let currentPath = String.sliceToEnd(terminal.currentDirectory, ~start=1)
      String.split(currentPath ++ "/" ++ path, "/")->Array.filter(p => p != "")
    }

    let current = ref(terminal.filesystem)
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

// Add output to terminal
let addOutput = (terminal: t, text: string): unit => {
  let monoStyle = {"fontFamily": "monospace", "fontSize": 11, "fill": 0x00ff00}

  let lines = String.split(text, "\n")
  Array.forEach(lines, line => {
    let textObj = Text.make({"text": line, "style": monoStyle})
    Text.setX(textObj, 10.0)
    Text.setY(textObj, 10.0 +. Int.toFloat(Array.length(terminal.outputLines)) *. terminal.lineHeight)
    let _ = Container.addChildText(terminal.container, textObj)
    terminal.outputLines = Array.concat(terminal.outputLines, [textObj])
  })

  // Remove old lines
  while Array.length(terminal.outputLines) > terminal.maxLines {
    switch Array.get(terminal.outputLines, 0) {
    | Some(oldLine) =>
      Text.destroy(oldLine)
      terminal.outputLines = Array.sliceToEnd(terminal.outputLines, ~start=1)
    | None => ()
    }
  }

  // Reposition lines
  Array.forEachWithIndex(terminal.outputLines, (line, i) => {
    Text.setY(line, 10.0 +. Int.toFloat(i) *. terminal.lineHeight)
  })
}

// Update input line display
let updateInputLine = (terminal: t): unit => {
  let cursor = if terminal.showCursor { "_" } else { " " }
  Text.setText(terminal.inputLine, terminal.currentDirectory ++ terminal.prompt ++ terminal.currentInput ++ cursor)
}

// List directory
let listDirectory = (terminal: t, path: string): string => {
  switch resolvePath(terminal, path) {
  | None => `ls: cannot access '${path}': No such file or directory`
  | Some(File(_)) => `ls: ${path}: Not a directory`
  | Some(Dir({contents})) =>
    let items = Dict.keysToArray(contents)->Array.map(name => {
      switch Dict.get(contents, name) {
      | Some(Dir(_)) => `[DIR] ${name}`
      | Some(File({locked})) =>
        let lock = if locked { " [LOCKED]" } else { "" }
        `[FILE] ${name}${lock}`
      | None => ""
      }
    })
    if Array.length(items) == 0 {
      "(empty directory)"
    } else {
      Array.join(items, "\n")
    }
  }
}

// Change directory
let changeDirectory = (terminal: t, path: string): string => {
  if path == ".." {
    let parts = String.split(terminal.currentDirectory, "/")->Array.filter(p => p != "")
    let _ = Array.pop(parts)
    terminal.currentDirectory = "/" ++ Array.join(parts, "/")
    if terminal.currentDirectory == "/" {
      terminal.currentDirectory = "/"
    }
    ""
  } else {
    switch resolvePath(terminal, path) {
    | None => `cd: ${path}: No such file or directory`
    | Some(File(_)) => `cd: ${path}: Not a directory`
    | Some(Dir(_)) =>
      terminal.currentDirectory = if String.startsWith(path, "/") {
        path
      } else {
        terminal.currentDirectory ++ "/" ++ path
      }
      if !String.startsWith(terminal.currentDirectory, "/") {
        terminal.currentDirectory = "/" ++ terminal.currentDirectory
      }
      ""
    }
  }
}

// Read file
let readFile = (terminal: t, path: string): string => {
  switch resolvePath(terminal, path) {
  | None => `cat: ${path}: No such file or directory`
  | Some(Dir(_)) => `cat: ${path}: Is a directory`
  | Some(File({locked: true, _})) => `cat: ${path}: Permission denied`
  | Some(File({content, locked: false})) =>
    if content == "" { "(empty file)" } else { content }
  }
}

// Handle built-in commands
let handleBuiltInCommand = (terminal: t, cmd: string, args: array<string>): string => {
  switch cmd {
  | "help" => `Available commands:
  ls [path]       - List directory contents
  cd <path>       - Change directory
  cat <file>      - Display file contents
  pwd             - Print working directory
  mkdir <name>    - Create directory
  rm <file>       - Remove file
  cp <src> <dst>  - Copy file
  clear           - Clear terminal
  shutdown        - Shutdown this device
  reboot          - Reboot this device
  help            - Show this help`
  | "clear" =>
    Array.forEach(terminal.outputLines, line => Text.destroy(line))
    terminal.outputLines = []
    ""
  | "pwd" => terminal.currentDirectory
  | "ls" =>
    let path = Array.get(args, 0)->Option.getOr(terminal.currentDirectory)
    listDirectory(terminal, path)
  | "cd" =>
    let path = Array.get(args, 0)->Option.getOr("/")
    changeDirectory(terminal, path)
  | "cat" =>
    switch Array.get(args, 0) {
    | None => "cat: missing file operand"
    | Some(path) => readFile(terminal, path)
    }
  | "mkdir" => "mkdir: operation not yet implemented"
  | "rm" => "rm: operation requires elevated privileges"
  | "cp" => "cp: operation not yet implemented"
  | "shutdown" =>
    switch terminal.ipAddress {
    | Some(ip) =>
      PowerManager.manualShutdownDevice(ip)
      "System is shutting down..."
    | None => "shutdown: cannot determine device IP"
    }
  | "reboot" =>
    switch terminal.ipAddress {
    | Some(ip) =>
      // Reboot = shutdown then immediately boot
      let wasShutdown = PowerManager.isDeviceShutdown(ip)
      if wasShutdown {
        // Already shutdown, just boot
        if PowerManager.deviceHasPower(ip) {
          PowerManager.bootDevice(ip)
          "System is rebooting..."
        } else {
          "reboot: no power available"
        }
      } else {
        // Shutdown then boot
        PowerManager.manualShutdownDevice(ip)
        if PowerManager.deviceHasPower(ip) {
          PowerManager.bootDevice(ip)
          "System is rebooting..."
        } else {
          "reboot: no power available after shutdown"
        }
      }
    | None => "reboot: cannot determine device IP"
    }
  | _ => `bash: ${cmd}: command not found`
  }
}

// Execute command
let executeCommand = (terminal: t): unit => {
  let fullCommand = String.trim(terminal.currentInput)
  if fullCommand == "" {
    addOutput(terminal, "")
    terminal.currentInput = ""
    updateInputLine(terminal)
  } else {
    addOutput(terminal, terminal.currentDirectory ++ terminal.prompt ++ fullCommand)

    let parts = String.split(fullCommand, " ")->Array.filter(p => p != "")
    let cmd = Array.get(parts, 0)->Option.getOr("")
    let args = Array.sliceToEnd(parts, ~start=1)

    let output = handleBuiltInCommand(terminal, cmd, args)
    if output != "" {
      addOutput(terminal, output)
    }

    terminal.commandHistory = Array.concat(terminal.commandHistory, [fullCommand])
    terminal.currentInput = ""
    updateInputLine(terminal)
  }
}

// Global focus tracker stored on window object for JS access
let setGlobalFocusedTerminal: option<t> => unit = %raw(`
  function(terminal) {
    window.__focusedTerminal = terminal;
  }
`)

let getGlobalFocusedTerminal: unit => option<t> = %raw(`
  function() {
    return window.__focusedTerminal || undefined;
  }
`)

// Handle key input for a terminal
let handleKeyInput = (terminal: t, key: string): unit => {
  if key == "Enter" {
    executeCommand(terminal)
  } else if key == "Backspace" {
    terminal.currentInput = String.slice(terminal.currentInput, ~start=0, ~end=String.length(terminal.currentInput) - 1)
    updateInputLine(terminal)
  } else if String.length(key) == 1 {
    terminal.currentInput = terminal.currentInput ++ key
    updateInputLine(terminal)
  }
}

// Setup keyboard handler (external JS)
let setupGlobalKeyboardHandler: (unit => option<t>, (t, string) => unit) => unit = %raw(`
  function(getFocused, handleKey) {
    if (!window.__terminalKeyboardSetup) {
      window.__terminalKeyboardSetup = true;
      console.log('[Terminal] Setting up global keyboard handler');
      window.addEventListener('keydown', (e) => {
        const focused = getFocused();
        // PixiJS v8 uses 'visible' property, check if container exists and is visible
        const isVisible = focused?.container?.visible !== false;
        if (!focused || !isVisible) return;

        // Only prevent default for our terminal keys
        if (e.key === 'Enter' || e.key === 'Backspace' || (e.key.length === 1 && !e.ctrlKey && !e.metaKey)) {
          e.preventDefault();
          handleKey(focused, e.key);
        }
      });
    }
  }
`)

// Debug log helper
let logFocus: string => unit = %raw(`function(msg) { console.log('[Terminal]', msg); }`)

// Focus this terminal
let focus = (terminal: t): unit => {
  logFocus("Focusing terminal")
  setGlobalFocusedTerminal(Some(terminal))
  Graphics.setAlpha(terminal.bg, 1.0)
}

// Unfocus terminal
let unfocus = (terminal: t): unit => {
  switch getGlobalFocusedTerminal() {
  | Some(focused) if focused === terminal =>
    setGlobalFocusedTerminal(None)
    Graphics.setAlpha(terminal.bg, 0.9)
  | _ => ()
  }
}

// Create a terminal
let make = (~width: float, ~height: float, ~prompt: string="> ", ~ipAddress: option<string>=?, ()): t => {
  let container = Container.make()
  Container.setEventMode(container, "static")

  // Background
  let bg = Graphics.make()
  let _ = bg->Graphics.rect(0.0, 0.0, width, height)->Graphics.fillColor(0x000000)
  Graphics.setEventMode(bg, "static")
  Graphics.setCursor(bg, "text")
  let _ = Container.addChildGraphics(container, bg)

  // Input line at bottom
  let monoStyle = {"fontFamily": "monospace", "fontSize": 11, "fill": 0x00ff00}
  let inputLine = Text.make({"text": prompt, "style": monoStyle})
  Text.setX(inputLine, 10.0)
  Text.setY(inputLine, height -. 25.0)
  let _ = Container.addChildText(container, inputLine)

  let terminal = {
    container,
    bg,
    outputLines: [],
    commandHistory: [],
    currentDirectory: "/",
    currentInput: "",
    showCursor: true,
    cursorBlink: 0.0,
    inputLine,
    prompt,
    width,
    height,
    maxLines: 20,
    lineHeight: 16.0,
    filesystem: createFilesystem(),
    ipAddress,
  }

  // Welcome message
  addOutput(terminal, "Terminal initialized. Type 'help' for commands.")
  addOutput(terminal, "")

  // Setup keyboard input - use global focus management
  Graphics.on(bg, "pointerdown", _ => {
    focus(terminal)
  })

  // Setup the global keyboard handler (only adds listener once)
  // Pass in the getter and handler functions so JS can call them
  setupGlobalKeyboardHandler(getGlobalFocusedTerminal, handleKeyInput)

  terminal
}

// Update cursor blink
let update = (terminal: t, deltaTime: float): unit => {
  terminal.cursorBlink = terminal.cursorBlink +. deltaTime
  if terminal.cursorBlink > 0.5 {
    terminal.showCursor = !terminal.showCursor
    terminal.cursorBlink = 0.0
    updateInputLine(terminal)
  }
}
