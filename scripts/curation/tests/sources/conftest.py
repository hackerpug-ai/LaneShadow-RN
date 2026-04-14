"""pytest configuration for sources tests.

This conftest intentionally shadows the parent tests/conftest.py to prevent
its 'from pipeline.models import ...' (relative package import that only works
when pytest is run from scripts/curation/) from failing when tests are run from
the project root with PYTHONPATH=$(pwd).

Also adds scripts/curation to sys.path so that both import styles work:
  - from scripts.curation.pipeline... (absolute, from repo root)
  - from pipeline...                   (relative, from scripts/curation/)
"""

import sys
from pathlib import Path

# Ensure scripts/curation is on sys.path so parent conftest can import 'pipeline.models'
_SCRIPTS_CURATION = str(Path(__file__).resolve().parent.parent.parent)
if _SCRIPTS_CURATION not in sys.path:
    sys.path.insert(0, _SCRIPTS_CURATION)
