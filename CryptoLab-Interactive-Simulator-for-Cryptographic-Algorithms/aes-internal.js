const AES_SBOX = [
  0x63,0x7c,0x77,0x7b,0xf2,0x6b,0x6f,0xc5,0x30,0x01,0x67,0x2b,0xfe,0xd7,0xab,0x76,
  0xca,0x82,0xc9,0x7d,0xfa,0x59,0x47,0xf0,0xad,0xd4,0xa2,0xaf,0x9c,0xa4,0x72,0xc0,
  0xb7,0xfd,0x93,0x26,0x36,0x3f,0xf7,0xcc,0x34,0xa5,0xe5,0xf1,0x71,0xd8,0x31,0x15,
  0x04,0xc7,0x23,0xc3,0x18,0x96,0x05,0x9a,0x07,0x12,0x80,0xe2,0xeb,0x27,0xb2,0x75,
  0x09,0x83,0x2c,0x1a,0x1b,0x6e,0x5a,0xa0,0x52,0x3b,0xd6,0xb3,0x29,0xe3,0x2f,0x84,
  0x53,0xd1,0x00,0xed,0x20,0xfc,0xb1,0x5b,0x6a,0xcb,0xbe,0x39,0x4a,0x4c,0x58,0xcf,
  0xd0,0xef,0xaa,0xfb,0x43,0x4d,0x33,0x85,0x45,0xf9,0x02,0x7f,0x50,0x3c,0x9f,0xa8,
  0x51,0xa3,0x40,0x8f,0x92,0x9d,0x38,0xf5,0xbc,0xb6,0xda,0x21,0x10,0xff,0xf3,0xd2,
  0xcd,0x0c,0x13,0xec,0x5f,0x97,0x44,0x17,0xc4,0xa7,0x7e,0x3d,0x64,0x5d,0x19,0x73,
  0x60,0x81,0x4f,0xdc,0x22,0x2a,0x90,0x88,0x46,0xee,0xb8,0x14,0xde,0x5e,0x0b,0xdb,
  0xe0,0x32,0x3a,0x0a,0x49,0x06,0x24,0x5c,0xc2,0xd3,0xac,0x62,0x91,0x95,0xe4,0x79,
  0xe7,0xc8,0x37,0x6d,0x8d,0xd5,0x4e,0xa9,0x6c,0x56,0xf4,0xea,0x65,0x7a,0xae,0x08,
  0xba,0x78,0x25,0x2e,0x1c,0xa6,0xb4,0xc6,0xe8,0xdd,0x74,0x1f,0x4b,0xbd,0x8b,0x8a,
  0x70,0x3e,0xb5,0x66,0x48,0x03,0xf6,0x0e,0x61,0x35,0x57,0xb9,0x86,0xc1,0x1d,0x9e,
  0xe1,0xf8,0x98,0x11,0x69,0xd9,0x8e,0x94,0x9b,0x1e,0x87,0xe9,0xce,0x55,0x28,0xdf,
  0x8c,0xa1,0x89,0x0d,0xbf,0xe6,0x42,0x68,0x41,0x99,0x2d,0x0f,0xb0,0x54,0xbb,0x16
];

function toByteArray(text, size = 16) {
  return Array.from((text || "").padEnd(size, " ").slice(0, size)).map((char) => char.charCodeAt(0));
}

function hex(value) {
  return value.toString(16).toUpperCase().padStart(2, "0");
}

function matrixHTML(values, highlights = []) {
  return `<div class="state-grid">${values.map((value, index) => `<div class="state-cell ${highlights.includes(index) ? "highlight" : ""}">${hex(value)}</div>`).join("")}</div>`;
}

function xorMatrixHTML(state, key) {
  return `<div class="state-grid">${state.map((value, index) => `<div class="xor-cell ${index < 4 ? "highlight" : ""}">${hex(value)} ⊕ ${hex(key[index])}<br>${hex(value ^ key[index])}</div>`).join("")}</div>`;
}

function rotateRow(values, row, shift) {
  const rowValues = values.slice(row * 4, row * 4 + 4);
  const rotated = rowValues.slice(shift).concat(rowValues.slice(0, shift));
  const clone = values.slice();
  clone.splice(row * 4, 4, ...rotated);
  return clone;
}

function shiftRows(values) {
  let current = values.slice();
  current = rotateRow(current, 1, 1);
  current = rotateRow(current, 2, 2);
  current = rotateRow(current, 3, 3);
  return current;
}

function mixColumns(values) {
  const result = values.slice();
  for (let col = 0; col < 4; col += 1) {
    const a = values[col];
    const b = values[col + 4];
    const c = values[col + 8];
    const d = values[col + 12];
    result[col] = (a + b) % 256;
    result[col + 4] = (b + c) % 256;
    result[col + 8] = (c + d) % 256;
    result[col + 12] = (d + a) % 256;
  }
  return result;
}

