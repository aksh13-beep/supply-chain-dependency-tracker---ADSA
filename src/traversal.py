"""
traversal.py
------------
OWNER: Aksitha

Implements the basic graph-traversal algorithms from Slide 4:
    - DFS   (Depth-First Search)      -> used for cycle detection
    - BFS   (Breadth-First Search)    -> shortest hop-count reachability
    - detect_cycles()                 -> flags circular dependency risk
    - topological_sort()              -> valid build/procurement order

All functions take a `Graph` object from graph.py and work only through
its public methods (get_neighbors, get_all_suppliers), so this module
never touches the graph's internals directly.
"""

from collections import deque


def dfs(graph, start):
    """
    Depth-first traversal from `start`.
    Returns the list of supplier ids in the order they were visited.
    Uses an explicit stack (not recursion) so it's safe for large,
    deep supplier chains without hitting Python's recursion limit.
    """
    visited = set()
    order = []
    stack = [start]

    while stack:
        node = stack.pop()
        if node in visited:
            continue
        visited.add(node)
        order.append(node)
        # push neighbors in reverse so we explore them in the natural order
        for neighbor, _weight in reversed(graph.get_neighbors(node)):
            if neighbor not in visited:
                stack.append(neighbor)

    return order


def bfs(graph, start):
    """
    Breadth-first traversal from `start`.
    Returns a dict {supplier_id: hop_distance_from_start}.
    This answers "how many tiers away is this dependency" ignoring weight.
    """
    distances = {start: 0}
    queue = deque([start])

    while queue:
        node = queue.popleft()
        for neighbor, _weight in graph.get_neighbors(node):
            if neighbor not in distances:
                distances[neighbor] = distances[node] + 1
                queue.append(neighbor)

    return distances


def detect_cycles(graph):
    """
    Detects circular dependencies using DFS with node coloring
    (white = unvisited, gray = on current recursion path, black = done).
    A "back edge" (an edge into a gray node) means a cycle exists.

    Returns: list of cycles, where each cycle is a list of supplier ids
             forming the loop, e.g. ["S4", "S8", "S4"].
             Empty list means the graph is acyclic.
    """
    WHITE, GRAY, BLACK = 0, 1, 2
    color = {node: WHITE for node in graph.get_all_suppliers()}
    cycles = []

    def visit(node, path):
        color[node] = GRAY
        path.append(node)

        for neighbor, _weight in graph.get_neighbors(node):
            if color.get(neighbor, WHITE) == GRAY:
                # back edge found -> extract the cycle portion of the path
                cycle_start_index = path.index(neighbor)
                cycles.append(path[cycle_start_index:] + [neighbor])
            elif color.get(neighbor, WHITE) == WHITE:
                visit(neighbor, path)

        path.pop()
        color[node] = BLACK

    for node in graph.get_all_suppliers():
        if color[node] == WHITE:
            visit(node, [])

    return cycles


def topological_sort(graph):
    """
    Kahn's Algorithm: produces a valid build/procurement order
    (every supplier appears only after everything it depends on).

    Returns:
        (order, is_valid)
        order    -> list of supplier ids in safe processing order
        is_valid -> False if a cycle was detected (order is incomplete)
    """
    in_degree = {node: 0 for node in graph.get_all_suppliers()}
    for node in graph.get_all_suppliers():
        for neighbor, _weight in graph.get_neighbors(node):
            in_degree[neighbor] += 1

    # NOTE: in a "depends on" graph, a good starting point for procurement
    # is a node with no *dependents* pointing INTO it from earlier stages.
    # Here we sort by out-degree completion instead: start from suppliers
    # that have zero unresolved dependencies (leaf raw-material suppliers).
    remaining_deps = {node: len(graph.get_neighbors(node)) for node in graph.get_all_suppliers()}

    queue = deque([node for node in graph.get_all_suppliers() if remaining_deps[node] == 0])
    order = []

    while queue:
        node = queue.popleft()
        order.append(node)
        for dependent, _weight in graph.get_predecessors(node):
            remaining_deps[dependent] -= 1
            if remaining_deps[dependent] == 0:
                queue.append(dependent)

    is_valid = len(order) == len(graph.get_all_suppliers())
    return order, is_valid


if __name__ == "__main__":
    from graph import Graph

    g = Graph()
    g.add_dependency("MFG", "S1")
    g.add_dependency("S1", "S2")
    g.add_dependency("S2", "S1")  # cycle
    print("DFS from MFG:", dfs(g, "MFG"))
    print("BFS from MFG:", bfs(g, "MFG"))
    print("Cycles:", detect_cycles(g))
    print("Topo sort:", topological_sort(g))
