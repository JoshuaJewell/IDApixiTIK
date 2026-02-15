# Network Infrastructure Overhaul - Vision & Next Steps

## Vision
Create a realistic, exploitable network infrastructure that supports deep hacking gameplay while remaining educationally authentic. Balance realism with fun gameplay loops inspired by Uplink and real penetration testing.

## Core Principles
1. **Network Segmentation**: Proper separation of DMZ, internal, IoT, SCADA
2. **Attack Chains**: Multi-hop lateral movement required for valuable targets
3. **Risk vs Reward**: Faster/aggressive = higher detection risk
4. **Software Progression**: Uplink-style tools (v1.0 → v2.0 → v3.0)
5. **Physical Integration**: IoT/SCADA tie into platformer infiltration mechanics

---

## Network Architecture Changes

### DMZ Restructure ✅
- **DMZ (10.0.0.x)**: ONLY internet-facing services
  - Mail Server, Web Server, VPN Server
  - NO database servers, dev terminals, or sensitive internal apps
- **Internal Network (10.0.1.x)**: Protected internal services
  - DB Server, Corp Intranet, Secret Server, File Server
  - Behind firewall, requires pivot from DMZ

### SCADA Network ✅
- **Isolated from IT network** (10.10.x.x or air-gapped)
- Power stations are facilities/locations, NOT network devices
- SCADA network controls power distribution to buildings/areas
- Large facilities (Atlas, Nexus, DevHub) have backup generators
- Attack path: Compromise SCADA → Cut power → Disable security during blackout
- Strategic timing: Backup generators have 15-30s delay

### IoT Network ✅
- **Separate network** (192.168.100.x) for all IoT devices
- Security cameras, smart locks, sensors, drones, alarms
- Weak security (default credentials, outdated firmware)
- Common entry point for attacks
- Ties to physical infiltration:
  - Disable cameras before entering
  - Unlock doors remotely
  - Disable alarms
- Physical connections can be severed/created in platformer mode

### Firewalls ✅
- **Firewall devices** at every network boundary
- Software-based bypass system (Uplink-style):
  - **Firewall Bypass v1.0**: Works on weak firewalls only
  - **Firewall Bypass v2.0**: Works on medium firewalls
  - **Firewall Disable v3.0**: Works on strong/enterprise firewalls
- Early game: Exploit systems without firewalls or other security flaws
- Mid-game: Acquire bypass software through missions/purchases
- Late game: Disable enterprise-grade firewalls
- **Port Scanner** tool to discover open ports and services

---

## Services & Infrastructure

### DNS ✅
- **Atlas (8.8.8.8) and Nexus (1.1.1.1)** provide public DNS
- All devices use these by default (like real internet)
- Internal DNS servers for corporate `.corp.local` domains
- Attack mechanics:
  - DNS poisoning (redirect traffic)
  - DNS tunneling (exfiltrate data)

### DHCP ✅
- **All routers** act as DHCP servers
- Hand out IP leases + DNS server addresses
- Simplifies network management (no manual IP config)

### VPN ✅
- **VPN server** in DMZ for remote worker access
- **Critical attack path**:
  - Physical infiltration → Hack rural laptop → Steal VPN credentials → Corporate network access
- Persistent access even if initial vulnerability is patched
- VPN logs record all activity (must clear)

### Backup Servers ✅
- Alternative data sources if primary is unavailable
- **RAID Implementation**:
  - Critical servers (DB, File) use RAID arrays
  - Must compromise multiple drives or backup to fully destroy evidence
  - RAID failure = data loss = mission consequence

### LDAP/Active Directory
- **Gameplay Purpose**: Central credential store
- Attack value:
  - Compromise LDAP → Steal all employee passwords
  - Domain admin credentials = "keys to the kingdom"
  - Kerberos ticket attacks (pass-the-ticket)
- **Implementation**: Simplified, not full AD simulation

### SIEM/Log Server
- **Dumbed-down "Security Dashboard"**
- Shows recent alerts and suspicious activity
- Attack mechanics:
  - **Log Deleter v1.0**: Obvious (admin notices immediately)
  - **Log Editor v2.0**: Selective editing (harder to detect)
  - **Log Scrubber v3.0**: Stealthy removal + fake entry injection
