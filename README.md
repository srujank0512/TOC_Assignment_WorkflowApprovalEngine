# Workflow Approval Engine

A Vercel-ready static web application that simulates a **Workflow Approval Engine** using **Finite State Machine (FSM)** ideas from **Theory of Computation**.

## Core Idea
This project models a real-life approval system as a machine with:
- **States**: Submitted, Under Review, Escalated, Approved, Rejected, Reopened
- **Transitions**: review, escalate, approve, reject, reopen, resubmit
- **Terminal outcomes**: Approved and Rejected

## Features
- Attractive dashboard-style interface
- Finite state machine diagram
- Request creation form
- Request filtering by workflow type and state
- Step-by-step state transition controls
- Demo auto-run path
- Transition history log
- ToC concept mapping section for viva explanation

## Files
- `index.html` – structure
- `styles.css` – UI and layout
- `script.js` – FSM logic and interactions
- `vercel.json` – Vercel deployment config

## Run locally
You can open `index.html` directly, or use a local server.

### Python
```bash
python -m http.server 8000
```
Then open:
```text
http://localhost:8000
```

## Deploy on Vercel
1. Upload the folder to GitHub or drag-drop it into Vercel.
2. Since this is a static project, no build command is required.
3. Deploy directly.

## ToC Explanation
- **State** = current status of a request
- **Input symbol / action** = reviewer or system action
- **Transition** = legal movement from one state to another
- **Accepting / terminal state** = final decision state

This makes the project both practical and strongly connected to Theory of Computation.
