import json

def load_script(path: str) -> list:
    with open(path, "r", encoding="utf-8") as f:
        data = json.load(f)

    checklist = []
    for i, item in enumerate(data):
        checklist.append({
            "id": item.get("id", i + 1),
            "section": item.get("section", item.get("section_name", f"Section {i+1}")),
            "description": item.get("description", item.get("content", "")),
            "weight": item.get("weight", round(1 / len(data), 2))
        })

    return checklist