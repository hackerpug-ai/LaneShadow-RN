# `refs/` is being deprecated — see `views/<screen>/<state>/`

The per-state design reference PNGs and annotations that lived here have moved to:

    .spec/design/system/views/<screen>/<state>/

Each state now has its own subfolder containing the .light.png, .dark.png (where designed), and .annotations.json file plus a per-state README.

The new structure is canonical per .spec/prds/v3-integration/SITE-MAP.md.

This redirect will be removed once all consumers (design-review pipeline scripts, sandbox sandboxes, capture tests) have migrated.
