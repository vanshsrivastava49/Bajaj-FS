const express = require('express');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

const analyzeGraphData = (inputArray) => {
    if (!Array.isArray(inputArray)) {
        return { error: "Payload 'data' must be an array." };
    }

    const invalid_entries = [];
    const duplicate_edges = [];
    const trackedEdges = new Set();
    
    const adjacencyList = {};
    const inDegree = {};
    const uniqueVertices = new Set();

    // Phase 1: Edge Validation & Duplicate Filtering
    const validConnections = [];
    for (const item of inputArray) {
        const cleanStr = typeof item === 'string' ? item.trim() : "";
        const edgePattern = /^([A-Z])->([A-Z])$/;
        const matchResult = cleanStr.match(edgePattern);

        if (!matchResult || matchResult[1] === matchResult[2]) {
            invalid_entries.push(item);
            continue;
        }

        const [_, p, c] = matchResult;

        if (trackedEdges.has(cleanStr)) {
            if (!duplicate_edges.includes(cleanStr)) duplicate_edges.push(cleanStr);
            continue;
        }
        trackedEdges.add(cleanStr);
        validConnections.push({ p, c, raw: cleanStr });
    }

    // Phase 2: Directed Graph Construction (handling multi-parent rule)
    for (const { p, c } of validConnections) {
        if (inDegree[c] > 0) continue; // First parent wins, discard others silently

        if (!adjacencyList[p]) adjacencyList[p] = [];
        adjacencyList[p].push(c);

        inDegree[c] = (inDegree[c] || 0) + 1;
        if (inDegree[p] === undefined) inDegree[p] = 0;

        uniqueVertices.add(p);
        uniqueVertices.add(c);
    }

    // Identify absolute roots or fallback to lexicographical smallest for pure cycles
    let originNodes = Array.from(uniqueVertices).filter(v => inDegree[v] === 0);
    if (originNodes.length === 0 && uniqueVertices.size > 0) {
        originNodes = [Array.from(uniqueVertices).sort()[0]];
    }

    const hierarchies = [];
    let total_trees = 0;
    let total_cycles = 0;
    let largest_tree_root = "";
    let max_depth = 0;

    // Phase 3: DFS Traversal for Tree Building & Cycle Detection
    for (const rootNode of originNodes) {
        const pathStack = new Set();
        let cycleFound = false;

        const traverseAndBuild = (currentNode) => {
            if (pathStack.has(currentNode)) {
                cycleFound = true;
                return { sub: {}, d: 0 };
            }
            pathStack.add(currentNode);

            const childrenObj = {};
            let deepestChild = 0;

            const neighbors = adjacencyList[currentNode] || [];
            neighbors.sort().forEach(neighbor => {
                const { sub, d } = traverseAndBuild(neighbor);
                childrenObj[neighbor] = sub;
                deepestChild = Math.max(deepestChild, d);
            });

            pathStack.delete(currentNode);
            return { sub: childrenObj, d: 1 + deepestChild };
        };

        const { sub: treeStructure, d: treeDepth } = traverseAndBuild(rootNode);

        if (cycleFound) {
            total_cycles++;
            hierarchies.push({ root: rootNode, tree: {}, has_cycle: true });
        } else {
            total_trees++;
            hierarchies.push({ root: rootNode, tree: { [rootNode]: treeStructure }, depth: treeDepth });

            // Tiebreaker algorithm
            if (treeDepth > max_depth || (treeDepth === max_depth && (largest_tree_root === "" || rootNode < largest_tree_root))) {
                max_depth = treeDepth;
                largest_tree_root = rootNode;
            }
        }
    }

    return {
        "user_id": "yourfullname_ddmmyyyy",       // UPDATE THIS
        "email_id": "your.email@college.edu",     // UPDATE THIS
        "college_roll_number": "YOUR_ROLL",       // UPDATE THIS
        "hierarchies": hierarchies,
        "invalid_entries": invalid_entries,
        "duplicate_edges": duplicate_edges,
        "summary": { total_trees, total_cycles, largest_tree_root }
    };
};

app.post('/bfhl', (req, res) => {
    try {
        const payload = req.body.data;
        if (!payload) {
            return res.status(400).json({ error: "Missing 'data' array in payload." });
        }
        res.status(200).json(analyzeGraphData(payload));
    } catch (err) {
        res.status(500).json({ error: "Server processing error" });
    }
});

const APP_PORT = process.env.PORT || 3000;
app.listen(APP_PORT, () => {
    console.log(`Server actively listening on port ${APP_PORT}`);
});