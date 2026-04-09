import React, { useRef, useEffect } from 'react';
import './Home.css';

export default function AuthLayout({ children }) {
  const panelLeftRef = useRef(null);
  const glowRef = useRef(null);

  useEffect(() => {
    const panelLeft = panelLeftRef.current;
    const glow = glowRef.current;

    if (!panelLeft || !glow) return;

    const handleMouseMove = (e) => {
      const rect = panelLeft.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      
      glow.style.left = `${x}px`;
      glow.style.top = `${y}px`;
      glow.style.opacity = '1';
    };

    const handleMouseLeave = () => {
      glow.style.opacity = '0';
    };

    panelLeft.addEventListener('mousemove', handleMouseMove);
    panelLeft.addEventListener('mouseleave', handleMouseLeave);

    return () => {
      panelLeft.removeEventListener('mousemove', handleMouseMove);
      panelLeft.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, []);

  return (
    <div className="root">
      {/* LEFT */}
      <div className="panel-left" ref={panelLeftRef}>
        {/* Cursor hover glow effect */}
        <div id="cursor-glow" ref={glowRef}></div>

        <div className="left-copy">
          <p className="tagline">Secure your conversations</p>
          <h2 className="headline">Not just a fancy<br/><em>chat app.</em></h2>
        </div>
      </div>

      <div className="divider"></div>

      {/* RIGHT */}
      <div className="panel-right">
        {children}
      </div>
    </div>
  );
}
