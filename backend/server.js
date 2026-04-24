const express = require('express');
const cors = require('cors');
const app = express();
app.use(cors({ origin: '*' })); 
app.use(express.json()); 

function evaluateHierarchies(inputList) {
    if (!Array.isArray(inputList)) throw new Error("Payload must be an array.");

    const badEntries = [];
    const repeatedLinks = [];
    const processedPairs = new Set();

    const childMapping = new Map();
    const parentCounts = new Map();
    const uniquePoints = new Set();

    const structureResults = [];
    let validTreeCount = 0;
    let cycleCount = 0;
    let highestDepth = 0;
    let topRootNode = "";

    const validLinks = [];
    for (const rawItem of inputList) {
        const strVal = typeof rawItem === 'string' ? rawItem.trim() : "";
        
        const formatCheck = /^([A-Z])->([A-Z])$/.test(strVal);

        if (!formatCheck) {
            badEntries.push(rawItem);
            continue;
        }

        const pNode = strVal[0];
        const cNode = strVal[3];

        if (pNode === cNode) {
            badEntries.push(rawItem);
            continue;
        }
        if (processedPairs.has(strVal)) {
            if (!repeatedLinks.includes(strVal)) repeatedLinks.push(strVal);
            continue;
        }       
        
        processedPairs.add(strVal);
        validLinks.push({ pNode, cNode });
    }

    for (const { pNode, cNode } of validLinks) {
        if ((parentCounts.get(cNode) || 0) > 0) continue;
        
        if (!childMapping.has(pNode)) childMapping.set(pNode, []);
        childMapping.get(pNode).push(cNode);
        
        parentCounts.set(cNode, (parentCounts.get(cNode) || 0) + 1);
        if (!parentCounts.has(pNode)) parentCounts.set(pNode, 0);
        
        uniquePoints.add(pNode).add(cNode);
    }

    const overallVisited = new Set();

    const walkGraph = (startPoint) => {
        const currentStack = new Set();
        const branchVisited = new Set();
        let foundCycle = false;
        const dive = (curr) => {
            if (currentStack.has(curr)) {
                foundCycle = true;
                return { layout: {}, depthScore: 0 };
            }
            
            currentStack.add(curr);
            branchVisited.add(curr);
            const levelContent = {};
            let peakDepth = 0;
            const nextNodes = childMapping.get(curr) || [];
            nextNodes.sort().forEach(n => {
                const res = dive(n);
                levelContent[n] = res.layout;
                peakDepth = Math.max(peakDepth, res.depthScore);
            });

            currentStack.delete(curr);
            return { layout: levelContent, depthScore: 1 + peakDepth };
        };
        
        const { layout, depthScore } = dive(startPoint);
        return { foundCycle, layout, depthScore, branchVisited };
    };
    let originPoints = Array.from(uniquePoints).filter(pt => parentCounts.get(pt) === 0);
    originPoints.sort(); 

    for (const rootPt of originPoints) {
        const { foundCycle, layout, depthScore, branchVisited } = walkGraph(rootPt);
        branchVisited.forEach(n => overallVisited.add(n)); 

        if (foundCycle) {
            cycleCount++;
            structureResults.push({ root: rootPt, tree: {}, has_cycle: true }); 
        } else {
            validTreeCount++;
            structureResults.push({ root: rootPt, tree: { [rootPt]: layout }, depth: depthScore }); 
            
            if (depthScore > highestDepth || (depthScore === highestDepth && (topRootNode === "" || rootPt < topRootNode))) {
                highestDepth = depthScore;
                topRootNode = rootPt;
            }
        }
    }

    let leftoverPoints = Array.from(uniquePoints).filter(pt => !overallVisited.has(pt));
    
    while (leftoverPoints.length > 0) {
        leftoverPoints.sort();
        const cycleStart = leftoverPoints[0];
        
        const { foundCycle, layout, branchVisited } = walkGraph(cycleStart);
        branchVisited.forEach(n => overallVisited.add(n));
        cycleCount++;
        structureResults.push({ root: cycleStart, tree: {}, has_cycle: true }); 
        leftoverPoints = Array.from(uniquePoints).filter(pt => !overallVisited.has(pt));
    }
    return {
        "user_id": "vanshsrivastava_04092004",
        "email_id": "vs1743@srmist.edu.in", 
        "college_roll_number": "RA2311003011846",
        "hierarchies": structureResults,
        "invalid_entries": badEntries,
        "duplicate_edges": repeatedLinks,
        "summary": { 
            total_trees: validTreeCount, 
            total_cycles: cycleCount, 
            largest_tree_root: topRootNode 
        }
    };
}
app.post('/bfhl', (req, res) => {
    try {
        const inputData = req.body.data;
        
        if (!inputData) {
            return res.status(400).json({ error: "Missing 'data' array in payload." });
        }
        
        const finalOutput = evaluateHierarchies(inputData);
        res.status(200).json(finalOutput);
        
    } catch (error) {
        res.status(500).json({ error: error.message || "Internal Server Error" });
    }
});
const SERVER_PORT = process.env.PORT || 3000;
app.listen(SERVER_PORT, () => {
    console.log(`backend is up on ${SERVER_PORT}`);
});