"""
graph.py
--------
OWNER: Aksitha

Core graph data structure for the Supply Chain Dependency Tracker.

Design choice (see Slide 4 of the proposal):
    We use an Adjacency List (dict of lists) instead of an adjacency matrix
    because real supplier networks are SPARSE (a supplier depends on a
    handful of others, not on every other supplier). This gives us:
        Space:  O(V + E)   instead of O(V^2)
        Neighbor lookup: O(1) average

An edge (from_id -> to_id) means:
"from_id DEPENDS ON to_id",
i.e. to_id supplies something that from_id needs.

This module is the shared contract between both teammates.
DO NOT change method signatures without telling the other person --
traversal.py, risk_scoring.py and visualize.py all import this class.
"""

from collections import defaultdict


class Graph:

    def __init__(self):
        # supplier_id -> metadata dict
        self.suppliers = {}

        # supplier_id -> list of (neighbor_id, weight)
        # "who does this supplier depend on"
        self.adjacency = defaultdict(list)

        # supplier_id -> list of (dependent_id, weight)
        # "who depends on this supplier"
        self.reverse_adjacency = defaultdict(list)

    # ------------------------------------------------------------------
    # Building the graph
    # ------------------------------------------------------------------

    def add_supplier(self, supplier_id, name=None, tier=None, has_backup=None):
        """Register a supplier node. Safe to call multiple times."""

        if supplier_id not in self.suppliers:

            self.suppliers[supplier_id] = {
                "name": name or supplier_id,
                "tier": tier,
                "has_backup": has_backup,
            }

        else:
            # Allow later calls to fill in metadata if it was missing
            meta = self.suppliers[supplier_id]

            if name is not None:
                meta["name"] = name

            if tier is not None:
                meta["tier"] = tier

            if has_backup is not None:
                meta["has_backup"] = has_backup

        # Make sure both adjacency maps know about this node
        _ = self.adjacency[supplier_id]
        _ = self.reverse_adjacency[supplier_id]

    def add_dependency(self, from_id, to_id, weight=1.0):
        """
        Record that `from_id` depends on `to_id`,
        with an edge weight.
        """

        if from_id not in self.suppliers:
            self.add_supplier(from_id)

        if to_id not in self.suppliers:
            self.add_supplier(to_id)

        self.adjacency[from_id].append((to_id, weight))

        self.reverse_adjacency[to_id].append((from_id, weight))

    # ------------------------------------------------------------------
    # Reading the graph
    # ------------------------------------------------------------------

    def get_neighbors(self, supplier_id):
        """
        Suppliers that `supplier_id` depends on.

        Returns:
            [(neighbor_id, weight), ...]
        """

        return self.adjacency.get(supplier_id, [])

    def get_predecessors(self, supplier_id):
        """
        Suppliers that depend ON `supplier_id`.

        Returns:
            [(dependent_id, weight), ...]
        """

        return self.reverse_adjacency.get(supplier_id, [])

    def get_all_suppliers(self):
        """
        Return all supplier/node IDs in the graph.

        Because add_dependency() automatically registers both
        from_id and to_id, this includes every node appearing
        in the dependency graph.
        """

        return list(self.suppliers.keys())

    def get_metadata(self, supplier_id):
        """Return metadata for a supplier."""

        return self.suppliers.get(supplier_id, {})

    def num_suppliers(self):
        """Return total number of suppliers."""

        return len(self.suppliers)

    def num_dependencies(self):
        """Return total number of dependency edges."""

        return sum(len(v) for v in self.adjacency.values())

    def __repr__(self):
        return (
            f"Graph("
            f"suppliers={self.num_suppliers()}, "
            f"dependencies={self.num_dependencies()}"
            f")"
        )


# ----------------------------------------------------------------------
# Data ingestion (Aksitha)
# ----------------------------------------------------------------------

def load_graph_from_csv(suppliers_csv_path, dependencies_csv_path):
    """
    Build a Graph from two CSV files.

    suppliers.csv columns:
        id, name, tier, has_backup

    dependencies.csv columns:
        from, to, weight
    """

    import csv

    graph = Graph()

    # --------------------------------------------------------------
    # Load suppliers
    # --------------------------------------------------------------

    with open(
        suppliers_csv_path,
        newline="",
        encoding="utf-8"
    ) as f:

        for row in csv.DictReader(f):

            has_backup = (
                row.get("has_backup", "")
                .strip()
                .lower()
                == "true"
            )

            graph.add_supplier(
                supplier_id=row["id"].strip(),
                name=row.get("name", "").strip(),
                tier=row.get("tier", "").strip(),
                has_backup=has_backup,
            )

    # --------------------------------------------------------------
    # Load dependencies
    # --------------------------------------------------------------

    with open(
        dependencies_csv_path,
        newline="",
        encoding="utf-8"
    ) as f:

        for row in csv.DictReader(f):

            weight = float(
                row.get("weight", 1) or 1
            )

            graph.add_dependency(
                row["from"].strip(),
                row["to"].strip(),
                weight
            )

    return graph


# ----------------------------------------------------------------------
# Quick manual smoke test
# ----------------------------------------------------------------------

if __name__ == "__main__":

    g = Graph()

    g.add_supplier(
        "MFG",
        "Main Manufacturer",
        tier=0
    )

    g.add_supplier(
        "S1",
        "Circuit Board Co",
        tier=1
    )

    g.add_dependency(
        "MFG",
        "S1",
        weight=5
    )

    print(g)

    print(
        "Neighbors of MFG:",
        g.get_neighbors("MFG")
    )

    print(
        "Predecessors of S1:",
        g.get_predecessors("S1")
    )