function roundKey(baseKey, round) {
  const shift = round % baseKey.length;
  const rotated = baseKey.slice(shift).concat(baseKey.slice(0, shift));
  return rotated.map((value, index) => (value ^ ((round * 29 + index * 7) % 256)));
}

function buildSimulation() {
  const message = document.getElementById("aes-plain").value || "SECUREMESSAGE12";
  const key = document.getElementById("aes-key").value || "CLASSROOMKEY890";
  const input = toByteArray(message);
  const keyBase = toByteArray(key);
  const rounds = [];
  let state = input.slice();

  for (let round = 1; round <= 3; round += 1) {
    const sub = state.map((value) => AES_SBOX[value]);
    const shifted = shiftRows(sub);
    const mixed = mixColumns(shifted);
    const rk = roundKey(keyBase, round);
    const added = mixed.map((value, index) => value ^ rk[index]);
    rounds.push({ round, input: state, sub, shifted, mixed, roundKey: rk, added, final: false });
    state = added;
  }

  const finalSub = state.map((value) => AES_SBOX[value]);
  const finalShift = shiftRows(finalSub);
  const finalKey = roundKey(keyBase, 4);
  const finalAdded = finalShift.map((value, index) => value ^ finalKey[index]);
  rounds.push({ round: 4, input: state, sub: finalSub, shifted: finalShift, mixed: null, roundKey: finalKey, added: finalAdded, final: true });

  const steps = [];
  steps.push({
    round: 0,
    title: "Step 1: Input block representation",
    explanation: "AES starts by arranging the 16-byte plaintext block into a 4×4 state matrix. This matrix becomes the input to Round 1.",
    html: `<div class="viz-grid"><div class="matrix-board"><div class="board-caption"><strong>Input block</strong><span class="mono">${message.padEnd(16, " ").slice(0, 16)}</span></div>${matrixHTML(input)}</div><div class="info-tile"><strong>Why this matters</strong><div>The state matrix is the central AES structure. Every round transforms this same matrix to spread information and hide patterns.</div></div></div>`
  });

  rounds.forEach((roundData) => {
    steps.push({
      round: roundData.round,
      title: `Round ${roundData.round}: SubBytes`,
      explanation: "Each byte is replaced using the AES S-box. This nonlinear substitution breaks simple input-output patterns.",
      html: renderSubBytes(roundData)
    });
    steps.push({
      round: roundData.round,
      title: `Round ${roundData.round}: ShiftRows`,
      explanation: "Rows are shifted left by different offsets so bytes move into new columns and start interacting with different neighbors.",
      html: renderShiftRows(roundData)
    });
    if (!roundData.final) {
      steps.push({
        round: roundData.round,
        title: `Round ${roundData.round}: MixColumns`,
        explanation: "Each column is blended so the output bytes depend on multiple input bytes. This strengthens diffusion across the state.",
        html: renderMixColumns(roundData)
      });
    }
    steps.push({
      round: roundData.round,
      title: `Round ${roundData.round}: AddRoundKey`,
      explanation: "The state is XORed with the round key. This is where the secret key directly enters the round transformation.",
      html: renderAddRoundKey(roundData)
    });
  });

  return { steps, rounds };
}

function renderSubBytes(roundData) {
  const lookups = roundData.input.slice(0, 4).map((value) => {
    const row = (value >> 4).toString(16).toUpperCase();
    const col = (value & 0x0f).toString(16).toUpperCase();
    return `<div class="info-tile"><strong>${hex(value)} → ${hex(AES_SBOX[value])}</strong><div>Row ${row}, Column ${col} in the S-box gives the substituted byte.</div></div>`;
  }).join("");

  const sboxPreview = AES_SBOX.slice(0, 64)
    .map((value, index) => `<div class="sbox-cell ${roundData.input.slice(0, 4).includes(index) ? "highlight" : ""}">${hex(value)}</div>`)
    .join("");

  return `<div class="viz-grid">
    <div class="matrix-board">
      <div class="board-caption"><strong>Before SubBytes</strong><span>Round ${roundData.round} input</span></div>
      ${matrixHTML(roundData.input)}
      <div class="round-arrow centered">↓</div>
      <div class="board-caption"><strong>After SubBytes</strong><span>Substituted state</span></div>
      ${matrixHTML(roundData.sub, Array.from({ length: 16 }, (_, i) => i))}
    </div>
    <div class="sbox-board">
      <div class="info-tile"><strong>S-box lookup highlights</strong><div>These examples show how a byte uses its first hex digit as the row and second hex digit as the column.</div></div>
      <div class="highlight-strip">${lookups}</div>
      <div>
        <strong>S-box preview</strong>
        <div class="bit-grid">${sboxPreview}</div>
      </div>
    </div>
  </div>`;
}

