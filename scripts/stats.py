import requests
from tabulate import tabulate

# -----------------------------
# Configuration
# -----------------------------
GITHUB_OWNER = "neanes"
GITHUB_REPO = "neanes"
API_URL = f"https://api.github.com/repos/{GITHUB_OWNER}/{GITHUB_REPO}/releases"


# -----------------------------
# Helper functions
# -----------------------------
def infer_os_from_name(name: str) -> str:
    """Infer OS from asset name."""
    n = name.lower()
    if n.endswith(".exe"):
        return "Windows"
    if n.endswith(".dmg") and "arm64" in n:
        return "Mac (Silicon)"
    if n.endswith(".zip") and "arm64" in n and "mac" in n:
        return "Mac (Silicon)"
    if n.endswith(".zip") and "mac" in n:
        return "Mac (Silicon)"
    if n.endswith(".dmg"):
        return "Mac (Intel)"
    if n.endswith(".AppImage".lower()):
        return "Linux"

    return None


def pct(part, total):
    return (part / total * 100) if total > 0 else 0


# -----------------------------
# Fetch releases
# -----------------------------
response = requests.get(API_URL)
response.raise_for_status()
releases = response.json()

# -----------------------------
# Create table
# -----------------------------

rows = []

for release in releases:
    release_name = release.get("name") or release.get("tag_name")

    counts = {"Windows": 0, "Mac (Intel)": 0, "Mac (Silicon)": 0, "Linux": 0}

    for asset in release.get("assets", []):
        os_name = infer_os_from_name(asset["name"])
        if os_name:
            counts[os_name] += asset["download_count"]

    total = sum(counts.values())

    rows.append(
        [
            release_name,
            total,
            counts["Windows"],
            f"{pct(counts['Windows'], total):.1f}%",
            counts["Mac (Silicon)"],
            f"{pct(counts['Mac (Silicon)'], total):.1f}%",
            counts["Mac (Intel)"],
            f"{pct(counts['Mac (Intel)'], total):.1f}%",
            counts["Linux"],
            f"{pct(counts['Linux'], total):.1f}%",
        ]
    )

# -----------------------------
# Print table
# -----------------------------
headers = [
    "Release",
    "Total",
    "Win",
    "Win%",
    "Mac",
    "Mac%",
    "Mac-x64",
    "Mac-x64%",
    "Linux",
    "Linux%",
]

print(tabulate(rows, headers=headers, tablefmt="github"))
