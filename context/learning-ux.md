# Learning UX (study, assistant, revisions)

Design intent for how learners move through ACUMEN. Update this when study/home
assistant behavior changes.

## AI assistant picker

- Settings → **AI assistant**: `cat` | `dog` | `icon` | `robot`
- Stored in AsyncStorage `assistant_id_v1` (`lib/settings.ts`, `AssistantContext`)
- **Cat (Auri)** = full sprite set (`AuriMascot`)
- **Dog / icon / robot** = placeholder Ionicons badges (`AssistantAvatar`) until art ships
- Floating companion, welcome screen, dialogue header use the selected assistant name

## Voice feedback

- Settings toggle `voice_feedback_enabled_v1` (default off)
- `expo-speech` via `lib/voice.ts` → `speakFeedback` / `stopSpeaking`
- Speaks study bullet summary, question/answer on flip, right/wrong cues, session wrap-up

## Study session flow

Phases in `hooks/useStudySession.ts`:

1. **notes** — AI teaching bullets when present (`What you'll learn:` on the deck), else card backs (`lib/studyNotes.ts`)
2. **studying** — flip flashcard → “Did you get it right?” → Got it wrong / Got it right
3. **complete** — XP + stats + **“Ready to take a quiz?”** CTA → `/quiz/[deckId]`

Wrong cards are re-queued in-session. Misses also write `card_reviews` (signed-in).

### Generate: teach style

On Generate (study mode), optional field **“How should the AI teach?”** merges into
`customPrompt` as `Teach style for study notes: …` so the pipeline biases card content
toward the user’s teaching preference.

### Generate wait game

While cards are generated (plan + dual OSS models + judge), the Generate screen
switches to **Hop** — tap to jump a runner over blocks (`components/generate/WaitGame.tsx`).
Original game; not a clone of Flappy Bird or Chrome dino.

## Homepage revision

- After a study session completes, save `last_studied_topic_v1` (`lib/weakPoints.ts`)
- Home shows **Revision** nudge if studied within ~36h and not dismissed today:
  “Quiz yourself on {title}?”
- Dismiss stores `revision_nudge_dismissed_day_v1` for the calendar day

## Weak points

- **Definition**: cards marked wrong in `card_reviews` (`was_correct = false`)
- Home **Weak points** section: `fetchPracticeMix` — mostly weaks, can sprinkle recent
  corrects; Fisher–Yates shuffle so order is **not** the same every login.
  Also gated ~75% of days (hash of userId+date) so the strip is not forced every login.
- Separate from **Needs practice** (deck-level quiz average &lt; 70% via gamification)

### Study notes vs card backs

Study sessions prefer AI **teaching bullets** stored in the deck description
under `What you'll learn:` (generated in `enrich.py`). Fallback is still
deriving bullets from card backs.

Quiz options prefer per-card **LLM distractors** (persisted after a marker in
`cards.back`, decoded in `lib/cardPayload.ts`). Fallback is other card backs.

| Area | Path |
|------|------|
| Assistant ids | `constants/assistants.ts` |
| Avatar | `components/mascot/AssistantAvatar.tsx` |
| Study hook | `hooks/useStudySession.ts` |
| Study UI | `app/study/[deckId].tsx` |
| Teach prompt | `app/generate.tsx` |
| Revision / weaks | `lib/weakPoints.ts`, `components/home/RevisionNudge.tsx`, `WeakPointPractice.tsx` |
| Voice | `lib/voice.ts` |
