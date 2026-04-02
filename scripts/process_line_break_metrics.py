#!/usr/bin/env python3

import argparse
import csv
import json
import math
from collections import Counter, defaultdict
from pathlib import Path
from typing import Any

import matplotlib.pyplot as plt  # type: ignore

RATIO_THRESHOLDS = [1.0, 1.1, 1.2, 1.3, 1.5, 2.0]
HISTOGRAM_EDGES = [
    -1.0,
    -0.75,
    -0.5,
    -0.25,
    0.0,
    0.25,
    0.5,
    0.75,
    1.0,
    1.25,
    1.5,
    1.75,
    2.0,
]
COMPROMISE_BUCKETS = ("any", "mild", "strong")
TOP_DOCUMENT_REPORTS = (
    ("nonFinalRatioSummary.max", "Top Documents by Worst Non-final Ratio"),
    ("semanticCompromise.strongRate", "Top Documents by Strong Compromise Rate"),
    ("adjacentIncompatibleCount", "Top Documents by Adjacent Incompatible Count"),
)


# ---------------------------------------------------------------------------
# Data loading
# ---------------------------------------------------------------------------


def load_raw_documents(path: Path) -> list[dict[str, Any]]:
    """Parse LINE_BREAK_METRICS_DOCUMENT records from a log file.

    Each record has ``filePath`` and ``lines`` (list of raw per-line dicts).
    """
    documents: list[dict[str, Any]] = []

    for line in path.read_text(errors="replace").splitlines():
        if line.startswith("LINE_BREAK_METRICS_DOCUMENT "):
            documents.append(json.loads(line.split(" ", 1)[1]))

    return documents


# ---------------------------------------------------------------------------
# Numeric helpers
# ---------------------------------------------------------------------------


def summarize_values(values: list[float]) -> dict[str, Any]:
    if not values:
        return {
            "count": 0,
            "mean": None,
            "standardDeviation": None,
            "min": None,
            "max": None,
        }

    n = len(values)
    mean = sum(values) / n
    variance = sum((v - mean) ** 2 for v in values) / n

    return {
        "count": n,
        "mean": mean,
        "standardDeviation": math.sqrt(variance),
        "min": min(values),
        "max": max(values),
    }


def build_histogram(values: list[float]) -> list[dict[str, Any]]:
    edges = HISTOGRAM_EDGES
    bins: list[dict[str, Any]] = []

    bins.append({"label": f"< {edges[0]:.2f}", "count": 0})
    for i in range(len(edges) - 1):
        bins.append({"label": f"{edges[i]:.2f} to < {edges[i + 1]:.2f}", "count": 0})
    bins.append({"label": f">= {edges[-1]:.2f}", "count": 0})

    for v in values:
        if v < edges[0]:
            bins[0]["count"] += 1
            continue
        if v >= edges[-1]:
            bins[-1]["count"] += 1
            continue
        for i in range(len(edges) - 1):
            if edges[i] <= v < edges[i + 1]:
                bins[i + 1]["count"] += 1
                break

    return bins


def build_threshold_counts(values: list[float]) -> dict[str, int]:
    return {f">{t:.1f}": sum(1 for v in values if v > t) for t in RATIO_THRESHOLDS}


def sort_break_penalty_counts(counts: dict[int, int]) -> list[dict[str, int]]:
    return [{"cost": cost, "count": count} for cost, count in sorted(counts.items())]


def fitness_class(ratio: float) -> int:
    if ratio < -0.5:
        return 0
    if ratio < 0.5:
        return 1
    if ratio < 1:
        return 2
    return 3


# ---------------------------------------------------------------------------
# Document-level aggregation
# ---------------------------------------------------------------------------


def empty_ratio_buckets() -> dict[str, list[float]]:
    return {bucket: [] for bucket in COMPROMISE_BUCKETS}


