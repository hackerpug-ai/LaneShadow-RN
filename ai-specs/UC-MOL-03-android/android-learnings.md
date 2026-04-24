# UC-MOL-03 Android Learnings

- `ModalBottomSheet` can satisfy the task detent contract without a custom drag implementation by fixing the rendered sheet container to a named fraction of `LocalConfiguration.current.screenHeightDp.dp`.
- The new overlay molecules keep the atom-composition gate by routing title/body copy through `LSText`, dialog actions through `LSButton`, and the visible sheet shell through `LSGlassPanel`.
- The sandbox toast stories need an automatic re-trigger loop because the motion token backing `chatOverlayDismiss` resolves to a very short duration in the current token set.
