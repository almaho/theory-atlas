#!/usr/bin/env python3
"""Exhaust small instances of Ko's matching reductions (arXiv:2610.10904v3).

Independent combinatorial checks of Appendix A.1.1 and A.2.4, not a test
or verification of the underlying cell-probe lower-bound proof.
Uses no third-party packages. Run with Python 3.
"""

from collections import deque
from itertools import product


def maximum_cardinality(left_size, right_size, edges):
    adjacent = [[] for _ in range(left_size)]
    for left, right in edges:
        adjacent[left].append(right)
    mate = [-1] * right_size

    def augment(left, seen):
        for right in adjacent[left]:
            if right not in seen:
                seen.add(right)
                if mate[right] == -1 or augment(mate[right], seen):
                    mate[right] = left
                    return True
        return False

    return sum(augment(left, set()) for left in range(left_size))


def maximum_weight(size, edges):
    """Hungarian oracle; zero nonedges permit arbitrary unmatched vertices."""
    costs = [[0] * size for _ in range(size)]
    for left, right, weight in edges:
        costs[left][right] = -weight
    u, v = [0] * (size + 1), [0] * (size + 1)
    matching, previous = [0] * (size + 1), [0] * (size + 1)
    for left in range(1, size + 1):
        matching[0] = left
        column = 0
        best = [float('inf')] * (size + 1)
        used = [False] * (size + 1)
        while True:
            used[column] = True
            row = matching[column]
            delta, next_column = float('inf'), 0
            for candidate in range(1, size + 1):
                if not used[candidate]:
                    reduced = costs[row - 1][candidate - 1] - u[row] - v[candidate]
                    if reduced < best[candidate]:
                        best[candidate] = reduced
                        previous[candidate] = column
                    if best[candidate] < delta:
                        delta, next_column = best[candidate], candidate
            for candidate in range(size + 1):
                if used[candidate]:
                    u[matching[candidate]] += delta
                    v[candidate] -= delta
                else:
                    best[candidate] -= delta
            column = next_column
            if matching[column] == 0:
                break
        while column:
            previous_column = previous[column]
            matching[column] = matching[previous_column]
            column = previous_column
    return v[0]


def matrices(n):
    for bits in product((0, 1), repeat=n * n):
        yield [bits[row * n:(row + 1) * n] for row in range(n)]


def unweighted_gadget(matrix, inserted, query):
    n = len(matrix)
    # The same local indices name opposite bipartition copies.
    edges = [(i, i) for i in range(2 * n)]
    edges += [(i, n + j) for i in range(n) for j in range(n) if matrix[i][j]]
    edges += [(n + j, 2 * n) for j in inserted]
    if query is not None:
        edges.append((2 * n, query))
    return edges


def weighted_core(matrix, inserted):
    n, vertices, edges = len(matrix), [], []
    p = n + 1

    def vertex(side, kind, row, column):
        return (side, kind, row, column)

    for side in ('L', 'R'):
        for index in range(1, p + 1):
            vertices += [vertex(side, 'a', 0, index), vertex(side, 'b', index, 0)]
        for row in range(1, p + 1):
            for column in range(1, p + 1):
                u, v, w, x = [vertex(side, kind, row, column) for kind in 'uvwx']
                vertices += [u, v, w, x]
                above = (vertex(side, 'a', 0, column) if row == 1
                         else vertex(side, 'u', row - 1, column))
                after = (vertex(side, 'b', row, 0) if column == p
                         else vertex(side, 'u', row, column + 1))
                cell_edges = [(above, v, 2 * column - 1), (v, u, 1),
                              (u, w, 2), (w, after, 2 * p - 2)]
                # The reflected right grid is traversed in the reverse direction.
                if side == 'R':
                    cell_edges = [(target, source, length)
                                  for source, target, length in cell_edges]
                edges += cell_edges
                edges.append((v, x, 1))  # Unused leaves point away from the grid.
                if side == 'L' and row <= n and column <= n and matrix[column - 1][row - 1]:
                    edges.append((x, w, 1))
    h = 4 * p * (p + 1)
    for element in set(inserted) | {n}:
        j = element + 1
        edges.append((vertex('L', 'b', j, 0), vertex('R', 'b', j, 0),
                      h + 2 * (p + 1) * (p - j)))
    assert len(vertices) == 8 * p * p + 4 * p
    assert len(set(vertices)) == len(vertices)
    return vertices, edges, 2 * h


def assert_acyclic(vertices, edges):
    adjacent, indegree = {v: [] for v in vertices}, {v: 0 for v in vertices}
    for source, target, _ in edges:
        adjacent[source].append(target)
        indegree[target] += 1
    queue = deque(v for v in vertices if indegree[v] == 0)
    visited = 0
    while queue:
        source = queue.popleft()
        visited += 1
        for target in adjacent[source]:
            indegree[target] -= 1
            if indegree[target] == 0:
                queue.append(target)
    assert visited == len(vertices)


def test_unweighted():
    cases = 0
    for n in range(1, 4):
        for matrix in matrices(n):
            for mask in range(1 << n):
                inserted = {j for j in range(n) if mask & (1 << j)}
                baseline = unweighted_gadget(matrix, inserted, None)
                assert maximum_cardinality(2 * n + 1, 2 * n + 1, baseline) == 2 * n
                for query in range(n):
                    intersects = any(matrix[query][j] for j in inserted)
                    edges = unweighted_gadget(matrix, inserted, query)
                    found = maximum_cardinality(2 * n + 1, 2 * n + 1, edges)
                    assert found == 2 * n + int(intersects), (matrix, inserted, query, found)
                    assert (found == 2 * n + 1) == intersects
                    cases += 1
    return cases


def test_weighted():
    # Check the weight oracle itself on every 2x2 weighted bipartite graph.
    for weights in product(range(3), repeat=4):
        edges = [(i, j, weights[2 * i + j]) for i in range(2) for j in range(2)]
        assert maximum_weight(2, edges) == max(weights[0] + weights[3], weights[1] + weights[2])
    cases = 0
    for n in range(1, 3):
        p = n + 1
        for matrix in matrices(n):
            for mask in range(1 << n):
                inserted = {j for j in range(n) if mask & (1 << j)}
                vertices, core_edges, distance = weighted_core(matrix, inserted)
                assert_acyclic(vertices, core_edges)
                index = {v: i for i, v in enumerate(vertices)}
                count, k = len(vertices), distance + 1
                edges = [(i, i, k) for i in range(count)]
                assert all(0 < length < distance for _, _, length in core_edges)
                edges += [(index[a], index[b], k - length) for a, b, length in core_edges]
                assert maximum_weight(count + 1, edges) == count * k
                for query in range(n):
                    selected = edges + [
                        (count, index[('L', 'a', 0, query + 1)], k),
                        (index[('R', 'a', 0, p - query)], count, k),
                    ]
                    intersects = any(matrix[query][j] for j in inserted)
                    found = maximum_weight(count + 1, selected)
                    expected = count * k + 1 + int(intersects)
                    assert found == expected, (matrix, inserted, query, found, expected)
                    cases += 1
    return cases


if __name__ == '__main__':
    unweighted_cases = test_unweighted()
    weighted_cases = test_weighted()
    print(f'PASS: {unweighted_cases} unweighted and {weighted_cases} weighted '
          'gadget/query instances, plus pre-query baselines and oracle checks.')
