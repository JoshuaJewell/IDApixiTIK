import { Container, Graphics, Text, TextStyle, FederatedPointerEvent } from "pixi.js";
import { Terminal } from "./Terminal";

/** Simple draggable application window */
class AppWindow extends Container {
  private titleBar: Graphics;
  private content: Container;
  private closeBtn: Graphics;
  private isDragging = false;
  private dragOffset = { x: 0, y: 0 };
  private onMoveBound: (e: FederatedPointerEvent) => void;
  private onUpBound: () => void;

  constructor(
    private title: string,
    private w: number,
    private h: number
  ) {
    super();
    this.eventMode = 'static';
    this.zIndex = 1;

    // Bind event handlers
    this.onMoveBound = this.onMove.bind(this);
    this.onUpBound = this.onUp.bind(this);

    // Window background
    const bg = new Graphics();
    bg.rect(0, 0, w, h).fill(0xf0f0f0).stroke({ width: 1, color: 0x000000 });
    this.addChild(bg);

    // Title bar
    this.titleBar = new Graphics();
    this.titleBar.rect(0, 0, w, 25).fill(0x0078D4);
    this.titleBar.eventMode = 'static';
    this.titleBar.cursor = 'grab';
    this.addChild(this.titleBar);

    const titleText = new Text({
      text: title,
      style: { fontSize: 12, fill: 0xffffff, fontFamily: 'Arial' }
    });
    titleText.x = 5;
    titleText.y = 6;
    this.titleBar.addChild(titleText);

    // Close button
    this.closeBtn = new Graphics();
    this.closeBtn.rect(w - 25, 2, 20, 20).fill(0xff0000);
    this.closeBtn.eventMode = 'static';
    this.closeBtn.cursor = 'pointer';
    const closeX = new Text({ text: "X", style: { fontSize: 12, fill: 0xffffff } });
    closeX.x = w - 18;
    closeX.y = 5;
    this.closeBtn.addChild(closeX);
    this.closeBtn.on("pointertap", () => this.close());
    this.titleBar.addChild(this.closeBtn);

    // Content area
    this.content = new Container();
    this.content.y = 25;
    this.addChild(this.content);

    // Setup dragging
    this.titleBar.on("pointerdown", (e) => this.startDrag(e));
  }

  private startDrag(e: FederatedPointerEvent) {
    this.isDragging = true;
    this.titleBar.cursor = 'grabbing';
    this.dragOffset = { x: e.global.x - this.x, y: e.global.y - this.y };

    if (this.parent) {
      this.parent.on("pointermove", this.onMoveBound);
      this.parent.on("pointerup", this.onUpBound);
      this.parent.on("pointerupoutside", this.onUpBound);
    }
  }

  private onMove(e: FederatedPointerEvent) {
    if (!this.isDragging) return;
    this.x = e.global.x - this.dragOffset.x;
    this.y = e.global.y - this.dragOffset.y;
  }

  private onUp() {
    this.isDragging = false;
    this.titleBar.cursor = 'grab';

    if (this.parent) {
      this.parent.off("pointermove", this.onMoveBound);
      this.parent.off("pointerup", this.onUpBound);
      this.parent.off("pointerupoutside", this.onUpBound);
    }
  }

  private close() {
    if (this.parent) {
      this.parent.off("pointermove", this.onMoveBound);
      this.parent.off("pointerup", this.onUpBound);
      this.parent.off("pointerupoutside", this.onUpBound);
    }
    this.destroy();
  }

  public getContent(): Container {
    return this.content;
  }
}

/** Laptop Desktop GUI (Windows-like) */
export class LaptopGUI extends Container {
  private desktop: Container;
  private taskbar: Graphics;

  constructor(private width: number, private height: number) {
    super();
    this.sortableChildren = true;
    this.eventMode = 'static';
    this.interactiveChildren = true;
    this.hitArea = { contains: () => true } as any;

    // Desktop background
    const bg = new Graphics();
    bg.rect(0, 0, width, height).fill(0x2b5797);
    this.addChild(bg);

    this.desktop = new Container();
    this.desktop.sortableChildren = true;
    this.desktop.eventMode = 'static';
    this.desktop.interactiveChildren = true;
    this.addChild(this.desktop);

    this.createDesktopIcons();
    this.createTaskbar();
  }

  private createDesktopIcons() {
    const icons = [
      { name: "Recycle Bin", x: 20, y: 20, app: () => this.openRecycleBin() },
      { name: "File Manager", x: 20, y: 100, app: () => this.openFileManager() },
      { name: "Network Manager", x: 20, y: 180, app: () => this.openNetworkManager() },
      { name: "Notepad", x: 20, y: 260, app: () => this.openNotepad() },
      { name: "Process Explorer", x: 20, y: 340, app: () => this.openProcessExplorer() },
      { name: "Terminal", x: 120, y: 20, app: () => this.openTerminal() },
    ];

    icons.forEach(icon => {
      const iconContainer = this.createDesktopIcon(icon.name, icon.x, icon.y, icon.app);
      this.desktop.addChild(iconContainer);
    });
  }

  private createDesktopIcon(name: string, x: number, y: number, onOpen: () => void): Container {
    const icon = new Container();
    icon.x = x;
    icon.y = y;
    icon.eventMode = 'static';
    icon.cursor = 'pointer';

    // Icon graphic
    const iconBg = new Graphics();
    iconBg.rect(0, 0, 60, 60).fill(0xffffff).stroke({ width: 2, color: 0x000000 });
    icon.addChild(iconBg);

    // Label
    const label = new Text({
      text: name,
      style: { fontSize: 10, fill: 0xffffff, align: 'center', wordWrap: true, wordWrapWidth: 60 }
    });
    label.anchor.set(0.5, 0);
    label.x = 30;
    label.y = 65;
    icon.addChild(label);

    icon.on("pointertap", onOpen);

    return icon;
  }

