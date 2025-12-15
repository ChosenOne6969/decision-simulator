import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Line, Pie } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, ArcElement, Title, Tooltip, Legend, Filler } from 'chart.js';
import annotationPlugin from 'chartjs-plugin-annotation';

// Register ChartJS components including ArcElement for the Pie Chart
ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, ArcElement, Title, Tooltip, Legend, Filler, annotationPlugin);

// --- SIMULATION ENGINE ---
const runLocalSimulation = (payload) => {
    const { variance, baseValue, breakdown, customRules, scenarioType } = payload;
    
    // 1. Setup Context & Thresholds
    let threshold, trueLabel, falseLabel, unit;
    if (scenarioType === "medical") {
        threshold = 140; trueLabel = "High Risk"; falseLabel = "Healthy"; unit = "mmHg";
    } else if (scenarioType === "loan") {
        threshold = 700; trueLabel = "Approved"; falseLabel = "Rejected"; unit = "Score";
    } else {
        threshold = customRules.threshold; trueLabel = customRules.trueLabel; falseLabel = customRules.falseLabel; unit = "pts";
    }

    // 2. Box-Muller Transform (Gaussian Noise Generator)
    const generateNormal = (mean, stdDev) => {
        let u = 0, v = 0;
        while (u === 0) u = Math.random();
        while (v === 0) v = Math.random();
        return mean + stdDev * Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
    };

    const iterations = 5000;
    const results = [];
    let flipCount = 0;
    
    // Determine the Ideal (Deterministic) Decision
    const baselineDecision = scenarioType === "loan" 
        ? (baseValue >= threshold ? trueLabel : falseLabel) 
        : (baseValue >= threshold ? trueLabel : falseLabel); 

    for (let i = 0; i < iterations; i++) {
        // Calculate Standard Deviation based on the user's Variance %
        // e.g., If Base is 700 and Variance is 5%, StdDev = 35.
        const stdDev = baseValue * (parseFloat(variance) / 100);
        
        // Inject Noise
        const noise = generateNormal(0, stdDev);
        const simulatedValue = Math.round(baseValue + noise);
        
        // Determine Outcome for this specific iteration
        let outcome;
        if (scenarioType === "loan") outcome = simulatedValue >= threshold ? trueLabel : falseLabel;
        else outcome = simulatedValue >= threshold ? trueLabel : falseLabel;

        results.push(simulatedValue);

        // Did this iteration flip the decision?
        if (outcome !== baselineDecision) flipCount++;
    }

    // Sort Results for the Distribution Graph (Low -> High)
    const distribution = {};
    results.sort((a, b) => a - b);
    results.forEach(val => {
        distribution[val] = (distribution[val] || 0) + 1;
    });

    // Calculate Final Stats
    const stabilityScore = ((1 - (flipCount / iterations)) * 100).toFixed(1);
    const failRate = (100 - parseFloat(stabilityScore)).toFixed(1);
    
    // Generate Text Report
    let impactStatement = "";
    if (parseFloat(failRate) === 0) impactStatement = "System is strictly deterministic. No deviation detected.";
    else impactStatement = `At ${variance}% variance, the model shows a ${failRate}% deviation from the ideal outcome.`;

    return {
        stability: stabilityScore,
        failRate: failRate,
        baselineDecision,
        baseValue,
        breakdown, 
        threshold,
        unit,
        scenarioType,
        probabilities: {
            [baselineDecision]: stabilityScore,
            [baselineDecision === trueLabel ? falseLabel : trueLabel]: failRate
        },
        distribution,
        impactStatement,
        trueLabel,
        falseLabel
    };
};

