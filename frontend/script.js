/**
 * Apex SupplyChain Intelligence - Executive Dashboard Engine
 * Dual-Mode Client: Connects to FastAPI Backend or runs standalone in-browser graph algorithms.
 */

const API_BASE = "http://127.0.0.1:8000";

// Global State
let globalState = {
    isOnline: false,
    suppliers: [],
    dependencies: [],
    cycles: [],
    spofs: [],
    criticality: {},
    leadTimes: {},
    networkNodes: [],
    networkEdges: [],
    fullNetworkInstance: null,
    miniNetworkInstance: null,
    physicsEnabled: true,
    activeTab: "overview",
    selectedNodeId: null
};

// ==========================================================================
// Embedded Fallback Dataset (Ensures 100% Zero-Failure Standalone Execution)
// ==========================================================================
const EMBEDDED_SUPPLIERS = [
    { id: "MFG", name: "Apex Motors (Main Manufacturer)", tier: 0, has_backup: true },
    { id: "BP", name: "Battery Pack Division", tier: 1, has_backup: true },
    { id: "PT", name: "Powertrain Systems", tier: 1, has_backup: true },
    { id: "CH", name: "Chassis & Suspension Group", tier: 1, has_backup: true },
    { id: "EL", name: "Electronics & Infotainment", tier: 1, has_backup: true },
    { id: "IN", name: "Interior Systems", tier: 1, has_backup: true },
    { id: "BD", name: "Body & Exterior", tier: 1, has_backup: true },
    { id: "BC", name: "Battery Cell Manufacturing", tier: 2, has_backup: false },
    { id: "BMS", name: "Battery Management System", tier: 2, has_backup: true },
    { id: "TC", name: "Thermal Cooling Unit", tier: 2, has_backup: true },
    { id: "MOT", name: "Electric Motor Assembly", tier: 2, has_backup: false },
    { id: "INV", name: "Inverter Systems", tier: 2, has_backup: true },
    { id: "GB", name: "Gearbox Unit", tier: 2, has_backup: true },
    { id: "SUS", name: "Suspension Components", tier: 2, has_backup: true },
    { id: "BRK", name: "Brake Systems", tier: 2, has_backup: true },
    { id: "WHL", name: "Wheel & Tire Assembly", tier: 2, has_backup: true },
    { id: "PCB", name: "Circuit Board Manufacturing", tier: 2, has_backup: false },
    { id: "SEN", name: "Sensor Array Supplier", tier: 2, has_backup: true },
    { id: "DIS", name: "Display Panel Supplier", tier: 2, has_backup: false },
    { id: "SEAT", name: "Seating Systems", tier: 2, has_backup: true },
    { id: "DASH", name: "Dashboard Assembly", tier: 2, has_backup: true },
    { id: "UPH", name: "Upholstery Fabric", tier: 2, has_backup: true },
    { id: "STL", name: "Steel Stamping", tier: 2, has_backup: true },
    { id: "GLS", name: "Glass Manufacturing", tier: 2, has_backup: false },
    { id: "PNT", name: "Paint & Coating", tier: 2, has_backup: true },
    { id: "CATH", name: "Cathode Material Supplier", tier: 3, has_backup: false },
    { id: "ANOD", name: "Anode Material Supplier", tier: 3, has_backup: true },
    { id: "SEP", name: "Separator Film Co", tier: 3, has_backup: false },
    { id: "MCU", name: "Microcontroller Foundry", tier: 3, has_backup: false },
    { id: "PUMP", name: "Coolant Pump Manufacturer", tier: 3, has_backup: true },
    { id: "HOSE", name: "Hose & Fitting Supplier", tier: 3, has_backup: true },
    { id: "MAG", name: "Rare Earth Magnet Supplier", tier: 3, has_backup: false },
    { id: "COP", name: "Copper Winding Supplier", tier: 3, has_backup: true },
    { id: "CAP", name: "Capacitor Supplier", tier: 3, has_backup: true },
    { id: "GEAR", name: "Precision Gear Manufacturer", tier: 3, has_backup: true },
    { id: "BEAR", name: "Bearing Supplier", tier: 3, has_backup: true },
    { id: "SPR", name: "Spring Steel Supplier", tier: 3, has_backup: true },
    { id: "FORGE", name: "Forging Company", tier: 3, has_backup: true },
    { id: "PAD", name: "Brake Pad Supplier", tier: 3, has_backup: true },
    { id: "ROT", name: "Rotor Casting Co", tier: 3, has_backup: true },
    { id: "TIRE", name: "Tire Rubber Supplier", tier: 3, has_backup: false },
    { id: "RIM", name: "Alloy Rim Casting", tier: 3, has_backup: true },
    { id: "SIL", name: "Silicon Wafer Supply", tier: 3, has_backup: false },
    { id: "LAM", name: "PCB Laminate Supplier", tier: 3, has_backup: true },
    { id: "LCD", name: "LCD Panel Manufacturer", tier: 3, has_backup: false },
    { id: "TGL", name: "Touch Glass Supplier", tier: 3, has_backup: true },
    { id: "FOAM", name: "Foam Padding Supplier", tier: 3, has_backup: true },
    { id: "FRM", name: "Seat Frame Metal Supplier", tier: 3, has_backup: true },
    { id: "PLAS", name: "Plastic Molding Co", tier: 3, has_backup: true },
    { id: "FAB", name: "Textile Fabric Mill", tier: 3, has_backup: true },
    { id: "DYE", name: "Dye & Chemical Supplier", tier: 3, has_backup: true },
    { id: "IRON", name: "Iron Ore Processor", tier: 3, has_backup: true },
    { id: "SAND", name: "Silica Sand Processor", tier: 3, has_backup: true },
    { id: "RESIN", name: "Resin & Chemical Supplier", tier: 3, has_backup: true },
    { id: "LITH", name: "Lithium Mining Co", tier: 4, has_backup: false },
    { id: "COBALT", name: "Cobalt Mining Co", tier: 4, has_backup: false },
    { id: "GRAPHITE", name: "Graphite Supplier", tier: 4, has_backup: true },
    { id: "RAREEARTH", name: "Rare Earth Ore Mine", tier: 4, has_backup: false },
    { id: "COPPERORE", name: "Copper Ore Mine", tier: 4, has_backup: true },
    { id: "SILICA", name: "Silica Quartz Mine", tier: 4, has_backup: true },
    { id: "IRONORE", name: "Iron Ore Mine", tier: 4, has_backup: true },
    { id: "RUBBER", name: "Natural Rubber Plantation", tier: 4, has_backup: false },
    { id: "PETRO", name: "Petrochemical Refinery", tier: 4, has_backup: true }
];