def build_semantic_compromise(
    ratio_buckets: dict[str, list[float]],
    denominator: int,
) -> dict[str, Any]:
    def rate(count: int) -> float | None:
        return None if denominator == 0 else count / denominator

    return {
        "anyCount": len(ratio_buckets["any"]),
        "anyRate": rate(len(ratio_buckets["any"])),
        "mildCount": len(ratio_buckets["mild"]),
        "mildRate": rate(len(ratio_buckets["mild"])),
        "strongCount": len(ratio_buckets["strong"]),
        "strongRate": rate(len(ratio_buckets["strong"])),
        "anyRatioSummary": summarize_values(ratio_buckets["any"]),
        "mildRatioSummary": summarize_values(ratio_buckets["mild"]),
        "strongRatioSummary": summarize_values(ratio_buckets["strong"]),
    }


def bucket_compromise_ratios(lines: list[dict[str, Any]]) -> dict[str, list[float]]:
    buckets = empty_ratio_buckets()

    for line in lines:
        break_penalty_cost = line["breakPenaltyCost"]
        if break_penalty_cost <= 0:
            continue

        ratio = line["adjustmentRatio"]
        buckets["any"].append(ratio)

        if break_penalty_cost < 500:
            buckets["mild"].append(ratio)
        elif break_penalty_cost < 1000:
            buckets["strong"].append(ratio)

    return buckets


def flatten_document_lists(documents: list[dict[str, Any]], field: str) -> list[Any]:
    return [item for doc in documents for item in doc[field]]


def sum_document_field(documents: list[dict[str, Any]], field: str) -> int:
    return sum(doc[field] for doc in documents)


def merge_break_penalty_counts(documents: list[dict[str, Any]]) -> list[dict[str, int]]:
    counts: dict[int, int] = defaultdict(int)
    for doc in documents:
        for item in doc["breakPenaltyCounts"]:
            counts[item["cost"]] += item["count"]
    return sort_break_penalty_counts(counts)


def build_document_overview(doc: dict[str, Any]) -> dict[str, Any]:
    return {
        "filePath": doc["filePath"],
        "paragraphCount": doc["paragraphCount"],
        "totalLineCount": doc["totalLineCount"],
        "nonFinalLineCount": doc["nonFinalLineCount"],
        "nonFinalRatioSummary": doc["nonFinalRatioSummary"],
        "paragraphMaxRatioSummary": doc["paragraphMaxRatioSummary"],
        "adjacentIncompatibleCount": doc["adjacentIncompatibleCount"],
        "adjacentPairCount": doc["adjacentPairCount"],
    }


def annotate_line_positions(lines: list[dict[str, Any]]) -> list[dict[str, Any]]:
    """Derive paragraph and in-paragraph line indices from line order.

    The frontend emits lines in paragraph order, and each paragraph's lines are
    emitted in line order. `isParagraphFinalLine` marks the paragraph boundary.
    """
    annotated: list[dict[str, Any]] = []
    paragraph_index = 0
    line_index_in_paragraph = 0

    for line in lines:
        annotated_line = dict(line)
        annotated_line["paragraphIndex"] = paragraph_index
        annotated_line["lineIndexInParagraph"] = line_index_in_paragraph
        annotated.append(annotated_line)

        if line["isParagraphFinalLine"]:
            paragraph_index += 1
            line_index_in_paragraph = 0
        else:
            line_index_in_paragraph += 1

    return annotated


def group_lines_by_paragraph(
    lines: list[dict[str, Any]],
) -> dict[int, list[dict[str, Any]]]:
    grouped: dict[int, list[dict[str, Any]]] = defaultdict(list)
    for line in lines:
        grouped[line["paragraphIndex"]].append(line)
    return grouped


def summarize_paragraphs(
    by_paragraph: dict[int, list[dict[str, Any]]],
) -> tuple[list[float], int, int]:
    paragraph_max_ratios: list[float] = []
    adjacent_pair_count = 0
    adjacent_incompatible_count = 0

    for para_lines in by_paragraph.values():
        para_lines.sort(key=lambda ln: ln["lineIndexInParagraph"])

        measured = [ln for ln in para_lines if not ln["isParagraphFinalLine"]]
        source = measured if measured else para_lines
        paragraph_max_ratios.append(max(ln["adjustmentRatio"] for ln in source))

        for left, right in zip(para_lines, para_lines[1:]):
            adjacent_pair_count += 1
            delta = abs(
                fitness_class(left["adjustmentRatio"])
                - fitness_class(right["adjustmentRatio"])
            )
            if delta > 1:
                adjacent_incompatible_count += 1

    return paragraph_max_ratios, adjacent_pair_count, adjacent_incompatible_count