- Uncleared logs = investigation triggered after mission
- **Implementation**: Not full SIEM, just log aggregation + alerting

---

## Detection & Stealth System

### Scan Aggressiveness ✅
- **Slow Scan** (30s): Stealthy, low detection risk, detailed results
- **Normal Scan** (10s): Moderate risk, good balance
- **Fast Scan** (2s): High detection risk, quick enumeration
- **Aggressive Scan** (instant): Maximum risk, immediate alerts

### Alert System (Later Implementation)
- Triggers based on:
  - Scan speed and patterns
  - Failed login attempts (3+ = alert)
  - Unusual traffic patterns
  - IDS/IPS signature matches
  - Data exfiltration volume
- **Alert Levels**: Green → Yellow → Orange → Red
- **Response**: Lockdowns, account disabling, honeypot activation

### Log Clearing ✅
- **Basic Tools**: Delete entire logs (obvious to sysadmin)
- **Advanced Tools**: Selective entry removal (requires skill)
- **Expert Tools**: Inject fake log entries (misdirection)
- Trade-off: Time vs stealth (quick clear = suspicious, slow = thorough)

---

## Power Infrastructure

### UPS as Strategic Obstacle ✅
- **UPS units** power critical systems during outages
- Cutting main power ≠ disabling UPS-protected devices
- Security systems on UPS = Power sabotage increases alert level without actual shutdown
- **Strategy**: Must disable UPS *then* cut power for full blackout

### Backup Generator Timing ✅
- Generators don't activate instantly (15-30 second delay)
- Creates timed objective windows:
  - "Extract data from server room before backup power kicks in"
  - "Escape facility during blackout window"
- High-risk, high-reward gameplay

---

## Data Exfiltration System

### DLP (Data Loss Prevention) ✅
- **High-security systems** detect large/unusual data transfers
- Triggers alerts on:
  - Large file downloads
  - Database dumps
  - Compressed archives leaving network
- **Gameplay**: Small chunks (slow, stealthy) vs bulk transfer (fast, risky)

### Obfuscation Methods
1. **Steganography**: Hide data in images/audio files (very slow, very stealthy)
2. **Encrypted Tunnel**: VPN/SSH tunnel (faster, moderately suspicious)
3. **Protocol Mimicry**: Disguise as HTTPS/DNS traffic (medium speed, low suspicion)
4. **Slow Drip**: Exfiltrate over hours/days in tiny packets (tedious, undetectable)

---

## Social Engineering & Email

### Email System ✅
- **Read employee emails** for intelligence gathering
- Find: Credentials, schedules, personal info, company secrets
- **Send phishing emails** to steal credentials/install malware
- **Challenge**: Making emails feel authentic
  - Solution: Hand-craft key story emails + template-based filler
  - Procedural names, dates, subjects

### Employee Simulation ✅
- Employees have:
  - Routines and schedules
  - Personal information (pets, family, hobbies)
  - Security weaknesses (password reuse, written passwords)
- **Social engineering paths**:
  - Find diary with password
  - Guess password (pet name, birthday)
  - Phishing email
  - Physical infiltration (shoulder surfing, sticky notes)
  - Bribery, blackmail, threats (ethical concerns?)

---

## Attack Mechanics (Detailed)

### 1. Exploitation Flow
```
SCAN → IDENTIFY → EXPLOIT → ACCESS
```

**Scan Phase** (Port Scanner):
- Discover open ports (22=SSH, 80=HTTP, 3389=RDP, etc.)
- Identify running services
- Determine versions

**Identify Phase** (Service Fingerprinting):
- OS detection (Linux/Windows/IoT)
- Service version (Apache 2.4.49, OpenSSH 7.4, etc.)
- Known vulnerabilities

**Exploit Phase** (Exploit Tools):
- **WebServer Exploit Kit v2.1**: Works on Apache 2.4.x
- **SSH Bruteforce**: Dictionary attack (slow, detectable)
- **IoT Default Creds**: Tries manufacturer defaults (fast, common)
- **Zero-Day Exploit**: Rare, expensive, works on patched systems

