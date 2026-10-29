const API = "http://127.0.0.1:8787";
const $ = (id) => document.getElementById(id);
let result = null;
let tabId = null;

function showError(msg) {
  $("err").innerHTML = msg ? `<div class="error">${LexReport.esc(msg)}</div>` : "";
}

async function checkEngine() {
  try {
    const res = await fetch(`${API}/health`);
    if (!res.ok) throw new Error();
    $("status").className = "status ok";
    $("status").textContent = "Engine running on this computer (offline rules).";
    return true;
  } catch {
    $("status").className = "status down";
    $("status").innerHTML = "The LEXGUARD engine is not running. In the lexguard folder, run <code>python server.py</code>, then try again.";
    return false;
  }
}

async function activeTab() {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  return tab;
}

async function readPage(id) {
  const [{ result: page }] = await chrome.scripting.executeScript({
    target: { tabId: id },
    func: () => ({
      selection: String(getSelection()),
      text: document.body.innerText,
      links: [...document.links]
        .filter((a) => /terms|conditions|privacy|refund|cancell?ation|policy|agreement/i.test(a.textContent))
        .slice(0, 8)
        .map((a) => ({ text: a.textContent.trim().slice(0, 60), href: a.href })),
    }),
  });
  return page;
}

async function run(mode) {
  showError("");
  if (!(await checkEngine())) return;
  const tab = await activeTab();
  if (!tab) return;
  tabId = tab.id;
  let page;
  try {
    page = await readPage(tabId);
  } catch {
    return showError("LEXGUARD can't read this tab. Click the LEXGUARD toolbar icon while on the page, then try again. Built-in Chrome pages and the PDF viewer can't be read; upload PDFs on the web page instead.");
  }
  const text = mode === "selection" ? page.selection : page.text;
  if (!text.trim()) return showError(mode === "selection" ? "Select some text on the page first." : "This page has no readable text.");

  $("links").innerHTML = mode === "page" && page.links.length
    ? `<b>Terms links on this page</b> (open one, then check it):<ul>${page.links.map((l) => `<li><a href="${LexReport.esc(l.href)}" target="_blank">${LexReport.esc(l.text || l.href)}</a></li>`).join("")}</ul>`
    : "";

  for (const b of [$("page"), $("sel")]) b.disabled = true;
  try {
    const res = await fetch(`${API}/analyze`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text, doc_type: $("doctype").value || null }),
    });
    result = await res.json();
    if (!res.ok) throw new Error(result.error || res.statusText);
    await chrome.scripting.insertCSS({ target: { tabId }, files: ["content.css"] });
    await chrome.scripting.executeScript({ target: { tabId }, files: ["content.js"] });
    const marked = await chrome.tabs.sendMessage(tabId, { type: "highlight", flags: result.flags });
    render(marked);
  } catch (err) {
    showError(`Could not check the page: ${err.message}`);
  } finally {
    for (const b of [$("page"), $("sel")]) b.disabled = false;
  }
}

function render(marked) {
  const order = { HIGH: 0, MEDIUM: 1, LOW: 2 };
  $("out").hidden = false;
  $("summary").innerHTML = LexReport.summary(result);
  $("note").textContent = marked && marked.missing.length
    ? `${marked.found} of ${result.flags.length} flagged sentences highlighted on the page. The rest are listed below.`
    : "";
  $("cards").innerHTML = [...result.flags].sort((a, b) => order[a.level] - order[b.level] || a.id - b.id).map(LexReport.card).join("")
    || `<p class="hint">No risky clauses found by the rule library.</p>`;
}

function focusCard(id) {
  document.querySelectorAll(".card.focus").forEach((c) => c.classList.remove("focus"));
  const card = document.querySelector(`.card[data-id="${id}"]`);
  if (card) { card.classList.add("focus"); card.scrollIntoView({ behavior: "smooth", block: "nearest" }); }
}

document.addEventListener("click", (e) => {
  const el = e.target.closest("[data-goto], .card[data-id]");
  if (!el || !tabId) return;
  e.preventDefault();
  const id = Number(el.dataset.goto || el.dataset.id);
  focusCard(id);
  chrome.tabs.sendMessage(tabId, { type: "focus", id });
});

chrome.runtime.onMessage.addListener((msg) => {
  if (msg.type === "markClicked") focusCard(msg.id);
});

// Right-click "Check with LEXGUARD" leaves a request for the panel to pick up.
async function takePending() {
  const { pending } = await chrome.storage.session.get("pending");
  if (pending && Date.now() - pending.at < 30000) {
    await chrome.storage.session.remove("pending");
    run("selection");
  }
}
chrome.storage.onChanged.addListener((changes, area) => {
  if (area === "session" && changes.pending && changes.pending.newValue) takePending();
});

$("page").addEventListener("click", () => run("page"));
$("sel").addEventListener("click", () => run("selection"));
$("clear").addEventListener("click", () => tabId && chrome.tabs.sendMessage(tabId, { type: "clear" }));
$("copy").addEventListener("click", async () => {
  await navigator.clipboard.writeText(LexReport.email(result));
  $("copy").textContent = "Copied";
  setTimeout(() => ($("copy").textContent = "Copy clarification email"), 1500);
});

checkEngine().then(takePending);
