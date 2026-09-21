"""
main.py
-------
OWNERS: Aksitha + Khyathi (write/review this file TOGETHER)

Entry point that ties both halves of the project together:
    graph.py, traversal.py        -> Aksitha
    risk_scoring.py, visualize.py -> Khyathi

Run from the project root with:
    python src/main.py
"""

import os

from graph import load_graph_from_csv
from traversal import detect_cycles, topological_sort
from risk_scoring import compute_criticality, find_single_points_of_failure, dijkstra
from visualize import draw_dependency_graph, print_alerts

DATA_DIR = os.path.join(os.path.dirname(__file__), "..", "data")
OUTPUT_DIR = os.path.join(os.path.dirname(__file__), "..", "output")


def main():
    os.makedirs(OUTPUT_DIR, exist_ok=True)

    # ---- Step 1 & 2: Data ingestion + graph construction (Aksitha) ----
    suppliers_csv = os.path.join(DATA_DIR, "suppliers.csv")
    dependencies_csv = os.path.join(DATA_DIR, "dependencies.csv")
    graph = load_graph_from_csv(suppliers_csv, dependencies_csv)
    print(f"Loaded graph: {graph}")

    # ---- Step 3 & 4: Traversal + cycle detection (Aksitha) ----
    cycles = detect_cycles(graph)
    order, is_acyclic = topological_sort(graph)
    if is_acyclic:
        print("\nValid procurement order (leaf suppliers first):")
        print(" -> ".join(order))
    else:
        print(f"\nTopological sort INCOMPLETE -- {len(cycles)} cycle(s) block a valid order.")

    # ---- Step 5: Risk scoring (Khyathi) ----
    criticality_scores = compute_criticality(graph)
    spof_ids = find_single_points_of_failure(graph)
    shortest_risk_paths = dijkstra(graph, start="MFG")
    print("\nLowest-risk (shortest lead-time) path lengths from MFG:")
    for supplier_id, dist in sorted(shortest_risk_paths.items(), key=lambda x: x[1]):
        print(f"    {supplier_id}: {dist} days")

    # ---- Step 6: Visualization & alerts (Khyathi) ----
    print_alerts(graph, cycles, spof_ids, criticality_scores)
    image_path = draw_dependency_graph(
        graph, cycles, spof_ids, criticality_scores,
        output_path=os.path.join(OUTPUT_DIR, "dependency_graph.png"),
    )
    print(f"Dependency graph image saved to: {image_path}")


if __name__ == "__main__":
    main()