import React, { useEffect, useState } from 'react';

interface ConfettiEffectProps {
  trigger: boolean;
  onComplete?: () => void;
}

export const ConfettiEffect: React.FC<ConfettiEffectProps> = ({ trigger, onComplete }) => {
  const [particles, setParticles] = useState<
    Array<{ id: number; x: number; y: number; color: string; size: number; rotation: number; vx: number; vy: number }>
  >([]);

  useEffect(() => {
    if (!trigger) return;

    const colors = ['#10b981', '#34d399', '#f59e0b', '#38bdf8', '#a855f7', '#ec4899'];
    const newParticles = Array.from({ length: 45 }).map((_, i) => ({
      id: i,
      x: 50 + (Math.random() * 20 - 10), // start near center
      y: 40,
      color: colors[Math.floor(Math.random() * colors.length)],
      size: Math.random() * 8 + 4,
      rotation: Math.random() * 360,
      vx: (Math.random() - 0.5) * 80,
      vy: -(Math.random() * 60 + 20),
    }));

    setParticles(newParticles);

    const timer = setTimeout(() => {
      setParticles([]);
      if (onComplete) onComplete();
    }, 2200);

    return () => clearTimeout(timer);
  }, [trigger, onComplete]);

  if (particles.length === 0) return null;

  return (
    <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden">
      {particles.map((p) => (
        <div
          key={p.id}
          className="absolute rounded-sm animate-confetti-drop"
          style={{
            left: `${p.x}%`,
            top: `${p.y}%`,
            width: `${p.size}px`,
            height: `${p.size * 1.5}px`,
            backgroundColor: p.color,
            transform: `rotate(${p.rotation}deg)`,
            boxShadow: `0 0 6px ${p.color}88`,
          }}
        />
      ))}
    </div>
  );
};
