function rotateLeft(text, shift) {
  const actualShift = ((shift % text.length) + text.length) % text.length;
  return text.slice(actualShift) + text.slice(0, actualShift);
}

function textToBits(text, size = 8) {
  return Array.from((text || "").padEnd(size, " ").slice(0, size))
    .map((char) => char.charCodeAt(0).toString(2).padStart(8, "0"))
    .join("");
}

function xorBits(a, b) {
  return a.split("").map((bit, index) => (bit === b[index] ? "0" : "1")).join("");
}

function bitChunks(bits, size) {
  return bits.match(new RegExp(`.{1,${size}}`, "g")) || [];
}

function chunkHTML(chunks, highlightCount = 0) {
  return `<div class="bit-line">${chunks.map((chunk, index) => `<span class="bit-chunk ${index < highlightCount ? "highlight" : ""}">${chunk}</span>`).join("")}</div>`;
}

function desRoundKeyBits(keyBits, round) {
  return rotateLeft(keyBits, round).slice(0, 48);
}

function simpleDesFeistel(bits32, roundKey48) {
  const expanded = Array.from({ length: 48 }, (_, index) => bits32[(index * 5 + 3) % 32]).join("");
  const xored = xorBits(expanded, roundKey48);
  const chunks = bitChunks(xored, 6);
  const sboxed = chunks.map((chunk, index) => {
    const row = parseInt(`${chunk[0]}${chunk[5]}`, 2);
    const col = parseInt(chunk.slice(1, 5), 2);
    return ((row * 3 + col + index) % 16).toString(2).padStart(4, "0");
  }).join("");
  const pPermutation = Array.from({ length: 32 }, (_, index) => sboxed[(index * 7 + 5) % 32]).join("");
  return { expanded, xored, sboxInputs: chunks, sboxOutputs: bitChunks(sboxed, 4), pPermutation };
}

function buildDesSimulation() {
  const plaintext = document.getElementById("des-plain").value || "SECURITY";
  const keyText = document.getElementById("des-key").value || "LABKEY12";
  const plaintextBits = textToBits(plaintext, 8);
  const keyBits = textToBits(keyText, 8);
  const ip = Array.from({ length: 64 }, (_, index) => plaintextBits[(index * 9 + 1) % 64]).join("");
  let left = ip.slice(0, 32);
  let right = ip.slice(32);
  const rounds = [];
  const steps = [];

  steps.push({
    round: 0,
    title: "Step 1: Initial block representation",
    explanation: "DES begins with a 64-bit input block. The block is shown here in 8-bit groups so students can track each character as bits.",
    html: `<div class="viz-grid"><div class="bit-board"><strong>Input block bits</strong>${chunkHTML(bitChunks(plaintextBits, 8))}</div><div class="info-tile"><strong>Key bits</strong>${chunkHTML(bitChunks(keyBits, 8))}</div></div>`
  });

  steps.push({
    round: 0,
    title: "Step 2: Initial Permutation (IP)",
    explanation: "The initial permutation rearranges the input bits into a new order before the Feistel rounds begin.",
    html: `<div class="state-pair"><div class="bit-board"><strong>Before IP</strong>${chunkHTML(bitChunks(plaintextBits, 8))}</div><div class="round-arrow">→</div><div class="bit-board"><strong>After IP</strong>${chunkHTML(bitChunks(ip, 8))}</div></div>`
  });

  steps.push({
    round: 0,
    title: "Step 3: Split into Left and Right halves",
    explanation: "After the initial permutation, the 64-bit block is split into two 32-bit halves called L0 and R0.",
    html: `<div class="split-visual"><div class="bit-board"><strong>L0</strong>${chunkHTML(bitChunks(left, 4))}</div><div class="bit-board"><strong>R0</strong>${chunkHTML(bitChunks(right, 4))}</div></div>`
  });

  for (let round = 1; round <= 16; round += 1) {
    const roundKey = desRoundKeyBits(keyBits, round);
    const feistel = simpleDesFeistel(right, roundKey);
    const newRight = xorBits(left, feistel.pPermutation);
    const newLeft = right;
    rounds.push({ round, left, right, roundKey, ...feistel, newLeft, newRight });
    steps.push({
      round,
      title: `Round ${round}: Feistel transformation`,
      explanation: "Each DES round expands the right half, XORs it with the round key, applies S-box substitutions, permutes the result, and combines it with the left half.",
      html: renderDesRound({ round, left, right, roundKey, ...feistel, newLeft, newRight })
    });
    left = newLeft;
    right = newRight;
  }

  const preOutput = right + left;
  const finalBits = Array.from({ length: 64 }, (_, index) => preOutput[(index * 11 + 7) % 64]).join("");
  steps.push({
    round: 16,
    title: "Final step: Swap halves and final output",
    explanation: "After Round 16, the halves are swapped and the final permutation produces the output block.",
    html: `<div class="viz-grid"><div class="bit-board"><strong>Before final permutation</strong>${chunkHTML(bitChunks(preOutput, 8))}</div><div class="bit-board"><strong>Final output</strong>${chunkHTML(bitChunks(finalBits, 8))}</div></div>`
  });

  return { steps, rounds, finalBits };
}

