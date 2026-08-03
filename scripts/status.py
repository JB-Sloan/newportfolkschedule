#!/usr/bin/env python3
"""
Regenerate tracking/STATUS.md from tracking/BACKLOG.md.

BACKLOG.md is the single source of truth. Edit the Status column there,
then run:  python3 scripts/status.py

Exit code 1 if any malformed rows are found, so this can gate CI.
"""

from __future__ import annotations

import re
import sys
from collections import OrderedDict
from datetime import date
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
BACKLOG = ROOT / "tracking" / "BACKLOG.md"
STATUS = ROOT / "tracking" / "STATUS.md"

VALID = ["done", "wip", "blocked", "todo", "cut"]
ICON = {"done": "✅", "wip": "🔨", "blocked": "⛔", "todo": "⬜", "cut": "🚫"}

EPIC_RE = re.compile(r"^##\s+(E\d+)\s+—\s+(.+?)\s*(?:·\s*(.+))?$")
ROW_RE = re.compile(r"^\|\s*(E\d+-\d+)\s*\|(.+?)\|\s*([a-z]+)\s*\|(.*?)\|\s*$")


def parse(text: str):
    epics = OrderedDict()
    errors = []
    current = None

    for lineno, line in enumerate(text.splitlines(), 1):
        m = EPIC_RE.match(line.strip())
        if m:
            key, name, phase = m.group(1), m.group(2), m.group(3) or ""
            current = key
            epics[key] = {"name": name, "phase": phase.strip(), "tasks": []}
            continue

        m = ROW_RE.match(line)
        if m:
            tid, title, status, notes = (g.strip() for g in m.groups())
            if status not in VALID:
                errors.append(f"line {lineno}: unknown status '{status}' on {tid}")
                continue
            if current is None:
                errors.append(f"line {lineno}: task {tid} outside any epic")
                continue
            epics[current]["tasks"].append(
                {"id": tid, "title": title, "status": status, "notes": notes}
            )

    return epics, errors


def bar(pct: float, width: int = 20) -> str:
    filled = round(pct * width)
    return "█" * filled + "░" * (width - filled)


def counts(tasks):
    c = {s: 0 for s in VALID}
    for t in tasks:
        c[t["status"]] += 1
    return c


def progress(c) -> float:
    active = sum(v for k, v in c.items() if k != "cut")
    return (c["done"] / active) if active else 0.0


def render(epics) -> str:
    all_tasks = [t for e in epics.values() for t in e["tasks"]]
    total = counts(all_tasks)
    overall = progress(total)

    out = []
    out.append("# Status\n")
    out.append(f"*Generated {date.today().isoformat()} by `scripts/status.py`. "
               "Do not edit by hand — edit `BACKLOG.md`.*\n")

    out.append("## Overall\n")
    out.append(f"`{bar(overall, 30)}` **{overall:.0%}** "
               f"({total['done']}/{sum(v for k, v in total.items() if k != 'cut')} tasks)\n")

    out.append("| Status | Count |")
    out.append("|---|---|")
    for s in VALID:
        out.append(f"| {ICON[s]} {s} | {total[s]} |")
    out.append("")

    out.append("## By epic\n")
    out.append("| Epic | Phase | Progress | Done | Open | Blocked |")
    out.append("|---|---|---|---|---|---|")
    for key, e in epics.items():
        c = counts(e["tasks"])
        p = progress(c)
        open_ct = c["todo"] + c["wip"]
        out.append(
            f"| **{key}** {e['name']} | {e['phase']} | `{bar(p, 12)}` {p:.0%} "
            f"| {c['done']} | {open_ct} | {c['blocked']} |"
        )
    out.append("")

    wip = [t for t in all_tasks if t["status"] == "wip"]
    if wip:
        out.append("## In progress\n")
        for t in wip:
            out.append(f"- 🔨 **{t['id']}** {t['title']}")
        out.append("")

    blocked = [t for t in all_tasks if t["status"] == "blocked"]
    if blocked:
        out.append("## Blocked\n")
        for t in blocked:
            note = f" — {t['notes']}" if t["notes"] else ""
            out.append(f"- ⛔ **{t['id']}** {t['title']}{note}")
        out.append("")

    # Anything flagged bold in Notes is treated as critical-path.
    critical = [t for t in all_tasks
                if t["status"] in ("todo", "wip", "blocked") and "**" in t["notes"]]
    if critical:
        out.append("## Critical path / warnings\n")
        for t in critical:
            out.append(f"- {ICON[t['status']]} **{t['id']}** {t['title']} — {t['notes']}")
        out.append("")

    out.append("## Next up\n")
    for key, e in epics.items():
        nxt = [t for t in e["tasks"] if t["status"] == "todo"][:3]
        if nxt:
            out.append(f"**{key} {e['name']}**")
            for t in nxt:
                out.append(f"- ⬜ {t['id']} {t['title']}")
            out.append("")

    return "\n".join(out) + "\n"


def main() -> int:
    if not BACKLOG.exists():
        print(f"error: {BACKLOG} not found", file=sys.stderr)
        return 1

    epics, errors = parse(BACKLOG.read_text(encoding="utf-8"))

    for e in errors:
        print(f"warning: {e}", file=sys.stderr)

    STATUS.write_text(render(epics), encoding="utf-8")

    total = sum(len(e["tasks"]) for e in epics.values())
    print(f"Wrote {STATUS.relative_to(ROOT)} — {len(epics)} epics, {total} tasks.")
    return 1 if errors else 0


if __name__ == "__main__":
    sys.exit(main())
