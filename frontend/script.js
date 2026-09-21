const API_URL = "http://127.0.0.1:8000";


async function checkHealth() {

    try {

        const response = await fetch(`${API_URL}/health`);

        const data = await response.json();

        document.getElementById("results").innerHTML =
            `<strong>Backend Status:</strong> ${data.status}`;

    } catch (error) {

        document.getElementById("results").innerHTML =
            "❌ Backend is not running.";

    }
}


async function loadSuppliers() {

    try {

        const response = await fetch(`${API_URL}/suppliers`);

        const data = await response.json();

        document.getElementById("results").innerHTML =
            `<pre>${JSON.stringify(data, null, 2)}</pre>`;

    } catch (error) {

        document.getElementById("results").innerHTML =
            "❌ Supplier API is not available yet.";

    }
}