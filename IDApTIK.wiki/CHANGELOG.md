# Wiki Changelog

Log of wiki updates and additions.

---

## 2025-12-08 – Hacker View Design Documentation

Following a design discussion to clarify the hacker gameplay experience, the following wiki pages were updated or created:

### Updated Pages

**2-Gameplay.md**
- Expanded core dynamic section to emphasize hacker's physical presence in the game world
- Added "Physical Presence Matters" section covering environmental factors and risks
- Added "Fluid Roles" section explaining non-locked class mechanics
- Added navigation links to new sub-pages (2.4-Hacker-View, 2.5-Network-Mechanics)

**5.3-Roadmap-Deep-Dive.md**
- Complete rewrite with implementation-focused phases
- Phase 1: Documents current completed work and next steps
- Phase 2: Network depth, trace system, firewall, pivoting mechanics
- Phase 3: Environmental integration, infiltrator coordination, adaptive AI
- Phase 4: Mission framework and persistent world elements
- Added technical architecture notes section

### New Pages

**2.4-Hacker-View.md** (Created)
- Physical-first access model (hacker brings own device or finds access)
- Device interface design (basic Uplink-style GUI for servers/routers, fuller GUI for personal computers)
- Getting online (WiFi, mobile data, corporate networks)
- InterNIC concept for public server directory
- Network views (local star topology, online Uplink-style connection map)
- Discovery methods (scanning, exploration, files/logs, mission briefings)
- Mission goal types (extraction, destruction, backdoors, support, evidence, cover-up)

**2.5-Network-Mechanics.md** (Created)
- Network architecture (star topology, subnets, zones)
- Firewall mechanics and bypass
- Pivoting through intermediate machines
- Trace and detection (active trace, action-based alerts, passive logging)
- Services and access table
- DNS and InterNIC systems
- Environmental factors (power, congestion, signal, physical destruction)

**CHANGELOG.md** (This file)
- Created to track wiki modifications

---

## Key Design Decisions Documented

1. **Hacker has physical presence** – Not a disembodied support role; exists in game world with discovery risk
2. **Physical-first access** – Must access a device to hack; no god-mode network view
3. **Stylized but accessible interfaces** – Basic GUI on all devices for accessibility, CLI available for power users
4. **Simplified realistic networking** – Subnets and firewalls, but not full routing complexity; star topologies
5. **Combination trace system** – Active trace during intrusion + action alerts + passive logging
6. **Mission-dependent goals** – Hacking objectives vary per mission, not a single "compromise" state
7. **Environmental integration** – Power, connectivity, physical location all affect hacking operations
8. **Bouncing recommended** – Route through intermediate machines to slow trace and obscure origin
