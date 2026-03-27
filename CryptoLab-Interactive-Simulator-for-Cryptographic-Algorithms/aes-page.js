function mod(n, m) {
  return ((n % m) + m) % m;
}

function toByteArray(text, size = 16) {
  return Array.from((text || "").padEnd(size, " ").slice(0, size)).map((char) => char.charCodeAt(0));
}

function byteArrayToHex(bytes) {
  return bytes.map((value) => value.toString(16).toUpperCase().padStart(2, "0")).join(" ");
}

function byteGrid(values) {
  return `<div class="byte-grid">${values.map((value) => `<div class="byte-cell">${value}</div>`).join("")}</div>`;
}

function simplifiedAES(message, key) {
  const bytes = toByteArray(message, 16);
  const keyBytes = toByteArray(key, 16);
  const subBytes = bytes.map((value, index) => mod(value + (index + 17), 256));
  const shiftRows = [subBytes[0], subBytes[1], subBytes[2], subBytes[3], subBytes[5], subBytes[6], subBytes[7], subBytes[4], subBytes[10], subBytes[11], subBytes[8], subBytes[9], subBytes[15], subBytes[12], subBytes[13], subBytes[14]];
  const mixColumns = shiftRows.map((value, index) => mod(value + shiftRows[(index + 4) % 16], 256));
  const addRoundKey = mixColumns.map((value, index) => value ^ keyBytes[index]);
  return { bytes, subBytes, shiftRows, mixColumns, addRoundKey };
}

function renderAES() {
  const message = document.getElementById("aes-message").value;
  const key = document.getElementById("aes-key").value;
  const { bytes, subBytes, shiftRows, mixColumns, addRoundKey } = simplifiedAES(message, key);
  document.getElementById("aes-output").textContent = byteArrayToHex(addRoundKey);
  const stages = [
    { title: "Initial State", explanation: "The 16-byte block is placed into a state matrix.", values: byteArrayToHex(bytes).split(" ") },
    { title: "SubBytes", explanation: "Each byte is substituted to break direct relationships.", values: byteArrayToHex(subBytes).split(" ") },
    { title: "ShiftRows", explanation: "Rows rotate left so bytes move into new columns.", values: byteArrayToHex(shiftRows).split(" ") },
    { title: "MixColumns", explanation: "Columns are blended so each output depends on multiple bytes.", values: byteArrayToHex(mixColumns).split(" ") },
    { title: "AddRoundKey", explanation: "The state is XORed with the secret key material.", values: byteArrayToHex(addRoundKey).split(" ") }
  ];
  document.getElementById("aes-stages").innerHTML = stages.map((stage) => `<div class="aes-stage"><h4>${stage.title}</h4><p>${stage.explanation}</p>${byteGrid(stage.values)}</div>`).join("");
}

document.getElementById("aes-run").addEventListener("click", renderAES);
document.getElementById("aes-example").addEventListener("click", () => {
  document.getElementById("aes-message").value = "SECUREMESSAGE12";
  document.getElementById("aes-key").value = "CLASSROOMKEY890";
});