def build_worst_lines(
    file_path: str, lines: list[dict[str, Any]], limit: int
) -> list[dict[str, Any]]:
    worst = sorted(lines, key=lambda ln: ln["adjustmentRatio"], reverse=True)[:limit]
    return [
        {
            "filePath": file_path,
            "paragraphIndex": line["paragraphIndex"],
            "lineIndexInParagraph": line["lineIndexInParagraph"],
            "ratio": line["adjustmentRatio"],
            "breakPenaltyCost": line["breakPenaltyCost"],
            "isParagraphFinalLine": line["isParagraphFinalLine"],
        }
        for line in worst
    ]


def build_document_metrics(raw: dict[str, Any]) -> dict[str, Any]:
    file_path: str = raw["filePath"]
    all_lines = annotate_line_positions(raw["lines"])
    non_final = [ln for ln in all_lines if not ln["isParagraphFinalLine"]]
    compromise_ratios = bucket_compromise_ratios(non_final)

    all_ratios = [ln["adjustmentRatio"] for ln in all_lines]
    non_final_ratios = [ln["adjustmentRatio"] for ln in non_final]
    by_paragraph = group_lines_by_paragraph(all_lines)
    (
        paragraph_max_ratios,
        adjacent_pair_count,
        adjacent_incompatible_count,
    ) = summarize_paragraphs(by_paragraph)

    # Break penalty counts
    break_penalty_counts = sort_break_penalty_counts(
        Counter(ln["breakPenaltyCost"] for ln in non_final)
    )

    return {
        "filePath": file_path,
        "paragraphCount": len(by_paragraph),
        "totalLineCount": len(all_lines),
        "finalLineCount": len(all_lines) - len(non_final),
        "nonFinalLineCount": len(non_final),
        "allRatios": all_ratios,
        "nonFinalRatios": non_final_ratios,
        "paragraphMaxRatios": paragraph_max_ratios,
        "anyCompromiseRatios": compromise_ratios["any"],
        "mildCompromiseRatios": compromise_ratios["mild"],
        "strongCompromiseRatios": compromise_ratios["strong"],
        "allRatioSummary": summarize_values(all_ratios),
        "nonFinalRatioSummary": summarize_values(non_final_ratios),
        "paragraphMaxRatioSummary": summarize_values(paragraph_max_ratios),
        "nonFinalRatioHistogram": build_histogram(non_final_ratios),
        "ratioThresholdCounts": build_threshold_counts(non_final_ratios),
        "paragraphMaxThresholdCounts": build_threshold_counts(paragraph_max_ratios),
        "breakPenaltyCounts": break_penalty_counts,
        "semanticCompromise": build_semantic_compromise(
            compromise_ratios, len(non_final)
        ),
        "adjacentPairCount": adjacent_pair_count,
        "adjacentIncompatibleCount": adjacent_incompatible_count,
        "worstLines": build_worst_lines(file_path, non_final, limit=10),
    }


# ---------------------------------------------------------------------------
# Corpus-level aggregation
# ---------------------------------------------------------------------------


