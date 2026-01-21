import { Container, Graphics, Text, TextStyle } from "pixi.js";

/** Interactive Terminal Component */
export class Terminal extends Container {
  private bg: Graphics;
  private outputLines: Text[] = [];
  private commandHistory: string[] = [];
  private currentDirectory: string = "/";
  private maxLines: number = 20;
  private lineHeight: number = 16;
  private inputLine: Text;
  private cursorBlink: number = 0;
  private showCursor: boolean = true;
  private currentInput: string = "";

  // Filesystem simulation
  private filesystem: { [key: string]: any } = {
    "/": {
      type: "dir",
      contents: {
        "home": { type: "dir", contents: {
          "user": { type: "dir", contents: {
            "documents": { type: "dir", contents: {
              "passwords.txt": { type: "file", content: "admin:P@ssw0rd123\nroot:toor\ndbuser:mysql_secure_2024", locked: true },
              "notes.txt": { type: "file", content: "Meeting at 3pm\nRemember to update firewall rules" }
            }},
            "downloads": { type: "dir", contents: {} }
          }}
        }},
        "sys": { type: "dir", contents: {
          "config": { type: "dir", contents: {
            "network.conf": { type: "file", content: "DHCP=enabled\nDNS=8.8.8.8", locked: true }
          }}
        }},
        "var": { type: "dir", contents: {
          "log": { type: "dir", contents: {
            "access.log": { type: "file", content: "[2024-12-06 10:23] User login: admin\n[2024-12-06 10:45] Failed login attempt: user" }
          }}
        }}
      }
    }
  };

  constructor(
    private width: number,
    private height: number,
    private prompt: string = "> ",
    private onCommand?: (cmd: string, args: string[]) => string | void
  ) {
    super();
    this.eventMode = 'static';

    // Background
    this.bg = new Graphics();
    this.bg.rect(0, 0, width, height).fill(0x000000);
    this.addChild(this.bg);

    // Input line at bottom
    const monoStyle = new TextStyle({
      fontFamily: 'monospace',
      fontSize: 11,
      fill: 0x00ff00
    });

    this.inputLine = new Text({
      text: this.prompt,
      style: monoStyle
    });
    this.inputLine.x = 10;
    this.inputLine.y = height - 25;
    this.addChild(this.inputLine);

    // Welcome message
    this.addOutput("Terminal initialized. Type 'help' for commands.");
    this.addOutput("");

    // Setup keyboard input
    this.setupKeyboardInput();
  }

  private setupKeyboardInput() {
    // Make terminal focusable
    this.bg.eventMode = 'static';
    this.bg.cursor = 'text';

    // Track focus state
    let isFocused = false;

    this.bg.on('pointerdown', () => {
      isFocused = true;
      this.bg.alpha = 1;
    });

    window.addEventListener('pointerdown', (e) => {
      // Check if click is outside terminal
      const target = e.target as HTMLElement;
      if (!target.closest('canvas')) {
        isFocused = false;
        this.bg.alpha = 0.95;
      }
    });

    window.addEventListener('keydown', (e) => {
      if (!isFocused || !this.worldVisible) return;

      e.preventDefault();

      if (e.key === 'Enter') {
        this.executeCommand();
      } else if (e.key === 'Backspace') {
        this.currentInput = this.currentInput.slice(0, -1);
        this.updateInputLine();
      } else if (e.key.length === 1 && !e.ctrlKey && !e.metaKey) {
        this.currentInput += e.key;
        this.updateInputLine();
      }
    });
  }

  private updateInputLine() {
    const cursor = this.showCursor ? '_' : ' ';
    this.inputLine.text = `${this.currentDirectory}${this.prompt}${this.currentInput}${cursor}`;
  }

  private executeCommand() {
    const fullCommand = this.currentInput.trim();
    if (!fullCommand) {
      this.addOutput("");
      this.currentInput = "";
      this.updateInputLine();
      return;
    }

    // Add command to output
    this.addOutput(`${this.currentDirectory}${this.prompt}${fullCommand}`);

    const parts = fullCommand.split(' ');
    const cmd = parts[0];
    const args = parts.slice(1);

    // Execute command
    let output = "";

    // Try custom handler first
    if (this.onCommand) {
      const customOutput = this.onCommand(cmd, args);
      if (customOutput !== undefined) {
        output = customOutput;
      }
    }

    // Built-in commands
    if (!output) {
      output = this.handleBuiltInCommand(cmd, args);
    }

    if (output) {
      this.addOutput(output);
    }

    this.commandHistory.push(fullCommand);
    this.currentInput = "";
    this.updateInputLine();
  }

