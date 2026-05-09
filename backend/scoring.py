def calculate_score(evaluations: list) -> dict:
    total_weighted = 0
    total_weight = 0
    section_scores = []

    for item in evaluations:
        score = item.get("score", 0)
        weight = item.get("weight", 0)
        total_weighted += (score / 100) * weight
        total_weight += weight

        section_scores.append({
            "section_name": item.get("section_name", "Unknown"),
            "score": score,
            "weight": weight,
            "status": item.get("status", "Unknown"),
            "evidence": item.get("evidence", None),
            "reasoning": item.get("reasoning", "")
        })

    # Normalize: divide by total weight so score is always out of 100
    overall = round((total_weighted / total_weight) * 100, 1) if total_weight > 0 else 0

    return {
        "overall_score": overall,
        "section_scores": section_scores
    }