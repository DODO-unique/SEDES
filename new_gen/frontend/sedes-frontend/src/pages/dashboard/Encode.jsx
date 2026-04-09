import React, { useState, useRef, useEffect } from 'react';
import './Dashboard.css';

function toBinary(str) {
  return str
    .split("")
    .map((c) => c.charCodeAt(0).toString(2).padStart(8, "0"))
    .join("");
}

export default function Encode() {
  const [imgSrc, setImgSrc] = useState(null);
  const [imgCapacity, setImgCapacity] = useState(0);
  const [message, setMessage] = useState('');
  const [status, setStatus] = useState({ msg: 'Waiting for input…', type: 'idle' });
  const [stepsDone, setStepsDone] = useState([false, false, false, false]);
  const [outputUrl, setOutputUrl] = useState(null);
  const [isEncoding, setIsEncoding] = useState(false);

  const fileInputRef = useRef(null);
  const hiddenCanvasRef = useRef(null);
  const outputCanvasRef = useRef(null);
  const imgRef = useRef(null); // Reference to the actual loaded image object

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
      const capacity = Math.floor((img.width * img.height * 3) / 8) - 10;
      setImgCapacity(capacity);
      markStepDone(1);
      setStatus({ msg: `Image loaded — ${img.width}×${img.height} px`, type: 'active' });
    };
    img.src = url;
  };

  const markStepDone = (stepNum) => {
    setStepsDone((prev) => {
      const next = [...prev];
      for (let i = 0; i < stepNum; i++) {
        next[i] = true;
      }
      return next;
    });
  };

  useEffect(() => {
    if (message.length > 0) markStepDone(2);
  }, [message]);

  const handleEncode = async () => {
    if (!imgRef.current || !message) return;

    setStatus({ msg: 'Encrypting message and encoding to image on backend…', type: 'active' });
    setIsEncoding(true);

    try {
      const token = localStorage.getItem("sedes_auth_token");
      const formData = new FormData();
      const file = fileInputRef.current.files[0];
      formData.append("image", file);
      formData.append("message", message);

      const res = await fetch("http://localhost:8000/api/stego/encode", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token}`
        },
        body: formData
      });

      if (!res.ok) {
        throw new Error("Failed to encode. Ensure you have an active session.");
      }

      const blob = await res.blob();
      const stegoUrl = URL.createObjectURL(blob);
      
      setOutputUrl(stegoUrl);
      setIsEncoding(false);
      markStepDone(4);
      setStatus({ msg: `Message successfully encrypted & encoded down to the pixel!`, type: 'success' });
    } catch (err) {
      console.error(err);
      setStatus({ msg: err.message || "Encoding failed", type: 'error' });
      setIsEncoding(false);
    }
  };

  const pct = imgCapacity > 0 ? Math.min(100, Math.round((message.length / imgCapacity) * 100)) : 0;
  const isOverCapacity = message.length > imgCapacity;
  const isReady = imgSrc && message.trim().length > 0 && !isOverCapacity && !isEncoding;

  const binPreview = message.length > 0 
    ? toBinary(message.slice(0, 20)) + (message.length > 20 ? "…" : "") 
    : "Binary representation will appear here…";

  return (
    <>
      <canvas ref={hiddenCanvasRef} style={{ display: 'none' }}></canvas>

      <main>
        {/* LEFT: INPUT */}
        <div>
          <div className="col-header fade-in">
            <p className="col-eyebrow">Hide in plain sight</p>
            <h1 className="col-title">Encode a <em>secret.</em></h1>
            <p className="col-sub">
              Upload an image, write your message — we'll weave it invisibly into
              the pixel data using LSB steganography.
            </p>
          </div>

          <div className="card fade-in">
            <div className="field">
              <label>Carrier Image</label>
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
                <span className="upload-label"><strong>Click to upload</strong> or drag & drop</span>
                <span className="upload-hint">PNG or BMP recommended · JPG loses LSB data on re-save</span>
              </div>
              
              {imgSrc && (
                <div id="preview-wrap" style={{ display: 'block', marginTop: '1rem', position: 'relative' }}>
                  <img src={imgSrc} alt="preview" style={{ width: '100%', borderRadius: '8px', border: '1px solid var(--border)' }} />
                  <span className="preview-badge">Original</span>
                </div>
              )}
            </div>
          </div>

          <div className="card fade-in">
            <div className="field">
              <label>Secret Message</label>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Type your hidden message here…"
              ></textarea>
              <div className="char-row">
                <span className="char-count"><span>{message.length}</span> chars</span>
                <span className="char-count">Capacity: <span>{imgCapacity > 0 ? pct + '%' : '—'}</span></span>
              </div>
              <div className="cap-bar-wrap">
                <div className="cap-bar">
                  <div className="cap-bar-fill" style={{ width: `${pct}%`, background: pct > 85 ? '#c95a5a' : '#c9a96e' }}></div>
                </div>
                <span className="cap-label">{imgCapacity > 0 ? `${imgCapacity} chars max` : 'Upload image first'}</span>
              </div>
            </div>

            <div className="field">
              <label>Binary Preview</label>
              <div className={`binary-box ${message.length > 0 ? 'has-data' : ''}`}>
                {binPreview}
              </div>
            </div>

            <button className="btn-primary" disabled={!isReady} onClick={handleEncode} style={{ marginTop: '0.5rem', width: '100%' }}>
              Encode Message →
            </button>
          </div>
        </div>

        {/* RIGHT: OUTPUT */}
        <div className="output-col">
          <div className="col-header fade-in">
            <p className="col-eyebrow">Encoded output</p>
            <h1 className="col-title">Your <em>vessel.</em></h1>
            <p className="col-sub">
              The image below looks identical to the original — yet contains your
              message hidden within its least significant bits.
            </p>
          </div>

          <div className="card fade-in" style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div className="steps-list">
              {['Upload a carrier image', 'Write your secret message', 'Click encode — message is woven into pixels', 'Download the encoded image'].map((text, idx) => (
                <div key={idx} className={`step ${stepsDone[idx] ? 'done' : ''}`}>
                  <div className="step-num">{idx + 1}</div>
                  <span className="step-text">{text}</span>
                </div>
              ))}
            </div>

            <div className="output-image-wrap">
              {!outputUrl && (
                <div className="output-placeholder">
                  <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#c9a96e" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="3" width="18" height="18" rx="2" />
                    <circle cx="8.5" cy="8.5" r="1.5" />
                    <polyline points="21 15 16 10 5 21" />
                  </svg>
                  <span>Encoded image will appear here</span>
                </div>
              )}
              {outputUrl && <img src={outputUrl} alt="Encoded Stego Image" style={{ display: 'block', width: '100%', borderRadius: '8px' }} />}
              {outputUrl && <span className="output-badge" style={{ display: 'block' }}>Encoded</span>}
            </div>

            <div className="status-bar">
              <div className={`status-dot ${status.type !== 'idle' ? status.type : ''}`}></div>
              <span>{status.msg}</span>
            </div>

            {outputUrl && (
              <a 
                href={outputUrl} 
                download="prodot_encoded.png" 
                className="btn-secondary" 
                style={{ display: 'block', textAlign: 'center', textDecoration: 'none' }}
              >
                ↓ Download Encoded Image
              </a>
            )}
          </div>
        </div>
      </main>
    </>
  );
}
