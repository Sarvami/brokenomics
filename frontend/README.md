# Brokenomics — Frontend

> Finance education for Gen Z India. Built for a hackathon. No jargon, no boredom.

React + Vite frontend for the Brokenomics personal finance co-pilot. Pairs with the FastAPI backend in `../backend`.

---

## Tech Stack

| Layer | Library |
|---|---|
| Framework | React 19 + Vite 8 |
| Styling | Tailwind CSS v4 (`@tailwindcss/vite`) |
| Animation | Framer Motion 12 |
| Icons | Phosphor React |
| Routing | React Router v7 |
| Fonts | Bebas Neue (headlines) + Space Grotesk (body) via Google Fonts |

---

## Project Structure

```
src/
├── components/
│   ├── auth/          AuthModal.jsx
│   ├── bento/         BentoGrid.jsx          ← topic sub-topic selector
│   ├── carousel/      SubTopicCarousel.jsx    ← (legacy, kept for ref)
│   ├── chat/          FloatingChat, ChatMessage, FollowupChips, GlobalChat
│   ├── flashcard/     FlashcardCard, FlashcardGrid
│   ├── journey/       JourneyView, JourneyStep, JargonTooltip, MemeSlot
│   ├── quiz/          QuizModal.jsx
│   └── sidebar/       LeftPanel.jsx
├── context/
│   └── AuthContext.jsx                        ← JWT in-memory, never localStorage
├── hooks/
│   ├── useAuth.js
│   ├── useChat.js
│   └── useTopics.js                           ← static topic data + API merge
├── lib/
│   └── api.js                                 ← fetch wrapper, all API calls
└── pages/
    ├── Home.jsx                               ← landing → grid → topic screens
    └── JourneyPage.jsx
```

---

## Getting Started

### Prerequisites

- Node.js 18+
- Backend running at `http://localhost:8000` (or update `API_BASE` in `src/lib/api.js`)

### Install & run

```bash
cd frontend
npm install
npm run dev
```

App runs at `http://localhost:5173`.

### Build

```bash
npm run build
```

---

## App Flow

```
Landing page
  ├── Get Started → Auth Modal (login / register)
  └── Continue as Guest → silently creates local guest state

Flashcard Grid  (3×2, all 6 topics visible at once)
  └── Click card → topic zoom transition

Topic Page  (bento grid of sub-topics)
  └── Click sub-topic
        ├── Quiz already done? → skip → Journey View
        └── First time? → Quiz Modal (2-3 questions)
                              └── Save answers to localStorage (key: quiz_<topicId>)
                                    └── Journey View

Journey View
  ├── Vertical flowchart with 5 steps
  ├── Jargon terms underlined with tooltip
  ├── MemeSlot placeholders every 3rd step
  └── Completion section at bottom
        ├── Open Groww →
        ├── Open Zerodha →
        └── Explore more in [topic]
```

---

## Key Design Decisions

**Auth** — JWT is stored in module-level memory (`src/lib/api.js`), never `localStorage` or `sessionStorage`. Guest sessions fall back silently if the backend is unreachable — the user can still browse everything.

**Quiz once per topic** — After completing the quiz for a topic, answers are written to `localStorage` under `quiz_<topicId>`. On next visit the quiz is skipped. A "retake personalisation quiz" link at the bottom of each topic page clears the key.

**Static content fallback** — `useTopics.js` ships all 6 topics with real copy, colors and sub-topics. The API merge is additive — local design data (colors, teasers, emoji) is never overwritten by the API response.

**No cursor gradient** — Background is static `#0F0F14`. Dynamic effects were removed for performance and visual cleanliness.

---

## Topic Color Palette

| Topic | Card bg | Accent |
|---|---|---|
| Mutual Funds | `#1A0505` | `#C0392B` |
| Stocks & Trading | `#05051A` | `#1A56DB` |
| Banking | `#051A05` | `#27AE60` |
| Loans & Credit | `#1A0A05` | `#C05621` |
| Taxes & Saving | `#0A051A` | `#6B21A8` |
| Investing 101 | `#1A0505` | `#E74C3C` |

---

## API Integration

All calls go through `src/lib/api.js`. Base URL defaults to `http://localhost:8000/api/v1`.

```js
// Change this to point at your deployed backend
const API_BASE = 'http://localhost:8000/api/v1';
```

Auth token is injected automatically via `setAuthToken()` / `getAuthToken()`. Protected endpoints receive `Authorization: Bearer <token>`.

---

## Component Notes

### `FlashcardCard`
- Hover → 3D `rotateY` flip (Framer Motion). Back face = solid topic accent color.
- Click → navigates directly to topic zoom transition (no lightbox).
- Cards are exactly `280×320px` inside a strict `3×2` CSS grid.

### `BentoGrid`
- CSS grid `repeat(3, 1fr)` with `gridAutoRows: 140px`.
- Span pattern: wide (col-span 2), tall (row-span 2), small, small, tall, small.
- Hover brightens background by one shade + adds accent glow.

### `JourneyView`
- Vertical connecting line at `left: 19px` (aligned to circle center), `width: 2px`.
- Completion screen auto-shows 1.2s after steps load with action cards linking to Groww and Zerodha.

### `GlobalChat`
- Floating button bottom-right on every page (56px circle, gradient bg).
- Panel: `width: 320px`, `min-height: 200px`, `max-height: 520px`.
- Offline message: *"our servers are napping rn 😴 try again in a bit"*.

### `AuthModal`
- Background `#13131A`, gradient border (purple → teal).
- Inputs: `#1E1E2E`, focus ring in `#6C63FF`.
- Sign-in button: `linear-gradient(135deg, #6C63FF, #00BCD4)`.

---

## Linting

```bash
npm run lint
```
