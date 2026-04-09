import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import Encode from './Encode';
import Decode from './Decode';
import './Dashboard.css';

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState('encode');

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <nav>
        <Link className="nav-logo" to="/">
          <span className="logo-dot"></span>
          ProDot
        </Link>

        <div className="nav-tabs">
          <div 
            className={`nav-tab ${activeTab === 'encode' ? 'active' : ''}`} 
            onClick={() => setActiveTab('encode')}
          >
            Encode
          </div>
          <div 
            className={`nav-tab ${activeTab === 'decode' ? 'active' : ''}`} 
            onClick={() => setActiveTab('decode')}
          >
            Decode
          </div>
        </div>

        <div className="nav-right">
          <div className="user-chip">
            <div className="avatar">U</div>
            <span>user@prodot.io</span>
          </div>
        </div>
      </nav>

      {activeTab === 'encode' ? <Encode /> : <Decode />}
    </div>
  );
}