const EMBEDDED_DEPENDENCIES = [
    { from: "MFG", to: "BP", weight: 10 },
    { from: "MFG", to: "PT", weight: 12 },
    { from: "MFG", to: "CH", weight: 8 },
    { from: "MFG", to: "EL", weight: 7 },
    { from: "MFG", to: "IN", weight: 6 },
    { from: "MFG", to: "BD", weight: 9 },
    { from: "BP", to: "BC", weight: 14 },
    { from: "BP", to: "BMS", weight: 10 },
    { from: "BP", to: "TC", weight: 8 },
    { from: "PT", to: "MOT", weight: 16 },
    { from: "PT", to: "INV", weight: 12 },
    { from: "PT", to: "GB", weight: 9 },
    { from: "CH", to: "SUS", weight: 7 },
    { from: "CH", to: "BRK", weight: 6 },
    { from: "CH", to: "WHL", weight: 5 },
    { from: "EL", to: "PCB", weight: 11 },
    { from: "EL", to: "SEN", weight: 8 },
    { from: "EL", to: "DIS", weight: 13 },
    { from: "IN", to: "SEAT", weight: 6 },
    { from: "IN", to: "DASH", weight: 5 },
    { from: "IN", to: "UPH", weight: 4 },
    { from: "BD", to: "STL", weight: 9 },
    { from: "BD", to: "GLS", weight: 10 },
    { from: "BD", to: "PNT", weight: 10 },
    { from: "BC", to: "CATH", weight: 18 },
    { from: "BC", to: "ANOD", weight: 15 },
    { from: "BC", to: "SEP", weight: 9 },
    { from: "BMS", to: "MCU", weight: 20 },
    { from: "BMS", to: "TC", weight: 4 },
    { from: "TC", to: "BMS", weight: 3 },
    { from: "TC", to: "PUMP", weight: 7 },
    { from: "TC", to: "HOSE", weight: 5 },
    { from: "MOT", to: "MAG", weight: 22 },
    { from: "MOT", to: "COP", weight: 10 },
    { from: "MOT", to: "INV", weight: 5 },
    { from: "INV", to: "MOT", weight: 4 },
    { from: "INV", to: "MCU", weight: 20 },
    { from: "INV", to: "CAP", weight: 8 },
    { from: "GB", to: "GEAR", weight: 12 },
    { from: "GB", to: "BEAR", weight: 6 },
    { from: "SUS", to: "SPR", weight: 9 },
    { from: "SUS", to: "FORGE", weight: 11 },
    { from: "BRK", to: "PAD", weight: 7 },
    { from: "BRK", to: "ROT", weight: 8 },
    { from: "WHL", to: "TIRE", weight: 10 },
    { from: "WHL", to: "RIM", weight: 9 },
    { from: "PCB", to: "MCU", weight: 20 },
    { from: "PCB", to: "SIL", weight: 25 },
    { from: "PCB", to: "LAM", weight: 6 },
    { from: "SEN", to: "SIL", weight: 25 },
    { from: "DIS", to: "LCD", weight: 19 },
    { from: "DIS", to: "TGL", weight: 8 },
    { from: "SEAT", to: "FOAM", weight: 5 },
    { from: "SEAT", to: "FRM", weight: 7 },
    { from: "DASH", to: "PLAS", weight: 6 },
    { from: "DASH", to: "LAM", weight: 6 },
    { from: "UPH", to: "FAB", weight: 5 },
    { from: "UPH", to: "DYE", weight: 4 },
    { from: "STL", to: "IRON", weight: 14 },
    { from: "GLS", to: "SAND", weight: 12 },
    { from: "PNT", to: "RESIN", weight: 9 },
    { from: "TGL", to: "GLS", weight: 6 },
    { from: "FRM", to: "STL", weight: 5 },
    { from: "PLAS", to: "RESIN", weight: 8 },
    { from: "CATH", to: "LITH", weight: 30 },
    { from: "CATH", to: "COBALT", weight: 28 },
    { from: "ANOD", to: "GRAPHITE", weight: 20 },
    { from: "ANOD", to: "LITH", weight: 25 },
    { from: "MAG", to: "RAREEARTH", weight: 35 },
    { from: "COP", to: "COPPERORE", weight: 18 },
    { from: "SIL", to: "SILICA", weight: 24 },
    { from: "IRON", to: "IRONORE", weight: 16 },
    { from: "SAND", to: "SILICA", weight: 14 },
    { from: "RESIN", to: "PETRO", weight: 11 },
    { from: "TIRE", to: "RUBBER", weight: 20 },
    { from: "FOAM", to: "PETRO", weight: 9 }
];

// ==========================================================================
// Client-Side ADSA Graph Engine (Matches Python src/ Algorithms)
// ==========================================================================
class ClientGraph {
    constructor(suppliers, dependencies) {
        this.suppliers = {};
        this.adj = {};
        this.revAdj = {};

        suppliers.forEach(s => {
            this.suppliers[s.id] = { ...s };
            this.adj[s.id] = [];
            this.revAdj[s.id] = [];
        });

        dependencies.forEach(d => {
            if (!this.suppliers[d.from]) {
                this.suppliers[d.from] = { id: d.from, name: d.from, tier: 1, has_backup: true };
                this.adj[d.from] = [];
                this.revAdj[d.from] = [];
            }
            if (!this.suppliers[d.to]) {
                this.suppliers[d.to] = { id: d.to, name: d.to, tier: 1, has_backup: true };
                this.adj[d.to] = [];
                this.revAdj[d.to] = [];
            }
            this.adj[d.from].push({ to: d.to, weight: d.weight });
            this.revAdj[d.to].push({ from: d.from, weight: d.weight });
        });
    }

    getAllSuppliers() {
        return Object.keys(this.suppliers);
    }

    detectCycles() {
        const WHITE = 0, GRAY = 1, BLACK = 2;
        const color = {};
        this.getAllSuppliers().forEach(n => color[n] = WHITE);
        const cycles = [];

        const visit = (node, path) => {
            color[node] = GRAY;
            path.push(node);

            for (let edge of this.adj[node]) {
                const neighbor = edge.to;
                if (color[neighbor] === GRAY) {
                    const startIdx = path.indexOf(neighbor);
                    cycles.push([...path.slice(startIdx), neighbor]);
                } else if (color[neighbor] === WHITE) {
                    visit(neighbor, path);
                }
            }

            path.pop();
            color[node] = BLACK;
        };

        this.getAllSuppliers().forEach(n => {
            if (color[n] === WHITE) visit(n, []);
        });

        return cycles;
    }

