import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';

const LandingPage = () => {
  const navigate = useNavigate();
  const [scenario, setScenario] = useState('loan'); 
  const [variance, setVariance] = useState(5); // Now represents PERCENTAGE (5%)
  
  const [factors, setFactors] = useState({
      income: 60000, debt: 5000, missedPayments: 0, // Loan
      age: 45, bmi: 24, sleep: 7, // Medical
      varA: 10, varB: 10, varC: 10 // Custom
  });

  const [customRules, setCustomRules] = useState({ threshold: 50, trueLabel: "Pass", falseLabel: "Fail" });

  const calculateBaseline = () => {
      let baseValue = 0;
      let breakdown = "";

      if (scenario === 'loan') {
          // Weighted Logic: Income helps, Debt hurts, Missed Payments hurt a lot
          baseValue = 600 + (factors.income / 1000) - (factors.debt / 100) - (factors.missedPayments * 50);
          breakdown = `Income +${(factors.income/1000).toFixed(0)} | Debt -${(factors.debt/100).toFixed(0)}`;
      } 
      else if (scenario === 'medical') {
          // Weighted Logic: Base BP 110 + Age factor + BMI factor - Sleep factor
          baseValue = 110 + (factors.age / 2) + factors.bmi - (factors.sleep * 2);
          breakdown = `Age +${factors.age/2} | BMI +${factors.bmi} | Sleep -${factors.sleep*2}`;
      } 
      else {
          baseValue = factors.varA + factors.varB + factors.varC;
          breakdown = `Sum of Inputs`;
      }
      return { baseValue: Math.round(baseValue), breakdown };
  };

  const handleStart = () => {
    const { baseValue, breakdown } = calculateBaseline();
    navigate('/result', { 
        state: { 
            scenario, 
            variance, // Passing the Percentage
            baseValue, 
            breakdown, 
            customRules 
        } 
    });
  };

  const renderInputs = () => {
      if (scenario === 'loan') return (
          <div className="grid-2" style={{gap: '10px'}}>
              <div><label>Annual Income ($)</label><input type="number" value={factors.income} onChange={(e)=>setFactors({...factors, income: parseFloat(e.target.value)})} /></div>
              <div><label>Total Debt ($)</label><input type="number" value={factors.debt} onChange={(e)=>setFactors({...factors, debt: parseFloat(e.target.value)})} /></div>
              <div style={{gridColumn: 'span 2'}}><label>Missed Payments</label><input type="number" value={factors.missedPayments} onChange={(e)=>setFactors({...factors, missedPayments: parseFloat(e.target.value)})} /></div>
          </div>
      );
      if (scenario === 'medical') return (
        <div className="grid-2" style={{gap: '10px'}}>
            <div><label>Age</label><input type="number" value={factors.age} onChange={(e)=>setFactors({...factors, age: parseFloat(e.target.value)})} /></div>
            <div><label>BMI</label><input type="number" value={factors.bmi} onChange={(e)=>setFactors({...factors, bmi: parseFloat(e.target.value)})} /></div>
            <div style={{gridColumn: 'span 2'}}><label>Sleep (Hours)</label><input type="number" value={factors.sleep} onChange={(e)=>setFactors({...factors, sleep: parseFloat(e.target.value)})} /></div>
        </div>
      );
      return (
          <div className="grid-2" style={{gap: '10px'}}>
              <input type="number" placeholder="Var A" value={factors.varA} onChange={(e)=>setFactors({...factors, varA: parseFloat(e.target.value)})} />
              <input type="number" placeholder="Var B" value={factors.varB} onChange={(e)=>setFactors({...factors, varB: parseFloat(e.target.value)})} />
              <input type="number" placeholder="Var C" value={factors.varC} onChange={(e)=>setFactors({...factors, varC: parseFloat(e.target.value)})} />
               <div style={{gridColumn: 'span 2', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginTop: '10px'}}>
                  <input type="number" placeholder="Threshold" value={customRules.threshold} onChange={(e)=>setCustomRules({...customRules, threshold: parseFloat(e.target.value)})} />
                  <input type="text" placeholder="Pass Label" value={customRules.trueLabel} onChange={(e)=>setCustomRules({...customRules, trueLabel: e.target.value})} />
              </div>
          </div>
      );
  };

  // Dynamic label for the percentage slider
  const getVarianceLabel = () => {
      if(scenario === 'loan') return "Market Volatility (%)";
      if(scenario === 'medical') return "Device Error / Fluctuation (%)";
      return "Random Variance (%)";
  };

  return (
    <div className="container">
      <motion.div 
        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }}
        className="glass-card"
      >
        <h1 className="title-gradient">Stochastic Risk Evaluator</h1>
        <p className="subtitle">Multivariate Analysis & Probability Simulation</p>

        <div className="input-group">
            <label>Domain Context</label>
            <select value={scenario} onChange={(e) => setScenario(e.target.value)}>
                <option value="loan">🏦 Financial Credit Risk Model</option>
                <option value="medical">❤️ Clinical Diagnosis Model</option>
                <option value="custom">🛠️ Custom Logic Gate</option>
            </select>
        </div>

        <div className="input-group">
            <label style={{color: '#22d3ee', marginBottom: '10px', display: 'block'}}>Determinants (Variables)</label>
            {renderInputs()}
        </div>

        <div className="input-group">
            <label>{getVarianceLabel()}</label>
            <input 
                type="range" min="0" max="20" step="1" 
                value={variance} onChange={(e) => setVariance(e.target.value)} 
                className="slider"
            />
            <div style={{display:'flex', justifyContent:'space-between', fontSize:'0.8rem'}}>
                <span>0% (Deterministic)</span>
                <span style={{fontWeight:'bold', color: '#22d3ee'}}>±{variance}% Variance</span>
                <span>20% (Chaotic)</span>
            </div>
        </div>

        <button className="cta-button" onClick={handleStart}>
            Run Monte Carlo Simulation &rarr;
        </button>
      </motion.div>
    </div>
  );
};

export default LandingPage;