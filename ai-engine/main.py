import argparse
import re
from datetime import datetime, timezone
from pathlib import Path

from src.loaders.csv_loader import load_csv
from src.processors.stats_processor import calculate_performance_index, get_rankings
from src.generators.summary_generator import generate_summary
from src.generators.markdown_generator import generate_markdown
from src.exporters.report_exporter import export_json, export_markdown


BASE_DIR = Path(__file__).resolve().parent
PROJECT_ROOT = BASE_DIR.parent

RAW_DATA_DIR = BASE_DIR / "data" / "raw"
SITE_OUTPUT = PROJECT_ROOT / "public" / "generated" / "reports"

DEFAULT_PATTERN = "stats_*.csv"


def slugify_filename(text: str) -> str:
    text = text.lower().strip()
    text = re.sub(r"[^a-z0-9]+", "_", text)
    return text.strip("_")


def get_report_slug(csv_file: Path) -> str:
    """
    Example:
    stats_jornada_1.csv -> report_jornada_1
    """
    name = csv_file.stem

    if name.startswith("stats_"):
        name = name.replace("stats_", "", 1)

    return f"report_{slugify_filename(name)}"


def validate_dataframe(df, csv_file: Path) -> list[str]:
    errors = []

    required_columns = [
        "competition",
        "season",
        "round",
        "player",
        "team",
        "opponent",
        "points",
        "rebounds",
        "assists",
    ]

    if df.empty:
        errors.append(f"{csv_file.name}: CSV is empty")
        return errors

    for column in required_columns:
        if column not in df.columns:
            errors.append(f"{csv_file.name}: missing required column '{column}'")

    return errors


def safe_str(value) -> str:
    if value is None:
        return ""

    return str(value)


def safe_int(value) -> int:
    try:
        return int(value)
    except Exception:
        return 0


def safe_float(value) -> float:
    try:
        return float(value)
    except Exception:
        return 0.0


def build_json_data(title, csv_file, rankings, best_scorer, most_complete, summary):
    generated_at = datetime.now(timezone.utc).isoformat()

    return {
        "schema_version": "1.0",
        "content_type": "stats_report",
        "title": title,
        "source_file": str(csv_file),
        "generated_at": generated_at,
        "competition": safe_str(best_scorer["competition"]),
        "season": safe_str(best_scorer["season"]),
        "round": safe_str(best_scorer["round"]),
        "summary": summary,
        "best_scorer": {
            "player": safe_str(best_scorer["player"]),
            "team": safe_str(best_scorer["team"]),
            "opponent": safe_str(best_scorer["opponent"]),
            "points": safe_int(best_scorer["points"]),
        },
        "most_complete": {
            "player": safe_str(most_complete["player"]),
            "team": safe_str(most_complete["team"]),
            "opponent": safe_str(most_complete["opponent"]),
            "performance_index": safe_float(most_complete["performance_index"]),
        },
        "top_points": rankings["top_points"][
            ["player", "team", "opponent", "points"]
        ].to_dict(orient="records"),
        "top_rebounds": rankings["top_rebounds"][
            ["player", "team", "opponent", "rebounds"]
        ].to_dict(orient="records"),
        "top_assists": rankings["top_assists"][
            ["player", "team", "opponent", "assists"]
        ].to_dict(orient="records"),
        "top_performance": rankings["top_performance"][
            ["player", "team", "opponent", "performance_index"]
        ].to_dict(orient="records"),
    }


def generate_report_from_csv(csv_file: Path) -> bool:
    if not csv_file.exists():
        print(f"CSV file not found: {csv_file}")
        return False

    print(f"Generating report from: {csv_file.name}")

    df = load_csv(csv_file)

    validation_errors = validate_dataframe(df, csv_file)

    if validation_errors:
        print("Report validation failed:")
        for error in validation_errors:
            print(f"- {error}")
        return False

    df = calculate_performance_index(df)
    rankings = get_rankings(df)

    if rankings["top_points"].empty or rankings["top_performance"].empty:
        print(f"No ranking data available for: {csv_file.name}")
        return False

    best_scorer = rankings["top_points"].iloc[0]
    most_complete = rankings["top_performance"].iloc[0]

    title = f"Resumo da {best_scorer['round']} - {best_scorer['competition']}"
    summary = generate_summary(best_scorer, most_complete)

    markdown = generate_markdown(
        title,
        summary,
        best_scorer,
        most_complete,
        rankings
    )

    json_data = build_json_data(
        title,
        csv_file,
        rankings,
        best_scorer,
        most_complete,
        summary
    )

    report_slug = get_report_slug(csv_file)

    markdown_file = SITE_OUTPUT / f"{report_slug}.md"
    json_file = SITE_OUTPUT / f"{report_slug}.json"

    SITE_OUTPUT.mkdir(parents=True, exist_ok=True)

    export_markdown(markdown, markdown_file)
    export_json(json_data, json_file)

    print("Report generated successfully:")
    print(markdown_file)
    print(json_file)

    return True


def get_stats_files(pattern: str = DEFAULT_PATTERN) -> list[Path]:
    if not RAW_DATA_DIR.exists():
        return []

    return sorted(RAW_DATA_DIR.glob(pattern))


def main(file: str | None = None) -> None:
    SITE_OUTPUT.mkdir(parents=True, exist_ok=True)

    if file:
        csv_file = Path(file)

        if not csv_file.is_absolute():
            csv_file = BASE_DIR / file

        generate_report_from_csv(csv_file)
        return

    stats_files = get_stats_files()

    if not stats_files:
        print(f"No stats CSV files found in: {RAW_DATA_DIR}")
        print(f"Expected pattern: {DEFAULT_PATTERN}")
        return

    success_count = 0

    for csv_file in stats_files:
        success = generate_report_from_csv(csv_file)

        if success:
            success_count += 1

        print("")

    print("Stats report generation completed.")
    print(f"Reports generated: {success_count}/{len(stats_files)}")


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(
        description="Generate stats reports from raw CSV files."
    )

    parser.add_argument(
        "--file",
        help="Generate report from one specific CSV file. Example: data/raw/stats_jornada_1.csv"
    )

    return parser


if __name__ == "__main__":
    parser = build_parser()
    args = parser.parse_args()

    main(file=args.file)