    findSPOFs() {
        const flagged = [];
        this.getAllSuppliers().forEach(node => {
            const hasDependents = this.revAdj[node] && this.revAdj[node].length > 0;
            const hasBackup = this.suppliers[node].has_backup;
            if (hasDependents && !hasBackup) {
                flagged.push(node);
            }
        });
        return flagged;
    }

    computeCriticality() {
        const scores = {};
        this.getAllSuppliers().forEach(node => {
            const visited = new Set([node]);
            const queue = [node];
            while (queue.length > 0) {
                const curr = queue.shift();
                const preds = this.revAdj[curr] || [];
                for (let p of preds) {
                    if (!visited.has(p.from)) {
                        visited.add(p.from);
                        queue.push(p.from);
                    }
                }
            }
            visited.delete(node);
            scores[node] = visited.size;
        });
        return scores;
    }

    dijkstra(startNode) {
        const distances = {};
        distances[startNode] = 0;
        const unvisited = new Set(this.getAllSuppliers());

        while (unvisited.size > 0) {
            let curr = null;
            let minDist = Infinity;
            for (let node of unvisited) {
                if (distances[node] !== undefined && distances[node] < minDist) {
                    minDist = distances[node];
                    curr = node;
                }
            }

            if (curr === null || minDist === Infinity) break;
            unvisited.delete(curr);

            const neighbors = this.adj[curr] || [];
            for (let edge of neighbors) {
                const alt = distances[curr] + edge.weight;
                if (distances[edge.to] === undefined || alt < distances[edge.to]) {
                    distances[edge.to] = alt;
                }
            }
        }
        return distances;
    }

    simulateDisruption(disruptedNode) {
        const visited = new Set([disruptedNode]);
        const queue = [disruptedNode];
        const affected = [];

        while (queue.length > 0) {
            const curr = queue.shift();
            const preds = this.revAdj[curr] || [];
            for (let p of preds) {
                if (!visited.has(p.from)) {
                    visited.add(p.from);
                    queue.push(p.from);
                    affected.push({
                        id: p.from,
                        name: this.suppliers[p.from]?.name || p.from,
                        tier: this.suppliers[p.from]?.tier ?? 1,
                        direct_parent: curr
                    });
                }
            }
        }

        const mfgHalted = visited.has("MFG") || disruptedNode === "MFG";
        const meta = this.suppliers[disruptedNode] || {};
        const severity = mfgHalted || affected.length >= 5 ? "CRITICAL" : affected.length >= 2 ? "HIGH" : "MODERATE";

        return {
            disrupted_node: disruptedNode,
            name: meta.name || disruptedNode,
            tier: meta.tier ?? 1,
            has_backup: meta.has_backup ?? false,
            severity: severity,
            affected_count: affected.length,
            mfg_halted: mfgHalted,
            affected_suppliers: affected,
            alternate_routes_found: 0,
            alternate_routes: [],
            recommendation: meta.has_backup 
                ? "Secondary supplier active. Activate contracted secondary vendor to absorb capacity."
                : "CRITICAL ALERT: Zero backup source available. Immediate dual-sourcing & emergency buffer inventory needed."
        };
    }
}

// ==========================================================================
// Initialization & Data Loading
// ==========================================================================
document.addEventListener("DOMContentLoaded", () => {
    initNavigation();
    initGlobalSearch();
    loadAllData();
});

async function loadAllData() {
    setEngineStatus("Connecting...", "warn");

    try {
        const res = await fetch(`${API_BASE}/api/overview`, { cache: "no-store", signal: AbortSignal.timeout(2000) });
        if (!res.ok) throw new Error("API not available");
        
        // Online mode: fetch from FastAPI
        globalState.isOnline = true;
        setEngineStatus("API ONLINE (FastAPI :8000)", "good");
        await loadOnlineData();

    } catch (err) {
        // Fallback to in-browser standalone engine
        console.warn("Backend API offline. Operating in Standalone Engine mode:", err);
        globalState.isOnline = false;
        setEngineStatus("STANDALONE (CLIENT ENGINE)", "good");
        loadStandaloneData();
    }

    renderAllViews();
}

function setEngineStatus(label, type) {
    const el = document.getElementById("engineStatusLabel");
    const pulse = document.getElementById("statusPulse");
    const footer = document.getElementById("footerEngineStatus");
    if (el) el.textContent = label;
    if (pulse) pulse.className = `status-pulse ${type}`;
    if (footer) footer.textContent = `Engine: ${label}`;
}

async function loadOnlineData() {
    try {
        const [overviewRes, graphRes, riskRes, suppliersRes, depsRes] = await Promise.all([
            fetch(`${API_BASE}/api/overview`).then(r => r.json()),
            fetch(`${API_BASE}/api/network-graph`).then(r => r.json()),
            fetch(`${API_BASE}/api/risk-summary`).then(r => r.json()),
            fetch(`${API_BASE}/api/suppliers`).then(r => r.json()),
            fetch(`${API_BASE}/api/dependencies`).then(r => r.json())
        ]);

        globalState.overview = overviewRes;
        globalState.networkNodes = graphRes.nodes;
        globalState.networkEdges = graphRes.edges;
        globalState.cycles = riskRes.cycle_list;
        globalState.spofs = riskRes.spof_list;
        globalState.suppliers = suppliersRes.suppliers;
        globalState.dependencies = depsRes.dependencies;
        globalState.topCritical = riskRes.top_critical_suppliers;
        globalState.riskDistribution = overviewRes.risk_distribution;

    } catch (e) {
        console.error("Failed loading from online API, falling back to local:", e);
        loadStandaloneData();
    }
}

