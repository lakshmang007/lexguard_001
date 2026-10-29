// Shared report rendering for the web page and the extension side panel.
const LexReport = (() => {
  const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const LEVEL_CLASS = { HIGH: "high", MEDIUM: "med", LOW: "low" };

  const ORDER = { HIGH: 0, MEDIUM: 1, LOW: 2 };
  // The first sentence of a reason is the plain-language version; the rest is legal detail.
  const plain = (reason) => reason.split(/(?<=\.)\s+/)[0];
  const plural = (n, word) => `${n} ${word}${n === 1 ? "" : "s"}`;

  // One entry per kind of risk, so a risk spread over two sentences is listed once.
  function groups(r) {
    const byRule = new Map();
    for (const f of [...r.flags].sort((a, b) => ORDER[a.level] - ORDER[b.level] || b.weight - a.weight)) {
      const g = byRule.get(f.rule);
      if (!g) byRule.set(f.rule, { ...f, labels: [f.label] });
      else if (!g.labels.includes(f.label)) g.labels.push(f.label);
    }
    return [...byRule.values()];
  }

  function verdict(r) {
    const gs = groups(r);
    const HIGH = gs.filter((g) => g.level === "HIGH").length;
    const MEDIUM = gs.filter((g) => g.level === "MEDIUM").length;
    const doc = r.doc_type.label.toLowerCase();
    if (HIGH) return `This ${doc} has ${plural(HIGH, "serious risk")}${MEDIUM ? ` and ${MEDIUM} more worth checking` : ""}. Don't sign until you've asked about them.`;
    if (MEDIUM) return `This ${doc} has ${plural(MEDIUM, "point")} worth checking before you sign.`;
    return `No serious risks found in this ${doc}. Still read it: LEXGUARD only knows the patterns in its rule library.`;
  }

  function summary(r) {
    const o = r.overall;
    const main = groups(r).filter((g) => g.level !== "LOW");
    const shown = main.slice(0, 5);
    const points = shown.map((g) =>
      `<li><span class="dot ${LEVEL_CLASS[g.level]}"></span><span><a href="#" data-goto="${g.id}">${esc(g.risk_name)}</a>: ${esc(plain(g.reason))} <span class="hint">(${esc(g.labels.join(", "))})</span></span></li>`).join("");
    const more = main.length > shown.length ? `<p class="hint">${main.length - shown.length} more below.</p>` : "";
    const qs = o.top_questions.map((q) => `<li>${esc(q.question)} <a href="#" data-goto="${q.clause_id}">(${esc(q.label)})</a></li>`).join("");
    return `
      <div class="summary">
        <div class="score ${LEVEL_CLASS[o.level]}" style="--p:${o.score}" data-score="${o.score}" role="img" aria-label="Risk score ${o.score} out of 100, ${o.level.toLowerCase()} risk"><span class="num">${o.score}</span><span class="of">/100</span><span class="lvl">${o.level} risk</span></div>
        <div class="meta">
          <div class="verdict">${esc(verdict(r))}</div>
          <div class="ai-note">${esc(r.doc_type.label)} · ${r.clause_count} clauses checked · ${r.elapsed_ms} ms · offline rules only</div>
        </div>
      </div>
      ${points ? `<div class="topq"><h3>In short</h3><ul class="points">${points}</ul>${more}</div>` : ""}
      ${qs ? `<div class="topq"><h3>Ask before signing</h3><ol>${qs}</ol></div>` : ""}`;
  }

  function card(f) {
    const also = f.also.length ? `<div class="also">Also matches: ${f.also.map((a) => esc(a.name)).join(", ")}</div>` : "";
    const india = f.jurisdiction === "IN" ? `<span class="tag">India rule</span>` : "";
    return `
      <article class="card ${LEVEL_CLASS[f.level]}" data-id="${f.id}" tabindex="0">
        <header><span class="badge ${LEVEL_CLASS[f.level]}">${f.level}</span><span class="cname">${esc(f.risk_name)}</span><span class="clabel">${esc(f.label)}</span>${india}</header>
        <p class="gist">${esc(plain(f.reason))}</p>
        <p class="ask"><b>Ask:</b> ${esc(f.question)}</p>
        <details>
          <summary>See details</summary>
          <dl>
            <dt>The sentence</dt><dd><blockquote>${esc(f.text)}</blockquote></dd>
            <dt>Why it matters</dt><dd>${esc(f.reason)}</dd>
            <dt>Protections checked</dt><dd class="${f.defended ? "defended" : ""}">${esc(f.defender)}</dd>
            <dt>Ask for this wording</dt><dd class="safer">${esc(f.safer_wording)}</dd>
          </dl>
          ${also}
        </details>
      </article>`;
  }

  function highlighted(r, minLevel) {
    const order = { LOW: 0, MEDIUM: 1, HIGH: 2 };
    const flags = r.flags.filter((f) => order[f.level] >= order[minLevel]).sort((a, b) => a.start - b.start);
    let html = "", pos = 0;
    for (const f of flags) {
      html += esc(r.text.slice(pos, f.start));
      html += `<mark class="${LEVEL_CLASS[f.level]}" data-id="${f.id}" title="${f.level}: ${esc(f.risk_name)}">${esc(r.text.slice(f.start, f.end))}</mark>`;
      pos = f.end;
    }
    return html + esc(r.text.slice(pos));
  }

  function email(r) {
    const items = r.flags.filter((f) => f.level !== "LOW").sort((a, b) => b.weight - a.weight);
    const lines = items.map((f, i) => `${i + 1}. ${f.label}: "${f.text.replace(/\s+/g, " ")}"\n   ${f.question}\n   Suggested wording: ${f.safer_wording}`);
    return `Subject: Clarifications before I sign\n\nHello,\n\nThank you for sharing the document. Before signing, I would like to clarify the following points:\n\n${lines.join("\n\n")}\n\nI look forward to your reply.\n\nRegards,\n`;
  }

  return { esc, summary, card, highlighted, email };
})();
