const canvas = document.getElementById("cakeCanvas");
const ctx = canvas.getContext("2d");

const confettiCanvas = document.getElementById("confettiCanvas");
const confettiCtx = confettiCanvas.getContext("2d");
confettiCanvas.width = canvas.width;
confettiCanvas.height = canvas.height;

const cakeImg = new Image();
cakeImg.src = "assets/cake.png";

const flameImg = new Image();
flameImg.src = "assets/flame.png"; // static flame image

let candles = [];
let confetti = [];
let confettiActive = false;

// 🎂 Draw cake base
function drawCake() {
  ctx.drawImage(cakeImg, 100, 180, 400, 200);
}

// 🕯️ Draw candles
function drawCandles() {
  candles.forEach(c => {
    ctx.fillStyle = "white";
    ctx.fillRect(c.x, c.y, 10, 30);

    if (c.lit) {
      ctx.drawImage(flameImg, c.x - 5, c.y - 25, 20, 25);
    }
  });
}

// 🔢 Update counter
function updateCandleCount() {
  const lit = candles.filter(c => c.lit).length;
  document.getElementById("candleCount").textContent =
    "Candles lit: " + lit + " / " + candles.length;
}

// ➕ Add or re-light candle
canvas.addEventListener("click", (e) => {
  const rect = canvas.getBoundingClientRect();
  const x = e.clientX - rect.left;
  const y = e.clientY - rect.top - 30;

  const clicked = candles.find(c => Math.abs(c.x - x) < 15 && Math.abs(c.y - y) < 40);

  if (clicked) {
    clicked.lit = true;
  } else {
    candles.push({ x, y, lit: true });
  }
  render();
  updateCandleCount();
});

// 💨 Blow candles using mic
async function startMic() {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    const audioCtx = new AudioContext();
    const analyser = audioCtx.createAnalyser();
    const mic = audioCtx.createMediaStreamSource(stream);
    mic.connect(analyser);

    const data = new Uint8Array(analyser.fftSize);

    function checkBlow() {
      analyser.getByteFrequencyData(data);
      let volume = data.reduce((a, b) => a + b) / data.length;
      if (volume > 20) {
        candles.forEach(c => (c.lit = false));
        render();
        updateCandleCount();

        // 🎉 Show message + confetti if all candles are out
        if (candles.length > 0 && candles.every(c => !c.lit)) {
          showMessage();
          startConfetti();
        }
      }
      requestAnimationFrame(checkBlow);
    }
    checkBlow();
  } catch (err) {
    console.error("Mic not available", err);
  }
}
startMic();

// 🔄 Render
function render() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  drawCake();
  drawCandles();
}

// 📝 Load from URL
function loadFromURL() {
  const params = new URLSearchParams(window.location.search);
  if (params.has("candles")) {
    try {
      const saved = JSON.parse(decodeURIComponent(params.get("candles")));
      if (Array.isArray(saved)) {
        candles = saved;
        render();
        updateCandleCount();
      }
    } catch (e) {
      console.error("Invalid candle data in URL");
    }
  }
}

// 📤 Share link
document.getElementById("shareBtn").addEventListener("click", () => {
  const data = encodeURIComponent(JSON.stringify(candles));
  const url = `${window.location.origin}${window.location.pathname}?candles=${data}`;
  navigator.clipboard.writeText(url).then(() => {
    alert("✅ Share link copied! Send it to your friend:\n" + url);
  });
});

// 🎉 Show message
function showMessage() {
  const msg = document.getElementById("message");
  msg.classList.remove("hidden");
  setTimeout(() => msg.classList.add("show"), 100);
}

// 🎊 Confetti
function startConfetti() {
  if (confettiActive) return;
  confettiActive = true;

  confetti = Array.from({ length: 100 }, () => ({
    x: Math.random() * confettiCanvas.width,
    y: Math.random() * -confettiCanvas.height,
    r: Math.random() * 6 + 4,
    d: Math.random() * 20 + 10,
    color: `hsl(${Math.random() * 360}, 100%, 50%)`,
    tilt: Math.random() * 10 - 10,
    tiltAngleIncrement: Math.random() * 0.07 + 0.05,
    tiltAngle: 0
  }));

  requestAnimationFrame(drawConfetti);
}

function drawConfetti() {
  confettiCtx.clearRect(0, 0, confettiCanvas.width, confettiCanvas.height);
  confetti.forEach(c => {
    c.tiltAngle += c.tiltAngleIncrement;
    c.y += (Math.cos(c.d) + 3 + c.r / 2) / 2;
    c.x += Math.sin(c.d);
    c.tilt = Math.sin(c.tiltAngle) * 15;

    confettiCtx.beginPath();
    confettiCtx.lineWidth = c.r;
    confettiCtx.strokeStyle = c.color;
    confettiCtx.moveTo(c.x + c.tilt + c.r / 4, c.y);
    confettiCtx.lineTo(c.x + c.tilt, c.y + c.tilt + c.r / 4);
    confettiCtx.stroke();
  });

  confetti = confetti.filter(c => c.y < confettiCanvas.height);
  if (confetti.length > 0) {
    requestAnimationFrame(drawConfetti);
  }
}

// 🚀 Start app
cakeImg.onload = () => {
  loadFromURL();
  render();
  updateCandleCount();
};
