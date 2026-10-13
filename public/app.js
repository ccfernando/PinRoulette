
const wheel = document.querySelector("#wheel");
const spinButton = document.querySelector("#spinButton");
const hubSpinButton = document.querySelector("#hubSpinButton");
const resetButton = document.querySelector("#resetButton");
const remainingCount = document.querySelector("#remainingCount");
const resultModal = document.querySelector("#resultModal");
const winnerImage = document.querySelector("#winnerImage");
const winnerName = document.querySelector("#winnerName");

// ========================================
// SOUND EFFECTS
// ========================================

const bgSound = new Audio("/sounds/BG.mp3");
bgSound.loop = true;
bgSound.volume = 0.35;

const spinSound = new Audio("/sounds/spin.mp3");
spinSound.loop = false;
spinSound.volume = 0.8;

let bgStarted = false;

function startBackgroundMusic() {
  if (bgStarted) return;

  bgSound.play()
    .then(() => {
      bgStarted = true;
    })
    .catch((error) => {
      console.warn("Background music could not play:", error);
    });
}

// ========================================
// ROULETTE VARIABLES
// ========================================

let allImages = [];
let activeImages = [];
let currentRotation = 0;
let isSpinning = false;

const SPIN_DURATION = 10000;

// ========================================
// RENDER WHEEL
// ========================================

function renderWheel() {
  wheel.innerHTML = "";

  const count = allImages.length;
  const activeNames = new Set(
    activeImages.map((image) => image.name)
  );

  allImages.forEach((image, index) => {
    const item = document.createElement("div");
    const angle = (360 / count) * index;

    item.className = `wheel-item${
      activeNames.has(image.name) ? "" : " is-picked"
    }`;

    item.style.setProperty("--angle", `${angle}deg`);

    const imageFrame = document.createElement("span");
    imageFrame.className = "image-frame";

    const img = document.createElement("img");
    img.src = image.url;
    img.alt = image.name.replace(/\.[^.]+$/, "");
    img.loading = "eager";

    imageFrame.append(img);
    item.append(imageFrame);
    wheel.append(item);
  });

  remainingCount.textContent = activeImages.length;

  spinButton.disabled =
    isSpinning || activeImages.length === 0;

  hubSpinButton.disabled = spinButton.disabled;

  spinButton.textContent =
    activeImages.length === 0 ? "Done" : "Start";
}

// ========================================
// PICK WINNER
// ========================================

function pickWinner() {
  const winnerIndex = Math.floor(
    Math.random() * activeImages.length
  );

  return activeImages[winnerIndex];
}

// ========================================
// SHOW WINNER
// ========================================

function showWinner(winner) {
  winnerImage.src = winner.url;
  winnerImage.alt = winner.name.replace(/\.[^.]+$/, "");
  winnerName.textContent = winner.name.replace(/\.[^.]+$/, "");

  activeImages = activeImages.filter(
    (image) => image.name !== winner.name
  );

  renderWheel();

  if (typeof resultModal.showModal === "function") {
    resultModal.showModal();
  } else {
    alert(`Selected: ${winner.name}`);
  }
}

// ========================================
// SPIN ROULETTE FOR 10 SECONDS
// ========================================

function spin() {
  if (isSpinning || activeImages.length === 0) return;

  const winner = pickWinner();

  const wheelIndex = allImages.findIndex(
    (image) => image.name === winner.name
  );

  const sliceAngle = 360 / allImages.length;
  const winnerAngle = wheelIndex * sliceAngle;

  const extraTurns = 30 + Math.floor(Math.random() * 3);
  const targetRotation = extraTurns * 360 - winnerAngle;

  isSpinning = true;

  spinButton.disabled = true;
  hubSpinButton.disabled = true;

  // Start background music
  startBackgroundMusic();

  // Restart spin sound from the beginning
  spinSound.pause();
  spinSound.currentTime = 0;

  // Play the sound for the duration of the spin
  spinSound.playbackRate = 1;
  spinSound.loop = false;

  spinSound.play().catch((error) => {
    console.warn("Spinning sound could not play:", error);
  });

  // Animate the wheel for exactly 10 seconds
  wheel.style.transition =
    `transform ${SPIN_DURATION}ms cubic-bezier(0.15, 0.65, 0.15, 1)`;

  currentRotation +=
    targetRotation +
    ((360 - (currentRotation % 360)) % 360);

  wheel.style.transform = `rotate(${currentRotation}deg)`;

  // Stop the sound and reveal the winner after 10 seconds
  window.setTimeout(() => {
    spinSound.pause();
    spinSound.currentTime = 0;

    isSpinning = false;

    showWinner(winner);
  }, SPIN_DURATION);
}

// ========================================
// RESET ROULETTE
// ========================================

function reset() {
  if (isSpinning) return;

  activeImages = [...allImages];
  currentRotation = 0;

  wheel.style.transition = "none";
  wheel.style.transform = "rotate(0deg)";

  // Force browser to apply reset before restoring transition
  wheel.offsetHeight;

  wheel.style.transition = "";

  renderWheel();
}

// ========================================
// LOAD IMAGES
// ========================================

async function loadImages() {
  try {
    const response = await fetch("/api/images");

    if (!response.ok) {
      throw new Error("Image list request failed.");
    }

    const data = await response.json();

    allImages = data.images;
    activeImages = [...allImages];

    if (allImages.length === 0) {
      wheel.innerHTML =
        '<p class="empty-state">Add images to data/images.</p>';

      spinButton.disabled = true;
      hubSpinButton.disabled = true;
      resetButton.disabled = true;

      return;
    }

    renderWheel();
  } catch (error) {
    wheel.innerHTML =
      '<p class="empty-state">Could not load images.</p>';

    spinButton.disabled = true;
    hubSpinButton.disabled = true;
    resetButton.disabled = true;

    console.error(error);
  }
}

// ========================================
// EVENT LISTENERS
// ========================================

spinButton.addEventListener("click", spin);
hubSpinButton.addEventListener("click", spin);
resetButton.addEventListener("click", reset);

// Start background music after the first user interaction
document.addEventListener("click", startBackgroundMusic);

// Initialize roulette
loadImages();