**Access Phase**:
- Gain shell/limited access
- Low-privilege user initially
- Need privilege escalation for full control

### 2. Pivoting Flow
```
COMPROMISE DMZ → ESTABLISH TUNNEL → SCAN INTERNAL → EXPLOIT INTERNAL
```

**Why Pivoting?**
- Internal network not visible from internet
- DMZ has limited access to internal
- Must use compromised DMZ as "jump point"

**How it Works**:
1. Compromise DMZ mail server (internet-facing)
2. Gain shell access (limited user)
3. Deploy "Proxy Tool" or SSH tunnel
4. Route traffic through compromised host
5. Scan internal network from inside
6. Exploit internal services (DB, fileserver, etc.)

**Tools**:
- **SSH Tunnel**: Port forwarding through compromised host
- **SOCKS Proxy**: Route all traffic through pivot
- **Reverse Shell**: Call back to attacker through firewall

### 3. Privilege Escalation Flow
```
LOW USER → FIND EXPLOIT → GAIN ROOT → FULL CONTROL
```

**Low-Privilege Limitations**:
- Can't install software
- Can't modify system files
- Can't access sensitive data
- Limited commands available

**Escalation Methods**:
1. **Kernel Exploit**: Buffer overflow, UAF (Use After Free)
2. **Sudo Vulnerability**: Misconfigured sudoers file
3. **SUID Binary**: Exploitable setuid programs
4. **Credential Theft**: Find admin password file, keylogger
5. **Social Engineering**: Phish admin for credentials
6. **Scheduled Task**: Modify cron job with higher privileges

**Tools**:
- **Linux Escalation Kit**: Automated privilege escalation
- **Windows Escalation Kit**: Token manipulation, DLL hijacking
- **Keylogger**: Capture admin password when they log in
- **Hash Dumper**: Extract password hashes for cracking

**Post-Escalation**:
- Install rootkit/backdoor for persistence
- Access all files and databases
- Modify system configurations
- Disable security features

---

## Software Progression System (Uplink-Style)

### Tier 1: Beginner (Free/Cheap)
**Scanning & Recon**:
- Port Scanner v1.0 (basic, slow, detectable)
- Trace Tracker v1.0 (shows your connection path)

**Exploitation**:
- Password Cracker v1.0 (dictionary attack, very slow)
- Default Creds Checker (tries common defaults)

**Covering Tracks**:
- Log Deleter v1.0 (deletes entire log, obvious)

**Bypass**:
- Firewall Bypass v1.0 (weak firewalls only)

### Tier 2: Intermediate (Mid-Game Purchases)
**Scanning & Recon**:
- Advanced Scanner v2.0 (OS detection, service fingerprinting)
- Network Mapper (visual topology discovery)

**Exploitation**:
- GPU Cracker v2.0 (faster password cracking)
- Exploit Database (known vulnerabilities)

**Pivoting**:
- SSH Tunnel Tool
- SOCKS Proxy

**Covering Tracks**:
- Log Editor v2.0 (selective entry removal)
- Connection Bouncer (route through multiple proxies)

**Bypass**:
- Firewall Bypass v2.0 (medium firewalls)
- IDS Evasion v2.0 (reduces detection chance)

### Tier 3: Expert (Late-Game/Expensive)
**Scanning & Recon**:
- Stealth Scanner v3.0 (undetectable, instant)
- Vulnerability Scanner (automated exploit finding)

**Exploitation**:
- Rainbow Table Cracker v3.0 (instant password cracking)
- Zero-Day Exploit Pack (works on fully patched systems)
- Privilege Escalation Kit (automated root access)

**Pivoting & Persistence**:
- Rootkit (hidden, survives reboot)
- Backdoor Implant (persistent remote access)

**Covering Tracks**:
- Log Scrubber v3.0 (removes evidence, injects false trails)
- Connection Anonymizer (untraceable routing)

**Bypass**:
- Firewall Disable v3.0 (any firewall, instant)
- IDS Killer v3.0 (disable monitoring systems)

---

## Open Questions & Design Decisions

