import React, { useState, useRef } from 'react';
import './Dashboard.css';

export default function Decode() {
  const [imgSrc, setImgSrc] = useState(null);
  const [meta, setMeta] = useState(null); // { w, h, px, cap }
  const [status, setStatus] = useState({ msg: 'Waiting for image…', type: 'idle' });
  const [binaryPreview, setBinaryPreview] = useState('Awaiting image upload — LSB data will stream here…');
  
  const [isScanning, setIsScanning] = useState(false);
  const [isDecoding, setIsDecoding] = useState(false);
  const [decodedMessage, setDecodedMessage] = useState(null);
  const [stats, setStats] = useState(null); // { chars, bits, pixels }
  const [noMessage, setNoMessage] = useState(false);
  const [copied, setCopied] = useState(false);

  const fileInputRef = useRef(null);
  const hiddenCanvasRef = useRef(null);
  const imgRef = useRef(null);

  const handleDragOver = (e) => {
    e.preventDefault();
    e.currentTarget.classList.add('drag-over');
  };

  const handleDragLeave = (e) => {
    e.currentTarget.classList.remove('drag-over');
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.currentTarget.classList.remove('drag-over');
    if (e.dataTransfer.files[0]) {
      loadImage(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files[0]) {
      loadImage(e.target.files[0]);
    }
  };

  const loadImage = (file) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      imgRef.current = img;
      setImgSrc(url);

      const cap = Math.floor((img.width * img.height * 3) / 8);
      setMeta({
        w: img.width,
        h: img.height,
        px: img.width * img.height,
        cap: cap
      });

      // Show preview of LSBs
      const ctx = hiddenCanvasRef.current.getContext('2d');
      hiddenCanvasRef.current.width = img.width;
      hiddenCanvasRef.current.height = img.height;
      ctx.drawImage(img, 0, 0);
      const data = ctx.getImageData(0, 0, img.width, img.height).data;
      
      let preview = "";
      for (let i = 0; i < Math.min(data.length, 400); i++) {
        if ((i + 1) % 4 !== 0) preview += data[i] & 1;
      }
      setBinaryPreview(preview + "…");

      setDecodedMessage(null);
      setNoMessage(false);
      setStats(null);
      setStatus({ msg: `Image loaded · ${img.width}×${img.height} · ready to decode`, type: 'active' });
    };
    img.src = url;
  };

  const handleDecode = async () => {
    if (!imgRef.current) return;
    
    setIsDecoding(true);
    setIsScanning(true);
    setDecodedMessage(null);
    setNoMessage(false);
    setStats(null);
    setStatus({ msg: 'Sending to backend for decryption and Steganography scanning…', type: 'active' });

    try {
      const token = localStorage.getItem("sedes_auth_token");
      const formData = new FormData();
      const file = fileInputRef.current.files[0];
      formData.append("image", file);

      const res = await fetch("http://localhost:8000/api/stego/decode", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token}`
        },
        body: formData
      });

      if (!res.ok) {
         const errorData = await res.json().catch(() => ({}));
         throw new Error(errorData.detail || "Failed to decode");
      }
      
      const data = await res.json();
      const secretMsg = data.secret;
      
      if (secretMsg && secretMsg.trim().length > 0) {
        setDecodedMessage(secretMsg);
        setStats({
          chars: secretMsg.length,
          bits: secretMsg.length * 8, // Approx bit extraction for UI
          pixels: secretMsg.length * 8 * 3 // Approx visualization
        });

        const decodedBits = secretMsg.split('').map(c => c.charCodeAt(0).toString(2).padStart(8, '0')).join('');
        setBinaryPreview(decodedBits.slice(0, 300) + '…');

        setStatus({ msg: `Message decrypted & decoded successfully — ${secretMsg.length} characters found`, type: 'success' });
      } else {
        setNoMessage(true);
        setStatus({ msg: 'No hidden message found in this image', type: 'error' });
      }
    } catch(err) {
      setNoMessage(true);
      setStatus({ msg: err.message, type: 'error' });
    } finally {
      setIsScanning(false);
      setIsDecoding(false);
    }
  };

  const handleCopy = () => {
    if (decodedMessage) {
      navigator.clipboard.writeText(decodedMessage).then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      });
    }
  };

  return (
    <>
      <canvas ref={hiddenCanvasRef} style={{ display: 'none' }}></canvas>

      <main>
        {/* LEFT */}
        <div>
          <div className="col-header fade-in">
            <p className="col-eyebrow">Reveal what's hidden</p>
            <h1 className="col-title">Decode the <em>invisible.</em></h1>
            <p className="col-sub">
              Upload an encoded image — we'll scan every pixel's least significant
              bits and reconstruct the hidden message within.
            </p>
          </div>

          <div className="card fade-in">
            <div style={{ marginBottom: '0.5rem' }}>
              <span style={{ fontSize: '10px', letterSpacing: '1.5px', textTransform: 'uppercase', color: 'var(--text-dim)' }}>
                Encoded Image
              </span>
            </div>
            <div 
              className="upload-zone" 
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
            >
              <input 
                type="file" 
                ref={fileInputRef} 
                accept="image/*" 
                style={{ display: 'none' }} 
                onChange={handleFileChange}
              />
              <div className="upload-icon">
                <svg viewBox="0 0 24 24" fill="none" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                  <polyline points="17 8 12 3 7 8" />
                  <line x1="12" y1="3" x2="12" y2="15" />
                </svg>
              </div>
              <span className="upload-label"><strong>Upload encoded image</strong></span>
              <span className="upload-hint">Use a PNG encoded by ProDot · JPG will corrupt the LSB data</span>
            </div>

            {imgSrc && (
              <div id="preview-wrap" style={{ display: 'block', marginTop: '1rem', position: 'relative' }}>
                <img src={imgSrc} alt="preview" style={{ width: '100%', borderRadius: '8px', border: '1px solid var(--border)' }} />
                <span className="preview-badge">Loaded</span>
              </div>
            )}

            {meta && (
              <div className="meta-grid" style={{ display: 'grid' }}>
                <div className="meta-item">
                  <div className="meta-label">Width</div>
                  <div className="meta-value">{meta.w} px</div>
                </div>
                <div className="meta-item">
                  <div className="meta-label">Height</div>
                  <div className="meta-value">{meta.h} px</div>
                </div>
                <div className="meta-item">
                  <div className="meta-label">Pixels</div>
                  <div className="meta-value">{meta.px.toLocaleString()}</div>
                </div>
                <div className="meta-item">
                  <div className="meta-label">Max capacity</div>
                  <div className="meta-value">{meta.cap.toLocaleString()} chars</div>
                </div>
              </div>
            )}
          </div>

          <div className="card fade-in">
            <div className="col-eyebrow" style={{ marginBottom: '12px' }}>
              Binary stream preview
            </div>
            <div className={`binary-stream ${meta ? 'active' : ''}`}>
              {binaryPreview}
            </div>
            <button 
              className="btn-primary" 
              disabled={!imgSrc || isDecoding} 
              onClick={handleDecode}
              style={{ marginTop: '1.2rem', width: '100%' }}
            >
              Decode Message →
            </button>
          </div>
        </div>

        {/* RIGHT */}
        <div className="output-col">
          <div className="col-header fade-in">
            <p className="col-eyebrow">Extracted message</p>
            <h1 className="col-title">The <em>secret</em> revealed.</h1>
            <p className="col-sub">
              LSB bits are extracted and reconstructed into readable text — byte
              by byte, pixel by pixel.
            </p>
          </div>

          {/* SCAN ANIMATION AREA */}
          <div className="card fade-in" style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
            <div className="scan-wrap">
              <div className={`scan-line ${isScanning ? 'scanning' : ''}`}></div>
              {(!decodedMessage && !noMessage) && (
                <div className="scan-placeholder">
                  <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#c9a96e" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: 0.35 }}>
                    <circle cx="11" cy="11" r="8" />
                    <path d="M21 21l-4.35-4.35" />
                  </svg>
                  <span>Upload a ProDot encoded image<br />and click Decode</span>
                </div>
              )}
            </div>

            {/* REVEALED MESSAGE */}
            {decodedMessage && (
              <div className="message-reveal" style={{ display: 'flex' }}>
                <div className="message-header">
                  <span className="message-label">Hidden message</span>
                  <button className="copy-btn" onClick={handleCopy}>{copied ? 'Copied!' : 'Copy'}</button>
                </div>
                <div className="message-box">
                  <div className="message-body">{decodedMessage}</div>
                </div>
              </div>
            )}

            {/* NO MESSAGE */}
            {noMessage && (
              <div className="no-message-note" style={{ display: 'block' }}>
                No hidden message found in this image.
              </div>
            )}

            {/* STATS */}
            {stats && (
              <div className="stats-grid" style={{ display: 'grid' }}>
                <div className="stat">
                  <div className="stat-val">{stats.chars}</div>
                  <div className="stat-label">Characters</div>
                </div>
                <div className="stat">
                  <div className="stat-val">{stats.bits.toLocaleString()}</div>
                  <div className="stat-label">Bits read</div>
                </div>
                <div className="stat">
                  <div className="stat-val">{stats.pixels.toLocaleString()}</div>
                  <div className="stat-label">Pixels scanned</div>
                </div>
              </div>
            )}

            <div className="status-bar">
              <div className={`status-dot ${status.type !== 'idle' ? status.type : ''}`}></div>
              <span>{status.msg}</span>
            </div>
          </div>
        </div>
      </main>
    </>
  );
}
