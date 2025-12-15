import React, { useEffect, useState } from 'react';

const Background = () => {
    const [offset, setOffset] = useState({ x: 0, y: 0 });
    const [particles, setParticles] = useState([]);
    const [shootingStars, setShootingStars] = useState([]);

    useEffect(() => {
        // 1. DENSE STARDUST (200 particles)
        const starColors = ['#ffffff', '#a5f3fc', '#c084fc', '#6366f1']; 
        const tempParticles = [];
        for (let i = 0; i < 200; i++) {
            tempParticles.push({
                id: i,
                left: Math.random() * 100,
                top: Math.random() * 100,
                size: Math.random() * 3 + 1, 
                opacity: Math.random() * 0.8 + 0.2,
                duration: Math.random() * 5 + 3, // Fast speed
                delay: Math.random() * 5,
                color: starColors[Math.floor(Math.random() * starColors.length)]
            });
        }
        setParticles(tempParticles);

        // 2. METEOR SHOWER (15 shooting stars)
        const tempMeteors = [];
        for (let i = 0; i < 15; i++) {
            tempMeteors.push({
                id: i,
                top: Math.random() * 60, 
                left: Math.random() * 100,
                delay: Math.random() * 6 
            });
        }
        setShootingStars(tempMeteors);
    }, []);

    useEffect(() => {
        const handleMouseMove = (e) => {
            const x = (e.clientX / window.innerWidth - 0.5) * 40;
            const y = (e.clientY / window.innerHeight - 0.5) * 40;
            setOffset({ x, y });
        };
        window.addEventListener('mousemove', handleMouseMove);
        return () => window.removeEventListener('mousemove', handleMouseMove);
    }, []);

    return (
        <div className="background-container">
            {/* LAYER 1: Nebula Orbs (Clean, no noise) */}
            <div 
                className="orb orb-1" 
                style={{ transform: `translate(${-offset.x}px, ${-offset.y}px)` }}
            ></div>
            <div 
                className="orb orb-2" 
                style={{ transform: `translate(${offset.x}px, ${offset.y}px)` }}
            ></div>

            {/* LAYER 2: Fast Colored Stardust */}
            {particles.map((p) => (
                <div
                    key={p.id}
                    className="particle"
                    style={{
                        left: `${p.left}%`,
                        top: `${p.top}%`,
                        width: `${p.size}px`,
                        height: `${p.size}px`,
                        backgroundColor: p.color,
                        boxShadow: `0 0 ${p.size * 2}px ${p.color}`,
                        opacity: p.opacity,
                        animationDuration: `${p.duration}s`,
                        animationDelay: `${p.delay}s`,
                        transform: `translate(${offset.x * 0.5}px, ${offset.y * 0.5}px)`
                    }}
                ></div>
            ))}

            {/* LAYER 3: Frequent Shooting Stars */}
            {shootingStars.map((s) => (
                <div
                    key={`meteor-${s.id}`}
                    className="shooting-star"
                    style={{
                        top: `${s.top}%`,
                        left: `${s.left}%`,
                        animationDelay: `${s.delay}s`
                    }}
                ></div>
            ))}
        </div>
    );
};

export default Background;