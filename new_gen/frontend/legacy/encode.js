let imgEl = null;
let imgCapacity = 0;

const imgInput = document.getElementById("img-input");
const uploadZone = document.getElementById("upload-zone");
const previewImg = document.getElementById("preview-img");
const previewWrap = document.getElementById("preview-wrap");
const messageTA = document.getElementById("message");
const charCount = document.getElementById("char-count");
const capPct = document.getElementById("cap-pct");
const capFill = document.getElementById("cap-fill");
const capLabel = document.getElementById("cap-label");
const binaryOut = document.getElementById("binary-out");
const encodeBtn = document.getElementById("encode-btn");
const hiddenCanvas = document.getElementById("hidden-canvas");
const outputCanvas = document.getElementById("output-canvas");
const outputPlaceholder = document.getElementById("output-placeholder");
const outputBadge = document.getElementById("output-badge");
const downloadBtn = document.getElementById("download-btn");
const statusDot = document.getElementById("status-dot");
const statusText = document.getElementById("status-text");

function setStatus(msg, type = "idle") {
  statusText.textContent = msg;
  statusDot.className = "status-dot" + (type !== "idle" ? " " + type : "");
}

function setStep(n) {
  for (let i = 1; i <= n; i++) {
    document.getElementById("step" + i).classList.add("done");
  }
}

// DRAG & DROP
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
    imgCapacity = Math.floor((img.width * img.height * 3) / 8) - 10;
    updateCapacity();
    checkReady();
    setStep(1);
    setStatus(
      "Image loaded — " + img.width + "×" + img.height + " px",
      "active",
    );
  };
  img.src = url;
}

function toBinary(str) {
  return str
    .split("")
    .map((c) => c.charCodeAt(0).toString(2).padStart(8, "0"))
    .join("");
}

function updateCapacity() {
  const msg = messageTA.value;
  charCount.textContent = msg.length;
  if (imgCapacity > 0) {
    const pct = Math.min(100, Math.round((msg.length / imgCapacity) * 100));
    capPct.textContent = pct + "%";
    capFill.style.width = pct + "%";
    capFill.style.background = pct > 85 ? "#c95a5a" : "#c9a96e";
    capLabel.textContent = imgCapacity + " chars max";
  }
  if (msg.length > 0) {
    const bin = toBinary(msg.slice(0, 20));
    binaryOut.textContent = bin + (msg.length > 20 ? "…" : "");
    binaryOut.classList.add("has-data");
  } else {
    binaryOut.textContent = "Binary representation will appear here…";
    binaryOut.classList.remove("has-data");
  }
}

messageTA.addEventListener("input", () => {
  updateCapacity();
  if (messageTA.value.length > 0) setStep(2);
  checkReady();
});

function checkReady() {
  const ready =
    imgEl &&
    messageTA.value.trim().length > 0 &&
    messageTA.value.length <= imgCapacity;
  encodeBtn.disabled = !ready;
}

encodeBtn.addEventListener("click", () => {
  if (!imgEl) return;
  const message = messageTA.value;
  if (!message) return;

  setStatus("Encoding message into pixel data…", "active");
  encodeBtn.disabled = true;

  setTimeout(() => {
    const ctx = hiddenCanvas.getContext("2d");
    hiddenCanvas.width = imgEl.width;
    hiddenCanvas.height = imgEl.height;
    ctx.drawImage(imgEl, 0, 0);

    const imageData = ctx.getImageData(0, 0, imgEl.width, imgEl.height);
    const data = imageData.data;

    // Encode with terminator
    const fullMsg = message + "\0";
    const binary = toBinary(fullMsg);

    let bitIndex = 0;
    for (let i = 0; i < data.length && bitIndex < binary.length; i++) {
      if ((i + 1) % 4 === 0) continue; // skip alpha
      data[i] = (data[i] & 0xfe) | parseInt(binary[bitIndex]);
      bitIndex++;
    }

    ctx.putImageData(imageData, 0, 0);

    // Show output
    outputCanvas.width = imgEl.width;
    outputCanvas.height = imgEl.height;
    const outCtx = outputCanvas.getContext("2d");
    outCtx.putImageData(imageData, 0, 0);

    outputPlaceholder.style.display = "none";
    outputCanvas.style.display = "block";
    outputBadge.style.display = "block";
    downloadBtn.style.display = "block";
    encodeBtn.disabled = false;

    setStep(3);
    setStep(4);
    setStatus(
      "Message successfully encoded — " + message.length + " chars hidden",
      "success",
    );
  }, 400);
});

downloadBtn.addEventListener("click", () => {
  const link = document.createElement("a");
  link.download = "prodot_encoded.png";
  link.href = outputCanvas.toDataURL("image/png");
  link.click();
});
