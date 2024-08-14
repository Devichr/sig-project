class Graph {
  constructor() {
    this.nodes = new Set();
    this.edges = new Map();
  }

  addNode(node) {
    this.nodes.add(node);
    this.edges.set(node, []);
  }

  addEdge(node1, node2, weight) {
    this.edges.get(node1).push({ node: node2, weight });
    this.edges.get(node2).push({ node: node1, weight });
  }

  dijkstra(startNode) {
    const distances = new Map();
    const visited = new Set();
    const pq = new PriorityQueue();

    this.nodes.forEach(node => distances.set(node, Infinity));
    distances.set(startNode, 0);

    pq.enqueue(startNode, 0);

    while (!pq.isEmpty()) {
      const { node: currentNode } = pq.dequeue();

      if (visited.has(currentNode)) continue;
      visited.add(currentNode);

      this.edges.get(currentNode).forEach(neighbor => {
        if (!visited.has(neighbor.node)) {
          const newDist = distances.get(currentNode) + neighbor.weight;

          if (newDist < distances.get(neighbor.node)) {
            distances.set(neighbor.node, newDist);
            pq.enqueue(neighbor.node, newDist);
          }
        }
      });
    }

    return distances;
  }
}

class PriorityQueue {
  constructor() {
    this.queue = [];
  }

  enqueue(node, priority) {
    this.queue.push({ node, priority });
    this.queue.sort((a, b) => a.priority - b.priority);
  }

  dequeue() {
    return this.queue.shift();
  }

  isEmpty() {
    return this.queue.length === 0;
  }
}

const haversineDistance = (coords1, coords2) => {
  const toRad = (x) => (x * Math.PI) / 180;

  const lat1 = coords1.latitude;
  const lon1 = coords1.longitude;
  const lat2 = coords2.latitude;
  const lon2 = coords2.longitude;

  const R = 6371; // km
  const x1 = lat2 - lat1;
  const dLat = toRad(x1);
  const x2 = lon1 - lon2;
  const dLon = toRad(x2);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};



module.exports = { Graph, haversineDistance};
