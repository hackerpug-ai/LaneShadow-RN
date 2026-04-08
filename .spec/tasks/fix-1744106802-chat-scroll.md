# Fix: Chat View Scrolling Issue

**Created**: 2026-04-08T12:20:02Z
**Mode**: Quick
**Implementer**: frontend-designer
**Reviewer**: ui-reviewer

## Problem
The chat view won't let users scroll through messages. The auto-scroll logic in `ChatTranscript` automatically scrolls to the bottom whenever messages change (including streaming status updates), preventing manual scrolling through chat history.

## Root Cause
In `components/ui/chat-transcript.tsx`, the `useEffect` hook (lines 455-463) scrolls to bottom on every `messagesTracking` change, which includes status updates. This causes the scroll position to jump to the bottom even when the user is manually scrolling up to read previous messages.

## Acceptance Criteria
- Can manually scroll up through message history
- When user scrolls up, the view should stay at the scrolled position (not auto-scroll back down)
- Auto-scroll should only happen for new messages, not for existing message updates (like streaming status changes)

## Implementation Notes
The fix should:
1. Detect when the user is manually scrolling (user intent)
2. Only auto-scroll when new messages arrive, not when existing messages update
3. Respect user's scroll position when they're actively reading through history

Consider tracking whether the user is near the bottom and only auto-scrolling if they are, or detecting user scroll intent and disabling auto-scroll when the user scrolls up manually.
