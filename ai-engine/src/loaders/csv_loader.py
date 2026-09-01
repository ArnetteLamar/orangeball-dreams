import pandas as pd
from pathlib import Path


def load_csv(file_path: Path):
    if not file_path.exists():
        raise FileNotFoundError(f"CSV não encontrado: {file_path}")

    return pd.read_csv(file_path)