function loadStandaloneData() {
    const clientGraph = new ClientGraph(EMBEDDED_SUPPLIERS, EMBEDDED_DEPENDENCIES);
    const rawCycles = clientGraph.detectCycles();
    const rawSpofs = clientGraph.findSPOFs();
    const criticality = clientGraph.computeCriticality();
    const leadTimes = clientGraph.dijkstra("MFG");

    const cycleNodes = new Set();
    const cycleEdges = new Set();
    const formattedCycles = [];

    rawCycles.forEach(c => {
        c.forEach(n => cycleNodes.add(n));
        for (let i = 0; i < c.length - 1; i++) {
            cycleEdges.add(`${c[i]}->${c[i+1]}`);
        }
        formattedCycles.push({
            cycle_path: c,
            readable: c.join(" ➔ "),
            length: c.length - 1
        });
    });

    const riskCounts = { critical: 0, high: 0, medium: 0, low: 0 };
    const nodes = [];

    clientGraph.getAllSuppliers().forEach(id => {
        const s = clientGraph.suppliers[id];
        const isSpof = rawSpofs.includes(id);
        const inCycle = cycleNodes.has(id);
        const critScore = criticality[id] || 0;
        const lead = leadTimes[id] ?? 999;

        let riskLevel = "low";
        if (isSpof || critScore >= 8 || inCycle) riskLevel = "critical";
        else if (critScore >= 4 || lead >= 35) riskLevel = "high";
        else if (critScore >= 2 || lead >= 20) riskLevel = "medium";

        riskCounts[riskLevel]++;

        nodes.push({
            id: id,
            label: id,
            name: s.name,
            tier: s.tier,
            has_backup: s.has_backup,
            is_spof: isSpof,
            is_cycle: inCycle,
            criticality: critScore,
            lead_time: leadTimes[id] ?? null,
            in_degree: clientGraph.revAdj[id]?.length || 0,
            out_degree: clientGraph.adj[id]?.length || 0,
            risk_level: riskLevel
        });
    });

    const edges = EMBEDDED_DEPENDENCIES.map(d => ({
        from: d.from,
        to: d.to,
        weight: d.weight,
        is_cycle: cycleEdges.has(`${d.from}->${d.to}`),
        label: `${d.weight}d`
    }));

    const spofList = rawSpofs.map(id => {
        const s = clientGraph.suppliers[id];
        const deps = (clientGraph.revAdj[id] || []).map(r => r.from);
        return {
            id: id,
            name: s.name,
            tier: s.tier,
            dependent_count: deps.length,
            dependents: deps,
            criticality_score: criticality[id] || 0,
            lead_time: leadTimes[id] ?? null
        };
    }).sort((a, b) => b.criticality_score - a.criticality_score);

    const topCritical = Object.entries(criticality)
        .map(([id, score]) => ({
            id: id,
            name: clientGraph.suppliers[id]?.name || id,
            tier: clientGraph.suppliers[id]?.tier ?? 1,
            impact_score: score,
            has_backup: clientGraph.suppliers[id]?.has_backup ?? false,
            is_spof: rawSpofs.includes(id),
            lead_time: leadTimes[id] ?? null
        }))
        .sort((a, b) => b.impact_score - a.impact_score)
        .slice(0, 10);

    const enrichedDeps = EMBEDDED_DEPENDENCIES.map(d => {
        const isCycleEdge = cycleEdges.has(`${d.from}->${d.to}`);
        const toIsSpof = rawSpofs.includes(d.to);
        let exposure = "low";
        if (isCycleEdge || (toIsSpof && d.weight >= 15)) exposure = "critical";
        else if (toIsSpof || d.weight >= 20) exposure = "high";
        else if (d.weight >= 10) exposure = "medium";

        return {
            from: d.from,
            from_name: clientGraph.suppliers[d.from]?.name || d.from,
            to: d.to,
            to_name: clientGraph.suppliers[d.to]?.name || d.to,
            weight: d.weight,
            is_cycle_edge: isCycleEdge,
            to_is_spof: toIsSpof,
            exposure: exposure
        };
    });

    globalState.clientGraph = clientGraph;
    globalState.overview = {
        total_suppliers: nodes.length,
        total_dependencies: edges.length,
        total_cycles: formattedCycles.length,
        total_spofs: spofList.length,
        risk_distribution: riskCounts,
        is_acyclic: formattedCycles.length === 0,
        avg_lead_time_days: 27.1,
        max_lead_time_days: 85.0
    };
    globalState.networkNodes = nodes;
    globalState.networkEdges = edges;
    globalState.cycles = formattedCycles;
    globalState.spofs = spofList;
    globalState.suppliers = nodes;
    globalState.dependencies = enrichedDeps;
    globalState.topCritical = topCritical;
    globalState.riskDistribution = riskCounts;
}

// ==========================================================================
// View Rendering
// ==========================================================================
function renderAllViews() {
    renderKPIs();
    renderDonutChart();
    renderTopSpofList();
    renderCyclesSection();
    renderSpofTable();
    renderImpactRankList();
    populateSimulatorDropdown();
    renderCatalogTables();
    initVisNetworks();
}

function renderKPIs() {
    const o = globalState.overview;
    if (!o) return;

    safeText("kpiSuppliers", String(o.total_suppliers).padStart(2, "0"));
    safeText("kpiDependencies", String(o.total_dependencies).padStart(2, "0"));
    safeText("kpiCycles", String(o.total_cycles).padStart(2, "0"));
    safeText("kpiSpofs", String(o.total_spofs).padStart(2, "0"));
    
    safeText("heroSupplierCount", o.total_suppliers);
    safeText("heroDepCount", o.total_dependencies);
    safeText("navNodeCountPill", o.total_suppliers);
    safeText("navSpofPill", o.total_spofs);
    
    const cycleStatusEl = document.getElementById("sidebarCycleStatus");
    if (cycleStatusEl) {
        cycleStatusEl.textContent = `${o.total_cycles} Cycles Detected`;
    }
}

function renderDonutChart() {
    const dist = globalState.riskDistribution || { critical: 21, high: 13, medium: 22, low: 7 };
    safeText("riskCountCrit", dist.critical);
    safeText("riskCountHigh", dist.high);
    safeText("riskCountMed", dist.medium);
    safeText("riskCountLow", dist.low);
    safeText("donutTotalCount", (dist.critical + dist.high + dist.medium + dist.low));

    const total = dist.critical + dist.high + dist.medium + dist.low || 1;
    const circumference = 2 * Math.PI * 40; // r=40 => 251.32

    const pCrit = (dist.critical / total) * circumference;
    const pHigh = (dist.high / total) * circumference;
    const pMed = (dist.medium / total) * circumference;
    const pLow = (dist.low / total) * circumference;

    let offset = 0;
    setStroke("donutCrit", pCrit, circumference, offset);
    offset -= pCrit;
    setStroke("donutHigh", pHigh, circumference, offset);
    offset -= pHigh;
    setStroke("donutMed", pMed, circumference, offset);
    offset -= pMed;
    setStroke("donutLow", pLow, circumference, offset);
}

function setStroke(id, slice, total, offset) {
    const el = document.getElementById(id);
    if (!el) return;
    el.style.strokeDasharray = `${slice} ${total}`;
    el.style.strokeDashoffset = offset;
}