// --- COMPONENT VIEW ---
const ResultPage = () => {
  const { state } = useLocation();
  const navigate = useNavigate();
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Redirect if no state is found (direct access protection)
    if (!state) { navigate('/'); return; }
    
    const processSimulation = async () => {
        setLoading(true); // Ensure loading screen shows on re-run

        // 1. ANTICIPATION DELAY (3 Seconds) for UX
        await new Promise(resolve => setTimeout(resolve, 3000));

        // 2. RUN SIMULATION
        const payload = {
            variance: state.variance,
            scenarioType: state.scenario,
            baseValue: state.baseValue, 
            breakdown: state.breakdown,
            customRules: state.customRules
        };
        
        const data = runLocalSimulation(payload);
        setResult(data);
        setLoading(false);
    };

    processSimulation();
    
    // Dependency on state.simId ensures re-calculation on every button click
  }, [state, navigate]); 

  const downloadReport = () => {
      const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(result, null, 2));
      const el = document.createElement('a');
      el.setAttribute("href", dataStr);
      el.setAttribute("download", `simulation_log_${Date.now()}.json`);
      document.body.appendChild(el); el.click(); el.remove();
  };

  // --- CHART 1: DISTRIBUTION (LINE) CONFIG ---
  const prepareChartData = () => {
    if (!result || !result.distribution) return { labels: [], datasets: [] };
    const keys = Object.keys(result.distribution).map(Number).sort((a, b) => a - b);
    
    return {
      labels: keys,
      datasets: [{
          label: 'Frequency',
          data: keys.map(k => result.distribution[k]),
          borderColor: '#3b82f6',
          backgroundColor: (context) => {
            const ctx = context.chart.ctx;
            const gradient = ctx.createLinearGradient(0, 0, 0, 300);
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

  const lineOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      title: { display: true, text: 'Gaussian Probability Distribution', color: '#94a3b8' },
      annotation: {
        annotations: {
            line1: { 
                type: 'line', 
                scaleID: 'x', 
                value: result ? result.threshold : 0, 
                borderColor: '#f87171', 
                borderWidth: 2, 
                label: { content: 'Threshold', display: true, backgroundColor: '#f87171', color: 'white' } 
            }
        }
      }
    },
    scales: {
        x: { 
            ticks: { color: '#94a3b8' }, 
            title: { display: true, text: result ? `Simulated Output (${result.unit})` : 'Value', color: '#cbd5e1' } 
        },
        y: { 
            display: true, 
            title: { display: true, text: 'Probability Density', color: '#cbd5e1' }, 
            grid: { color: 'rgba(255,255,255,0.05)' } 
        }
    }
  };

  // --- CHART 2: PIE CHART CONFIG ---
  const preparePieData = () => {
      if(!result) return { labels: [], datasets: [] };
      
      const idealLabel = result.baselineDecision;
      const riskLabel = result.baselineDecision === result.trueLabel ? result.falseLabel : result.trueLabel;

      return {
          labels: [idealLabel, riskLabel],
          datasets: [{
              data: [parseFloat(result.stability), parseFloat(result.failRate)],
              backgroundColor: ['#4ade80', '#f87171'], // Green vs Red
              borderColor: '#1e293b', // Dark border to match background
              borderWidth: 2
          }]
      };
  };

  const pieOptions = {
      plugins: {
          legend: { position: 'bottom', labels: { color: '#cbd5e1', padding: 20 } }
      }
  };

  // --- RENDER: LOADING STATE ---
  if (loading || !result) return (
    <div className="container" style={{textAlign:"center", height: "80vh", display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center"}}>
        <h2 style={{ fontFamily: 'Montserrat', fontSize: "2rem", animation: "pulse 1.5s infinite" }}>
            Analyzing Quantum Outcomes...
        </h2>
        <p style={{marginTop: "15px", opacity: 0.7, color: "#22d3ee"}}>
             Injecting {state?.variance}% Stochastic Noise
        </p>
    </div>
  );

  // --- RENDER: RESULTS ---
  return (
    <div className="container">
      <div style={{display: 'flex', justifyContent: 'space-between', marginBottom: '20px'}}>
          <button className="secondary-button" onClick={() => navigate('/')}>&larr; New Model</button>
          <button className="secondary-button" onClick={downloadReport} style={{borderColor: '#22d3ee', color: '#22d3ee'}}>💾 Export JSON</button>
      </div>

      <div className="glass-card">
        {/* HEADER */}
        <div className="grid-2">
            <div>
                <h1>Evaluation Report</h1>
                <p style={{fontSize: '0.9rem', color: '#94a3b8', marginTop: '-10px'}}>
                    Logic: {result.breakdown}
                </p>
            </div>
            <div style={{ textAlign: "right" }}>
                <div className="stat-label">Confidence Score</div>
                <div className="stat-value" style={{ color: parseFloat(result.stability) < 60 ? "#f87171" : "#4ade80" }}>
                    {result.stability}%
                </div>
            </div>
        </div>

        {/* IMPACT STATEMENT BOX */}
        <div style={{ 
            background: 'rgba(34, 211, 238, 0.1)', border: '1px solid #22d3ee', borderRadius: '12px', 
            padding: '15px', marginTop: '20px', textAlign: 'center', color: '#cffafe'
        }}>
            <strong style={{textTransform:'uppercase', letterSpacing:'1px', fontSize:'0.8rem'}}>Entropy Analysis</strong>
            <div style={{ fontSize: '1.1rem', marginTop: '5px' }}>{result.impactStatement}</div>
        </div>

        {/* MAIN LINE CHART */}
        <div style={{ height: "300px", marginTop: "20px", marginBottom: "30px" }}>
            <Line data={prepareChartData()} options={lineOptions} />
        </div>

        {/* EXPLAINER TEXT */}
        <div className="explainer-box">
            <h3>📖 Understanding the Data</h3>
            <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px'}}>
                <div>
                    <strong>X-Axis (Simulated Output):</strong> The range of possible scores generated by the simulation.
                </div>
                <div>
                    <strong>Y-Axis (Probability):</strong> The height of the curve shows the likelihood of that specific score.
                </div>
            </div>
        </div>

        {/* PIE CHART SECTION */}
        <div className="grid-2" style={{marginTop: '40px', alignItems: 'center'}}>
            <div>
                <h3>Probabilistic Outcome</h3>
                <p style={{color: '#94a3b8', marginBottom: '15px', lineHeight: '1.6'}}>
                    While the "Ideal" math suggests a 100% chance of <strong>{result.baselineDecision}</strong>, the real-world variance introduces a <strong>{result.failRate}%</strong> risk of the opposite outcome.
                </p>
                <div className="stat-card">
                    <div className="stat-label">Ideal Deterministic Outcome</div>
                    <div className="stat-value">{result.baselineDecision}</div>
                </div>
            </div>
            <div style={{height: '280px', display: 'flex', justifyContent: 'center'}}>
                <Pie data={preparePieData()} options={pieOptions} />
            </div>
        </div>

      </div>
    </div>
  );
};

export default ResultPage;