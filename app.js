const wheelCanvas = document.querySelector("#wheelCanvas");
const participantForm = document.querySelector("#participantForm");
const participantInput = document.querySelector("#participantInput");
const addButton = document.querySelector("#addBtn");
const clearButton = document.querySelector("#clearBtn");
const spinButton = document.querySelector("#spinBtn");
const participantsChips = document.querySelector("#participantsChips");
const chipsEmptyState = document.querySelector("#chipsEmptyState");
const formFeedback = document.querySelector("#formFeedback");
const statusText = document.querySelector("#statusText");
const remainingBadge = document.querySelector("#remainingBadge");
const winnerCard = document.querySelector("#winnerCard");
const winnerName = document.querySelector("#winnerName");
const winnerHint = document.querySelector("#winnerHint");

const palette = [
  "#5f3dc4",
  "#6741d9",
  "#7048e8",
  "#7950f2",
  "#845ef7",
  "#9775fa",
  "#9c36ff",
  "#6d28d9",
];

const state = {
  participants: [],
  spinning: false,
  rotation: 0,
  lastWinner: "",
  animationFrameId: 0,
};

const removeDiacritics = (value) =>
  value.normalize("NFD").replace(/[\u0300-\u036f]/g, "");

const normalizeName = (value) => value.trim().replace(/\s+/g, " ");

const isRiggedName = (value) =>
  removeDiacritics(value).toLocaleLowerCase("es") === "violeta";

const normalizeDegrees = (value) => ((value % 360) + 360) % 360;

const createParticipant = (label) => ({
  id:
    typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
      ? crypto.randomUUID()
      : `participant-${Date.now()}-${Math.random().toString(16).slice(2)}`,
  label,
});

const setCanvasRotation = (rotation) => {
  state.rotation = rotation;
  wheelCanvas.style.transform = `rotate(${rotation}deg)`;
};

const setFeedback = (message, tone = "neutral") => {
  formFeedback.textContent = message;
  formFeedback.dataset.tone = tone;
};

const getRemainingLabel = (count) =>
  `${count} ${count === 1 ? "participante" : "participantes"}`;

const isBusy = () => state.spinning;

const updateWinnerCard = () => {
  if (state.spinning) {
    winnerCard.classList.remove("is-active");
    winnerName.textContent = "Girando...";
    winnerHint.textContent =
      "La ruleta está buscando al ganador de esta ronda.";
    return;
  }

  if (!state.lastWinner) {
    winnerCard.classList.remove("is-active");
    winnerName.textContent = "Aún sin resultado";
    winnerHint.textContent = "El resultado de cada giro aparecerá aquí.";
    return;
  }

  winnerCard.classList.add("is-active");
  winnerName.textContent = state.lastWinner;
  winnerHint.textContent = "";
};

const updateStatus = () => {
  const count = state.participants.length;
  remainingBadge.textContent = getRemainingLabel(count);

  if (state.spinning) {
    statusText.textContent =
      "La ruleta está girando. Espera a que se cierre la ronda.";
    return;
  }

  if (count === 0) {
    statusText.textContent = "Agrega al menos un participante para empezar.";
    return;
  }

  if (count === 1) {
    statusText.textContent =
      "Solo queda un nombre. La ruleta se muestra como un círculo completo.";
    return;
  }

  statusText.textContent = "";
};

const updateControls = () => {
  const hasParticipants = state.participants.length > 0;
  const busy = isBusy();
  participantInput.disabled = busy;
  addButton.disabled = busy;
  clearButton.disabled = busy || !hasParticipants;
  spinButton.disabled = busy || !hasParticipants;
};

const buildParticipantChip = (participant) => {
  const chip = document.createElement("span");
  chip.className = "chip";

  const label = document.createElement("span");
  label.textContent = participant.label;

  const removeButton = document.createElement("button");
  removeButton.type = "button";
  removeButton.textContent = "×";
  removeButton.setAttribute(
    "aria-label",
    `Eliminar a ${participant.label} de la ruleta`
  );
  removeButton.addEventListener("click", () => removeParticipant(participant.id));

  chip.append(label, removeButton);
  return chip;
};

const renderParticipants = () => {
  participantsChips.replaceChildren();

  state.participants.forEach((participant) => {
    participantsChips.append(buildParticipantChip(participant));
  });

  chipsEmptyState.hidden = state.participants.length > 0;
};

const fitText = (ctx, text, maxWidth) => {
  if (ctx.measureText(text).width <= maxWidth) {
    return text;
  }

  let trimmed = text;

  while (trimmed.length > 1 && ctx.measureText(`${trimmed}…`).width > maxWidth) {
    trimmed = trimmed.slice(0, -1);
  }

  return `${trimmed}…`;
};

