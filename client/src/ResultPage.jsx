import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Line } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler } from 'chart.js';
import annotationPlugin from 'chartjs-plugin-annotation';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler, annotationPlugin);

// --- THE LOCAL SIMULATION ENGINE ---
const runLocalSimulation = (payload) => {
    const { uncertaintyLevel, inputs, customRules, scenarioType } = payload;
    
    // 1. Define Rules based on Scenario
    let threshold, trueLabel, falseLabel, inputValue;

    if (scenarioType === "medical") {
        threshold = 140; // Systolic BP
        trueLabel = "High Risk";
        falseLabel = "Healthy";
        inputValue = inputs.systolicBP;
    } else if (scenarioType === "loan") {
        threshold = 700; // Credit Score
        trueLabel = "Approved";
        falseLabel = "Rejected";
        inputValue = inputs.creditScore;
    } else {
        threshold = customRules.threshold;
        trueLabel = customRules.trueLabel;
        falseLabel = customRules.falseLabel;
        inputValue = inputs.customValue;
    }

    // 2. Helper: Box-Muller Transform for Gaussian Noise
    const generateNormal = (mean, stdDev) => {
        let u = 0, v = 0;
        while (u === 0) u = Math.random();
        while (v === 0) v = Math.random();
        return mean + stdDev * Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
    };

    // 3. Monte Carlo Simulation
    const iterations = 5000;
    const results = [];
    const logs = [];
    let flipCount = 0;

    // Determine Baseline (The "Perfect World" Outcome)
    const isAboveThreshold = inputValue > threshold;
    const baselineDecision = scenarioType === "loan" 
        ? (isAboveThreshold ? trueLabel : falseLabel) 
        : (isAboveThreshold ? trueLabel : falseLabel); 
    
    for (let i = 0; i < iterations; i++) {
        // Inject Noise
        const noise = generateNormal(0, parseFloat(uncertaintyLevel) * 20); // Scaled for visibility
        const simulatedValue = inputValue + noise;
        
        // Determine Outcome
        let outcome = simulatedValue >= threshold ? trueLabel : falseLabel;
        
        // Handle Logic Inversion for Loan (Higher is better)
        if (scenarioType === "loan" && simulatedValue < threshold) outcome = falseLabel;
        if (scenarioType === "loan" && simulatedValue >= threshold) outcome = trueLabel;

        results.push(Math.round(simulatedValue));

        // Check Stability
        const isFlip = outcome !== baselineDecision;
        if (isFlip) flipCount++;

        // Log interesting events
        if (logs.length < 5 && (isFlip || Math.random() < 0.001)) {
            logs.push({
                id: i,
                value: simulatedValue.toFixed(2),
                outcome: outcome,
                isFlip: isFlip
            });
        }
    }

    // 4. Calculate Distribution
    const distribution = {};
    results.sort((a, b) => a - b);
    results.forEach(val => {
        distribution[val] = (distribution[val] || 0) + 1;
    });

    // 5. Calculate Stability & Impact
    const stabilityScore = ((1 - (flipCount / iterations)) * 100).toFixed(2);
    const dropPercentage = (100 - parseFloat(stabilityScore)).toFixed(2);
    
    // Impact Statement Generation
    let impactStatement = "";
    if (parseFloat(dropPercentage) === 0) {
        impactStatement = "System is stable. Noise had zero impact on the outcome.";
    } else if (parseFloat(dropPercentage) < 20) {
        impactStatement = `At uncertainty level ${uncertaintyLevel}, the probability of '${baselineDecision}' dropped by ${dropPercentage}%.`;
    } else {
        impactStatement = `Critical Instability: Noise reduced confidence in '${baselineDecision}' by ${dropPercentage}%.`;
    }

    // 6. Reflection Text
    let reflection = "";
    if (stabilityScore > 95) reflection = "The system is robust. Chaos has little effect here.";
    else if (stabilityScore > 70) reflection = "Uncertainty is creeping in. The edge cases are dangerous.";
    else reflection = "Entropy dominates. The decision is no longer deterministic.";

    return {
        stability: stabilityScore + "%",
        baselineDecision,
        threshold,
        probabilities: {
            [baselineDecision]: ((1 - (flipCount / iterations)) * 100).toFixed(1) + "%",
            [baselineDecision === trueLabel ? falseLabel : trueLabel]: ((flipCount / iterations) * 100).toFixed(1) + "%"
        },
        distribution,
        logs,
        reflection,
        impactStatement
    };
};

