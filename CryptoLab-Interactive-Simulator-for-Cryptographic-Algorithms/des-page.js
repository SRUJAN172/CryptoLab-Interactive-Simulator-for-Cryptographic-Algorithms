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

function desRoundKeyBits(keyBits, round) {
  return rotateLeft(keyBits, round).slice(0, 48);
}

function simpleDesFeistel(bits32, roundKey48) {
  const expanded = Array.from({ length: 48 }, (_, index) => bits32[(index * 5 + 3) % 32]).join("");
  const xored = xorBits(expanded, roundKey48);
  const chunks = xored.match(/.{1,6}/g) || [];
  const sboxed = chunks.map((chunk, index) => {
    const row = parseInt(`${chunk[0]}${chunk[5]}`, 2);
    const col = parseInt(chunk.slice(1, 5), 2);
    return ((row * 3 + col + index) % 16).toString(2).padStart(4, "0");
  }).join("");
  const pPermutation = Array.from({ length: 32 }, (_, index) => sboxed[(index * 7 + 5) % 32]).join("");
  return { expanded, xored, sboxed, pPermutation };
}

function simplifiedDES(text, key, decrypt = false) {
  const plaintextBits = textToBits(text, 8);
  const keyBits = textToBits(key, 8);
  const ip = Array.from({ length: 64 }, (_, index) => plaintextBits[(index * 9 + 1) % 64]).join("");
  let left = ip.slice(0, 32);
  let right = ip.slice(32);
  const rounds = [];
  const order = decrypt ? Array.from({ length: 16 }, (_, i) => 16 - i) : Array.from({ length: 16 }, (_, i) => i + 1);

  order.forEach((roundNumber) => {
    const roundKey = desRoundKeyBits(keyBits, roundNumber);
    const f = simpleDesFeistel(right, roundKey);
    const newRight = xorBits(left, f.pPermutation);
    const newLeft = right;
    rounds.push({ roundNumber, left, right, roundKey, ...f, newLeft, newRight });
    left = newLeft;
    right = newRight;
  });

  const preOutput = right + left;
  const finalBits = Array.from({ length: 64 }, (_, index) => preOutput[(index * 11 + 7) % 64]).join("");
  return { ip, rounds, finalBits };
}

function createStepCard(title, body) {
  return `<div class="step-card"><strong>${title}</strong><div>${body}</div></div>`;
}

function runDES(decrypt = false) {
  const text = document.getElementById("des-text").value;
  const key = document.getElementById("des-key").value;
  const simulation = simplifiedDES(text, key, decrypt);
  const roundOne = simulation.rounds[0];
  document.getElementById("des-output").textContent = simulation.finalBits.match(/.{1,8}/g).join(" ");
  document.getElementById("des-steps").innerHTML = [
    createStepCard("Initial permutation", "Input bits are rearranged before the Feistel rounds begin."),
    createStepCard("Split into halves", `L0 = ${simulation.ip.slice(0, 16)}... and R0 = ${simulation.ip.slice(32, 48)}...`),
    createStepCard(`Round ${roundOne.roundNumber} expansion`, `R expands to 48 bits: ${roundOne.expanded.slice(0, 24)}...`),
    createStepCard("XOR with round key", "The expanded bits are XORed with the current round key."),
    createStepCard("S-box substitution", "Each 6-bit chunk becomes 4 bits, reducing 48 bits back to 32 bits."),
    createStepCard("Feistel update", `New halves become L1 = R0 and R1 = L0 XOR f(R0, K1).`)
  ].join("");
}

document.getElementById("des-encrypt").addEventListener("click", () => runDES(false));
document.getElementById("des-decrypt").addEventListener("click", () => runDES(true));
document.getElementById("des-example").addEventListener("click", () => {
  document.getElementById("des-text").value = "SECURITY";
  document.getElementById("des-key").value = "LABKEY12";
});
