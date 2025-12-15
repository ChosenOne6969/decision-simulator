// simulationEngine.js

function generateGaussianNoise(mean, variance) {
    let u = 0, v = 0;
    while(u === 0) u = Math.random(); 
    while(v === 0) v = Math.random();
    let z = Math.sqrt( -2.0 * Math.log( u ) ) * Math.cos( 2.0 * Math.PI * v );
    return mean + (z * variance);
}

// --- EVALUATORS ---
function evaluateMedicalRisk(inputs) {
    return { 
        outcome: inputs.systolicBP > 140 ? "High Risk" : "Low Risk", 
        trackedValue: inputs.systolicBP,
        threshold: 140,
        operator: ">" 
    };
}

function evaluateLoanRisk(inputs) {
    return { 
        outcome: inputs.creditScore >= 700 ? "Approved" : "Rejected", 
        trackedValue: inputs.creditScore,
        threshold: 700,
        operator: ">="
    };
}

function evaluateCustom(inputs, customRules) {
    const val = inputs.customValue;
    const threshold = customRules.threshold;
    let success = false;

    if (customRules.operator === ">") success = val > threshold;
    else if (customRules.operator === "<") success = val < threshold;
    else if (customRules.operator === ">=") success = val >= threshold;
    else if (customRules.operator === "<=") success = val <= threshold;

    return {
        outcome: success ? "Pass" : "Fail", 
        trackedValue: val,
        threshold: threshold,
        operator: customRules.operator
    };
}

// --- SIMULATION RUNNER ---
function runSimulation(baseInputs, uncertaintyLevel, scenarioType, customRules = null) {
    const results = { outcomes: {}, distribution: {} };
    const logs = []; // New: To store specific run details

    // 1. SELECT LOGIC
    let evaluator;
    if (scenarioType === "loan") evaluator = evaluateLoanRisk;
    else if (scenarioType === "custom") evaluator = (inputs) => evaluateCustom(inputs, customRules);
    else evaluator = evaluateMedicalRisk;

    // 2. BASELINE
    const baseline = evaluator(baseInputs);
    const baselineOutcome = baseline.outcome;
    results.outcomes[baselineOutcome] = 0;
    
    // Initialize opposite key
    const opposite = 
        (baselineOutcome === "Approved") ? "Rejected" :
        (baselineOutcome === "High Risk") ? "Low Risk" :
        (baselineOutcome === "Pass") ? "Fail" : 
        "Pass";
    results.outcomes[opposite] = 0;

    // 3. SIMULATION LOOP
    for (let i = 0; i < 1000; i++) {
        let perturbedInputs = {};
        let valueToPerturb;

        if (scenarioType === "loan") valueToPerturb = baseInputs.creditScore;
        else if (scenarioType === "custom") valueToPerturb = baseInputs.customValue;
        else valueToPerturb = baseInputs.systolicBP;

        const noisyValue = generateGaussianNoise(valueToPerturb, uncertaintyLevel * 1.5);
        
        if (scenarioType === "loan") perturbedInputs.creditScore = noisyValue;
        else if (scenarioType === "custom") perturbedInputs.customValue = noisyValue;
        else perturbedInputs.systolicBP = noisyValue;

        const result = evaluator(perturbedInputs);
        
        // Track stats
        const trackedInt = Math.round(result.trackedValue);
        results.distribution[trackedInt] = (results.distribution[trackedInt] || 0) + 1;
        results.outcomes[result.outcome] = (results.outcomes[result.outcome] || 0) + 1;

        // --- LOGGING LOGIC ---
        // We want to capture "Flips" (Near Misses) and some "Standard" runs
        const isFlip = result.outcome !== baselineOutcome;
        
        // Save log if it's a Flip (up to 10) OR if we just need some sample data (up to 5)
        if ((isFlip && logs.length < 15) || (!isFlip && logs.length < 5)) {
            logs.push({
                id: i + 1,
                value: result.trackedValue.toFixed(1), // Keep decimal precision for the log
                outcome: result.outcome,
                isFlip: isFlip
            });
        }
    }

    // Sort logs so "Flips" appear first for visibility
    logs.sort((a, b) => (a.isFlip === b.isFlip) ? 0 : a.isFlip ? -1 : 1);

    const stability = (results.outcomes[baselineOutcome] / 1000) * 100;
    const probabilities = {};
    for (const key in results.outcomes) {
        probabilities[key] = ((results.outcomes[key] / 1000) * 100).toFixed(1) + "%";
    }

    return {
        baselineDecision: baselineOutcome,
        probabilities: probabilities,
        stability: stability.toFixed(1) + "%",
        reflection: generateReflection(stability),
        distribution: results.distribution,
        threshold: baseline.threshold,
        logs: logs // Send logs to frontend
    };
}

function generateReflection(stability) {
    if (stability > 90) return "Confident. The input is far from the threshold.";
    if (stability > 60) return "Unstable. Small noise is flipping the decision.";
    return "Maximum Entropy. The system is effectively guessing.";
}

module.exports = { runSimulation };