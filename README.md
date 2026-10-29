# LEXGUARD: AI Rights and Contract Intelligence System

**See the risky sentence before you sign.** LEXGUARD checks offer letters, quotations, ticket terms and online policies clause by clause. For every flagged clause it shows the exact sentence, a risk level, a plain-language reason, a question to ask before signing, and safer wording to suggest instead.

Team Root Coders (Shiva Kumar, Lavanya, Madhu S, Lakshman G) · HACKNOVA-26 (ANVESHANA-26) · AI/ML

> A review aid, not legal advice. The demo uses synthetic documents only, with no real personal data.

## How it works

```
Web page  / Chrome extension / PDF upload
                 │
         Local server (127.0.0.1:8787, offline)
                 │
  1. Extractor   → numbered clauses with exact character positions
  2. Risk Finder → 28 risk rules (incl. India rule pack) from engine/rules/rules.json
  3. Defender    → searches the whole document for protections, lowers the risk
  4. Judge       → LOW / MEDIUM / HIGH, overall score, top-3 questions
                 │
  Highlighted report · clarification email · save as PDF
```

- **Offline:** standard-library Python only. No AI API and no upload; the extension talks only to `127.0.0.1`.
- **Every flag is verifiable:** each one quotes its exact source sentence, and the benchmark checks this.
- **The Defender reduces false alarms:** it only counts a protection that is in the same clause or in a clause on the same topic.
- **Optional AI layer:** a disclosed hook in `engine/ai_layer.py`. It is off and not implemented in this prototype.

## Run it

Requires Python 3.9+. `pypdf` is optional and only needed for PDF upload.

```bash
python server.py
```

Open http://127.0.0.1:8787, then pick a sample or paste or upload a document.

### Chrome extension

1. Start the server (`python server.py`).
2. Open `chrome://extensions`, turn on **Developer mode**, click **Load unpacked** and choose the `extension/` folder.
3. Open a terms or signup page, for example http://127.0.0.1:8787/web/demo_signup.html. Click the LEXGUARD icon, then **Check this page**, or select text and right-click **Check with LEXGUARD**.
4. Risky sentences are highlighted in the page. Click a card to jump to its sentence, or click a highlight to jump to its card.

## Test it

```bash
python -m eval.benchmark
python -m eval.public_datasets --split test
```

The first command runs the synthetic samples against the targets in our solution note. The second runs the free public datasets in `datasets/`.

### Results on synthetic samples (`samples/`, 3 documents, 29 planted risks)

| Target | Goal | Result |
|---|---|---|
| Planted risky clauses flagged | ≥ 80% | **100%** |
| Clean clauses wrongly flagged HIGH | ≤ 20% | **0%** |
| Flags that quote their source sentence | 100% | **100%** |
| Processing time, 2-page document | < 10 s | **~20 ms** |

These samples were written by the same team that wrote the rules, so they are a sanity check, not proof. The public datasets below are the honest test.

### Results on public data: LexGLUE UNFAIR-ToS, held-out test split (1,607 sentences)

| Metric | Baseline (first rules) | After tuning on the train split |
|---|---|---|
| Unfair sentences flagged (recall) | 28.5% | **65.7%** |
| Precision | 45.8% | **54.1%** |
| Fair sentences flagged HIGH | 2.4% | **3.5%** |
| Speed | | 0.5 ms per sentence |

UNFAIR-ToS marks some clauses as "fair" that LEXGUARD flags on purpose, such as non-refundable payments, auto-renewal and indemnity, so precision understates usefulness for consumers. Full tables are in [`eval/results_public.md`](eval/results_public.md); the baseline is in `eval/results_public_baseline.md`.

### Results on public data: CUAD (510 commercial contracts)

Recall is low on business-to-business contract language: Non-Compete 7%, IP assignment 0%, Cap on Liability 28%, Liquidated Damages 53%. Our rules target consumer and employee wording. This is the main gap for the optional AI layer or more rules.

## Project layout

```
engine/            extractor, risk_finder, defender, judge, doc_type, ai_layer, rules/rules.json
server.py          local HTTP server (standard library)
web/               web page, shared report renderer, demo signup page
extension/         Chrome Manifest V3 extension (side panel + in-page highlights)
samples/           synthetic offer letter, quotation, ticket terms + planted-risk labels
datasets/          UNFAIR-ToS + CUAD (CC BY 4.0, see datasets/README.md)
eval/              benchmark.py, public_datasets.py, results
```

## Known limits (prototype)

- No OCR yet: scanned PDFs without a text layer are rejected with a message.
- English only. Kannada/Hindi output is planned.
- The extension can't read Chrome's built-in PDF viewer; use the web page upload instead.
- Rule-based recall on real terms is about 66%, so a clean report does not mean a document is safe.

## AI disclosure

Claude (Anthropic) helped plan the solution note and generated this prototype's code, rules and synthetic samples. The team reviews, tests and extends it.

## Licence

The code is for the HACKNOVA-26 submission. The datasets keep their own CC BY 4.0 licences; see `datasets/README.md`.
