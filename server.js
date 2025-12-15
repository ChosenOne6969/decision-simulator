// server.js
const express = require('express');
const cors = require('cors');
// Import the updated engine
const { runSimulation } = require('./simulationEngine');

const app = express();
const PORT = 5000;

// Middleware
app.use(cors()); // Allows our frontend to talk to this backend
app.use(express.json()); // Allows us to parse JSON data sent in the request

// API Route: POST /api/simulate
app.post('/api/simulate', (req, res) => {
    // 1. Extract data from the frontend request
    // We now look for 'customRules' in addition to the standard inputs
    const { inputs, uncertaintyLevel, scenarioType, customRules } = req.body;

    // Validation
    if (!inputs || typeof uncertaintyLevel === 'undefined') {
        return res.status(400).json({ error: "Missing inputs or uncertainty level" });
    }

    // Default to "medical" if no scenario is provided
    const selectedScenario = scenarioType || "medical";

    console.log(`Received Request: ${selectedScenario} simulation, Level ${uncertaintyLevel}`);

    // 2. Run the logic (using our updated engine)
    // We pass 'customRules' as the 4th argument (it will be null for medical/loan, which is fine)
    const result = runSimulation(
        inputs, 
        parseFloat(uncertaintyLevel), 
        selectedScenario, 
        customRules
    );

    // 3. Send back the JSON response
    res.json(result);
});

// Start the server
app.listen(PORT, () => {
    console.log(`\nDecision Simulator API running on http://localhost:${PORT}`);
    console.log(`Endpoint ready: POST /api/simulate\n`);
});