function renderTopSpofList() {
    const container = document.getElementById("overviewTopSpofList");
    if (!container) return;

    const spofs = globalState.spofs.slice(0, 3);
    container.innerHTML = spofs.map(s => `
        <div class="tsb-row" onclick="inspectNode('${s.id}')" style="cursor:pointer">
            <div>
                <span class="tsb-id">${s.id}</span>
                <span class="tsb-name"> • ${s.name}</span>
            </div>
            <span class="tsb-impact">Tier ${s.tier} • ${s.dependent_count} dependents</span>
        </div>
    `).join("");
}

function renderCyclesSection() {
    const container = document.getElementById("cyclesLoopCards");
    if (!container) return;

    container.innerHTML = globalState.cycles.map((c, idx) => `
        <div class="cycle-card">
            <span style="font-size:16px;">🔄</span>
            <div>
                <div style="font-size:10px; font-weight:700; color:var(--warn); margin-bottom:2px;">CYCLE LOOP #${idx + 1}</div>
                <div class="cycle-loop-text">${c.readable}</div>
            </div>
        </div>
    `).join("");
}

function renderSpofTable() {
    const tbody = document.getElementById("spofTableBody");
    if (!tbody) return;

    tbody.innerHTML = globalState.spofs.map(s => `
        <tr>
            <td class="cell-mono">${s.id}</td>
            <td style="font-weight:600; color:#fff;">${s.name}</td>
            <td><span class="cell-badge t${s.tier}">Tier ${s.tier}</span></td>
            <td><strong style="color:var(--crit);">${s.dependent_count}</strong> direct systems</td>
            <td class="cell-mono">${s.lead_time !== null ? s.lead_time + 'd' : '--'}</td>
            <td><span class="cell-badge crit">Affects ${s.criticality_score} nodes</span></td>
            <td>
                <button class="cell-action-btn" onclick="inspectNode('${s.id}')">Inspect</button>
                <button class="cell-action-btn" style="color:var(--warn); margin-left:4px;" onclick="setAndSimulate('${s.id}')">Simulate</button>
            </td>
        </tr>
    `).join("");
}

function renderImpactRankList() {
    const container = document.getElementById("impactRankList");
    if (!container) return;

    const list = (globalState.topCritical || []).slice(0, 7);
    container.innerHTML = list.map((item, idx) => `
        <div class="rank-card" onclick="inspectNode('${item.id}')" style="cursor:pointer">
            <div class="rank-num">#${idx + 1}</div>
            <div class="rank-info">
                <div class="rank-name">${item.id} <span style="font-size:11px; color:var(--text-muted); font-weight:normal;">(${item.name})</span></div>
                <div class="rank-sub">Tier ${item.tier} • ${item.has_backup ? 'Backup Active' : 'No Backup (SPOF)'}</div>
            </div>
            <div class="rank-badge">
                <div class="rank-score">${item.impact_score}</div>
                <span class="rank-score-sub">Nodes Affected</span>
            </div>
        </div>
    `).join("");
}

function populateSimulatorDropdown() {
    const select = document.getElementById("simSupplierSelect");
    if (!select) return;

    select.innerHTML = '<option value="">-- Choose Supplier Node --</option>' +
        globalState.networkNodes.map(n => `
            <option value="${n.id}">${n.id} - ${n.name} (Tier ${n.tier}${n.is_spof ? ' • SPOF' : ''})</option>
        `).join("");
}

function renderCatalogTables() {
    // Suppliers Directory
    const supTbody = document.getElementById("catalogSuppliersTbody");
    if (supTbody) {
        supTbody.innerHTML = globalState.networkNodes.map(s => `
            <tr>
                <td class="cell-mono">${s.id}</td>
                <td style="font-weight:600; color:#fff;">${s.name}</td>
                <td><span class="cell-badge t${s.tier}">Tier ${s.tier}</span></td>
                <td>${s.has_backup ? '<span style="color:var(--good)">✓ Available</span>' : '<span style="color:var(--crit); font-weight:bold;">✗ None (SPOF)</span>'}</td>
                <td><span class="cell-badge ${s.risk_level}">${s.risk_level.toUpperCase()}</span></td>
                <td class="cell-mono">${s.lead_time !== null ? s.lead_time + ' days' : '--'}</td>
                <td>${s.out_degree} upstream</td>
                <td>${s.in_degree} downstream</td>
                <td><button class="cell-action-btn" onclick="inspectNode('${s.id}')">Inspect</button></td>
            </tr>
        `).join("");
    }

    // Dependencies Directory
    const depTbody = document.getElementById("catalogDependenciesTbody");
    if (depTbody) {
        depTbody.innerHTML = globalState.dependencies.map(d => `
            <tr>
                <td class="cell-mono" style="color:var(--brand-cyan);">${d.from} <small style="color:var(--text-muted); display:block;">${d.from_name}</small></td>
                <td class="cell-mono" style="color:#ffffff;">${d.to} <small style="color:var(--text-muted); display:block;">${d.to_name}</small></td>
                <td><span>${d.from} ➔ relies on ➔ ${d.to}</span></td>
                <td class="cell-mono"><strong>${d.weight}</strong> days</td>
                <td>${d.is_cycle_edge ? '<span class="cell-badge warn">YES (Cycle)</span>' : '<span style="color:var(--text-muted);">No</span>'}</td>
                <td><span class="cell-badge ${d.exposure}">${d.exposure.toUpperCase()}</span></td>
            </tr>
        `).join("");
    }
}

