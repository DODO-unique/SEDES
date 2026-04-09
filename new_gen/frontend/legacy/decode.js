let imgEl = null;

const imgInput = document.getElementById("img-input");
const uploadZone = document.getElementById("upload-zone");
const previewImg = document.getElementById("preview-img");
const previewWrap = document.getElementById("preview-wrap");
const metaGrid = document.getElementById("meta-grid");
const decodeBtn = document.getElementById("decode-btn");
const hiddenCanvas = document.getElementById("hidden-canvas");
const binaryStream = document.getElementById("binary-stream");
const scanLine = document.getElementById("scan-line");
const scanPlaceholder = document.getElementById("scan-placeholder");
const scanWrap = document.getElementById("scan-wrap");
const messageReveal = document.getElementById("message-reveal");
const messageBody = document.getElementById("message-body");
const noMessageNote = document.getElementById("no-message-note");
const statsGrid = document.getElementById("stats-grid");
const statusDot = document.getElementById("status-dot");
const statusText = document.getElementById("status-text");
const copyBtn = document.getElementById("copy-btn");

function setStatus(msg, type = "idle") {
  statusText.textContent = msg;
  statusDot.className = "status-dot" + (type !== "idle" ? " " + type : "");
}

uploadZone.addEventListener("dragover", (e) => {
  e.preventDefault();
  uploadZone.classList.add("drag-over");
});
uploadZone.addEventListener("dragleave", () =>
  uploadZone.classList.remove("drag-over"),
);
uploadZone.addEventListener("drop", (e) => {
  e.preventDefault();
  uploadZone.classList.remove("drag-over");
  if (e.dataTransfer.files[0]) loadImage(e.dataTransfer.files[0]);
});

imgInput.addEventListener("change", () => {
  if (imgInput.files[0]) loadImage(imgInput.files[0]);
});

function loadImage(file) {
  const url = URL.createObjectURL(file);
  const img = new Image();
  img.onload = () => {
    imgEl = img;
    previewImg.src = url;
    previewWrap.style.display = "block";
    metaGrid.style.display = "grid";

    document.getElementById("meta-w").textContent = img.width + " px";
    document.getElementById("meta-h").textContent = img.height + " px";
    document.getElementById("meta-px").textContent = (
      img.width * img.height
    ).toLocaleString();
    const cap = Math.floor((img.width * img.height * 3) / 8);
    document.getElementById("meta-cap").textContent =
      cap.toLocaleString() + " chars";

    // Show preview of LSBs
    const ctx = hiddenCanvas.getContext("2d");
    hiddenCanvas.width = img.width;
    hiddenCanvas.height = img.height;
    ctx.drawImage(img, 0, 0);
    const data = ctx.getImageData(0, 0, img.width, img.height).data;
    let preview = "";
    for (let i = 0; i < Math.min(data.length, 400); i++) {
      if ((i + 1) % 4 !== 0) preview += data[i] & 1;
    }
    binaryStream.textContent = preview + "…";
    binaryStream.classList.add("active");

    decodeBtn.disabled = false;
    setStatus(
      "Image loaded · " + img.width + "×" + img.height + " · ready to decode",
      "active",
    );
  };
  img.src = url;
}

decodeBtn.addEventListener("click", () => {
  if (!imgEl) return;
  decodeBtn.disabled = true;

  // Reset output
  messageReveal.style.display = "none";
  noMessageNote.style.display = "none";
  statsGrid.style.display = "none";
  scanPlaceholder.style.display = "none";
  scanLine.classList.add("scanning");
  setStatus("Scanning pixel data…", "active");

  setTimeout(() => {
    const ctx = hiddenCanvas.getContext("2d");
    hiddenCanvas.width = imgEl.width;
    hiddenCanvas.height = imgEl.height;
    ctx.drawImage(imgEl, 0, 0);
    const data = ctx.getImageData(0, 0, imgEl.width, imgEl.height).data;

    // Extract LSBs
    let bits = "";
    let bitsUsed = 0;
    for (let i = 0; i < data.length; i++) {
      if ((i + 1) % 4 === 0) continue;
      bits += data[i] & 1;
      bitsUsed++;
    }

    // Reconstruct text
    let message = "";
    let pixelsScanned = 0;
    for (let i = 0; i + 7 < bits.length; i += 8) {
      const byte = bits.slice(i, i + 8);
      const charCode = parseInt(byte, 2);
      pixelsScanned += 3;
      if (charCode === 0) break;
      if (charCode < 32 && charCode !== 10 && charCode !== 13) {
        message = "";
        break;
      }
      message += String.fromCharCode(charCode);
      if (message.length > 50000) break;
    }

    scanLine.classList.remove("scanning");
    decodeBtn.disabled = false;

    if (message && message.trim().length > 0) {
      messageBody.textContent = message;
      messageReveal.style.display = "flex";
      statsGrid.style.display = "grid";
      document.getElementById("stat-chars").textContent = message.length;
      document.getElementById("stat-bits").textContent = (
        message.length * 8
      ).toLocaleString();
      document.getElementById("stat-pixels").textContent =
        pixelsScanned.toLocaleString();

      // Animate binary stream to show decoded bits
      const decodedBits = message
        .split("")
        .map((c) => c.charCodeAt(0).toString(2).padStart(8, "0"))
        .join("");
      binaryStream.textContent = decodedBits.slice(0, 300) + "…";

      setStatus(
        "Message decoded successfully — " +
          message.length +
          " characters found",
        "success",
      );
    } else {
      noMessageNote.style.display = "block";
      scanPlaceholder.style.display = "flex";
      setStatus("No hidden message found in this image", "error");
    }
  }, 1400);
});

copyBtn.addEventListener("click", () => {
  navigator.clipboard.writeText(messageBody.textContent).then(() => {
    copyBtn.textContent = "Copied!";
    setTimeout(() => {
      copyBtn.textContent = "Copy";
    }, 2000);
  });
});
