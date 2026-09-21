"""
visualize.py
------------
OWNER: Khyathi

Renders the supplier dependency graph as an image and prints a
human-readable alert list for high-risk suppliers (Slide 3, step 6).

Uses networkx purely as a drawing/layout helper -- all the actual
analysis (cycles, criticality, SPOFs) comes from OUR OWN algorithms
in traversal.py and risk_scoring.py, not from networkx's built-ins.
"""

import networkx as nx
import matplotlib.pyplot as plt


def to_networkx(graph):
    """Convert our Graph object into a networkx.DiGraph purely for drawing."""
    G = nx.DiGraph()
    for node in graph.get_all_suppliers():
        G.add_node(node, **graph.get_metadata(node))
    for node in graph.get_all_suppliers():
        for neighbor, weight in graph.get_neighbors(node):
            G.add_edge(node, neighbor, weight=weight)
    return G


def draw_dependency_graph(graph, cycles, spof_ids, criticality_scores, output_path):
    """
    Draws the dependency graph and saves it as a PNG.

    Color coding:
        red     -> single point of failure
        orange  -> part of a detected cycle
        skyblue -> normal supplier
    Node size scales with criticality score.
    """
    G = to_networkx(graph)
    # k controls node spacing; larger networks need more room to stay readable
    k_value = 0.9 if G.number_of_nodes() <= 15 else 1.4
    pos = nx.spring_layout(G, seed=42, k=k_value, iterations=100)

    cycle_nodes = set()
    for cycle in cycles:
        cycle_nodes.update(cycle)

    criticality_map = dict(criticality_scores)
    max_score = max(criticality_map.values()) if criticality_map else 1

    node_colors = []
    node_sizes = []
    for node in G.nodes():
        if node in spof_ids:
            node_colors.append("#e74c3c")     # red
        elif node in cycle_nodes:
            node_colors.append("#e67e22")     # orange
        else:
            node_colors.append("#5dade2")     # blue

        score = criticality_map.get(node, 0)
        node_sizes.append(300 + (score / max(max_score, 1)) * 1400)

    is_large = G.number_of_nodes() > 15
    fig_size = (22, 16) if is_large else (11, 8)
    label_font = 6 if is_large else 9
    edge_label_font = 5 if is_large else 7

    plt.figure(figsize=fig_size)
    nx.draw_networkx_nodes(G, pos, node_color=node_colors, node_size=node_sizes, alpha=0.9)
    nx.draw_networkx_labels(G, pos, font_size=label_font, font_weight="bold")
    nx.draw_networkx_edges(G, pos, arrows=True, arrowsize=12, alpha=0.4, connectionstyle="arc3,rad=0.08")
    if not is_large:
        edge_labels = nx.get_edge_attributes(G, "weight")
        nx.draw_networkx_edge_labels(G, pos, edge_labels=edge_labels, font_size=edge_label_font)

    plt.title("Supply Chain Dependency Graph\n(red = single point of failure, orange = in a cycle)")
    plt.axis("off")
    plt.tight_layout()
    plt.savefig(output_path, dpi=150)
    plt.close()
    return output_path


def print_alerts(graph, cycles, spof_ids, criticality_scores, top_n=5):
    """Prints a plain-text risk report to the console."""
    print("\n" + "=" * 60)
    print("RISK ALERT REPORT")
    print("=" * 60)

    print(f"\n[1] Circular dependencies detected: {len(cycles)}")
    for cycle in cycles:
        print("    -> " + " -> ".join(cycle))

    print(f"\n[2] Single points of failure: {len(spof_ids)}")
    for supplier_id in spof_ids:
        name = graph.get_metadata(supplier_id).get("name", supplier_id)
        dependents = len(graph.get_predecessors(supplier_id))
        print(f"    -> {supplier_id} ({name}): {dependents} supplier(s) rely on it, no backup source")

    print(f"\n[3] Top {top_n} most critical suppliers (by downstream impact):")
    for supplier_id, score in criticality_scores[:top_n]:
        name = graph.get_metadata(supplier_id).get("name", supplier_id)
        print(f"    -> {supplier_id} ({name}): affects {score} other supplier(s) if disrupted")

    print("=" * 60 + "\n")
