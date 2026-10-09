const wheel = document.querySelector("#wheel");
const spinButton = document.querySelector("#spinButton");
const hubSpinButton = document.querySelector("#hubSpinButton");
const resetButton = document.querySelector("#resetButton");
const remainingCount = document.querySelector("#remainingCount");
const resultModal = document.querySelector("#resultModal");
const winnerImage = document.querySelector("#winnerImage");
const winnerName = document.querySelector("#winnerName");

let allImages = [];
let activeImages = [];
let currentRotation = 0;
let isSpinning = false;

function renderWheel() {
  wheel.innerHTML = "";
  const count = allImages.length;
  const activeNames = new Set(activeImages.map((image) => image.name));

  allImages.forEach((image, index) => {
    const item = document.createElement("div");
    const angle = (360 / count) * index;
    item.className = `wheel-item${activeNames.has(image.name) ? "" : " is-picked"}`;
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
  spinButton.disabled = isSpinning || activeImages.length === 0;
  hubSpinButton.disabled = spinButton.disabled;
  spinButton.textContent = activeImages.length === 0 ? "Done" : "Start";
}

function pickWinner() {
  const winnerIndex = Math.floor(Math.random() * activeImages.length);
  return activeImages[winnerIndex];
}

function showWinner(winner) {
  winnerImage.src = winner.url;
  winnerImage.alt = winner.name.replace(/\.[^.]+$/, "");
  winnerName.textContent = winner.name.replace(/\.[^.]+$/, "");

  activeImages = activeImages.filter((image) => image.name !== winner.name);
  renderWheel();

  if (typeof resultModal.showModal === "function") {
    resultModal.showModal();
  } else {
    alert(`Selected: ${winner.name}`);
  }
}

function spin() {
  if (isSpinning || activeImages.length === 0) return;

  const winner = pickWinner();
  const wheelIndex = allImages.findIndex((image) => image.name === winner.name);
  const sliceAngle = 360 / allImages.length;
  const winnerAngle = wheelIndex * sliceAngle;
  const extraTurns = 5 + Math.floor(Math.random() * 3);
  const targetRotation = extraTurns * 360 - winnerAngle;

  isSpinning = true;
  spinButton.disabled = true;
  hubSpinButton.disabled = true;
  currentRotation += targetRotation + ((360 - (currentRotation % 360)) % 360);
  wheel.style.transform = `rotate(${currentRotation}deg)`;

  window.setTimeout(() => {
    isSpinning = false;
    showWinner(winner);
  }, 5300);
}

function reset() {
  if (isSpinning) return;
  activeImages = [...allImages];
  currentRotation = 0;
  wheel.style.transition = "none";
  wheel.style.transform = "rotate(0deg)";
  wheel.offsetHeight;
  wheel.style.transition = "";
  renderWheel();
}

async function loadImages() {
  try {
    const response = await fetch("/api/images");
    if (!response.ok) throw new Error("Image list request failed.");
    const data = await response.json();

    allImages = data.images;
    activeImages = [...allImages];

    if (allImages.length === 0) {
      wheel.innerHTML = '<p class="empty-state">Add images to data/images.</p>';
      spinButton.disabled = true;
      hubSpinButton.disabled = true;
      resetButton.disabled = true;
      return;
    }

    renderWheel();
  } catch (error) {
    wheel.innerHTML = '<p class="empty-state">Could not load images.</p>';
    spinButton.disabled = true;
    hubSpinButton.disabled = true;
    resetButton.disabled = true;
    console.error(error);
  }
}

spinButton.addEventListener("click", spin);
hubSpinButton.addEventListener("click", spin);
resetButton.addEventListener("click", reset);

loadImages();
