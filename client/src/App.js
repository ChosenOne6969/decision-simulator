import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import LandingPage from './LandingPage';
import ResultPage from './ResultPage';
import Background from './Background';
import './App.css'; 

function App() {
  return (
    <>
        {/* 1. Background Layer (Fixed) */}
        <Background />

        {/* 2. Scrollable Content Wrapper */}
        {/* The wrapper handles the scrolling. Anything inside here moves. */}
        <div className="content-scroll-wrapper">
            
            {/* LOGO INSIDE WRAPPER = SCROLLS AWAY */}
            <a href="/" className="logo">
                Andrea Piu
            </a>

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