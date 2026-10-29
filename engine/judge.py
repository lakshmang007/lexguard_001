"""Agent 4 - Judge: final level per clause, overall score and top questions."""
from .defender import label

LEVEL_POINTS = {"HIGH": 25, "MEDIUM": 10, "LOW": 3}


def _level(weight, thresholds):
    if weight >= thresholds["HIGH"]:
        return "HIGH"
    if weight >= thresholds["MEDIUM"]:
        return "MEDIUM"
    return "LOW"


def judge(clauses, rules):
    risks_by_id = {r["id"]: r for r in rules["risks"]}
    thresholds = rules["levels"]
    flags = []
    for clause in clauses:
        hits = clause.get("risks", [])
        if not hits:
            continue
        hits.sort(key=lambda h: -h["final_weight"])
        top = hits[0]
        # Several independent risks in one clause push it up a little.
        weight = min(1.0, top["final_weight"] + 0.05 * (len(hits) - 1))
        rule = risks_by_id[top["rule"]]
        flags.append({
            "id": clause["id"],
            "section": clause["section"],
            "label": label(clause).capitalize(),
            "text": clause["text"],
            "start": clause["start"],
            "end": clause["end"],
            "level": _level(weight, thresholds),
            "weight": round(weight, 2),
            "rule": top["rule"],
            "risk_name": top["name"],
            "matched": top["matched"],
            "reason": rule["reason"],
            "defender": top["defender_note"],
            "defended": bool(top["defended_by"]),
            "question": rule["question"],
            "safer_wording": rule["safer_wording"],
            "jurisdiction": top.get("jurisdiction"),
            "also": [{"rule": h["rule"], "name": h["name"]} for h in hits[1:]],
            "source": "rules",
        })

    counts = {lvl: sum(1 for f in flags if f["level"] == lvl) for lvl in LEVEL_POINTS}
    safe = 1.0
    for f in flags:
        safe *= 1 - 0.3 * f["weight"]
    score = round(100 * (1 - safe))
    overall = "HIGH" if counts["HIGH"] >= 2 or score >= 60 else "MEDIUM" if score >= 25 else "LOW"

    ranked = sorted(flags, key=lambda f: -f["weight"])
    top_questions, seen = [], set()
    for f in ranked:
        if f["question"] not in seen and f["level"] != "LOW":
            seen.add(f["question"])
            top_questions.append({"clause_id": f["id"], "label": f["label"], "question": f["question"]})
        if len(top_questions) == 3:
            break

    return flags, {
        "score": score,
        "level": overall,
        "counts": counts,
        "top_questions": top_questions,
    }