// ==========================================================================
// Vis.js Interactive Network Topology Visualization
// ==========================================================================
function initVisNetworks() {
    if (typeof vis === "undefined") {
        console.warn("Vis.js not loaded. Retrying in 500ms...");
        setTimeout(initVisNetworks, 500);
        return;
    }

    const fullContainer = document.getElementById("fullNetworkContainer");
    const miniContainer = document.getElementById("overviewNetworkContainer");

    const visNodes = globalState.networkNodes.map(n => {
        let colorBg = "#06b6d4";
        let colorBorder = "#22d3ee";
        let size = 16 + (n.criticality || 0) * 1.8;

        if (n.id === "MFG") {
            colorBg = "#8b5cf6";
            colorBorder = "#c084fc";
            size = 36;
        } else if (n.is_spof) {
            colorBg = "#f43f5e";
            colorBorder = "#fda4af";
        } else if (n.is_cycle) {
            colorBg = "#f59e0b";
            colorBorder = "#fcd34d";
        }

        return {
            id: n.id,
            label: n.id,
            title: `<b>${n.id}</b>: ${n.name}<br>Tier ${n.tier} | Lead Time: ${n.lead_time ?? '--'}d`,
            color: {
                background: colorBg,
                border: colorBorder,
                highlight: { background: "#ffffff", border: colorBorder }
            },
            font: { color: "#ffffff", face: "Space Grotesk", size: n.id === "MFG" ? 14 : 11 },
            size: size,
            shape: n.id === "MFG" ? "diamond" : "dot",
            tier: n.tier
        };
    });

    const visEdges = globalState.networkEdges.map(e => ({
        from: e.from,
        to: e.to,
        arrows: "to",
        color: {
            color: e.is_cycle ? "#f59e0b" : "rgba(255, 255, 255, 0.15)",
            highlight: "#22d3ee"
        },
        dashes: e.is_cycle,
        width: e.is_cycle ? 2 : 1,
        smooth: { type: "continuous" }
    }));

    const options = {
        nodes: {
            borderWidth: 2,
            shadow: true
        },
        edges: {
            hoverWidth: 2,
            selectionWidth: 2
        },
        physics: {
            enabled: true,
            barnesHut: {
                gravitationalConstant: -2800,
                centralGravity: 0.35,
                springLength: 90,
                springConstant: 0.04,
                damping: 0.09
            },
            stabilization: { iterations: 120 }
        },
        interaction: {
            hover: true,
            tooltipDelay: 100,
            navigationButtons: false,
            keyboard: false
        }
    };

    // Full Network Graph
    if (fullContainer) {
        fullContainer.innerHTML = "";
        globalState.fullNetworkInstance = new vis.Network(fullContainer, { nodes: visNodes, edges: visEdges }, options);
        
        globalState.fullNetworkInstance.on("click", params => {
            if (params.nodes && params.nodes.length > 0) {
                inspectNode(params.nodes[0]);
            }
        });
    }

    // Mini Network Preview in Overview
    if (miniContainer) {
        miniContainer.innerHTML = "";
        const miniOptions = {
            ...options,
            interaction: { dragNodes: true, dragView: true, zoomView: true }
        };
        globalState.miniNetworkInstance = new vis.Network(miniContainer, { nodes: visNodes, edges: visEdges }, miniOptions);
        
        globalState.miniNetworkInstance.on("click", params => {
            if (params.nodes && params.nodes.length > 0) {
                switchTab("network");
                setTimeout(() => inspectNode(params.nodes[0]), 200);
            }
        });
    }
}

// Graph Controls
function zoomNetwork(factor) {
    if (!globalState.fullNetworkInstance) return;
    const currentScale = globalState.fullNetworkInstance.getScale();
    globalState.fullNetworkInstance.moveTo({ scale: currentScale * factor, animation: true });
}

function fitNetwork() {
    if (!globalState.fullNetworkInstance) return;
    globalState.fullNetworkInstance.fit({ animation: { duration: 600, easingFunction: "easeInOutQuad" } });
}

function togglePhysics() {
    if (!globalState.fullNetworkInstance) return;
    globalState.physicsEnabled = !globalState.physicsEnabled;
    globalState.fullNetworkInstance.setOptions({ physics: { enabled: globalState.physicsEnabled } });
    
    const btn = document.getElementById("physicsToggleBtn");
    if (btn) {
        btn.classList.toggle("active", globalState.physicsEnabled);
        btn.textContent = globalState.physicsEnabled ? "Physics: ON" : "Physics: OFF";
    }
}

function filterNetworkGraph() {
    if (!globalState.fullNetworkInstance) return;
    const tierVal = document.getElementById("tierFilterSelect").value;
    const riskVal = document.getElementById("riskFilterSelect").value;

    const filteredNodes = globalState.networkNodes.filter(n => {
        if (tierVal !== "all" && String(n.tier) !== tierVal) return false;
        if (riskVal === "spof" && !n.is_spof) return false;
        if (riskVal === "cycle" && !n.is_cycle) return false;
        if (riskVal === "critical" && (n.risk_level !== "critical" && n.risk_level !== "high")) return false;
        return true;
    });

    const activeNodeIds = new Set(filteredNodes.map(n => n.id));
    const filteredEdges = globalState.networkEdges.filter(e => activeNodeIds.has(e.from) && activeNodeIds.has(e.to));

    // Update Vis.js dataset
    initVisNetworksWithData(filteredNodes, filteredEdges);
}

function initVisNetworksWithData(nodes, edges) {
    const fullContainer = document.getElementById("fullNetworkContainer");
    if (!fullContainer) return;

    const visNodes = nodes.map(n => {
        let colorBg = "#06b6d4";
        let colorBorder = "#22d3ee";
        let size = 16 + (n.criticality || 0) * 1.8;

        if (n.id === "MFG") {
            colorBg = "#8b5cf6";
            colorBorder = "#c084fc";
            size = 36;
        } else if (n.is_spof) {
            colorBg = "#f43f5e";
            colorBorder = "#fda4af";
        } else if (n.is_cycle) {
            colorBg = "#f59e0b";
            colorBorder = "#fcd34d";
        }

        return {
            id: n.id,
            label: n.id,
            title: `<b>${n.id}</b>: ${n.name}<br>Tier ${n.tier}`,
            color: { background: colorBg, border: colorBorder },
            font: { color: "#ffffff", face: "Space Grotesk", size: n.id === "MFG" ? 14 : 11 },
            size: size,
            shape: n.id === "MFG" ? "diamond" : "dot"
        };
    });

    const visEdges = edges.map(e => ({
        from: e.from,
        to: e.to,
        arrows: "to",
        color: { color: e.is_cycle ? "#f59e0b" : "rgba(255, 255, 255, 0.15)" },
        dashes: e.is_cycle,
        width: e.is_cycle ? 2 : 1
    }));

    globalState.fullNetworkInstance = new vis.Network(
        fullContainer,
        { nodes: visNodes, edges: visEdges },
        {
            nodes: { borderWidth: 2, shadow: true },
            physics: { enabled: globalState.physicsEnabled, barnesHut: { gravitationalConstant: -2800 } }
        }
    );

    globalState.fullNetworkInstance.on("click", params => {
        if (params.nodes && params.nodes.length > 0) inspectNode(params.nodes[0]);
    });
}

function searchFocusNode(query) {
    if (!query || !globalState.fullNetworkInstance) return;
    const q = query.trim().toUpperCase();
    const match = globalState.networkNodes.find(n => n.id === q || n.name.toUpperCase().includes(q));
    if (match) {
        globalState.fullNetworkInstance.focus(match.id, {
            scale: 1.4,
            animation: { duration: 500, easingFunction: "easeInOutQuad" }
        });
        globalState.fullNetworkInstance.selectNodes([match.id]);
        inspectNode(match.id);
    }
}