const ResultPage = () => {
  const { state } = useLocation();
  const navigate = useNavigate();
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!state) { navigate('/'); return; }
    
    const runSim = async () => {
        // 1. ANTICIPATION DELAY (3 Seconds)
        await new Promise(resolve => setTimeout(resolve, 3000));

        // 2. RUN LOCAL SIMULATION
        const payload = {
            uncertaintyLevel: state.uncertainty,
            scenarioType: state.scenario,
            inputs: state.scenario === "custom" ? { customValue: state.inputs.customValue } : state.inputs,
            customRules: state.scenario === "custom" ? state.customRules : null
        };
        
        const simulationResult = runLocalSimulation(payload);
        setResult(simulationResult);
        setLoading(false);
    };
    runSim();
  }, [state, navigate]); 

  // --- DOWNLOAD HELPER ---
  const downloadReport = () => {
      const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(result, null, 2));
      const downloadAnchorNode = document.createElement('a');
      downloadAnchorNode.setAttribute("href", dataStr);
      downloadAnchorNode.setAttribute("download", `decision_log_${Date.now()}.json`);
      document.body.appendChild(downloadAnchorNode); // required for firefox
      downloadAnchorNode.click();
      downloadAnchorNode.remove();
  };

  // --- RENDERING HELPERS ---
  const getLabel = (key) => key;

  const prepareChartData = () => {
    if (!result || !result.distribution) return { labels: [], datasets: [] };
    const keys = Object.keys(result.distribution).map(Number).sort((a, b) => a - b);
    const labels = []; const dataPoints = [];
    for (let i = keys[0]; i <= keys[keys.length-1]; i++) {
        labels.push(i);
        dataPoints.push(result.distribution[i] || 0);
    }
    return {
      labels,
      datasets: [{
          label: 'Probability Density',
          data: dataPoints,
          borderColor: '#3b82f6',
          backgroundColor: (context) => {
            const ctx = context.chart.ctx;
            const gradient = ctx.createLinearGradient(0, 0, 0, 400);
            gradient.addColorStop(0, 'rgba(59, 130, 246, 0.5)');
            gradient.addColorStop(1, 'rgba(59, 130, 246, 0.0)');
            return gradient;
          },
          fill: true,
          tension: 0.4,
          pointRadius: 0
      }]
    };
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      annotation: {
        annotations: {
            line1: {
                type: 'line',
                scaleID: 'x',
                value: result ? result.threshold : 0,
                borderColor: '#f87171',
                borderWidth: 2,
                borderDash: [6, 6],
                label: { content: 'Threshold', display: true, backgroundColor: '#f87171', color: 'white' }
            }
        }
      }
    },
    scales: {
        x: { grid: { color: 'rgba(255,255,255,0.1)' }, ticks: { color: '#94a3b8' } },
        y: { display: false }
    }
  };

  // --- LOADING SCREEN ---
  if (loading || !result) return (
    <div className="container" style={{textAlign:"center", height: "80vh", justifyContent: "center"}}>
        <h2 style={{ fontFamily: 'Montserrat', fontSize: "2rem", animation: "pulse 1.5s infinite" }}>
            Analyzing Quantum Outcomes...
        </h2>
        <p style={{marginTop: "10px", opacity: 0.7}}>Injecting noise into the system</p>
    </div>
  );

  // --- RESULT SCREEN ---
  return (
    <div className="container">
      
      {/* BUTTON HEADER */}
      <div style={{display: 'flex', justifyContent: 'space-between', marginBottom: '20px', flexWrap: 'wrap', gap: '10px'}}>
          <button className="secondary-button" onClick={() => navigate('/')}>
              &larr; Start New Simulation
          </button>
          
          <button className="secondary-button" onClick={downloadReport} style={{borderColor: '#22d3ee', color: '#22d3ee'}}>
              💾 Download Mission Log
          </button>
      </div>

      <div className="glass-card">
        <div className="grid-2">
            <div>
                <h1>Results</h1>
                <p style={{fontStyle: 'italic', color: '#a5f3fc'}}>"{result.reflection}"</p>
            </div>
            <div style={{ textAlign: "right" }}>
                <div className="stat-label">Stability Score</div>
                <div className="stat-value" style={{ 
                    color: parseFloat(result.stability) < 60 ? "#f87171" : "#4ade80",
                    textShadow: "0 0 20px rgba(255,255,255,0.2)"
                }}>
                    {result.stability}
                </div>
            </div>
        </div>

        {/* ENTROPY IMPACT REPORT */}
        <div style={{ 
            background: 'rgba(34, 211, 238, 0.1)', 
            border: '1px solid #22d3ee', 
            borderRadius: '12px', 
            padding: '15px',
            marginTop: '20px',
            marginBottom: '20px',
            textAlign: 'center',
            color: '#cffafe'
        }}>
            <strong style={{textTransform:'uppercase', letterSpacing:'1px', fontSize:'0.8rem'}}>Entropy Impact Report</strong>
            <div style={{ fontSize: '1.1rem', marginTop: '5px' }}>
                {result.impactStatement}
            </div>
        </div>

        <div style={{ height: "300px", marginTop: "20px", marginBottom: "30px" }}>
            <Line data={prepareChartData()} options={chartOptions} />
        </div>

        <div className="explainer-box">
            <h3>📖 Understanding the Data</h3>
            <div style={{marginBottom: "15px"}}>
                <strong>1. The Blue Hill:</strong> Represents the range of possible outcomes. A wider hill means higher uncertainty.
            </div>
            <div>
                <strong>2. The Verdict:</strong> Even if the perfect result is <strong>{getLabel(result.baselineDecision)}</strong>, 
                noise creates a real probability of failure.
            </div>
        </div>

        <div className="grid-2" style={{ marginTop: "30px" }}>
            <div className="stat-card">
                <div className="stat-label">Perfect World Result</div>
                <div className="stat-value">{getLabel(result.baselineDecision)}</div>
            </div>
            <div className="stat-card">
                 <div className="stat-label">Real World Probabilities</div>
                 {Object.entries(result.probabilities).map(([k, v]) => (
                     <div key={k} style={{ display:"flex", justifyContent:"space-between", marginTop:"5px", color:"#cbd5e1"}}>
                         <span>{getLabel(k)}</span>
                         <span style={{fontWeight:"bold", color: "#60a5fa"}}>{v}</span>
                     </div>
                 ))}
            </div>
        </div>

        <h3 style={{ marginTop: "40px", borderTop: "1px solid rgba(255,255,255,0.1)", paddingTop: "20px" }}>
            Event Horizon Logs
        </h3>
        <table>
            <thead>
                <tr>
                    <th>Sim ID</th>
                    <th>Input Value</th>
                    <th>Outcome</th>
                    <th>Status</th>
                </tr>
            </thead>
            <tbody>
                {result.logs.map(log => (
                    <tr key={log.id} className={log.isFlip ? "flipped" : "stable"}>
                        <td>#{log.id}</td>
                        <td>{log.value}</td>
                        <td>{getLabel(log.outcome)}</td>
                        <td>{log.isFlip ? "⚠️ FLIPPED" : "Stable"}</td>
                    </tr>
                ))}
            </tbody>
        </table>

      </div>
    </div>
  );
};

export default ResultPage;