function renderDesRound(roundData) {
  const sboxCards = roundData.sboxInputs.slice(0, 4).map((chunk, index) => {
    const row = parseInt(`${chunk[0]}${chunk[5]}`, 2);
    const col = parseInt(chunk.slice(1, 5), 2);
    return `<div class="info-tile"><strong>S-box ${index + 1}</strong><div>Input ${chunk} uses row ${row} and column ${col}, giving output ${roundData.sboxOutputs[index]}.</div></div>`;
  }).join("");

  return `<div class="round-summary">
    <div class="split-visual">
      <div class="bit-board"><strong>L${roundData.round - 1}</strong>${chunkHTML(bitChunks(roundData.left, 4))}</div>
      <div class="bit-board"><strong>R${roundData.round - 1}</strong>${chunkHTML(bitChunks(roundData.right, 4))}</div>
    </div>
    <div class="viz-grid">
      <div class="bit-board">
        <strong>Expansion permutation</strong>
        ${chunkHTML(bitChunks(roundData.expanded, 6), 4)}
        <div class="helper-text">The 32-bit right half is expanded to 48 bits so it can be XORed with the 48-bit round key.</div>
      </div>
      <div class="bit-board">
        <strong>XOR with round key</strong>
        ${chunkHTML(bitChunks(roundData.roundKey, 6), 4)}
        <div class="round-arrow centered">⊕</div>
        ${chunkHTML(bitChunks(roundData.xored, 6), 4)}
      </div>
    </div>
    <div class="viz-grid">
      <div class="sbox-board">
        <strong>S-box substitution</strong>
        <div class="highlight-strip">${sboxCards}</div>
        <div class="bit-board">${chunkHTML(roundData.sboxOutputs, 4)}</div>
      </div>
      <div class="bit-board">
        <strong>P permutation</strong>
        ${chunkHTML(bitChunks(roundData.pPermutation, 4), 4)}
        <div class="helper-text">This permutation rearranges the 32-bit S-box output before it is combined with the left half.</div>
      </div>
    </div>
    <div class="split-visual">
      <div class="bit-board"><strong>New L${roundData.round}</strong>${chunkHTML(bitChunks(roundData.newLeft, 4))}</div>
      <div class="bit-board"><strong>New R${roundData.round}</strong>${chunkHTML(bitChunks(roundData.newRight, 4))}</div>
    </div>
  </div>`;
}

let desSimulation = { steps: [], rounds: [], finalBits: "" };
let desIndex = 0;

function renderDesTimeline() {
  document.getElementById("des-rounds").innerHTML = Array.from({ length: 16 }, (_, index) => {
    const round = index + 1;
    const current = desSimulation.steps[desIndex];
    return `<span class="timeline-chip ${current && current.round === round ? "active" : ""}">Round ${round}</span>`;
  }).join("");
}

function renderDesStep() {
  if (!desSimulation.steps.length) {
    return;
  }
  const step = desSimulation.steps[desIndex];
  document.getElementById("des-progress").textContent = `Step ${desIndex + 1} of ${desSimulation.steps.length}`;
  document.getElementById("des-step").innerHTML = `<h4>${step.title}</h4><p class="viz-copy">${step.explanation}</p>${step.html}`;
  document.getElementById("des-prev").disabled = desIndex === 0;
  document.getElementById("des-next").disabled = desIndex === desSimulation.steps.length - 1;
  renderDesTimeline();
}

function buildAndRenderDes(resetIndex = true) {
  desSimulation = buildDesSimulation();
  if (resetIndex) {
    desIndex = 0;
  }
  renderDesStep();
}

document.getElementById("des-build").addEventListener("click", () => buildAndRenderDes(true));
document.getElementById("des-prev").addEventListener("click", () => {
  desIndex = Math.max(0, desIndex - 1);
  renderDesStep();
});
document.getElementById("des-next").addEventListener("click", () => {
  desIndex = Math.min(desSimulation.steps.length - 1, desIndex + 1);
  renderDesStep();
});
document.getElementById("des-reset").addEventListener("click", () => buildAndRenderDes(true));
document.getElementById("des-example").addEventListener("click", () => {
  document.getElementById("des-plain").value = "SECURITY";
  document.getElementById("des-key").value = "LABKEY12";
});

buildAndRenderDes(true);
