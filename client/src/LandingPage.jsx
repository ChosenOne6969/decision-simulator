import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';

const LandingPage = () => {
  const navigate = useNavigate();
  
  // Form State
  const [scenario, setScenario] = useState("medical");
  const [customRules, setCustomRules] = useState({ 
      title: "Speeding Ticket", variableName: "Speed (mph)", 
      operator: ">", threshold: 60, trueLabel: "Ticket", falseLabel: "Safe" 
  });
  const [inputs, setInputs] = useState({ systolicBP: 140, creditScore: 700, customValue: 60 });
  const [uncertainty, setUncertainty] = useState(3.0);

  // Navigate to Result Page
  const handleStart = () => {
    navigate('/result', { 
      state: { scenario, customRules, inputs, uncertainty } 
    });
  };

  return (
    <div className="container">
      {/* CRITICAL FIX: 
          We removed the <div className="background-container"> from here.
          Now the Global Particles from App.js will be visible!
      */}

      <motion.div 
        initial={{ opacity: 0, y: 50 }} 
        animate={{ opacity: 1, y: 0 }} 
        transition={{ duration: 0.8 }}
        className="glass-card"
        style={{ maxWidth: "600px", margin: "0 auto" }}
      >
        <p style={{ color: "#3b82f6", fontWeight: "bold", letterSpacing: "2px", fontSize: "0.8rem", textTransform: "uppercase" }}>
          Interactive Simulator
        </p>
        <h1>Define the Uncertainty.</h1>
        <p>Real-world decisions are never binary. Inject noise into the system and see where certainty collapses.</p>
        
        {/* SCENARIO SELECTOR */}
        <label>Select Scenario</label>
        <select value={scenario} onChange={(e) => setScenario(e.target.value)}>
          <option value="medical">Medical Diagnosis (Borderline BP)</option>
          <option value="loan">Loan Approval (Credit Cutoff)</option>
          <option value="custom">Create Custom Scenario...</option>
        </select>

        {/* CUSTOM BUILDER */}
        {scenario === "custom" && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} style={{ overflow: "hidden" }}>
             <div className="grid-2" style={{ marginTop: "20px" }}>
                <div><label>Title</label><input type="text" value={customRules.title} onChange={e => setCustomRules({...customRules, title: e.target.value})} /></div>
                <div><label>Variable</label><input type="text" value={customRules.variableName} onChange={e => setCustomRules({...customRules, variableName: e.target.value})} /></div>
             </div>
             <div className="grid-2">
                <div><label>Threshold</label><input type="number" value={customRules.threshold} onChange={e => setCustomRules({...customRules, threshold: parseInt(e.target.value)})} /></div>
                <div><label>Fail Label</label><input type="text" value={customRules.trueLabel} onChange={e => setCustomRules({...customRules, trueLabel: e.target.value})} /></div>
             </div>
          </motion.div>
        )}

        {/* SLIDERS */}
        <div style={{ marginTop: "30px" }}>
            <label>
              {scenario === 'medical' ? `Systolic BP: ${inputs.systolicBP}` : 
               scenario === 'loan' ? `Credit Score: ${inputs.creditScore}` : 
               `${customRules.variableName}: ${inputs.customValue}`}
            </label>
            <input type="range" 
               min={scenario === 'loan' ? 600 : (scenario === 'medical' ? 100 : customRules.threshold - 50)} 
               max={scenario === 'loan' ? 850 : (scenario === 'medical' ? 200 : customRules.threshold + 50)}
               value={scenario === 'medical' ? inputs.systolicBP : scenario === 'loan' ? inputs.creditScore : inputs.customValue} 
               onChange={(e) => {
                 const val = parseInt(e.target.value);
                 if(scenario === 'medical') setInputs({...inputs, systolicBP: val});
                 else if(scenario === 'loan') setInputs({...inputs, creditScore: val});
                 else setInputs({...inputs, customValue: val});
               }} 
            />
            
            <label style={{ marginTop: "30px" }}>Uncertainty Level (Noise): {uncertainty}</label>
            <input type="range" min="0" max="10" step="0.5" value={uncertainty} onChange={(e) => setUncertainty(e.target.value)} />
            <p style={{ fontSize: "0.8rem", marginTop: "5px" }}>
               {uncertainty === 0 ? "Deterministic (Perfect World)" : uncertainty > 7 ? "High Entropy (Chaos)" : "Realistic Noise"}
            </p>
        </div>

        <button className="cta-button" onClick={handleStart}>
           Run Simulation &rarr;
        </button>

      </motion.div>
    </div>
  );
};

export default LandingPage;