def build_corpus_metrics(documents: list[dict[str, Any]]) -> dict[str, Any]:
    all_ratios = flatten_document_lists(documents, "allRatios")
    non_final_ratios = flatten_document_lists(documents, "nonFinalRatios")
    paragraph_max_ratios = flatten_document_lists(documents, "paragraphMaxRatios")
    compromise_ratios = {
        "any": flatten_document_lists(documents, "anyCompromiseRatios"),
        "mild": flatten_document_lists(documents, "mildCompromiseRatios"),
        "strong": flatten_document_lists(documents, "strongCompromiseRatios"),
    }
    break_penalty_counts = merge_break_penalty_counts(documents)

    worst_lines = sorted(
        flatten_document_lists(documents, "worstLines"),
        key=lambda wl: wl["ratio"],
        reverse=True,
    )[:20]

    non_final_count = sum_document_field(documents, "nonFinalLineCount")

    return {
        "fileCount": len(documents),
        "paragraphCount": sum_document_field(documents, "paragraphCount"),
        "totalLineCount": sum_document_field(documents, "totalLineCount"),
        "finalLineCount": sum_document_field(documents, "finalLineCount"),
        "nonFinalLineCount": non_final_count,
        "allRatioSummary": summarize_values(all_ratios),
        "nonFinalRatioSummary": summarize_values(non_final_ratios),
        "paragraphMaxRatioSummary": summarize_values(paragraph_max_ratios),
        "nonFinalRatioHistogram": build_histogram(non_final_ratios),
        "ratioThresholdCounts": build_threshold_counts(non_final_ratios),
        "paragraphMaxThresholdCounts": build_threshold_counts(paragraph_max_ratios),
        "breakPenaltyCounts": break_penalty_counts,
        "semanticCompromise": build_semantic_compromise(
            compromise_ratios, non_final_count
        ),
        "adjacentPairCount": sum_document_field(documents, "adjacentPairCount"),
        "adjacentIncompatibleCount": sum_document_field(
            documents, "adjacentIncompatibleCount"
        ),
        "worstLines": worst_lines,
        "documents": [build_document_overview(doc) for doc in documents],
    }


# ---------------------------------------------------------------------------
# Display helpers
# ---------------------------------------------------------------------------


def pct(numerator: int, denominator: int) -> str:
    if denominator == 0:
        return "n/a"
    return f"{(100 * numerator / denominator):.2f}%"


def fmt_number(value: Any, digits: int = 3) -> str:
    if value is None:
        return "n/a"
    if isinstance(value, int):
        return str(value)
    return f"{value:.{digits}f}"


def get_nested(mapping: dict[str, Any], path: str) -> Any:
    current: Any = mapping
    for part in path.split("."):
        current = current[part]
    return current


def print_corpus_summary(corpus: dict[str, Any]) -> None:
    non_final_count = corpus["nonFinalLineCount"]
    paragraph_count = corpus["paragraphCount"]
    adjacent_pairs = corpus["adjacentPairCount"]

    print("Corpus Summary")
    print(f"  Files: {corpus['fileCount']}")
    print(f"  Paragraphs: {paragraph_count}")
    print(f"  Total lines: {corpus['totalLineCount']}")
    print(f"  Non-final lines: {non_final_count}")
    print(f"  Mean r (non-final): {fmt_number(corpus['nonFinalRatioSummary']['mean'])}")
    print(
        f"  Std dev r (non-final): {fmt_number(corpus['nonFinalRatioSummary']['standardDeviation'])}"
    )
    print(f"  Max r (non-final): {fmt_number(corpus['nonFinalRatioSummary']['max'])}")
    print(
        f"  Mean paragraph max r: {fmt_number(corpus['paragraphMaxRatioSummary']['mean'])}"
    )
    print(
        f"  Adjacent incompatible pairs: {corpus['adjacentIncompatibleCount']} / {adjacent_pairs} "
        f"({pct(corpus['adjacentIncompatibleCount'], adjacent_pairs)})"
    )
    print(
        f"  Semantic compromise rate: {corpus['semanticCompromise']['anyCount']} / {non_final_count} "
        f"({pct(corpus['semanticCompromise']['anyCount'], non_final_count)})"
    )
    print(
        f"  Strong compromise rate: {corpus['semanticCompromise']['strongCount']} / {non_final_count} "
        f"({pct(corpus['semanticCompromise']['strongCount'], non_final_count)})"
    )
    print()

    print("Ratio Thresholds")
    for label, count in corpus["ratioThresholdCounts"].items():
        print(f"  {label}: {count} ({pct(count, non_final_count)})")
    print()

    print("Paragraph Max Thresholds")
    for label, count in corpus["paragraphMaxThresholdCounts"].items():
        print(f"  {label}: {count} ({pct(count, paragraph_count)})")
    print()

    print("Break Penalty Counts")
    for item in corpus["breakPenaltyCounts"]:
        print(f"  {item['cost']:>4}: {item['count']}")
    print()