function renderShiftRows(roundData) {
  return `<div class="state-pair">
    <div class="matrix-board">
      <div class="board-caption"><strong>Before ShiftRows</strong><span>Rows still aligned</span></div>
      ${matrixHTML(roundData.sub, [4,5,6,7,8,9,10,11,12,13,14,15])}
    </div>
    <div class="round-arrow">→</div>
    <div class="matrix-board">
      <div class="board-caption"><strong>After ShiftRows</strong><span>Rows moved left</span></div>
      ${matrixHTML(roundData.shifted, [4,5,6,7,8,9,10,11,12,13,14,15])}
      <div class="info-tile"><strong>Row movement</strong><div>Row 0 stays still. Row 1 shifts by 1, Row 2 shifts by 2, and Row 3 shifts by 3.</div></div>
    </div>
  </div>`;
}

function renderMixColumns(roundData) {
  const columnBefore = [roundData.shifted[0], roundData.shifted[4], roundData.shifted[8], roundData.shifted[12]];
  const columnAfter = [roundData.mixed[0], roundData.mixed[4], roundData.mixed[8], roundData.mixed[12]];
  return `<div class="viz-grid">
    <div class="matrix-board">
      <div class="board-caption"><strong>Before MixColumns</strong><span>Columns before blending</span></div>
      ${matrixHTML(roundData.shifted)}
      <div class="round-arrow centered">↓</div>
      <div class="board-caption"><strong>After MixColumns</strong><span>Column outputs</span></div>
      ${matrixHTML(roundData.mixed, Array.from({ length: 16 }, (_, i) => i))}
    </div>
    <div class="info-tile">
      <strong>Column transformation concept</strong>
      <div class="vector-row">
        ${columnBefore.map((value) => `<div class="vector-chip">${hex(value)}</div>`).join("")}
      </div>
      <div class="viz-copy">The first column is mixed so each new byte depends on multiple old bytes.</div>
      <div class="vector-row">
        ${columnAfter.map((value) => `<div class="vector-chip">${hex(value)}</div>`).join("")}
      </div>
      <div class="helper-text">In real AES, this uses matrix multiplication in a finite field. Here, the visual focus is that columns are blended, not copied directly.</div>
    </div>
  </div>`;
}

function renderAddRoundKey(roundData) {
  const state = roundData.final ? roundData.shifted : roundData.mixed;
  const label = roundData.final ? "Final round output" : `Round ${roundData.round} output becomes the next round input`;
  return `<div class="viz-grid">
    <div class="matrix-board">
      <div class="board-caption"><strong>State before AddRoundKey</strong><span>XOR stage</span></div>
      ${matrixHTML(state)}
      <div class="round-arrow centered">⊕</div>
      <div class="board-caption"><strong>Round key</strong><span>Round ${roundData.round}</span></div>
      ${matrixHTML(roundData.roundKey)}
    </div>
    <div class="matrix-board">
      <div class="board-caption"><strong>XOR calculation</strong><span>Highlighted cells show byte-wise XOR</span></div>
      ${xorMatrixHTML(state, roundData.roundKey)}
      <div class="info-tile"><strong>${label}</strong><div>${matrixHTML(roundData.added, Array.from({ length: 16 }, (_, i) => i))}</div></div>
    </div>
  </div>`;
}

let aesSimulation = { steps: [], rounds: [] };
let aesIndex = 0;

function renderAesTimeline() {
  const timeline = document.getElementById("aes-rounds");
  timeline.innerHTML = [1, 2, 3, 4].map((round) => `<span class="timeline-chip ${aesSimulation.steps[aesIndex] && aesSimulation.steps[aesIndex].round === round ? "active" : ""}">${round === 4 ? "Final Round" : `Round ${round}`}</span>`).join("");
}

function renderAesStep() {
  if (!aesSimulation.steps.length) {
    return;
  }
  const step = aesSimulation.steps[aesIndex];
  document.getElementById("aes-progress").textContent = `Step ${aesIndex + 1} of ${aesSimulation.steps.length}`;
  document.getElementById("aes-step").innerHTML = `<h4>${step.title}</h4><p class="viz-copy">${step.explanation}</p>${step.html}`;
  document.getElementById("aes-prev").disabled = aesIndex === 0;
  document.getElementById("aes-next").disabled = aesIndex === aesSimulation.steps.length - 1;
  renderAesTimeline();
}

function buildAesSimulation(resetIndex = true) {
  aesSimulation = buildSimulation();
  if (resetIndex) {
    aesIndex = 0;
  }
  renderAesStep();
}

document.getElementById("aes-build").addEventListener("click", () => buildAesSimulation(true));
document.getElementById("aes-prev").addEventListener("click", () => {
  aesIndex = Math.max(0, aesIndex - 1);
  renderAesStep();
});
document.getElementById("aes-next").addEventListener("click", () => {
  aesIndex = Math.min(aesSimulation.steps.length - 1, aesIndex + 1);
  renderAesStep();
});
document.getElementById("aes-reset").addEventListener("click", () => buildAesSimulation(true));
document.getElementById("aes-example").addEventListener("click", () => {
  document.getElementById("aes-plain").value = "SECUREMESSAGE12";
  document.getElementById("aes-key").value = "CLASSROOMKEY890";
});

buildAesSimulation(true);
