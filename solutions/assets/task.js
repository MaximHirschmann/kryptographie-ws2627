// Shared logic for every task page: header, breadcrumbs, prev/next links, math rendering.
// The page only has to set <body data-task="N">.
(function () {
  const n = Number(document.body.dataset.task);
  const task = window.TASKS.find((t) => t.n === n);
  const topic = window.topicOf(n);

  document.title = `Question ${n}: ${task.title}`;
  document.getElementById("crumbs").innerHTML =
    `<a href="../index.html">All solutions</a> › ${topic.title}`;
  document.getElementById("title").textContent = `Question ${n}: ${task.title}`;
  const scriptLink = document.createElement("a");
  scriptLink.href = "../script.html";
  scriptLink.textContent = "Extended lecture script";
  document.getElementById("crumbs").append(" · ", scriptLink);

  // "Idea" box with the core idea, placed directly above the solution.
  const idea = window.IDEAS && window.IDEAS[n];
  const solution = document.querySelector(".solution");
  if (idea && solution) {
    const box = document.createElement("div");
    box.className = "box idea";
    box.innerHTML = `<span class="label">Idea.</span> ${idea}`;
    solution.before(box);
  }

  // "In the script" box: links to the definitions, theorems and sections the solution uses.
  const refs = (window.SCRIPT_REFS && window.SCRIPT_REFS[n]) || [];
  if (refs.length && solution) {
    const links = refs
      .map((id) => `<a href="../script.html#${id}">${(window.SCRIPT_LABELS || {})[id] || id}</a>`)
      .join(" · ");
    const box = document.createElement("div");
    box.className = "box scriptref";
    box.innerHTML = `<span class="label">In the script:</span> ${links}`;
    solution.before(box);
  }

  // Prev/next only link to solved tasks.
  const solved = window.TASKS.filter((t) => t.solved);
  const prev = [...solved].reverse().find((t) => t.n < n);
  const next = solved.find((t) => t.n > n);
  const link = (t, dir) =>
    t ? `<a href="${window.taskFile(t.n)}">${dir === "prev" ? "← " : ""}Question ${t.n}: ${t.title}${dir === "next" ? " →" : ""}</a>` : "<span></span>";
  document.getElementById("pager").innerHTML = link(prev, "prev") + link(next, "next");

  renderMathInElement(document.body, {
    delimiters: [
      { left: "$$", right: "$$", display: true },
      { left: "$", right: "$", display: false },
    ],
    throwOnError: false,
  });
})();
