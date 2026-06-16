.cycle = 3
| .reviewers_this_cycle = []
| .findings |= map(
    if .id == "RF-019" or .id == "RF-020" then
      .status = "addressed"
    else . end
  )
