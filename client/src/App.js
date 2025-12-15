import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import LandingPage from './LandingPage';
import ResultPage from './ResultPage';
import Background from './Background';
import './App.css'; 

function App() {
  return (
    <>
        {/* Fixed Background */}
        <Background />

        {/* Fixed Logo */}
        <a href="/" className="logo">
            Andrea Piu
        </a>

        {/* Scrollable Page Content */}
        <div className="content-scroll-wrapper">
            <Router>
                <Routes>
                    <Route path="/" element={<LandingPage />} />
                    <Route path="/result" element={<ResultPage />} />
                </Routes>
            </Router>
        </div>
    </>
  );
}

export default App;