// Small teaching examples; no network requests or cryptographic dependencies.
(function () {
  "use strict";
  const bits = (n) => n.toString(2).padStart(4, "0");
  const text = (root, selector, value) => { root.querySelector(selector).textContent = value; };

  document.querySelectorAll("[data-xor-demo]").forEach((root) => {
    const attack = root.dataset.xorDemo === "attack";
    let message = 9, pad = 6, delta = 0;
    function update() {
      const cipher = message ^ pad;
      root.querySelectorAll("[data-bit-row]").forEach((row) => {
        const kind = row.dataset.bitRow;
        const value = { message, pad, cipher, delta, altered: cipher ^ delta, recovered: message ^ delta }[kind];
        Array.from(row.children).forEach((cell, i) => {
          const bit = (value >> (3 - i)) & 1;
          cell.textContent = bit;
          if (cell.tagName === "BUTTON") cell.setAttribute("aria-pressed", String(Boolean(bit)));
          cell.classList.toggle("v-bit--changed", Boolean(delta & (1 << (3 - i))) && (kind === "altered" || kind === "recovered"));
        });
      });
      text(root, "[data-xor-result]", attack
        ? "Original m = " + bits(message) + "; decrypted m′ = " + bits(message ^ delta) + "."
        : bits(message) + " ⊕ " + bits(pad) + " = " + bits(cipher));
    }
    root.querySelectorAll("[data-bit-row] button").forEach((button, i) => {
      const row = button.parentElement.dataset.bitRow;
      const index = Array.from(button.parentElement.children).indexOf(button);
      button.addEventListener("click", () => {
        const mask = 1 << (3 - index);
        if (row === "message") message ^= mask;
        else if (row === "pad") pad ^= mask;
        else delta ^= mask;
        update();
      });
    });
    update();
  });

  document.querySelectorAll("[data-mode-demo]").forEach((root) => {
    const select = root.querySelector("select");
    function update() {
      root.querySelectorAll("[data-mode-panel]").forEach((panel) => {
        panel.hidden = panel.dataset.modePanel !== select.value;
      });
    }
    select.addEventListener("change", update);
    update();
  });

  function birthdayProbability(q, space) {
    if (q > space) return 1;
    let logNoCollision = 0;
    for (let i = 1; i < q; i++) logNoCollision += Math.log1p(-i / space);
    return -Math.expm1(logNoCollision);
  }
  document.querySelectorAll("[data-birthday-demo]").forEach((root) => {
    const bitsInput = root.querySelector("[data-hash-bits]");
    const queries = root.querySelector("[data-hash-queries]");
    function update() {
      const n = Number(bitsInput.value), space = 2 ** n, max = 2 * Math.sqrt(space);
      queries.max = max;
      queries.value = Math.min(Number(queries.value), max);
      const q = Number(queries.value);
      const points = [];
      for (let i = 0; i <= max; i++) {
        points.push((54 + i / max * 500).toFixed(2) + "," + (188 - 152 * birthdayProbability(i, space)).toFixed(2));
      }
      root.querySelector("[data-birthday-curve]").setAttribute("points", points.join(" "));
      const dot = root.querySelector("[data-birthday-dot]");
      dot.setAttribute("cx", 54 + q / max * 500);
      dot.setAttribute("cy", 188 - 152 * birthdayProbability(q, space));
      text(root, "[data-query-value]", q);
      text(root, "[data-query-mid]", max / 2);
      text(root, "[data-query-max]", max);
      text(root, "[data-birthday-result]", (100 * birthdayProbability(q, space)).toFixed(1) + "% collision probability · " + (q * (q - 1) / 2) + " pairs · " + space + " possible outputs");
      root.querySelector("svg desc").textContent = "Exact ideal collision probability for " + n + "-bit outputs. At " + q + " distinct queries it is " + (100 * birthdayProbability(q, space)).toFixed(1) + " percent.";
    }
    bitsInput.addEventListener("change", update);
    queries.addEventListener("input", update);
    update();
  });

  document.querySelectorAll("[data-crt-demo]").forEach((root) => {
    const a = root.querySelector("[data-crt-a]");
    const b = root.querySelector("[data-crt-b]");
    function update() {
      let result = 0;
      while (result % 3 !== Number(a.value) || result % 5 !== Number(b.value)) result++;
      root.querySelectorAll("td[data-crt-value]").forEach((cell) => {
        const selected = Number(cell.dataset.crtValue) === result;
        cell.classList.toggle("is-selected", selected);
        if (selected) cell.setAttribute("aria-current", "true");
        else cell.removeAttribute("aria-current");
      });
      text(root, "[data-crt-result]", "x ≡ " + result + " (mod 15): " + result + " mod 3 = " + a.value + ", " + result + " mod 5 = " + b.value + ".");
    }
    a.addEventListener("change", update); b.addEventListener("change", update);
    update();
  });

  function powMod(base, exponent, modulus) {
    let result = 1;
    while (exponent > 0) {
      if (exponent % 2) result = result * base % modulus;
      base = base * base % modulus;
      exponent = Math.floor(exponent / 2);
    }
    return result;
  }
  document.querySelectorAll("[data-dh-demo]").forEach((root) => {
    const xInput = root.querySelector("[data-dh-x]");
    const yInput = root.querySelector("[data-dh-y]");
    function update() {
      const x = xInput.valueAsNumber, y = yInput.valueAsNumber;
      if (![x, y].every((n) => Number.isInteger(n) && n >= 0 && n <= 10)) {
        text(root, "[data-dh-result]", "Choose whole exponents from 0 to 10.");
        return;
      }
      const A = powMod(2, x, 23), B = powMod(2, y, 23);
      const aliceKey = powMod(B, x, 23), bobKey = powMod(A, y, 23);
      text(root, "[data-dh-private-x]", "private x = " + x);
      text(root, "[data-dh-private-y]", "private y = " + y);
      text(root, "[data-dh-public-a]", "A = 2^" + x + " mod 23 = " + A);
      text(root, "[data-dh-public-b]", "B = 2^" + y + " mod 23 = " + B);
      text(root, "[data-dh-alice-key]", "B^x mod 23 = " + aliceKey);
      text(root, "[data-dh-bob-key]", "A^y mod 23 = " + bobKey);
      text(root, "[data-dh-result]", "Both derive " + aliceKey + "; the private exponents x and y are not sent.");
      root.querySelector("svg desc").textContent = "Alice sends A = " + A + ". Bob sends B = " + B + ". They separately derive the same group element " + aliceKey + ".";
    }
    xInput.addEventListener("input", update); yInput.addEventListener("input", update);
    update();
  });

  document.querySelectorAll("[data-secrecy-demo]").forEach((root) => {
    const priorInput = root.querySelector("[data-prior-input]");
    const padInput = root.querySelector("[data-pad-law]");
    const cipherInput = root.querySelector("[data-observed-c]");
    const percent = (p) => (100 * p).toFixed(1).replace(/\.0$/, "") + "%";
    function update() {
      const prior = Number(priorInput.value) / 100;
      const padOne = Number(padInput.value), c = Number(cipherInput.value);
      const likelihoodOne = c === 1 ? 1 - padOne : padOne;
      const likelihoodZero = c === 1 ? padOne : 1 - padOne;
      const evidence = prior * likelihoodOne + (1 - prior) * likelihoodZero;
      const posterior = prior * likelihoodOne / evidence;
      text(root, "[data-prior-label]", percent(prior));
      root.querySelector("[data-prior-bar]").setAttribute("width", 400 * prior);
      root.querySelector("[data-posterior-bar]").setAttribute("width", 400 * posterior);
      text(root, "[data-prior-text]", "P(M = 1) = " + percent(prior));
      text(root, "[data-posterior-text]", "P(M = 1 | c) = " + percent(posterior));
      text(root, "[data-posterior-note]", padOne === 0.5
        ? "A uniform pad leaves the prior unchanged, even when messages are biased."
        : "The biased pad changes the probabilities: this scheme is not perfectly secret.");
      const result = "P(C = " + c + ") = " + percent(evidence) + "; P(M = 1 | C = " + c + ") = " + percent(posterior) + ".";
      text(root, "[data-secrecy-result]", result);
      root.querySelector("svg desc").textContent = "Before observing the ciphertext, the message is 1 with probability " + percent(prior) + ". " + result;
    }
    priorInput.addEventListener("input", update);
    padInput.addEventListener("change", update);
    cipherInput.addEventListener("change", update);
    update();
  });

  document.querySelectorAll("[data-rsa-demo]").forEach((root) => {
    const messageInput = root.querySelector("[data-rsa-m]");
    const multiplierInput = root.querySelector("[data-rsa-s]");
    function update() {
      const m = Number(messageInput.value), s = Number(multiplierInput.value);
      const cipher = powMod(m, 3, 55);
      const altered = cipher * powMod(s, 3, 55) % 55;
      const recovered = powMod(altered, 27, 55);
      text(root, "[data-rsa-message]", m);
      text(root, "[data-rsa-cipher]", "c = " + cipher);
      text(root, "[data-rsa-original]", "m = " + powMod(cipher, 27, 55));
      text(root, "[data-rsa-altered]", "c′ = " + altered);
      text(root, "[data-rsa-recovered]", "m′ = m · s mod 55 = " + recovered);
      const result = "Decrypting c′ gives " + recovered + " = " + m + " × " + s + " mod 55.";
      text(root, "[data-rsa-result]", result);
      root.querySelector("svg desc").textContent = "Message " + m + " encrypts to " + cipher + ". Multiply the ciphertext by " + s + " cubed modulo 55 to obtain " + altered + ". " + result;
    }
    messageInput.addEventListener("change", update);
    multiplierInput.addEventListener("change", update);
    update();
  });

  document.querySelectorAll("[data-oracle-demo]").forEach((root) => {
    const form = root.querySelector("form"), input = root.querySelector("input"), body = root.querySelector("tbody");
    let answers = new Map();
    function sample() {
      const bytes = new Uint16Array(1);
      if (globalThis.crypto && globalThis.crypto.getRandomValues) globalThis.crypto.getRandomValues(bytes);
      else bytes[0] = Math.floor(Math.random() * 65536);
      return "0x" + bytes[0].toString(16).padStart(4, "0");
    }
    const initial = sample();
    answers.set("hello", initial);
    body.querySelector("td:nth-child(2)").textContent = initial;
    form.addEventListener("submit", (event) => {
      event.preventDefault();
      const value = input.value, known = answers.has(value);
      if (!known) answers.set(value, sample());
      const row = document.createElement("tr");
      [value || "(empty string)", answers.get(value), known ? "cached" : "new sample"].forEach((value) => {
        const cell = document.createElement("td"); cell.textContent = value; row.append(cell);
      });
      if (body.querySelector("[data-oracle-empty]")) body.replaceChildren();
      body.prepend(row);
      while (body.children.length > 6) body.lastElementChild.remove();
      text(root, "[data-oracle-result]", (known ? "Reused the stored answer: " : "Sampled and stored: ") + answers.get(value));
    });
    root.querySelector("[data-oracle-reset]").addEventListener("click", () => {
      answers = new Map();
      const row = document.createElement("tr"), cell = document.createElement("td");
      cell.colSpan = 3; cell.textContent = "No queries yet."; cell.dataset.oracleEmpty = "";
      row.append(cell); body.replaceChildren(row);
      text(root, "[data-oracle-result]", "A new oracle starts with an empty table.");
    });
  });
})();
