const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";

function mod(n, m) {
  return ((n % m) + m) % m;
}

function cleanLetters(text, mergeJ = false) {
  let result = (text || "").toUpperCase().replace(/[^A-Z]/g, "");
  if (mergeJ) {
    result = result.replace(/J/g, "I");
  }
  return result;
}

function createStepCard(title, body) {
  return `<div class="step-card"><strong>${title}</strong><div>${body}</div></div>`;
}

function setHTML(id, html) {
  const node = document.getElementById(id);
  if (node) {
    node.innerHTML = html;
  }
}

function setText(id, text) {
  const node = document.getElementById(id);
  if (node) {
    node.textContent = text;
  }
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

function textToBits(text, size = 8) {
  return Array.from((text || "").padEnd(size, " ").slice(0, size))
    .map((char) => char.charCodeAt(0).toString(2).padStart(8, "0"))
    .join("");
}

function bitsToText(bits) {
  let result = "";
  for (let i = 0; i < bits.length; i += 8) {
    result += String.fromCharCode(parseInt(bits.slice(i, i + 8), 2));
  }
  return result.trimEnd();
}

function xorBits(a, b) {
  return a
    .split("")
    .map((bit, index) => (bit === b[index] ? "0" : "1"))
    .join("");
}

function rotateLeft(text, shift) {
  const actualShift = mod(shift, text.length);
  return text.slice(actualShift) + text.slice(0, actualShift);
}

function caesarCipher(text, shift, decrypt = false) {
  const appliedShift = decrypt ? -shift : shift;
  const steps = [];
  let result = "";

  for (const char of text.toUpperCase()) {
    if (!alphabet.includes(char)) {
      result += char;
      steps.push(createStepCard(`"${char}" stays the same`, "Non-letter characters are not shifted."));
      continue;
    }

    const index = alphabet.indexOf(char);
    const newIndex = mod(index + appliedShift, 26);
    const shifted = alphabet[newIndex];
    result += shifted;
    steps.push(createStepCard(`${char} → ${shifted}`, `${char} is at position ${index}. Shift by ${appliedShift} to get ${newIndex}, which is ${shifted}.`));
  }

  return { result, steps };
}

function createPlayfairMatrix(key) {
  const sequence = `${cleanLetters(key, true)}ABCDEFGHIKLMNOPQRSTUVWXYZ`;
  const seen = new Set();
  const chars = [];

  for (const char of sequence) {
    if (!seen.has(char)) {
      seen.add(char);
      chars.push(char);
    }
  }

  return Array.from({ length: 5 }, (_, row) => chars.slice(row * 5, row * 5 + 5));
}

function locateInMatrix(matrix, target) {
  for (let row = 0; row < 5; row += 1) {
    for (let col = 0; col < 5; col += 1) {
      if (matrix[row][col] === target) {
        return { row, col };
      }
    }
  }
  return null;
}

function createDigraphs(text) {
  const cleaned = cleanLetters(text, true);
  const pairs = [];
  let i = 0;

  while (i < cleaned.length) {
    const first = cleaned[i];
    let second = cleaned[i + 1];
    if (!second || first === second) {
      second = "X";
      i += 1;
    } else {
      i += 2;
    }
    pairs.push(first + second);
  }
  return pairs;
}

function splitIntoPairs(text) {
  const cleaned = cleanLetters(text, true);
  const pairs = [];
  for (let i = 0; i < cleaned.length; i += 2) {
    const pair = cleaned.slice(i, i + 2);
    if (pair.length === 2) {
      pairs.push(pair);
    }
  }
  return pairs;
}

function transformPlayfairPair(pair, matrix, decrypt = false) {
  const [a, b] = pair.split("");
  const posA = locateInMatrix(matrix, a);
  const posB = locateInMatrix(matrix, b);
  const direction = decrypt ? -1 : 1;

  if (posA.row === posB.row) {
    return {
      result: matrix[posA.row][mod(posA.col + direction, 5)] + matrix[posB.row][mod(posB.col + direction, 5)],
      rule: "Same row: move each letter one step horizontally."
    };
  }

  if (posA.col === posB.col) {
    return {
      result: matrix[mod(posA.row + direction, 5)][posA.col] + matrix[mod(posB.row + direction, 5)][posB.col],
      rule: "Same column: move each letter one step vertically."
    };
  }

  return {
    result: matrix[posA.row][posB.col] + matrix[posB.row][posA.col],
    rule: "Rectangle rule: keep rows, swap columns."
  };
}

function modInverse(a, m) {
  a = mod(a, m);
  for (let x = 1; x < m; x += 1) {
    if (mod(a * x, m) === 1) {
      return x;
    }
  }
  return null;
}

function gcd(a, b) {
  return b === 0 ? Math.abs(a) : gcd(b, a % b);
}

function powerMod(base, exponent, modulus) {
  let result = 1n;
  let b = BigInt(base) % BigInt(modulus);
  let e = BigInt(exponent);
  const m = BigInt(modulus);
  while (e > 0n) {
    if (e % 2n === 1n) {
      result = (result * b) % m;
    }
    b = (b * b) % m;
    e /= 2n;
  }
  return Number(result);
}

function isPrime(num) {
  if (num < 2) {
    return false;
  }
  for (let i = 2; i <= Math.sqrt(num); i += 1) {
    if (num % i === 0) {
      return false;
    }
  }
  return true;
}

function chooseE(phi) {
  const commonValues = [65537, 17, 5, 3];
  for (const candidate of commonValues) {
    if (candidate < phi && gcd(candidate, phi) === 1) {
      return candidate;
    }
  }
  for (let e = 3; e < phi; e += 2) {
    if (gcd(e, phi) === 1) {
      return e;
    }
  }
  return null;
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

function desRoundKeyBits(keyBits, round) {
  return rotateLeft(keyBits, round).slice(0, 48);
}

function simpleDesFeistel(bits32, roundKey48) {
  const expansionMap = Array.from({ length: 48 }, (_, index) => bits32[(index * 5 + 3) % 32]);
  const expanded = expansionMap.join("");
  const xored = xorBits(expanded, roundKey48);
  const chunks = xored.match(/.{1,6}/g) || [];
  const sboxed = chunks
    .map((chunk, index) => {
      const row = parseInt(`${chunk[0]}${chunk[5]}`, 2);
      const col = parseInt(chunk.slice(1, 5), 2);
      return mod(row * 3 + col + index, 16).toString(2).padStart(4, "0");
    })
    .join("");
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
  const sequence = decrypt ? Array.from({ length: 16 }, (_, i) => 16 - i) : Array.from({ length: 16 }, (_, i) => i + 1);

  sequence.forEach((roundNumber) => {
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
  return { plaintextBits, keyBits, ip, rounds, finalBits, outputText: bitsToText(finalBits) };
}

function fillExamples() {
  document.getElementById("caesar-example")?.addEventListener("click", () => {
    document.getElementById("caesar-text").value = "ATTACK AT DAWN";
    document.getElementById("caesar-shift").value = 3;
  });
  document.getElementById("playfair-example")?.addEventListener("click", () => {
    document.getElementById("playfair-key").value = "MONARCHY";
    document.getElementById("playfair-text").value = "INSTRUMENTS";
  });
  document.getElementById("hill-example")?.addEventListener("click", () => {
    document.getElementById("hill-text").value = "HELP";
    document.getElementById("hill-a").value = 3;
    document.getElementById("hill-b").value = 3;
    document.getElementById("hill-c").value = 2;
    document.getElementById("hill-d").value = 5;
  });
  document.getElementById("aes-example")?.addEventListener("click", () => {
    document.getElementById("aes-message").value = "SECUREMESSAGE12";
    document.getElementById("aes-key").value = "CLASSROOMKEY890";
  });
  document.getElementById("des-example")?.addEventListener("click", () => {
    document.getElementById("des-text").value = "SECURITY";
    document.getElementById("des-key").value = "LABKEY12";
  });
  document.getElementById("rsa-example")?.addEventListener("click", () => {
    document.getElementById("rsa-p").value = 11;
    document.getElementById("rsa-q").value = 13;
    document.getElementById("rsa-message").value = 9;
  });
  document.getElementById("dh-example")?.addEventListener("click", () => {
    document.getElementById("dh-prime").value = 23;
    document.getElementById("dh-base").value = 5;
    document.getElementById("dh-alice").value = 6;
    document.getElementById("dh-bob").value = 15;
  });
  document.getElementById("sha-example")?.addEventListener("click", () => {
    document.getElementById("sha-text").value = "cryptography";
  });
}

function setupCaesar() {
  const run = (decrypt = false) => {
    const text = document.getElementById("caesar-text").value;
    const shift = Number(document.getElementById("caesar-shift").value || 0);
    const { result, steps } = caesarCipher(text, shift, decrypt);
    setText("caesar-output", result || "Enter text to transform.");
    setHTML("caesar-steps", steps.join("") || createStepCard("No input yet", "Type some plaintext and choose a shift to watch the letter mapping."));
  };
  document.getElementById("caesar-encrypt")?.addEventListener("click", () => run(false));
  document.getElementById("caesar-decrypt")?.addEventListener("click", () => run(true));
}

function setupPlayfair() {
  const run = (decrypt = false) => {
    const key = document.getElementById("playfair-key").value;
    const text = document.getElementById("playfair-text").value;
    const matrix = createPlayfairMatrix(key);
    const pairs = decrypt ? splitIntoPairs(text) : createDigraphs(text);
    const steps = [];
    let result = "";

    setHTML("playfair-matrix", matrix.flat().map((char) => `<div class="matrix-cell">${char}</div>`).join(""));
    steps.push(createStepCard("Digraph creation", pairs.join(" | ") || "No digraphs yet"));

    for (const pair of pairs) {
      const transformed = transformPlayfairPair(pair, matrix, decrypt);
      result += transformed.result;
      steps.push(createStepCard(`${pair} → ${transformed.result}`, transformed.rule));
    }

    setText("playfair-output", result || "Enter a keyword and plaintext.");
    setHTML("playfair-steps", steps.join("") || createStepCard("Waiting for input", "Use the example button to see the matrix and pair rules immediately."));
  };
  document.getElementById("playfair-encrypt")?.addEventListener("click", () => run(false));
  document.getElementById("playfair-decrypt")?.addEventListener("click", () => run(true));
}

function setupHill() {
  document.getElementById("hill-encrypt")?.addEventListener("click", () => {
    const text = cleanLetters(document.getElementById("hill-text").value);
    const matrix = [
      [Number(document.getElementById("hill-a").value), Number(document.getElementById("hill-b").value)],
      [Number(document.getElementById("hill-c").value), Number(document.getElementById("hill-d").value)]
    ];
    const determinant = mod(matrix[0][0] * matrix[1][1] - matrix[0][1] * matrix[1][0], 26);

    if (gcd(determinant, 26) !== 1) {
      setText("hill-output", "This key matrix is not invertible mod 26, so choose another matrix.");
      setHTML("hill-steps", createStepCard("Invalid key matrix", `det = ${determinant}, and gcd(${determinant}, 26) must be 1.`));
      return;
    }

    const padded = text.length % 2 === 0 ? text : `${text}X`;
    let result = "";
    const steps = [];

    setHTML("hill-visual", `<strong>Key Matrix</strong><div class="matrix-mini"><span>${matrix[0][0]}</span><span>${matrix[0][1]}</span><span>${matrix[1][0]}</span><span>${matrix[1][1]}</span></div><div>det(K) mod 26 = ${determinant}</div>`);

    for (let i = 0; i < padded.length; i += 2) {
      const pair = padded.slice(i, i + 2);
      const vector = [alphabet.indexOf(pair[0]), alphabet.indexOf(pair[1])];
      const multiplied = [
        mod(matrix[0][0] * vector[0] + matrix[0][1] * vector[1], 26),
        mod(matrix[1][0] * vector[0] + matrix[1][1] * vector[1], 26)
      ];
      result += alphabet[multiplied[0]] + alphabet[multiplied[1]];
      steps.push(createStepCard(`${pair} → ${alphabet[multiplied[0]]}${alphabet[multiplied[1]]}`, `<div class="vector-row"><div class="vector-chip">[${vector[0]}, ${vector[1]}]</div><div class="vector-chip">K × P</div><div class="vector-chip">[${multiplied[0]}, ${multiplied[1]}]</div></div>(${matrix[0][0]}×${vector[0]} + ${matrix[0][1]}×${vector[1]}) mod 26 = ${multiplied[0]}<br>(${matrix[1][0]}×${vector[0]} + ${matrix[1][1]}×${vector[1]}) mod 26 = ${multiplied[1]}`));
    }

    setText("hill-output", result || "Enter plaintext to encrypt.");
    setHTML("hill-steps", steps.join("") || createStepCard("Waiting for input", "Use a 2×2 key matrix and short plaintext pairs."));
  });
}

function setupAES() {
  document.getElementById("aes-run")?.addEventListener("click", () => {
    const message = document.getElementById("aes-message").value;
    const key = document.getElementById("aes-key").value;
    const { bytes, subBytes, shiftRows, mixColumns, addRoundKey } = simplifiedAES(message, key);
    const stages = [
      { title: "Initial State", explanation: "The message is arranged into a 4×4 byte state.", values: byteArrayToHex(bytes).split(" ") },
      { title: "SubBytes", explanation: "Each byte is substituted to obscure direct patterns.", values: byteArrayToHex(subBytes).split(" ") },
      { title: "ShiftRows", explanation: "Rows are shifted to spread the influence of each byte.", values: byteArrayToHex(shiftRows).split(" ") },
      { title: "MixColumns", explanation: "Columns are blended so every output byte depends on multiple inputs.", values: byteArrayToHex(mixColumns).split(" ") },
      { title: "AddRoundKey", explanation: "The state is combined with the secret key using XOR.", values: byteArrayToHex(addRoundKey).split(" ") }
    ];
    setHTML("aes-stages", stages.map((stage) => `<div class="aes-stage"><h4>${stage.title}</h4><p>${stage.explanation}</p>${byteGrid(stage.values)}</div>`).join(""));
    setText("aes-output", byteArrayToHex(addRoundKey));
  });
}

function setupDES() {
  const run = (decrypt = false) => {
    const text = document.getElementById("des-text").value;
    const key = document.getElementById("des-key").value;
    const simulation = simplifiedDES(text, key, decrypt);
    const roundOne = simulation.rounds[0];
    setText("des-output", simulation.finalBits.match(/.{1,8}/g).join(" "));
    setHTML("des-steps", [
      createStepCard("Initial permutation", `Input bits are rearranged into a new order before rounds begin.`),
      createStepCard("Split into halves", `L0 = ${simulation.ip.slice(0, 16)}... and R0 = ${simulation.ip.slice(32, 48)}...`),
      createStepCard(`Round ${roundOne.roundNumber} expansion`, `R expands from 32 bits to 48 bits: ${roundOne.expanded.slice(0, 24)}...`),
      createStepCard("XOR with round key", `Expanded R is XORed with the round key to mix secret information.`),
      createStepCard("S-box substitution", `The 48-bit result is compressed to 32 bits using 6-bit to 4-bit substitutions.`),
      createStepCard("Feistel swap", `New L becomes old R, and new R becomes old L XOR f(R, K).`)
    ].join(""));
  };

  document.getElementById("des-encrypt")?.addEventListener("click", () => run(false));
  document.getElementById("des-decrypt")?.addEventListener("click", () => run(true));
}

function setupRSA() {
  document.getElementById("rsa-run")?.addEventListener("click", () => {
    const p = Number(document.getElementById("rsa-p").value);
    const q = Number(document.getElementById("rsa-q").value);
    const message = Number(document.getElementById("rsa-message").value);
    if (!isPrime(p) || !isPrime(q)) {
      setText("rsa-output", "Both p and q must be prime numbers.");
      setHTML("rsa-steps", createStepCard("Prime check failed", "Choose prime values such as 11, 13, 17, or 19."));
      return;
    }
    const n = p * q;
    const phi = (p - 1) * (q - 1);
    const e = chooseE(phi);
    const d = modInverse(e, phi);
    if (message >= n) {
      setText("rsa-output", `The message must be smaller than n = ${n}.`);
      setHTML("rsa-steps", createStepCard("Message too large", "RSA encrypts numbers modulo n, so the message must be in the valid range."));
      return;
    }
    const encrypted = powerMod(message, e, n);
    const decrypted = powerMod(encrypted, d, n);
    setText("rsa-output", `Public key: (${e}, ${n}) | Private key: (${d}, ${n}) | Ciphertext: ${encrypted} | Decrypted: ${decrypted}`);
    setHTML("rsa-steps", [
      createStepCard("1. Calculate n", `n = p × q = ${p} × ${q} = ${n}`),
      createStepCard("2. Calculate φ(n)", `φ(n) = (${p} - 1) × (${q} - 1) = ${phi}`),
      createStepCard("3. Choose e", `Choose e = ${e}, where gcd(e, φ(n)) = 1.`),
      createStepCard("4. Calculate d", `Find d so that (d × e) mod φ(n) = 1. Here, d = ${d}.`),
      createStepCard("5. Encrypt", `c = m^e mod n = ${message}^${e} mod ${n} = ${encrypted}`),
      createStepCard("6. Decrypt", `m = c^d mod n = ${encrypted}^${d} mod ${n} = ${decrypted}`)
    ].join(""));
  });
}

function setupDiffieHellman() {
  document.getElementById("dh-run")?.addEventListener("click", () => {
    const p = Number(document.getElementById("dh-prime").value);
    const g = Number(document.getElementById("dh-base").value);
    const a = Number(document.getElementById("dh-alice").value);
    const b = Number(document.getElementById("dh-bob").value);
    const alicePublic = powerMod(g, a, p);
    const bobPublic = powerMod(g, b, p);
    const aliceSecret = powerMod(bobPublic, a, p);
    const bobSecret = powerMod(alicePublic, b, p);
    setHTML("dh-diagram", `<div class="dh-card"><strong>Alice</strong><p>Secret a = ${a}</p><p>Public A = ${g}<sup>${a}</sup> mod ${p} = ${alicePublic}</p><p>Shared = ${bobPublic}<sup>${a}</sup> mod ${p} = ${aliceSecret}</p></div><div class="dh-arrow">↔</div><div class="dh-card"><strong>Bob</strong><p>Secret b = ${b}</p><p>Public B = ${g}<sup>${b}</sup> mod ${p} = ${bobPublic}</p><p>Shared = ${alicePublic}<sup>${b}</sup> mod ${p} = ${bobSecret}</p></div>`);
    setText("dh-output", `${aliceSecret}`);
    setHTML("dh-steps", [
      createStepCard("Public values", `Everyone knows p = ${p} and g = ${g}.`),
      createStepCard("Alice computes A", `A = g^a mod p = ${g}^${a} mod ${p} = ${alicePublic}`),
      createStepCard("Bob computes B", `B = g^b mod p = ${g}^${b} mod ${p} = ${bobPublic}`),
      createStepCard("Exchange", "Alice sends A to Bob, and Bob sends B to Alice over the public channel."),
      createStepCard("Shared secret", `Alice gets ${aliceSecret}; Bob gets ${bobSecret}. They match, so the shared secret is ${aliceSecret}.`)
    ].join(""));
  });
}

async function sha256(text) {
  const data = new TextEncoder().encode(text);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(hashBuffer)).map((byte) => byte.toString(16).padStart(2, "0")).join("");
}

function setupSHA() {
  document.getElementById("sha-run")?.addEventListener("click", async () => {
    const text = document.getElementById("sha-text").value;
    const originalHash = await sha256(text);
    const modifiedText = text.length === 0 ? "a" : `${text.slice(0, -1)}${text.slice(-1) === "a" ? "b" : "a"}`;
    const modifiedHash = await sha256(modifiedText);
    setText("sha-output", originalHash);
    setHTML("sha-avalanche", `<div class="step-card"><strong>Original text</strong><div>${text || "(empty string)"}</div><div class="hash-box">${originalHash}</div></div><div class="step-card"><strong>Changed text by one character</strong><div>${modifiedText}</div><div class="hash-box">${modifiedHash}</div></div><div class="step-card"><strong>Avalanche effect</strong><div>A one-character change creates a completely different digest, which is what makes secure hash functions useful for integrity checking.</div></div>`);
  });
}

function setupNavigationHighlight() {
  const links = Array.from(document.querySelectorAll(".nav-link"));
  const sections = Array.from(document.querySelectorAll(".panel"));
  if (!links.length || !sections.length) {
    return;
  }
  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        links.forEach((link) => {
          link.classList.toggle("active", link.getAttribute("href") === `#${entry.target.id}`);
        });
      }
    });
  }, { threshold: 0.35 });
  sections.forEach((section) => observer.observe(section));
}

function init() {
  fillExamples();
  setupCaesar();
  setupPlayfair();
  setupHill();
  setupAES();
  setupDES();
  setupRSA();
  setupDiffieHellman();
  setupSHA();
  setupNavigationHighlight();
}

init();
