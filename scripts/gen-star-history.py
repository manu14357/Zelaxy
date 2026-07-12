#!/usr/bin/env python3
"""
Regenerate the committed star-history chart from live GitHub data.

Why this exists: star-history.com's live SVG intermittently 503s (its shared
backend is rate-limited), so GitHub renders a broken image. This bakes a real,
always-rendering PNG from the actual stargazer timestamps instead.

Requires:
  - gh CLI, authenticated (`gh auth login`)
  - matplotlib  (pip install matplotlib)

Usage:
  python3 scripts/gen-star-history.py
  # then commit apps/zelaxy/public/social/star-history.png
"""
import subprocess
import sys
from datetime import datetime, timezone

REPO = "manu14357/Zelaxy"
OUT = "apps/zelaxy/public/social/star-history.png"
ORANGE = "#EA580C"


def parse(s):
    return datetime.strptime(s, "%Y-%m-%dT%H:%M:%SZ")


def main():
    try:
        created_raw = subprocess.check_output(
            ["gh", "api", f"repos/{REPO}", "--jq", ".created_at"], text=True).strip()
        # Paginate stargazers with timestamps (star+json media type).
        stamps = subprocess.check_output(
            ["gh", "api", "--paginate",
             "-H", "Accept: application/vnd.github.star+json",
             f"repos/{REPO}/stargazers?per_page=100",
             "--jq", ".[].starred_at"], text=True).split()
    except (subprocess.CalledProcessError, FileNotFoundError) as e:
        sys.exit(f"Failed to fetch from GitHub (is gh authenticated?): {e}")

    created = parse(created_raw)
    stars = sorted(parse(s) for s in stamps)
    now = datetime.now(timezone.utc).replace(tzinfo=None)
    xs = [created] + stars + [now]
    ys = [0] + list(range(1, len(stars) + 1)) + [len(stars)]

    import matplotlib
    matplotlib.use("Agg")
    import matplotlib.pyplot as plt
    import matplotlib.dates as mdates

    fig, ax = plt.subplots(figsize=(8, 4.0), dpi=200)
    fig.patch.set_facecolor("white")
    ax.set_facecolor("white")
    ax.fill_between(xs, ys, color=ORANGE, alpha=0.10, zorder=1)
    ax.plot(xs, ys, color=ORANGE, linewidth=2.6, solid_capstyle="round",
            solid_joinstyle="round", zorder=3)
    ax.scatter(xs[1:-1], ys[1:-1], s=34, facecolor="white", edgecolor=ORANGE,
               linewidth=2.0, zorder=4)
    ax.scatter([xs[-1]], [ys[-1]], s=48, color=ORANGE, zorder=5)
    ax.annotate(f"{len(stars)} stars", xy=(xs[-1], ys[-1]), xytext=(-6, 10),
                textcoords="offset points", ha="right", va="bottom",
                fontsize=11, fontweight="bold", color=ORANGE)

    ymax = max(10, len(stars) + 2)
    ax.set_ylim(0, ymax)
    ax.set_xlim(xs[0], xs[-1])
    ax.set_ylabel("GitHub Stars", fontsize=11, color="#374151")
    ax.grid(True, axis="y", color="#eef0f2", linewidth=1)
    ax.set_axisbelow(True)
    for s in ("top", "right"):
        ax.spines[s].set_visible(False)
    for s in ("left", "bottom"):
        ax.spines[s].set_color("#d1d5db")
    ax.tick_params(colors="#9ca3af", labelsize=10)
    ax.xaxis.set_major_locator(mdates.AutoDateLocator())
    ax.xaxis.set_major_formatter(mdates.DateFormatter("%b %Y"))
    ax.set_title("Zelaxy — Star History", loc="left", fontsize=16,
                 fontweight="bold", color="#111827", pad=24)
    ax.text(0.0, 1.045, f"github.com/{REPO}", transform=ax.transAxes,
            fontsize=10, color="#6b7280")
    fig.tight_layout()
    fig.savefig(OUT, facecolor="white", bbox_inches="tight", pad_inches=0.25)
    print(f"Wrote {OUT}  ({len(stars)} stars)")


if __name__ == "__main__":
    main()
