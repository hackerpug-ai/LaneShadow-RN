# Epic 4: Session Management

> Epic Sequence: 4
> PRD: .spec/prds/v1/
> Tasks: 3

## Overview

Enable persistent planning sessions: start new sessions, browse history in sidebar, resume previous sessions. Sessions work like ChatGPT threads — each session is an independent conversation about a ride plan.

## Human Test Steps

When this epic is complete, users should be able to:

1. Plan a ride ("coastal 2-hour loop") — verify session created
2. Tap "New Session" — verify map clears and chat resets
3. Plan different ride in new session
4. Open sidebar — verify both sessions listed
5. Verify titles auto-generated from first messages
6. Tap first session — verify routes restore on map
7. Close and reopen app — verify most recent session loads

## Acceptance Criteria (from PRD)

- Rider can tap "New Session" button to start a fresh planning conversation (UC-AG-09)
- Starting a new session clears map polylines and resets chat input
- Rider can access session history via slide-out sidebar (left swipe or hamburger)
- Session sidebar shows auto-generated title, date, and route count per session
- Rider can tap a session to resume it, restoring routes and chat history
- Sessions persist across app launches
- Most recent active session loads automatically on app open

## PRD Sections Covered

- UC-AG-09: Manage chat sessions

## Dependencies

- **Depends on**: Epic 1 (Phase 0 Remediation), Epic 2 (Chat Infrastructure)
- **Blocks**: Epic 7

## Task List

| Task ID | Title | Type | Priority | Blocked By |
|---------|-------|------|----------|------------|
| US-019 | Implement useChatSession hook with session CRUD | FEATURE | P0 | Epic 2 |
| US-020 | Implement useSessionHistory and integrate SessionSidebar | FEATURE | P0 | Epic 2 |
| US-021 | Wire NewSessionButton and session clearing logic | FEATURE | P0 | Epic 2 |
