"""
risk_scoring.py
----------------
OWNER: Khyathi

Implements the risk / criticality analysis from Slide 4:
    - dijkstra()                    -> weighted shortest (lowest-risk) path
    - compute_criticality()         -> ranks suppliers by structural importance
    - find_single_points_of_failure()  -> flags suppliers with no backup
    - find_alternate_path()         -> checks if a backup route exists if
                                        one supplier is removed

Edge weight convention (matches data/dependencies.csv): lead time in days.
A "lowest-risk" path is the path with the smallest total lead time.
"""

import heapq
from collections import deque


def dijkstra(graph, start):
    """
    Standard Dijkstra's algorithm with a min-heap.
    Returns dict {supplier_id: shortest_weighted_distance_from_start}.
    Unreachable suppliers are simply absent from the result.
    """
    distances = {start: 0}
    visited = set()
    heap = [(0, start)]

    while heap:
        dist, node = heapq.heappop(heap)
        if node in visited:
            continue
        visited.add(node)

        for neighbor, weight in graph.get_neighbors(node):
            new_dist = dist + weight
            if neighbor not in distances or new_dist < distances[neighbor]:
                distances[neighbor] = new_dist
                heapq.heappush(heap, (new_dist, neighbor))

    return distances


def compute_criticality(graph):
    """
    Ranks every supplier by "structural importance": how many other
    suppliers (directly or indirectly) rely on it.

    Method: for each node, do a BFS/DFS over the REVERSE graph
    (get_predecessors) to count every supplier that would be affected
    if this node failed. A bigger "affected count" = more critical.

    Returns: list of (supplier_id, affected_count) sorted, most critical first.
    """
    scores = []

    for node in graph.get_all_suppliers():
        affected = _count_reachable_reverse(graph, node)
        scores.append((node, affected))

    scores.sort(key=lambda pair: pair[1], reverse=True)
    return scores


def _count_reachable_reverse(graph, start):
    """Helper: BFS over predecessor edges to count downstream-dependent suppliers."""
    visited = {start}
    queue = deque([start])

    while queue:
        node = queue.popleft()
        for dependent, _weight in graph.get_predecessors(node):
            if dependent not in visited:
                visited.add(dependent)
                queue.append(dependent)

    visited.discard(start)  # don't count the node itself
    return len(visited)


def find_single_points_of_failure(graph):
    """
    Flags suppliers that are BOTH:
      (a) depended on by at least one other supplier, AND
      (b) marked with has_backup = False in the supplier master data.

    These are suppliers where, if disrupted, dependents have no
    alternate source lined up -- the exact risk described in the
    problem statement.

    Returns: list of supplier_ids flagged as single points of failure.
    """
    flagged = []
    for node in graph.get_all_suppliers():
        meta = graph.get_metadata(node)
        has_dependents = len(graph.get_predecessors(node)) > 0
        has_backup = meta.get("has_backup", False)

        if has_dependents and not has_backup:
            flagged.append(node)

    return flagged


def find_alternate_path(graph, start, target, avoid_node):
    """
    Checks whether `target` is still reachable from `start` if
    `avoid_node` (a failed/disrupted supplier) is removed from the graph.

    Used to answer: "if this supplier goes down, can we still get the
    component another way?"

    Returns: list representing the alternate path (supplier ids), or
             None if no alternate path exists.
    """
    if start == avoid_node or target == avoid_node:
        return None

    visited = {start}
    queue = deque([(start, [start])])

    while queue:
        node, path = queue.popleft()
        if node == target:
            return path

        for neighbor, _weight in graph.get_neighbors(node):
            if neighbor == avoid_node or neighbor in visited:
                continue
            visited.add(neighbor)
            queue.append((neighbor, path + [neighbor]))

    return None


if __name__ == "__main__":
    from graph import Graph

    g = Graph()
    g.add_supplier("MFG", has_backup=True)
    g.add_supplier("S1", has_backup=False)
    g.add_dependency("MFG", "S1", weight=5)
    g.add_dependency("MFG", "S2", weight=8)
    g.add_dependency("S2", "S1", weight=2)

    print("Dijkstra from MFG:", dijkstra(g, "MFG"))
    print("Criticality:", compute_criticality(g))
    print("SPOFs:", find_single_points_of_failure(g))
    print("Alternate path MFG->S1 avoiding direct edge:",
          find_alternate_path(g, "MFG", "S1", avoid_node="S2"))