  private handleBuiltInCommand(cmd: string, args: string[]): string {
    switch(cmd) {
      case 'help':
        return `Available commands:
  ls [path]       - List directory contents
  cd <path>       - Change directory
  cat <file>      - Display file contents
  pwd             - Print working directory
  mkdir <name>    - Create directory
  rm <file>       - Remove file
  cp <src> <dst>  - Copy file
  clear           - Clear terminal
  help            - Show this help`;

      case 'clear':
        this.outputLines.forEach(line => line.destroy());
        this.outputLines = [];
        return "";

      case 'pwd':
        return this.currentDirectory;

      case 'ls':
        return this.listDirectory(args[0] || this.currentDirectory);

      case 'cd':
        return this.changeDirectory(args[0] || "/");

      case 'cat':
        if (!args[0]) return "cat: missing file operand";
        return this.readFile(args[0]);

      case 'mkdir':
        if (!args[0]) return "mkdir: missing operand";
        return this.makeDirectory(args[0]);

      case 'rm':
        if (!args[0]) return "rm: missing operand";
        return this.removeFile(args[0]);

      case 'cp':
        if (args.length < 2) return "cp: missing operands";
        return this.copyFile(args[0], args[1]);

      default:
        return `bash: ${cmd}: command not found`;
    }
  }

  private resolvePath(path: string): any {
    if (path === "/") return this.filesystem["/"];

    const parts = path.startsWith("/")
      ? path.slice(1).split('/').filter(p => p)
      : (this.currentDirectory.slice(1) + "/" + path).split('/').filter(p => p);

    let current = this.filesystem["/"];

    for (const part of parts) {
      if (part === "..") {
        // Handle parent directory - simplified
        continue;
      }
      if (!current.contents || !current.contents[part]) {
        return null;
      }
      current = current.contents[part];
    }

    return current;
  }

  private listDirectory(path: string): string {
    const dir = this.resolvePath(path);
    if (!dir) return `ls: cannot access '${path}': No such file or directory`;
    if (dir.type !== "dir") return `ls: ${path}: Not a directory`;

    const items = Object.entries(dir.contents).map(([name, item]: [string, any]) => {
      const prefix = item.type === "dir" ? "[DIR]" : "[FILE]";
      const lock = item.locked ? " [LOCKED]" : "";
      return `${prefix} ${name}${lock}`;
    });

    return items.length ? items.join('\n') : "(empty directory)";
  }

  private changeDirectory(path: string): string {
    if (path === "..") {
      const parts = this.currentDirectory.split('/').filter(p => p);
      parts.pop();
      this.currentDirectory = "/" + parts.join('/');
      if (this.currentDirectory === "/") this.currentDirectory = "/";
      return "";
    }

    const dir = this.resolvePath(path);
    if (!dir) return `cd: ${path}: No such file or directory`;
    if (dir.type !== "dir") return `cd: ${path}: Not a directory`;

    this.currentDirectory = path.startsWith("/") ? path : this.currentDirectory + "/" + path;
    if (!this.currentDirectory.startsWith("/")) this.currentDirectory = "/" + this.currentDirectory;
    return "";
  }

  private readFile(path: string): string {
    const file = this.resolvePath(path);
    if (!file) return `cat: ${path}: No such file or directory`;
    if (file.type !== "file") return `cat: ${path}: Is a directory`;
    if (file.locked) return `cat: ${path}: Permission denied`;

    return file.content || "(empty file)";
  }

  private makeDirectory(name: string): string {
    // Simplified - would need proper path handling
    return "mkdir: operation not yet implemented";
  }

  private removeFile(path: string): string {
    return "rm: operation requires elevated privileges";
  }

  private copyFile(src: string, dst: string): string {
    return "cp: operation not yet implemented";
  }

  private addOutput(text: string) {
    const monoStyle = new TextStyle({
      fontFamily: 'monospace',
      fontSize: 11,
      fill: 0x00ff00
    });

    const lines = text.split('\n');
    lines.forEach(line => {
      const textObj = new Text({ text: line, style: monoStyle });
      textObj.x = 10;
      textObj.y = 10 + this.outputLines.length * this.lineHeight;
      this.addChild(textObj);
      this.outputLines.push(textObj);
    });

    // Remove old lines if too many
    while (this.outputLines.length > this.maxLines) {
      const oldLine = this.outputLines.shift();
      if (oldLine) {
        oldLine.destroy();
      }
    }

    // Re-position all lines
    this.outputLines.forEach((line, i) => {
      line.y = 10 + i * this.lineHeight;
    });
  }

  public update(deltaTime: number) {
    this.cursorBlink += deltaTime;
    if (this.cursorBlink > 0.5) {
      this.showCursor = !this.showCursor;
      this.cursorBlink = 0;
      this.updateInputLine();
    }
  }
}