const drawEmptyWheel = (ctx, size) => {
  const center = size / 2;
  const radius = size * 0.44;

  ctx.save();
  ctx.beginPath();
  ctx.fillStyle = "rgba(255, 255, 255, 0.03)";
  ctx.strokeStyle = "rgba(155, 135, 245, 0.22)";
  ctx.lineWidth = 3;
  ctx.arc(center, center, radius, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = "#bdb8d7";
  ctx.font = '600 20px "Sora", sans-serif';
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText("Añade participantes", center, center - 10);

  ctx.fillStyle = "#8d89a7";
  ctx.font = '500 14px "Inter", sans-serif';
  ctx.fillText("y pulsa Girar cuando quieras empezar", center, center + 20);
  ctx.restore();
};

const drawSingleParticipantWheel = (ctx, size, participant) => {
  const center = size / 2;
  const radius = size * 0.44;

  ctx.save();
  ctx.beginPath();
  ctx.arc(center, center, radius, 0, Math.PI * 2);
  ctx.fillStyle = "#7048e8";
  ctx.fill();

  ctx.beginPath();
  ctx.arc(center, center, radius, 0, Math.PI * 2);
  ctx.lineWidth = 4;
  ctx.strokeStyle = "rgba(255, 255, 255, 0.2)";
  ctx.stroke();

  ctx.fillStyle = "#ffffff";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.font = '700 28px "Sora", sans-serif';
  ctx.fillText(fitText(ctx, participant.label, radius * 1.2), center, center);
  ctx.restore();
};

const drawWheelSlices = (ctx, size) => {
  const center = size / 2;
  const radius = size * 0.44;
  const sliceAngle = (Math.PI * 2) / state.participants.length;

  state.participants.forEach((participant, index) => {
    const startAngle = -Math.PI / 2 + index * sliceAngle;
    const endAngle = startAngle + sliceAngle;
    const midAngle = startAngle + sliceAngle / 2;

    ctx.beginPath();
    ctx.moveTo(center, center);
    ctx.arc(center, center, radius, startAngle, endAngle);
    ctx.closePath();
    ctx.fillStyle = palette[index % palette.length];
    ctx.fill();

    ctx.strokeStyle = "rgba(255, 255, 255, 0.14)";
    ctx.lineWidth = 2;
    ctx.stroke();

    const labelRadius = radius * 0.67;
    const x = center + Math.cos(midAngle) * labelRadius;
    const y = center + Math.sin(midAngle) * labelRadius;
    const fontSize = Math.max(12, Math.min(18, 22 - state.participants.length * 0.55));

    ctx.save();
    ctx.translate(x, y);

    let textRotation = midAngle;
    if (textRotation > Math.PI / 2 && textRotation < (Math.PI * 3) / 2) {
      textRotation += Math.PI;
    }

    ctx.rotate(textRotation);
    ctx.fillStyle = "#fefefe";
    ctx.font = `700 ${fontSize}px Inter, sans-serif`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(fitText(ctx, participant.label, radius * 0.48), 0, 0);
    ctx.restore();
  });

  ctx.beginPath();
  ctx.arc(center, center, radius * 0.17, 0, Math.PI * 2);
  ctx.fillStyle = "rgba(15, 15, 19, 0.86)";
  ctx.fill();

  ctx.beginPath();
  ctx.arc(center, center, radius * 0.17, 0, Math.PI * 2);
  ctx.lineWidth = 3;
  ctx.strokeStyle = "rgba(255, 255, 255, 0.14)";
  ctx.stroke();

  ctx.beginPath();
  ctx.arc(center, center, radius, 0, Math.PI * 2);
  ctx.lineWidth = 4;
  ctx.strokeStyle = "rgba(255, 255, 255, 0.2)";
  ctx.stroke();
};

const drawWheel = () => {
  const ctx = wheelCanvas.getContext("2d");
  const rect = wheelCanvas.getBoundingClientRect();
  const size = Math.max(320, Math.min(rect.width || 520, rect.height || 520));
  const dpr = window.devicePixelRatio || 1;
  const internalSize = Math.round(size * dpr);

  if (wheelCanvas.width !== internalSize || wheelCanvas.height !== internalSize) {
    wheelCanvas.width = internalSize;
    wheelCanvas.height = internalSize;
  }

  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.clearRect(0, 0, size, size);

  if (state.participants.length === 0) {
    drawEmptyWheel(ctx, size);
  } else if (state.participants.length === 1) {
    drawSingleParticipantWheel(ctx, size, state.participants[0]);
  } else {
    drawWheelSlices(ctx, size);
  }

  const ariaCount = state.participants.length;
  wheelCanvas.setAttribute(
    "aria-label",
    ariaCount === 0
      ? "Ruleta vacía"
      : `Ruleta con ${getRemainingLabel(ariaCount)}`
  );
};

const renderApp = () => {
  renderParticipants();
  updateStatus();
  updateControls();
  updateWinnerCard();
  drawWheel();
};

const getWeights = () => {
  const count = state.participants.length;

  if (count === 0) {
    return [];
  }

  const hasVioleta = state.participants.some((participant) =>
    isRiggedName(participant.label)
  );

  if (!hasVioleta || count === 1) {
    return state.participants.map(() => 1 / count);
  }

  const remainingWeight = 0.1 / (count - 1);

  return state.participants.map((participant) =>
    isRiggedName(participant.label) ? 0.9 : remainingWeight
  );
};

const pickWinnerIndex = () => {
  const weights = getWeights();
  const threshold = Math.random();
  let cumulative = 0;

  for (let index = 0; index < weights.length; index += 1) {
    cumulative += weights[index];

    if (threshold <= cumulative || index === weights.length - 1) {
      return index;
    }
  }

  return 0;
};

const animateSpin = (targetRotation, duration, onFinish) => {
  const startRotation = state.rotation;
  const delta = targetRotation - startRotation;
  const startTime = performance.now();

  const frame = (timestamp) => {
    const elapsed = timestamp - startTime;
    const progress = Math.min(elapsed / duration, 1);
    const eased = 1 - Math.pow(1 - progress, 3);
    setCanvasRotation(startRotation + delta * eased);

    if (progress < 1) {
      state.animationFrameId = window.requestAnimationFrame(frame);
      return;
    }

    setCanvasRotation(targetRotation);
    state.animationFrameId = 0;
    onFinish();
  };

  state.animationFrameId = window.requestAnimationFrame(frame);
};

const removeParticipant = (participantId) => {
  if (isBusy()) {
    return;
  }

  state.participants = state.participants.filter(
    (participant) => participant.id !== participantId
  );

  if (state.participants.length === 0) {
    state.lastWinner = "";
  }

  setFeedback("Lista actualizada.", "neutral");
  renderApp();
};

const addParticipant = (rawValue) => {
  if (isBusy()) {
    return;
  }

  const label = normalizeName(rawValue);

  if (!label) {
    setFeedback("Escribe un nombre válido antes de agregarlo.", "danger");
    return;
  }

  const alreadyExists = state.participants.some(
    (participant) =>
      participant.label.toLocaleLowerCase("es") === label.toLocaleLowerCase("es")
  );

  if (alreadyExists) {
    setFeedback("Ese nombre ya está en la ruleta.", "danger");
    return;
  }

  state.participants = [...state.participants, createParticipant(label)];
  setFeedback(`${label} se añadió a la ruleta.`, "success");
  participantForm.reset();
  participantInput.focus();
  renderApp();
};

const clearParticipants = () => {
  if (isBusy()) {
    return;
  }

  state.participants = [];
  state.lastWinner = "";
  setCanvasRotation(0);
  setFeedback("La lista se ha vaciado.", "success");
  renderApp();
};

const spinWheel = () => {
  if (isBusy() || state.participants.length === 0) {
    return;
  }

  state.spinning = true;
  state.lastWinner = "";
  renderApp();

  const winnerIndex = pickWinnerIndex();
  const winner = state.participants[winnerIndex];
  const fullTurns = Math.floor(Math.random() * 3) + 6;
  const currentNormalizedRotation = normalizeDegrees(state.rotation);

  let finalNormalizedRotation = currentNormalizedRotation;

  if (state.participants.length > 1) {
    const sliceDegrees = 360 / state.participants.length;
    const winnerCenter = winnerIndex * sliceDegrees + sliceDegrees / 2;
    finalNormalizedRotation = normalizeDegrees(-winnerCenter);
  }

  const deltaToTarget = normalizeDegrees(
    finalNormalizedRotation - currentNormalizedRotation
  );
  const targetRotation = state.rotation + fullTurns * 360 + deltaToTarget;

  // The wheel only adds whole extra turns so the pointer can stop exactly on the chosen slice.
  animateSpin(targetRotation, 4000, () => {
    state.spinning = false;
    state.lastWinner = winner.label;
    state.participants = state.participants.filter(
      (participant) => participant.id !== winner.id
    );

    if (state.participants.length === 0) {
      setFeedback("Se han extraído todos los nombres.", "success");
    } else {
      setFeedback(`${winner.label} sale de la ruleta.`, "success");
    }

    renderApp();
  });
};

participantForm.addEventListener("submit", (event) => {
  event.preventDefault();
  addParticipant(participantInput.value);
});

clearButton.addEventListener("click", clearParticipants);
spinButton.addEventListener("click", spinWheel);
window.addEventListener("resize", drawWheel);

setCanvasRotation(0);
renderApp();
participantInput.focus();
