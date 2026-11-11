// Lecture script: numbers sections and theorem-like environments, builds the
// table of contents, fills cross-references, and renders the math.
// Environments: <div class="env def|thm|lemma|cor|prop|claim|ex|rem|prin" id="..." data-title="...">
// Proofs:       <div class="proof" data-title="optional">
// Cross-refs:   <a class="xref" href="#id"></a>  (empty text is replaced by e.g. "Definition 7")
(function () {
  const names = {
    def: "Definition", thm: "Theorem", lemma: "Lemma", cor: "Corollary",
    prop: "Proposition", claim: "Claim", ex: "Example", rem: "Remark", prin: "Principle",
  };
  const labels = {};

  // Sections: h2 inside section.chapter, h3 inside section.sub
  const toc = document.getElementById("toc-list");
  let c = 0;
  document.querySelectorAll("section.chapter").forEach((ch) => {
    c += 1;
    const h2 = ch.querySelector(":scope > h2");
    const chTitle = h2.textContent;
    labels[ch.id] = "Section " + c;
    h2.insertAdjacentHTML("afterbegin", `<span class="secnum">${c}</span>`);
    h2.insertAdjacentHTML("beforeend", `<a class="anchor" href="#${ch.id}">¶</a>`);
    toc.insertAdjacentHTML("beforeend",
      `<li class="l2"><a href="#${ch.id}"><span class="n">${c}</span><span class="t">${chTitle}</span><span class="dots"></span></a></li>`);
    let s = 0;
    ch.querySelectorAll(":scope > section.sub").forEach((sub) => {
      s += 1;
      const h3 = sub.querySelector(":scope > h3");
      const num = `${c}.${s}`;
      labels[sub.id] = "Section " + num;
      const title = h3.textContent;
      h3.insertAdjacentHTML("afterbegin", `<span class="secnum">${num}</span>`);
      h3.insertAdjacentHTML("beforeend", `<a class="anchor" href="#${sub.id}">¶</a>`);
      toc.insertAdjacentHTML("beforeend",
        `<li class="l3"><a href="#${sub.id}"><span class="n">${num}</span><span class="t">${title}</span><span class="dots"></span></a></li>`);
    });
  });

  // Environments: one counter per kind, numbered through the whole script.
  const counters = {};
  document.querySelectorAll(".env").forEach((el) => {
    const kind = Object.keys(names).find((k) => el.classList.contains(k));
    counters[kind] = (counters[kind] || 0) + 1;
    const label = `${names[kind]} ${counters[kind]}`;
    if (el.id) labels[el.id] = label;
    const title = el.dataset.title ? ` (${el.dataset.title})` : "";
    const anchor = el.id ? `<a class="anchor" href="#${el.id}">¶</a>` : "";
    el.insertAdjacentHTML("afterbegin", `<span class="envhead">${label}${title}.${anchor}</span> `);
  });

  document.querySelectorAll(".proof").forEach((el) => {
    const title = el.dataset.title ? ` (${el.dataset.title})` : "";
    el.insertAdjacentHTML("afterbegin", `<span class="proofhead">Proof${title}.</span> `);
    el.insertAdjacentHTML("beforeend", `<span class="qed">$\\square$</span>`);
  });

  document.querySelectorAll("a.xref").forEach((a) => {
    const id = a.getAttribute("href").slice(1);
    if (!a.textContent.trim()) a.textContent = labels[id] || "?";
  });

  renderMathInElement(document.body, {
    delimiters: [
      { left: "$$", right: "$$", display: true },
      { left: "$", right: "$", display: false },
    ],
    throwOnError: false,
  });

  // Re-scroll after numbering/math changed the layout.
  if (location.hash) {
    const t = document.getElementById(location.hash.slice(1));
    if (t) t.scrollIntoView();
  }
})();