def print_top_documents(
    documents: list[dict[str, Any]], metric_path: str, label: str, limit: int
) -> None:
    print(label)
    for doc in top_documents(documents, metric_path, limit):
        print(
            f"  {fmt_number(get_nested(doc, metric_path))}  "
            f"{doc['filePath']}  "
            f"(non-final lines: {doc['nonFinalLineCount']})"
        )
    print()


def print_worst_lines(corpus: dict[str, Any], limit: int) -> None:
    print("Worst Lines")
    for item in corpus["worstLines"][:limit]:
        print(
            f"  r={fmt_number(item['ratio'])}  "
            f"break={item['breakPenaltyCost']}  "
            f"{item['filePath']}  "
            f"paragraph {item['paragraphIndex']}, line {item['lineIndexInParagraph']}"
        )
    print()


def top_documents(
    documents: list[dict[str, Any]], metric_path: str, limit: int
) -> list[dict[str, Any]]:
    usable = [doc for doc in documents if get_nested(doc, metric_path) is not None]
    return sorted(usable, key=lambda doc: get_nested(doc, metric_path), reverse=True)[
        :limit
    ]


def mapping_rows(mapping: dict[str, int], key_name: str) -> list[dict[str, int]]:
    return [{key_name: key, "count": count} for key, count in mapping.items()]


# ---------------------------------------------------------------------------
# Report output
# ---------------------------------------------------------------------------


def write_json_outputs(
    output_dir: Path, documents: list[dict[str, Any]], corpus: dict[str, Any]
) -> None:
    output_dir.mkdir(parents=True, exist_ok=True)

    (output_dir / "corpus-summary.json").write_text(json.dumps(corpus, indent=2) + "\n")

    (output_dir / "document-metrics.json").write_text(
        json.dumps(documents, indent=2) + "\n"
    )

    (output_dir / "worst-lines.json").write_text(
        json.dumps(corpus["worstLines"], indent=2) + "\n"
    )


