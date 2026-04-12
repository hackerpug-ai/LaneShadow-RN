"""Ground truth data loader for calibration.

Loads editorial ground truth data from JSONL files.
Sources: Rider Magazine Top 50, FHWA Scenic Byways.
"""

from dataclasses import dataclass
from pathlib import Path
from typing import Optional

from scripts.curation.pipeline.extraction.calibration import MIN_SAMPLE_SIZE


@dataclass
class GroundTruthRecord:
    """Editorial ground truth record for a route.

    Used for calibration - comparing pipeline scores against editorial rankings.
    """
    route_id: str
    name: str
    editorial_rank: int  # Lower is better (1 = best)
    source: str  # "rider_mag" | "fhwa_scenic"
    state: Optional[str] = None
    notes: Optional[str] = None

    def to_dict(self) -> dict:
        """Convert to dictionary format."""
        return {
            "route_id": self.route_id,
            "name": self.name,
            "editorial_rank": self.editorial_rank,
            "source": self.source,
            "state": self.state,
            "notes": self.notes,
        }


def load_ground_truth(path: Path) -> list[GroundTruthRecord]:
    """Load editorial ground truth from a JSONL file.

    Each line should be a JSON object with:
        route_id: str
        name: str
        editorial_rank: int (lower is better)
        source: str ("rider_mag" | "fhwa_scenic")
        state: str (optional)
        notes: str (optional)

    Args:
        path: Path to JSONL file containing ground truth records

    Returns:
        List of GroundTruthRecord objects

    Raises:
        AssertionError: If fewer than MIN_SAMPLE_SIZE records are loaded
        FileNotFoundError: If the file doesn't exist
        json.JSONDecodeError: If a line is not valid JSON
    """
    if not path.exists():
        raise FileNotFoundError(f"Ground truth file not found: {path}")

    records = []
    with open(path) as f:
        import json

        for line_num, line in enumerate(f, 1):
            line = line.strip()
            if not line:
                continue  # Skip empty lines

            try:
                data = json.loads(line)
            except json.JSONDecodeError as e:
                raise ValueError(
                    f"Invalid JSON on line {line_num} of {path}: {e}"
                ) from e

            # Validate required fields
            required_fields = ["route_id", "name", "editorial_rank", "source"]
            missing_fields = [
                field for field in required_fields if field not in data
            ]
            if missing_fields:
                raise ValueError(
                    f"Line {line_num} missing required fields: {missing_fields}"
                )

            record = GroundTruthRecord(
                route_id=data["route_id"],
                name=data["name"],
                editorial_rank=int(data["editorial_rank"]),
                source=data["source"],
                state=data.get("state"),
                notes=data.get("notes"),
            )
            records.append(record)

    if len(records) < MIN_SAMPLE_SIZE:
        raise AssertionError(
            f"Calibration requires >= {MIN_SAMPLE_SIZE} ground truth samples, "
            f"got {len(records)} from {path}"
        )

    return records
