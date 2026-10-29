// Shared report rendering for the web page and the extension side panel.
const LexReport = (() => {
  const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const LEVEL_CLASS = { HIGH: "high", MEDIUM: "med", LOW: "low" };

  function summary(r) {
    const o = r.overall;
    const qs = o.top_questions.map((q) => `<li><a href="#" data-goto="${q.clause_id}">${esc(q.label)}</a>: ${esc(q.question)}</li>`).join("");
    return `
      <div class="summary">
        <div class="score ${LEVEL_CLASS[o.level]}"><span class="num">${o.score}</span><span class="of">/100</span><span class="lvl">${o.level} risk</span></div>
        <div class="meta">
          <div><b>${esc(r.doc_type.label)}</b> · ${r.clause_count} clauses checked · ${r.elapsed_ms} ms</div>
          <div class="counts">
            <span class="pill high">${o.counts.HIGH} high</span>
            <span class="pill med">${o.counts.MEDIUM} medium</span>
            <span class="pill low">${o.counts.LOW} low</span>
          </div>
          <div class="ai-note">${esc(r.ai_layer.note)}</div>
        </div>
      </div>
      ${qs ? `<div class="topq"><h3>Top questions to ask before signing</h3><ol>${qs}</ol></div>` : `<div class="topq"><h3>No medium or high risks found</h3><p>Still read the document. LEXGUARD only knows the patterns in its rule library.</p></div>`}`;
  }

  function card(f) {
    const also = f.also.length ? `<div class="also">Also matches: ${f.also.map((a) => esc(a.name)).join(", ")}</div>` : "";
    const india = f.jurisdiction === "IN" ? `<span class="tag">India rule</span>` : "";
    return `
      <article class="card ${LEVEL_CLASS[f.level]}" data-id="${f.id}" tabindex="0">
        <header><span class="badge ${LEVEL_CLASS[f.level]}">${f.level}</span><span class="cname">${esc(f.label)} · ${esc(f.risk_name)}</span>${india}</header>
        <blockquote>${esc(f.text)}</blockquote>
        <dl>
          <dt>Why</dt><dd>${esc(f.reason)}</dd>
          <dt>Defender</dt><dd class="${f.defended ? "defended" : ""}">${esc(f.defender)}</dd>
          <dt>Ask</dt><dd>${esc(f.question)}</dd>
          <dt>Safer wording</dt><dd class="safer">${esc(f.safer_wording)}</dd>
        </dl>
        ${also}
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
