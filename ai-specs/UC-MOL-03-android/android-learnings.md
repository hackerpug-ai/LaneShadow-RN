# UC-MOL-03 Android Learnings

- `ModalBottomSheet` can satisfy the task detent contract without a custom drag implementation by fixing the rendered sheet container to a named fraction of `LocalConfiguration.current.screenHeightDp.dp`.
- The new overlay molecules keep the atom-composition gate by routing title/body copy through `LSText`, dialog actions through `LSButton`, and the visible sheet shell through `LSGlassPanel`.
- Android overlay molecules need a strict bridge from the shipped motion surface: `chatOverlayEnter` resolves through `motion.duration.normal` plus `motion.easing.decelerate`, while `chatOverlayDismiss` keeps the shipped `fast` exit duration and a contract-owned 5000ms readable toast window.
- Once the toast readable lifetime moved to the named dismiss contract, the sandbox no longer needed the automatic re-trigger loop to keep the toast visible long enough to inspect.
