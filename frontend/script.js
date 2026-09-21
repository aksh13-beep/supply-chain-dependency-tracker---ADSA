```javascript
const API_URL = "http://127.0.0.1:8000";

async function loadSuppliers() {
    try {
        const response = await fetch(`${API_URL}/suppliers`);
        const data = await response.json();

        document.getElementById("supplierCount").textContent =
            data.total_suppliers;

        return data;
    } catch (error) {
        return null;
    }
}

async function loadDependencies() {
    try {
        const response = await fetch(`${API_URL}/dependencies`);
        const data = await response.json();

        document.getElementById("dependencyCount").textContent =
            data.total_dependencies;

        updateTable(data.dependencies);

        return data;
    } catch (error) {
        return null;
    }
}

function updateTable(dependencies) {
    const table = document.getElementById("dependencyTable");

    const important = [...dependencies]
        .sort((a, b) => Number(b.weight) - Number(a.weight))
        .slice(0, 6);

    table.innerHTML = important.map(dep => {

        const weight = Number(dep.weight);

        let text = "Moderate";
        let className = "medium";

        if (weight >= 20) {
            text = "Critical";
            className = "critical";
        } else if (weight >= 14) {
            text = "High";
            className = "high";
        }

        return `
            <tr>
                <td>${dep.from}</td>
                <td>${dep.to}</td>
                <td>${dep.weight}</td>
                <td><span class="${className}">${text}</span></td>
            </tr>
        `;
    }).join("");
}

async function checkHealth() {
    try {
        const response = await fetch(`${API_URL}/health`);
        const data = await response.json();

        document.getElementById("systemStatus").textContent =
            data.status === "OK" ? "Operational" : "Check API";

    } catch (error) {
        document.getElementById("systemStatus").textContent = "Offline";
    }
}

async function loadDashboard() {
    await Promise.all([
        loadSuppliers(),
        loadDependencies(),
        checkHealth()
    ]);
}

document.addEventListener("DOMContentLoaded", loadDashboard);
```