// ==========================================================================
// Slide-over Node Inspector
// ==========================================================================
function inspectNode(nodeId) {
    const node = globalState.networkNodes.find(n => n.id === nodeId);
    if (!node) return;

    globalState.selectedNodeId = nodeId;
    const drawer = document.getElementById("nodeInspectorDrawer");
    if (!drawer) return;

    drawer.classList.add("open");

    safeText("inspNodeTitle", node.name);
    safeText("inspNodeId", `SUPPLIER ID: ${node.id}`);
    
    const tierBadge = document.getElementById("inspNodeTier");
    if (tierBadge) {
        tierBadge.textContent = `TIER ${node.tier}`;
        tierBadge.className = `nid-badge cell-badge t${node.tier}`;
    }

    // Upstream & Downstream Relationships
    const upstream = globalState.networkEdges.filter(e => e.from === node.id).map(e => e.to);
    const downstream = globalState.networkEdges.filter(e => e.to === node.id).map(e => e.from);

    const body = document.getElementById("inspNodeBody");
    body.innerHTML = `
        <div class="nid-section">
            <div class="nid-sec-title">OPERATIONAL PROFILE</div>
            <div class="nid-meta-grid">
                <div class="nid-meta-tile">
                    <span class="nmt-label">Lead Time from MFG</span>
                    <span class="nmt-val">${node.lead_time !== null ? node.lead_time + ' days' : 'Root'}</span>
                </div>
                <div class="nid-meta-tile">
                    <span class="nmt-label">Backup Source</span>
                    <span class="nmt-val" style="color:${node.has_backup ? 'var(--good)' : 'var(--crit)'}">
                        ${node.has_backup ? 'Contracted' : 'NONE (SPOF)'}
                    </span>
                </div>
                <div class="nid-meta-tile">
                    <span class="nmt-label">Downstream Blast Radius</span>
                    <span class="nmt-val" style="color:var(--brand-cyan);">${node.criticality} nodes</span>
                </div>
                <div class="nid-meta-tile">
                    <span class="nmt-label">Circular Deadlock</span>
                    <span class="nmt-val" style="color:${node.is_cycle ? 'var(--warn)' : 'var(--text-muted)'}">
                        ${node.is_cycle ? 'IN CYCLE' : 'Acyclic'}
                    </span>
                </div>
            </div>
        </div>

        <div class="nid-section">
            <div class="nid-sec-title">DIRECT UPSTREAM DEPENDENCIES (${upstream.length})</div>
            <div class="nid-chips-list">
                ${upstream.length > 0 
                    ? upstream.map(u => `<span class="nid-chip" onclick="inspectNode('${u}')">${u}</span>`).join('') 
                    : '<span style="color:var(--text-muted); font-size:12px;">Raw material source (No upstream)</span>'}
            </div>
        </div>

        <div class="nid-section">
            <div class="nid-sec-title">SYSTEMS RELYING ON THIS SUPPLIER (${downstream.length})</div>
            <div class="nid-chips-list">
                ${downstream.length > 0 
                    ? downstream.map(d => `<span class="nid-chip" onclick="inspectNode('${d}')">${d}</span>`).join('') 
                    : '<span style="color:var(--text-muted); font-size:12px;">Top-level component / Finished good</span>'}
            </div>
        </div>

        <button class="btn-gradient nid-action-btn" onclick="setAndSimulate('${node.id}')">
            ⚡ Simulate Disruption of ${node.id}
        </button>
    `;

    // Highlight node on graph
    if (globalState.fullNetworkInstance) {
        globalState.fullNetworkInstance.selectNodes([node.id]);
    }
}

function closeInspector() {
    const drawer = document.getElementById("nodeInspectorDrawer");
    if (drawer) drawer.classList.remove("open");
}

// ==========================================================================
// Disruption Simulator Sandbox ("What-If" Analysis)
// ==========================================================================
async function runDisruptionSimulation() {
    const select = document.getElementById("simSupplierSelect");
    const nodeId = select ? select.value : null;

    if (!nodeId) {
        alert("Please select a supplier to simulate.");
        return;
    }

    const btn = document.getElementById("runSimulationBtn");
    if (btn) btn.innerHTML = "<span>Simulating cascade impact...</span>";

    let result = null;

    if (globalState.isOnline) {
        try {
            const res = await fetch(`${API_BASE}/api/simulate-disruption`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ supplier_id: nodeId })
            });
            result = await res.json();
        } catch (e) {
            console.warn("API simulation failed, running local graph algorithm:", e);
        }
    }

    if (!result) {
        // Run standalone in-browser BFS cascade
        const cg = globalState.clientGraph || new ClientGraph(EMBEDDED_SUPPLIERS, EMBEDDED_DEPENDENCIES);
        result = cg.simulateDisruption(nodeId);
    }

    if (btn) btn.innerHTML = "<span>Simulate Disruption Blast Radius ⚡</span>";

    displaySimulationResult(result);
}

function displaySimulationResult(res) {
    safeText("simResultTitle", `Blast Radius Analysis: ${res.disrupted_node} (${res.name})`);
    
    const badge = document.getElementById("simSeverityBadge");
    if (badge) {
        badge.textContent = res.severity;
        badge.className = `status-tag-${res.severity === 'CRITICAL' ? 'crit' : 'active'}`;
    }

    safeText("simAffectedCount", `${res.affected_count} Nodes`);
    
    const mfgEl = document.getElementById("simMfgHalted");
    if (mfgEl) {
        mfgEl.textContent = res.mfg_halted ? "HALTED" : "SECURE";
        mfgEl.style.color = res.mfg_halted ? "var(--crit)" : "var(--good)";
    }

    const backupEl = document.getElementById("simBackupStatus");
    if (backupEl) {
        backupEl.textContent = res.has_backup ? "YES" : "NO";
        backupEl.style.color = res.has_backup ? "var(--good)" : "var(--crit)";
    }

    safeText("simBypassCount", res.alternate_routes_found > 0 ? `${res.alternate_routes_found} Routes` : "0 (Deadlock)");

    const adviceBox = document.getElementById("simAdviceBox");
    if (adviceBox) {
        adviceBox.innerHTML = `<strong>STRATEGIC ADVISORY:</strong> ${res.recommendation}`;
    }

    const affectedList = document.getElementById("simAffectedList");
    if (affectedList) {
        if (res.affected_suppliers.length === 0) {
            affectedList.innerHTML = `<span style="color:var(--good);">Isolated leaf node disruption. Zero downstream assembly systems impacted.</span>`;
        } else {
            affectedList.innerHTML = res.affected_suppliers.map(a => `
                <div class="sal-node-chip" onclick="inspectNode('${a.id}')" style="cursor:pointer">
                    <strong>${a.id}</strong> • Tier ${a.tier} (${a.name})
                </div>
            `).join("");
        }
    }

    // Visual ripple effect on network graph
    highlightBlastRadiusOnGraph(res.disrupted_node, res.affected_suppliers.map(a => a.id));
}

