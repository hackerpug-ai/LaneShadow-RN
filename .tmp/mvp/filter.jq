"cycle=\(.cycle)",
"addressed: \([.findings[] | select(.status == "addressed")] | length)",
"open: \([.findings[] | select(.status == "open")] | length)"
