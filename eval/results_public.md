# LEXGUARD on public datasets

## LexGLUE UNFAIR-ToS (test split, 1607 sentences)

| Metric | Value |
|---|---|
| Unfair sentences flagged (recall) | 65.7% |
| Flags that were really unfair (precision) | 54.1% |
| F1 | 0.593 |
| Fair sentences flagged at any level | 6.7% |
| Fair sentences flagged HIGH | 3.5% |
| Speed | 0.54 ms per sentence |

| Unfair type | Sentences | Caught by the matching rule |
|---|---|---|
| Arbitration | 7 | 86% |
| Choice of law | 13 | 85% |
| Content removal | 13 | 62% |
| Contract by using | 23 | 52% |
| Jurisdiction | 16 | 69% |
| Limitation of liability | 38 | 68% |
| Unilateral change | 38 | 60% |
| Unilateral termination | 38 | 42% |

## CUAD v1 (510 contracts, 1848 annotated clauses)

| CUAD category | Clauses | Caught by the matching rule | Flagged by any rule |
|---|---|---|---|
| Renewal Term | 199 | 43% | 45% |
| Non-Compete | 226 | 7% | 10% |
| Cap On Liability | 632 | 28% | 29% |
| Liquidated Damages | 113 | 53% | 59% |
| Covenant Not To Sue | 159 | 2% | 2% |
| Termination For Convenience | 223 | 17% | 22% |
| Ip Ownership Assignment | 296 | 0% | 1% |
