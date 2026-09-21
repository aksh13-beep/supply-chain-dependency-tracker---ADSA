import sys
import csv

sys.path.append("src")

from graph import Graph
from traversal import detect_cycles
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import csv

app = FastAPI(
    title="Supply Chain Dependency Tracker",
    description="API for supply chain dependency and risk analysis",
    version="1.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/")
def home():
    return {
        "message": "Supply Chain Dependency Tracker API is running!"
    }


@app.get("/health")
def health():
    return {
        "status": "OK"
    }


@app.get("/suppliers")
def get_suppliers():

    suppliers = []

    with open("data/suppliers.csv", "r", encoding="utf-8") as file:

        reader = csv.DictReader(file)

        for row in reader:
            suppliers.append(row)

    return {
        "total_suppliers": len(suppliers),
        "suppliers": suppliers
    }
@app.get("/dependencies")
def get_dependencies():

    dependencies = []

    with open("data/dependencies.csv", "r", encoding="utf-8") as file:

        reader = csv.DictReader(file)

        for row in reader:
            dependencies.append(row)

    return {
        "total_dependencies": len(dependencies),
        "dependencies": dependencies
    }
@app.get("/cycles")
def get_cycles():

    graph = Graph()

    with open("data/dependencies.csv", "r", encoding="utf-8") as file:

        reader = csv.DictReader(file)

        for row in reader:
            graph.add_dependency(
                row["from"],
                row["to"],
                int(row["weight"])
            )

    cycles = detect_cycles(graph)

    return {
        "total_cycles": len(cycles),
        "cycles": cycles
    }