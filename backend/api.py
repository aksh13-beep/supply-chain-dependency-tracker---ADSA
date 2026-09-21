from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

import csv
import sys

# Allow Python to find files inside the src folder
sys.path.append("src")

from graph import load_graph_from_csv
from traversal import detect_cycles


app = FastAPI(
    title="Supply Chain Dependency Tracker",
    description="API for supply chain dependency and risk analysis",
    version="1.0"
)


# ---------------------------------------------------------
# CORS
# ---------------------------------------------------------

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ---------------------------------------------------------
# Home
# ---------------------------------------------------------

@app.get("/")
def home():
    return {
        "message": "Supply Chain Dependency Tracker API is running!"
    }


# ---------------------------------------------------------
# Health check
# ---------------------------------------------------------

@app.get("/health")
def health():
    return {
        "status": "OK"
    }


# ---------------------------------------------------------
# Get suppliers
# ---------------------------------------------------------

@app.get("/suppliers")
def get_suppliers():

    suppliers = []

    with open(
        "data/suppliers.csv",
        "r",
        encoding="utf-8"
    ) as file:

        reader = csv.DictReader(file)

        for row in reader:
            suppliers.append(row)

    return {
        "total_suppliers": len(suppliers),
        "suppliers": suppliers
    }


# ---------------------------------------------------------
# Get dependencies
# ---------------------------------------------------------

@app.get("/dependencies")
def get_dependencies():

    dependencies = []

    with open(
        "data/dependencies.csv",
        "r",
        encoding="utf-8"
    ) as file:

        reader = csv.DictReader(file)

        for row in reader:
            dependencies.append(row)

    return {
        "total_dependencies": len(dependencies),
        "dependencies": dependencies
    }


# ---------------------------------------------------------
# Detect cycles
# ---------------------------------------------------------

@app.get("/cycles")
def get_cycles():

    graph = load_graph_from_csv(
        "data/suppliers.csv",
        "data/dependencies.csv"
    )

    cycles = detect_cycles(graph)

    return {
        "total_cycles": len(cycles),
        "cycles": cycles
    }