def write_csv(path: Path, fieldnames: list[str], rows: list[dict[str, Any]]) -> None:
    with path.open("w", newline="") as f:
        writer = csv.DictWriter(f, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(rows)


def write_markdown_report(
    output_dir: Path,
    corpus: dict[str, Any],
    documents: list[dict[str, Any]],
    top: int,
    plots_written: list[str],
) -> None:
    non_final_count = corpus["nonFinalLineCount"]
    paragraph_count = corpus["paragraphCount"]

    lines: list[str] = []
    lines.append("# Line Break Metrics Report")
    lines.append("")
    lines.append("## Corpus Summary")
    lines.append("")
    lines.append("| Metric | Value |")
    lines.append("| --- | ---: |")
    lines.append(f"| Files | {corpus['fileCount']} |")
    lines.append(f"| Paragraphs | {paragraph_count} |")
    lines.append(f"| Total lines | {corpus['totalLineCount']} |")
    lines.append(f"| Non-final lines | {non_final_count} |")
    lines.append(
        f"| Mean r (non-final) | {fmt_number(corpus['nonFinalRatioSummary']['mean'])} |"
    )
    lines.append(
        f"| Std dev r (non-final) | {fmt_number(corpus['nonFinalRatioSummary']['standardDeviation'])} |"
    )
    lines.append(
        f"| Max r (non-final) | {fmt_number(corpus['nonFinalRatioSummary']['max'])} |"
    )
    lines.append(
        f"| Mean paragraph max r | {fmt_number(corpus['paragraphMaxRatioSummary']['mean'])} |"
    )
    lines.append(
        f"| Semantic compromise rate | {pct(corpus['semanticCompromise']['anyCount'], non_final_count)} |"
    )
    lines.append(
        f"| Strong compromise rate | {pct(corpus['semanticCompromise']['strongCount'], non_final_count)} |"
    )
    lines.append(
        f"| Adjacent incompatible pair rate | {pct(corpus['adjacentIncompatibleCount'], corpus['adjacentPairCount'])} |"
    )
    lines.append("")

    lines.append("## Ratio Thresholds")
    lines.append("")
    lines.append("| Threshold | Count | Share of non-final lines |")
    lines.append("| --- | ---: | ---: |")
    for label, count in corpus["ratioThresholdCounts"].items():
        lines.append(f"| {label} | {count} | {pct(count, non_final_count)} |")
    lines.append("")

    lines.append("## Paragraph Max Thresholds")
    lines.append("")
    lines.append("| Threshold | Count | Share of paragraphs |")
    lines.append("| --- | ---: | ---: |")
    for label, count in corpus["paragraphMaxThresholdCounts"].items():
        lines.append(f"| {label} | {count} | {pct(count, paragraph_count)} |")
    lines.append("")

    lines.append("## Break Penalty Counts")
    lines.append("")
    lines.append("| Break penalty cost | Count |")
    lines.append("| --- | ---: |")
    for item in corpus["breakPenaltyCounts"]:
        lines.append(f"| {item['cost']} | {item['count']} |")
    lines.append("")

    lines.append("## Worst Lines")
    lines.append("")
    lines.append("| Ratio | Break | File | Paragraph | Line |")
    lines.append("| ---: | ---: | --- | ---: | ---: |")
    for item in corpus["worstLines"][:top]:
        lines.append(
            f"| {fmt_number(item['ratio'])} | {item['breakPenaltyCost']} | {item['filePath']} | {item['paragraphIndex']} | {item['lineIndexInParagraph']} |"
        )
    lines.append("")

    def add_top_docs_section(
        title: str, docs: list[dict[str, Any]], metric_path: str
    ) -> None:
        lines.append(f"## {title}")
        lines.append("")
        lines.append("| Metric | File | Non-final lines |")
        lines.append("| ---: | --- | ---: |")
        for doc in docs:
            lines.append(
                f"| {fmt_number(get_nested(doc, metric_path))} | {doc['filePath']} | {doc['nonFinalLineCount']} |"
            )
        lines.append("")

    for metric_path, title in TOP_DOCUMENT_REPORTS:
        add_top_docs_section(
            title, top_documents(documents, metric_path, top), metric_path
        )

    if plots_written:
        lines.append("## Plots")
        lines.append("")
        for plot in plots_written:
            lines.append(f"- `{plot}`")
        lines.append("")

    (output_dir / "report.md").write_text("\n".join(lines) + "\n")


def write_csv_outputs(
    output_dir: Path, corpus: dict[str, Any], documents: list[dict[str, Any]]
) -> None:
    write_csv(
        output_dir / "documents.csv",
        [
            "filePath",
            "paragraphCount",
            "totalLineCount",
            "finalLineCount",
            "nonFinalLineCount",
            "nonFinalMean",
            "nonFinalStdDev",
            "nonFinalMax",
            "paragraphMaxMean",
            "paragraphMaxMax",
            "semanticCompromiseRate",
            "strongCompromiseRate",
            "adjacentIncompatibleCount",
            "adjacentPairCount",
        ],
        [
            {
                "filePath": doc["filePath"],
                "paragraphCount": doc["paragraphCount"],
                "totalLineCount": doc["totalLineCount"],
                "finalLineCount": doc["finalLineCount"],
                "nonFinalLineCount": doc["nonFinalLineCount"],
                "nonFinalMean": doc["nonFinalRatioSummary"]["mean"],
                "nonFinalStdDev": doc["nonFinalRatioSummary"]["standardDeviation"],
                "nonFinalMax": doc["nonFinalRatioSummary"]["max"],
                "paragraphMaxMean": doc["paragraphMaxRatioSummary"]["mean"],
                "paragraphMaxMax": doc["paragraphMaxRatioSummary"]["max"],
                "semanticCompromiseRate": doc["semanticCompromise"]["anyRate"],
                "strongCompromiseRate": doc["semanticCompromise"]["strongRate"],
                "adjacentIncompatibleCount": doc["adjacentIncompatibleCount"],
                "adjacentPairCount": doc["adjacentPairCount"],
            }
            for doc in documents
        ],
    )

    write_csv(
        output_dir / "worst_lines.csv",
        [
            "ratio",
            "breakPenaltyCost",
            "filePath",
            "paragraphIndex",
            "lineIndexInParagraph",
            "isParagraphFinalLine",
        ],
        corpus["worstLines"],
    )

    write_csv(
        output_dir / "break_penalty_counts.csv",
        ["cost", "count"],
        corpus["breakPenaltyCounts"],
    )

    write_csv(
        output_dir / "nonfinal_ratio_histogram.csv",
        ["label", "count"],
        corpus["nonFinalRatioHistogram"],
    )

    write_csv(
        output_dir / "ratio_threshold_counts.csv",
        ["threshold", "count"],
        mapping_rows(corpus["ratioThresholdCounts"], "threshold"),
    )

    write_csv(
        output_dir / "paragraph_max_threshold_counts.csv",
        ["threshold", "count"],
        mapping_rows(corpus["paragraphMaxThresholdCounts"], "threshold"),
    )


def write_plot_outputs(output_dir: Path, corpus: dict[str, Any]) -> list[str]:
    written: list[str] = []

    histogram = corpus["nonFinalRatioHistogram"]
    labels = [item["label"] for item in histogram]
    counts = [item["count"] for item in histogram]

    plt.figure(figsize=(12, 5))
    plt.bar(range(len(labels)), counts)
    plt.xticks(range(len(labels)), labels, rotation=45, ha="right")
    plt.ylabel("Line count")
    plt.title("Non-final adjustment ratio histogram")
    plt.tight_layout()
    plt.savefig(output_dir / "nonfinal_ratio_histogram.png", dpi=150)
    plt.close()
    written.append("nonfinal_ratio_histogram.png")

    thresholds = list(corpus["ratioThresholdCounts"].items())
    plt.figure(figsize=(8, 4))
    plt.bar([label for label, _ in thresholds], [count for _, count in thresholds])
    plt.ylabel("Line count")
    plt.title("Non-final ratio threshold counts")
    plt.tight_layout()
    plt.savefig(output_dir / "ratio_threshold_counts.png", dpi=150)
    plt.close()
    written.append("ratio_threshold_counts.png")

    return written


def write_report_outputs(
    output_dir: Path, documents: list[dict[str, Any]], corpus: dict[str, Any], top: int
) -> list[str]:
    output_dir.mkdir(parents=True, exist_ok=True)
    write_json_outputs(output_dir, documents, corpus)
    write_csv_outputs(output_dir, corpus, documents)
    plots_written = write_plot_outputs(output_dir, corpus)
    write_markdown_report(output_dir, corpus, documents, top, plots_written)
    return plots_written


# ---------------------------------------------------------------------------
# CLI
# ---------------------------------------------------------------------------


def main() -> int:
    parser = argparse.ArgumentParser(
        description="Summarize LINE_BREAK_METRICS_* records from a --silent-pdf log."
    )
    parser.add_argument("logfile", help="Path to the captured stdout/stderr log file")
    parser.add_argument(
        "--top",
        type=int,
        default=10,
        help="How many top documents/worst lines to print",
    )
    parser.add_argument(
        "--json-out",
        type=Path,
        help="Optional directory to write normalized JSON outputs into",
    )
    parser.add_argument(
        "--out",
        type=Path,
        help="Optional directory to write a Markdown report, CSV tables, JSON, and plots into",
    )
    args = parser.parse_args()

    raw_documents = load_raw_documents(Path(args.logfile))
    if not raw_documents:
        raise SystemExit("No LINE_BREAK_METRICS_DOCUMENT records found in the log.")

    documents = [build_document_metrics(raw) for raw in raw_documents]
    corpus = build_corpus_metrics(documents)

    print_corpus_summary(corpus)
    print_worst_lines(corpus, args.top)
    for metric_path, label in TOP_DOCUMENT_REPORTS:
        print_top_documents(documents, metric_path, label, args.top)

    if args.json_out is not None:
        write_json_outputs(args.json_out, documents, corpus)

    if args.out is not None:
        plots_written = write_report_outputs(args.out, documents, corpus, args.top)
        if plots_written:
            print(f"Wrote report outputs to {args.out}")

    return 0


if __name__ == "__main__":
    raise SystemExit(main())
