// test.js
const { runSimulation } = require('./simulationEngine');

console.log("--- Starting Test ---");

// 1. Define a patient who is "on the edge"
// Age > 50 (Risk)
// BP 142 (Just barely High Risk, threshold is 140)
// Cholesterol 180 (Safe)
const patientInputs = {
    age: 55,
    systolicBP: 142,
    cholesterol: 180
};

// 2. Run simulation with "Level 3" uncertainty
// This means we are adding a medium amount of noise to the BP and Cholesterol
console.log("Running simulation for borderline patient...");
const result = runSimulation(patientInputs, 3.0);

// 3. Print the results
console.log("\n--- Results ---");
console.log("Baseline Decision (No noise):", result.baselineDecision);
console.log("Probabilities (With noise):", result.probabilities);
console.log("Stability:", result.stability);
console.log("Reflection:", result.reflection);