  private createTaskbar() {
    this.taskbar = new Graphics();
    this.taskbar.rect(0, this.height - 40, this.width, 40).fill(0x1e1e1e);
    this.addChild(this.taskbar);

    const startBtn = new Text({
      text: "START",
      style: { fontSize: 14, fill: 0xffffff, fontWeight: 'bold' }
    });
    startBtn.x = 10;
    startBtn.y = this.height - 30;
    this.addChild(startBtn);
  }

  private openFileManager() {
    const win = new AppWindow("File Manager", 400, 300);
    win.x = 150;
    win.y = 100;

    const content = win.getContent();
    const files = [
      "[DIR]  C:\\Users\\Admin\\Documents",
      "[DIR]  C:\\Users\\Admin\\Downloads",
      "[FILE] C:\\Users\\Admin\\passwords.txt [LOCKED]",
      "[DIR]  C:\\Program Files",
      "[DIR]  C:\\Windows\\System32",
      "[FILE] C:\\secret_keys.dat [LOCKED]"
    ];

    let yPos = 10;
    files.forEach(file => {
      const fileText = new Text({
        text: file,
        style: { fontSize: 11, fill: file.includes("LOCKED") ? 0xff0000 : 0x000000, fontFamily: 'monospace' }
      });
      fileText.x = 10;
      fileText.y = yPos;
      content.addChild(fileText);
      yPos += 20;
    });

    this.desktop.addChild(win);
  }

  private openNotepad() {
    const win = new AppWindow("Notepad - notes.txt", 350, 250);
    win.x = 200;
    win.y = 150;

    const content = win.getContent();
    const noteContent = `Meeting Notes:
- Server maintenance scheduled for Friday
- Update firewall rules
- Check database backup integrity
- Admin password: [REDACTED]
- VPN key stored in /sys/keys/vpn.key`;

    const note = new Text({
      text: noteContent,
      style: { fontSize: 11, fill: 0x000000, fontFamily: 'monospace', wordWrap: true, wordWrapWidth: 330 }
    });
    note.x = 10;
    note.y = 10;
    content.addChild(note);

    this.desktop.addChild(win);
  }

  private openNetworkManager() {
    const win = new AppWindow("Network Manager", 400, 300);
    win.x = 180;
    win.y = 120;

    const content = win.getContent();

    const header = new Text({
      text: "Network Connections",
      style: { fontSize: 14, fill: 0x000000, fontWeight: 'bold' }
    });
    header.x = 10;
    header.y = 10;
    content.addChild(header);

    const connections = [
      "WiFi: Connected",
      "SSID: CorpNetwork-5G",
      "IP: 192.168.1.102",
      "Gateway: 192.168.1.1",
      "DNS: 8.8.8.8, 8.8.4.4",
      "",
      "Active Connections:",
      "- VPN: Disconnected",
      "- Ethernet: Not connected"
    ];

    let yPos = 40;
    connections.forEach(line => {
      const text = new Text({
        text: line,
        style: { fontSize: 11, fill: 0x000000, fontFamily: 'monospace' }
      });
      text.x = 10;
      text.y = yPos;
      content.addChild(text);
      yPos += 18;
    });

    this.desktop.addChild(win);
  }

  private openProcessExplorer() {
    const win = new AppWindow("Process Explorer", 450, 320);
    win.x = 160;
    win.y = 110;

    const content = win.getContent();

    const header = new Text({
      text: "PID    NAME                CPU%   MEM",
      style: { fontSize: 11, fill: 0x000000, fontFamily: 'monospace', fontWeight: 'bold' }
    });
    header.x = 10;
    header.y = 10;
    content.addChild(header);

    const processes = [
      "1432   explorer.exe        2.1%   124MB",
      "2044   chrome.exe          8.4%   512MB",
      "3156   system              0.3%   32MB",
      "4721   database_srv.exe   12.8%   1024MB",
      "5892   security_mon.exe    1.2%   64MB",
      "6334   vpn_client.exe      0.8%   48MB",
      "7102   backup_svc.exe      4.5%   256MB"
    ];

    let yPos = 35;
    processes.forEach(proc => {
      const procText = new Text({
        text: proc,
        style: { fontSize: 10, fill: 0x000000, fontFamily: 'monospace' }
      });
      procText.x = 10;
      procText.y = yPos;
      content.addChild(procText);
      yPos += 18;
    });

    this.desktop.addChild(win);
  }

  private openRecycleBin() {
    const win = new AppWindow("Recycle Bin", 350, 200);
    win.x = 220;
    win.y = 180;

    const content = win.getContent();
    const msg = new Text({
      text: "Recycle Bin is empty.",
      style: { fontSize: 12, fill: 0x666666, fontStyle: 'italic' }
    });
    msg.x = 10;
    msg.y = 50;
    content.addChild(msg);

    this.desktop.addChild(win);
  }

  private openTerminal() {
    const win = new AppWindow("Terminal", 460, 350);
    win.x = 140;
    win.y = 80;

    const content = win.getContent();
    const terminal = new Terminal(450, 315, "C:\\> ");
    content.addChild(terminal);

    this.desktop.addChild(win);
  }
}
