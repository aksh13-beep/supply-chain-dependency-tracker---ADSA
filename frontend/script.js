async function loadCycles() {
    try {
        const response = await fetch(`${API_URL}/cycles`);
        const data = await response.json();

        document.getElementById("cycleCount").textContent =
            String(data.total_cycles).padStart(2, "0");

        return data;

    } catch (error) {
        document.getElementById("cycleCount").textContent = "--";
        return null;
    }
}


async function loadDashboard() {
    await Promise.all([
        loadSuppliers(),
        loadDependencies(),
        loadCycles(),
        checkHealth()
    ]);
}