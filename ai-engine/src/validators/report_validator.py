import json
from pathlib import Path


REQUIRED_REPORT_FIELDS = [
    "schema_version",
    "content_type",
    "title",
    "summary",
    "competition",
    "season",
    "round",
    "best_scorer",
    "most_complete",
    "top_points",
    "top_rebounds",
    "top_assists",
    "top_performance"
]


def load_json(path: Path) -> dict:
    return json.loads(path.read_text(encoding="utf-8"))


def validate_generated_reports(reports_dir: Path) -> list[str]:
    """
    Validates generated reports:
    public/generated/reports/report_*.json
    """
    errors = []

    if not reports_dir.exists():
        return [f"Missing generated reports folder: {reports_dir}"]

    report_files = sorted(reports_dir.glob("report_*.json"))

    if not report_files:
        return [f"No generated report JSON files found in: {reports_dir}"]

    for report_file in report_files:
        try:
            report = load_json(report_file)
        except json.JSONDecodeError as error:
            errors.append(f"{report_file.name}: invalid JSON - {error}")
            continue

        for field in REQUIRED_REPORT_FIELDS:
            if field not in report:
                errors.append(f"{report_file.name}: missing field '{field}'")

        if report.get("content_type") != "stats_report":
            errors.append(
                f"{report_file.name}: content_type should be 'stats_report'"
            )

        if not isinstance(report.get("top_points", []), list):
            errors.append(f"{report_file.name}: top_points must be a list")

        if not isinstance(report.get("top_rebounds", []), list):
            errors.append(f"{report_file.name}: top_rebounds must be a list")

        if not isinstance(report.get("top_assists", []), list):
            errors.append(f"{report_file.name}: top_assists must be a list")

        if not isinstance(report.get("top_performance", []), list):
            errors.append(f"{report_file.name}: top_performance must be a list")

    return errors