### 1. RAID Implementation
**Options**:
- **Simple**: Just flavor text ("This server uses RAID 5")
- **Medium**: Must target multiple drives ("Drive 1/3 corrupted")
- **Complex**: Different RAID levels with different failure modes

**Recommendation**: Medium - flavor + minor mechanic

### 2. Data Obfuscation Details
**Recommended Methods**:
- **Steganography Tool**: Hide in images (very slow, max stealth)
- **Encrypted Tunnel**: Standard VPN/SSH (fast, moderate risk)
- **DNS Tunneling**: Exfil through DNS queries (slow, low risk)
- **HTTPS Mimicry**: Disguise as web traffic (medium speed, low risk)

Each method = different tool tier (v1.0, v2.0, v3.0 with better stealth/speed)

### 3. Email Authenticity
**Recommended Approach**:
- Hand-craft ~20-30 key story emails (plot-critical, memorable)
- Template system for filler:
  - Procedural: "${NAME} - Meeting at ${TIME}"
  - Categories: HR announcements, IT tickets, casual chatter, spam
  - Name generation from employee database

### 4. Exploitation Detail Level
**Recommended Approach**:
- **Abstract, not simulation**: Click "Exploit" → Success/Failure
- **No minigames**: Not buffer overflow tutorials
- **Context matters**: Better tools + newer vulnerabilities = higher success rate
- **Failure consequences**: Failed exploit can trigger alerts

---

## Implementation Phases

### Phase 1: Network Restructure (CURRENT)
**Goals**: Fix architecture, enable future gameplay
1. ✅ Split DMZ (10.0.0.x) from Internal (10.0.1.x)
2. ✅ Create IoT network (192.168.100.x)
3. ✅ Create SCADA network (10.10.x.x)
4. ✅ Add firewall devices at boundaries
5. ✅ Add VPN server to DMZ
6. ✅ Move power infrastructure to SCADA
7. ✅ Relocate devices to correct zones

**Deliverable**: Realistic, scalable network topology

### Phase 2: Essential Services
**Goals**: Add supporting infrastructure
1. Internal DNS servers
2. DHCP on all routers (already done?)
3. Backup servers with RAID
4. LDAP/AD server (simplified)
5. SIEM/Log server

**Deliverable**: Complete service infrastructure

### Phase 3: Detection & Monitoring
**Goals**: Create risk/reward gameplay
1. IDS/IPS devices on networks
2. SIEM alert dashboard
3. Alert level system
4. Honeypot devices
5. Failed login tracking

**Deliverable**: Detection system that creates tension

### Phase 4: Attack Tools
**Goals**: Core hacking gameplay
1. Port scanner (slow/fast modes)
2. Password cracker (tier 1-3)
3. Firewall bypass (tier 1-3)
4. Exploit framework
5. Log deletion tools (tier 1-3)

**Deliverable**: Playable hacking loop

### Phase 5: Advanced Mechanics
**Goals**: Depth and replayability
1. Pivoting/tunneling system
2. Privilege escalation
3. Email system + social engineering
4. Data exfiltration + DLP
5. Backdoors/persistence

**Deliverable**: Deep, interconnected systems

### Phase 6: Physical Integration
**Goals**: Tie hacking to platformer
1. IoT exploitation (cameras, locks, alarms)
2. SCADA power control
3. Physical infiltration benefits
4. Guard/alarm response to hacking

**Deliverable**: Unified stealth infiltration game

---

## Out of Scope (For Now)
- ❌ Certificate pinning mechanics (too complex)
- ❌ Detailed cryptographic implementations (educational, not fun)
- ❌ Real exploit code/buffer overflow simulation (legal/ethical concerns)
- ❌ Full SCADA HMI simulation (use simplified control interface)
- ❌ Realistic packet capture/analysis (too technical for gameplay)

---

## Immediate Next Action
**Answer from user**: Proceed with Phase 1 network restructure?

If yes, next steps:
1. Design concrete network topology diagram
2. Create new device types (Firewall, IDS, VPN, etc.)
3. Reorganize existing devices into correct zones
4. Implement zone-based routing rules
5. Update visualizations to show new topology
