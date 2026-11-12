// Diagram helper: renders SVG figures from JSON specs.
// Usage in a page:
//   <figure class="diagram"><script type="application/json">{ ...spec... }</script>
//     <figcaption>Caption ($math$ allowed)</figcaption></figure>
// Load this file before task.js. Text labels support x_{sub}, x^{sup} and plain Unicode.
//
// Spec types:
//   grid: { "type": "grid", "cell": [w, h], "nodes": { id: { "c", "r", "kind", "label", "w", "hl" } },
//           "edges": [ [from, to, { "route": "hv"|"vh"|"straight", "label", "dashed", "hl", "lpos" }] ] }
//         kinds: "box" (rectangle), "xor" (⊕ circle), "in"/"out"/"text" (plain label), "dot" (junction)
//   flow: { "type": "flow", "parties": [names], "steps": [ {"from","to","label","hl"} | {"at","text","hl"} ] }
(function () {
  const NS = "http://www.w3.org/2000/svg";
  const COLORS = { line: "#4b5563", box: "#e8effc", boxLine: "#3b6fd8", hl: "#d9822b", hlFill: "#fdf0e1", text: "#1f2328", muted: "#5f6670" };

  function el(tag, attrs, parent) {
    const e = document.createElementNS(NS, tag);
    for (const [k, v] of Object.entries(attrs || {})) e.setAttribute(k, v);
    if (parent) parent.appendChild(e);
    return e;
  }

  // Text with _{...} / ^{...} (or _x / ^x for one character) rendered as tspans.
  function text(parent, x, y, s, opts = {}) {
    const t = el("text", {
      x, y, "text-anchor": opts.anchor || "middle", "dominant-baseline": "central",
      "font-size": opts.size || 14, fill: opts.color || COLORS.text,
      "font-family": "system-ui, -apple-system, Segoe UI, sans-serif",
      "font-style": opts.italic ? "italic" : "normal", "font-weight": opts.bold ? 600 : 400,
    }, parent);
    const re = /([_^])(\{([^}]*)\}|(.))/g;
    let last = 0, m, shift = 0;
    const plain = (str) => { if (str) { const sp = el("tspan", shift ? { dy: -shift } : {}, t); sp.textContent = str; shift = 0; } };
    while ((m = re.exec(s))) {
      plain(s.slice(last, m.index));
      const d = m[1] === "_" ? 4 : -6;
      const sp = el("tspan", { dy: d, "font-size": (opts.size || 14) * 0.72 }, t);
      sp.textContent = m[3] !== undefined ? m[3] : m[4];
      shift = d;
      last = re.lastIndex;
    }
    const rest = s.slice(last);
    if (rest) { const sp = el("tspan", shift ? { dy: -shift } : {}, t); sp.textContent = rest; }
    else if (shift) { const sp = el("tspan", { dy: -shift }, t); sp.textContent = "​"; }
    return t;
  }

  function defs(svg) {
    const d = el("defs", {}, svg);
    for (const [id, c] of [["arr", COLORS.line], ["arrhl", COLORS.hl]]) {
      const m = el("marker", { id: id + svg.dataset.uid, viewBox: "0 0 10 10", refX: 9, refY: 5, markerWidth: 7, markerHeight: 7, orient: "auto-start-reverse" }, d);
      el("path", { d: "M0,0 L10,5 L0,10 z", fill: c }, m);
    }
  }

  let uid = 0;
  function newSvg(w, h) {
    const svg = el("svg", { viewBox: `0 0 ${w} ${h}`, width: w, role: "img" });
    svg.style.maxWidth = "100%";
    svg.style.height = "auto";
    svg.dataset.uid = String(++uid);
    defs(svg);
    return svg;
  }

  // ---------------- grid diagrams ----------------
  function renderGrid(spec) {
    const [cw, ch] = spec.cell || [90, 60];
    const pad = spec.pad || 30;
    const nodes = spec.nodes;
    let maxC = 0, maxR = 0;
    for (const n of Object.values(nodes)) { maxC = Math.max(maxC, n.c); maxR = Math.max(maxR, n.r); }
    const W = (maxC + 1) * cw + 2 * pad - cw * 0.0, H = (maxR + 1) * ch + 2 * pad;
    const svg = newSvg(W, H);
    const pos = (n) => [pad + n.c * cw + cw / 2, pad + n.r * ch + ch / 2];
    const half = (n) => {
      if (n.kind === "box") return [(n.w || 56) / 2, (n.h || 34) / 2];
      if (n.kind === "xor") return [11, 11];
      if (n.kind === "dot") return [0, 0];
      return [(n.w || 14) / 2, 10];
    };
    // point on the border of node n when leaving/entering along direction (dx, dy)
    const border = (n, dx, dy) => {
      const [x, y] = pos(n), [hw, hh] = half(n);
      if (n.kind === "xor") { const L = Math.hypot(dx, dy) || 1; return [x + dx / L * 11, y + dy / L * 11]; }
      if (dx === 0 && dy === 0) return [x, y];
      const tx = dx ? hw / Math.abs(dx) : Infinity, ty = dy ? hh / Math.abs(dy) : Infinity;
      const t = Math.min(tx, ty);
      return [x + dx * t, y + dy * t];
    };
    const gEdges = el("g", {}, svg), gNodes = el("g", {}, svg), gLabels = el("g", {}, svg);
    for (const [a, b, o = {}] of spec.edges || []) {
      const A = nodes[a], B = nodes[b];
      const [ax, ay] = pos(A), [bx, by] = pos(B);
      let pts;
      const route = o.route || (ax === bx || ay === by ? "straight" : "hv");
      if (route === "straight") pts = [border(A, bx - ax, by - ay), border(B, ax - bx, ay - by)];
      else if (route === "hv") pts = [border(A, Math.sign(bx - ax), 0), [bx, ay], border(B, 0, Math.sign(ay - by))];
      else pts = [border(A, 0, Math.sign(by - ay)), [ax, by], border(B, Math.sign(ax - bx), 0)];
      const color = o.hl ? COLORS.hl : COLORS.line;
      el("polyline", {
        points: pts.map((p) => p.join(",")).join(" "), fill: "none", stroke: color, "stroke-width": o.hl ? 2.2 : 1.5,
        "stroke-dasharray": o.dashed ? "5,4" : "none", "marker-end": B.kind === "dot" ? "none" : `url(#${o.hl ? "arrhl" : "arr"}${svg.dataset.uid})`,
      }, gEdges);
      if (o.label) {
        const [p, q] = o.lpos === "end" ? [pts[pts.length - 2], pts[pts.length - 1]] : [pts[0], pts[1]];
        const mx = (p[0] + q[0]) / 2, my = (p[1] + q[1]) / 2;
        const vertical = Math.abs(p[0] - q[0]) < 1;
        text(gLabels, mx + (vertical ? 6 : 0), my - (vertical ? 0 : 10), o.label, { size: 12, color: o.hl ? COLORS.hl : COLORS.muted, anchor: vertical ? "start" : "middle" });
      }
    }
    for (const n of Object.values(nodes)) {
      const [x, y] = pos(n), [hw, hh] = half(n);
      const stroke = n.hl ? COLORS.hl : COLORS.boxLine;
      if (n.kind === "box") {
        el("rect", { x: x - hw, y: y - hh, width: 2 * hw, height: 2 * hh, rx: 6, fill: n.hl ? COLORS.hlFill : COLORS.box, stroke, "stroke-width": 1.5 }, gNodes);
        text(gNodes, x, y, n.label || "", { size: 14, bold: true });
      } else if (n.kind === "xor") {
        el("circle", { cx: x, cy: y, r: 11, fill: "#fff", stroke: n.hl ? COLORS.hl : COLORS.line, "stroke-width": 1.5 }, gNodes);
        el("path", { d: `M${x - 7},${y} H${x + 7} M${x},${y - 7} V${y + 7}`, stroke: n.hl ? COLORS.hl : COLORS.line, "stroke-width": 1.5 }, gNodes);
        if (n.label) text(gNodes, x + 16, y - 12, n.label, { size: 12, color: COLORS.muted, anchor: "start" });
      } else if (n.kind === "dot") {
        el("circle", { cx: x, cy: y, r: 2.5, fill: COLORS.line }, gNodes);
      } else {
        text(gNodes, x, y, n.label || "", { size: 15, italic: n.kind !== "text", color: n.hl ? COLORS.hl : COLORS.text, bold: !!n.hl });
      }
    }
    return svg;
  }

  // ---------------- message-flow diagrams ----------------
  function renderFlow(spec) {
    const parties = spec.parties;
    const gap = spec.gap || 300, top = 40, row = spec.row || 34, padX = spec.padX || 110;
    const W = padX * 2 + gap * (parties.length - 1);
    const rows = spec.steps.length;
    const H = top + 30 + rows * row + 20;
    const svg = newSvg(W, H);
    const X = (i) => padX + i * gap;
    parties.forEach((p, i) => {
      text(svg, X(i), 18, p, { size: 15, bold: true });
      el("line", { x1: X(i), y1: top, x2: X(i), y2: H - 10, stroke: "#c4c8cf", "stroke-width": 1.5, "stroke-dasharray": "3,4" }, svg);
    });
    spec.steps.forEach((s, k) => {
      const y = top + 26 + k * row;
      if (s.text !== undefined) {
        const anchor = s.at === 0 ? "end" : s.at === parties.length - 1 ? "start" : "middle";
        const x = X(s.at) + (anchor === "end" ? -10 : anchor === "start" ? 10 : 0);
        text(svg, x, y, s.text, { size: 13, color: s.hl ? COLORS.hl : COLORS.text, anchor, bold: !!s.hl });
        el("circle", { cx: X(s.at), cy: y, r: 3, fill: s.hl ? COLORS.hl : COLORS.boxLine }, svg);
      } else {
        const color = s.hl ? COLORS.hl : COLORS.line;
        const dir = Math.sign(X(s.to) - X(s.from));
        el("line", { x1: X(s.from) + dir * 4, y1: y + 6, x2: X(s.to) - dir * 4, y2: y + 6, stroke: color, "stroke-width": s.hl ? 2.2 : 1.5, "marker-end": `url(#${s.hl ? "arrhl" : "arr"}${svg.dataset.uid})` }, svg);
        text(svg, (X(s.from) + X(s.to)) / 2, y - 6, s.label, { size: 13, color: s.hl ? COLORS.hl : COLORS.text, bold: !!s.hl });
      }
    });
    return svg;
  }

  document.querySelectorAll("figure.diagram").forEach((fig) => {
    const src = fig.querySelector('script[type="application/json"]');
    if (!src) return;
    try {
      const spec = JSON.parse(src.textContent);
      const svg = spec.type === "flow" ? renderFlow(spec) : renderGrid(spec);
      const caption = fig.querySelector("figcaption");
      if (caption) {
        if (!caption.id) caption.id = `diagram-caption-${svg.dataset.uid}`;
        svg.setAttribute("aria-labelledby", caption.id);
      } else {
        svg.setAttribute("aria-label", spec.label || "Cryptographic construction diagram");
      }
      fig.insertBefore(svg, fig.querySelector("figcaption"));
    } catch (e) {
      fig.insertAdjacentHTML("afterbegin", `<p class="note">Figure could not be rendered: ${e.message}</p>`);
    }
  });
})();