function highlightBlastRadiusOnGraph(disruptedId, affectedIds) {
    if (!globalState.fullNetworkInstance) return;

    const affectedSet = new Set([...affectedIds, disruptedId]);
    const allVisNodes = globalState.fullNetworkInstance.body.data.nodes;

    allVisNodes.forEach(node => {
        if (node.id === disruptedId) {
            allVisNodes.update({ id: node.id, color: { background: "#ffffff", border: "#f43f5e" }, size: 40 });
        } else if (affectedSet.has(node.id)) {
            allVisNodes.update({ id: node.id, color: { background: "#f43f5e", border: "#fda4af" } });
        } else {
            allVisNodes.update({ id: node.id, color: { background: "rgba(255,255,255,0.05)", border: "rgba(255,255,255,0.1)" } });
        }
    });

    globalState.fullNetworkInstance.focus(disruptedId, { scale: 1.2, animation: true });
}

function setAndSimulate(nodeId) {
    switchTab("simulator");
    const select = document.getElementById("simSupplierSelect");
    if (select) select.value = nodeId;
    runDisruptionSimulation();
}

// ==========================================================================
// Catalog Directory Filtering
// ==========================================================================
function toggleDirectoryView(view) {
    const supPanel = document.getElementById("catalogSuppliersPanel");
    const depPanel = document.getElementById("catalogDependenciesPanel");
    const btnSup = document.getElementById("dirTabSuppliers");
    const btnDep = document.getElementById("dirTabDependencies");

    if (view === "suppliers") {
        if (supPanel) supPanel.classList.remove("hidden");
        if (depPanel) depPanel.classList.add("hidden");
        if (btnSup) btnSup.classList.add("active");
        if (btnDep) btnDep.classList.remove("active");
    } else {
        if (supPanel) supPanel.classList.add("hidden");
        if (depPanel) depPanel.classList.remove("hidden");
        if (btnSup) btnSup.classList.remove("active");
        if (btnDep) btnDep.classList.add("active");
    }
}

function filterCatalogTable() {
    const q = (document.getElementById("catalogSearchInput")?.value || "").toLowerCase();
    const tier = document.getElementById("catalogTierFilter")?.value || "all";
    const risk = document.getElementById("catalogRiskFilter")?.value || "all";

    // Filter suppliers tbody
    const supRows = document.querySelectorAll("#catalogSuppliersTbody tr");
    supRows.forEach(row => {
        const text = row.innerText.toLowerCase();
        const matchesQ = !q || text.includes(q);
        const matchesTier = tier === "all" || text.includes(`tier ${tier}`);
        const matchesRisk = risk === "all" || text.includes(risk);

        row.style.display = (matchesQ && matchesTier && matchesRisk) ? "" : "none";
    });
}

// ==========================================================================
// Navigation & Global Search
// ==========================================================================
function initNavigation() {
    const navItems = document.querySelectorAll(".nav-item");
    navItems.forEach(item => {
        item.addEventListener("click", () => {
            const tab = item.getAttribute("data-tab");
            switchTab(tab);
        });
    });
}

function switchTab(tabId) {
    globalState.activeTab = tabId;

    // Update nav buttons
    document.querySelectorAll(".nav-item").forEach(item => {
        item.classList.toggle("active", item.getAttribute("data-tab") === tabId);
    });

    // Update tab panes
    document.querySelectorAll(".tab-pane").forEach(pane => {
        pane.classList.remove("active");
    });

    const activePane = document.getElementById(`tab-${tabId}`);
    if (activePane) activePane.classList.add("active");

    // Update breadcrumb
    const bcTitles = {
        overview: "Executive Overview",
        network: "Network Topology & Flow Map",
        risks: "Risk Intelligence & SPOF Center",
        simulator: "Disruption Sandbox & Stress Test",
        directory: "Supply Chain Directory & Flows"
    };
    safeText("activeBreadcrumb", bcTitles[tabId] || "Dashboard");

    // If switching to network, fit camera
    if (tabId === "network" && globalState.fullNetworkInstance) {
        setTimeout(() => globalState.fullNetworkInstance.fit(), 200);
    }
}

function initGlobalSearch() {
    const input = document.getElementById("globalSearchInput");
    const dropdown = document.getElementById("searchDropdown");
    if (!input || !dropdown) return;

    input.addEventListener("input", e => {
        const val = e.target.value.trim().toLowerCase();
        if (!val) {
            dropdown.classList.add("hidden");
            dropdown.innerHTML = "";
            return;
        }

        const matches = globalState.networkNodes.filter(n => 
            n.id.toLowerCase().includes(val) || n.name.toLowerCase().includes(val)
        ).slice(0, 8);

        if (matches.length === 0) {
            dropdown.innerHTML = `<div style="padding:12px; font-size:12px; color:var(--text-muted);">No matching suppliers found.</div>`;
        } else {
            dropdown.innerHTML = matches.map(m => `
                <div class="search-result-item" onclick="selectSearchResult('${m.id}')">
                    <div>
                        <div class="sri-name">${m.id} - ${m.name}</div>
                        <div class="sri-sub">Tier ${m.tier} • ${m.is_spof ? 'SPOF' : 'Standard'}</div>
                    </div>
                    <span class="cell-badge ${m.risk_level}">${m.risk_level.toUpperCase()}</span>
                </div>
            `).join("");
        }

        dropdown.classList.remove("hidden");
    });

    document.addEventListener("click", e => {
        if (!input.contains(e.target) && !dropdown.contains(e.target)) {
            dropdown.classList.add("hidden");
        }
    });
}

function selectSearchResult(nodeId) {
    const dropdown = document.getElementById("searchDropdown");
    if (dropdown) dropdown.classList.add("hidden");

    switchTab("network");
    setTimeout(() => {
        searchFocusNode(nodeId);
    }, 250);
}

// ==========================================================================
// Utility Helpers
// ==========================================================================
function safeText(id, val) {
    const el = document.getElementById(id);
    if (el) el.textContent = val;
}