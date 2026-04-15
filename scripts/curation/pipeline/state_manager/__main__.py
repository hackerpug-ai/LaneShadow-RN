"""Allow running the state manager as a module.

    python -m scripts.curation.pipeline.state_manager <command>
"""

import sys
from scripts.curation.pipeline.state_manager.cli import main

sys.exit(main())
