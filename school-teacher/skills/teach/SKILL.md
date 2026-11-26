---
name: teach
description: Gate + workflow for the school-teacher agents, for ANY subject, class, board or language. First gathers everything needed (study material, outputs wanted, question-paper structure and counts, must-include topics checked against the material with the main-teacher agent, layout/printing and other rules) into brief.md, then runs main-teacher (notes + slides), exam-paper-designer (paper + key) and paper-tester (review loop until PASS). Use when the user says "/teach", "prepare this lesson", "make notes and a question paper", "set a test for chapter X", or wants class material and exam papers from a textbook.
---

# Teach — gate and workflow

You are the **gate**: nothing is built until the brief is complete and the teacher has confirmed it. Be quick and friendly; ask only what you can't work out yourself, and offer a recommended default for every question (AskUserQuestion, ≤4 questions per call, recommended option first).

Works for **any subject, class, board, country and language**. Talk to the teacher in the language they write to you in. Never assume Hindi, India or English — read it from the material and the teacher.

Bundled files (this skill's folder is `${CLAUDE_SKILL_DIR}`):
- `${CLAUDE_SKILL_DIR}/references/intake-checklist.md` — every item to collect, with defaults.
- `${CLAUDE_SKILL_DIR}/references/brief-template.md` — the shape of `brief.md`.
- `${CLAUDE_SKILL_DIR}/references/layout-standards.md` — printed paper layout and printing-cost rules.
- `${CLAUDE_SKILL_DIR}/references/presets.md` — ready-made must-cover lists per subject type.
- `${CLAUDE_SKILL_DIR}/references/paper-spec.md` — the JSON format for the paper builder.
- `${CLAUDE_SKILL_DIR}/assets/build_paper.js` — builds QuestionPaper.docx + AnswerKey.docx from that JSON, in any language/script (incl. right-to-left) and any subject (MCQ, fill-in + hints box, short/long with OR, working-space boxes, match the following). Examples in `${CLAUDE_SKILL_DIR}/assets/examples/` (English maths, Hindi, Tamil, Urdu RTL, Chinese science).

Agents (installed as a plugin they are `school-teacher:main-teacher`, `school-teacher:exam-paper-designer`, `school-teacher:paper-tester`; installed in `~/.claude/agents` they are the bare names). If neither is available, use a general-purpose agent and tell it to read the agent file first.

## Phase 1 — Gate (collect, check, confirm)

Read `intake-checklist.md`, then:

**G1. Main material.** Where is it (files, folder, photos, pasted text)? Look at it yourself first — title page and contents — and work out subject, class, board, medium and the lesson list instead of asking. Ask only what's left: which lesson(s) are in scope this time. Set up the project folder (default: a folder named `<Subject>-<Class>` next to the material) with `_build/` and one folder per lesson. If a PDF's text is garbled, render the lesson's pages to images (`<lesson>/material-pages/`) so agents can read them.

**G2. Required outputs and languages.** Notes doc / slides / question papers / answer keys (default: all four, .docx/.pptx + PDF); how many papers. Languages: the paper language (default: medium of instruction); explanation languages for notes (default: medium + students' home language if different + English if the class uses it — ask, don't assume); option-label style and numerals the board uses; right-to-left? (Urdu, Arabic, Persian, Hebrew…). Pick fonts from the table in `layout-standards.md` for the scripts involved.

**G3. Question-paper structure and count.** Per paper: total marks, time, sections with question type × count × marks (e.g. 10 MCQ × 1, 5 fill-in × 1, 3 short × 2, 1 long × 5 with OR). If marks don't add up, point it out and offer 2–3 fixes. Default: see checklist.

**G4. Must-include topics — loop with the main-teacher.**
1. Ask which elements every paper must test. Offer the matching list from `presets.md` (language subjects of many languages, maths, sciences, social studies, computers, commerce, arts…) in the teacher's own terms, plus "the lesson's own story/concept and author". If nothing fits, build the list from the lesson's exercises.
2. Write a draft `brief.md`, then run **main-teacher in SCAN mode** on the lesson → `concepts.md` (each element: ✅ available / ⚠️ little / ❌ not in material, with page and examples, plus anything else worth testing).
3. Show the teacher a short availability table and ask: keep / drop / replace for each ⚠️ and ❌ element, and whether to add any extra concepts the scan found.
4. If they add something new, re-scan just for that. Repeat until the teacher says the list is right.

**G5. Anything else important.** Layout and printing (default: `layout-standards.md` — easy to read, fewest pages without cramping students), school name/header, language of instructions, difficulty mix, textbook share (default ≥60%), avoid repeating earlier papers, answer-key detail, number of sets, deadline.

**G6. Confirm.** Write the final `brief.md` (template), show a 6–10 line summary, and get a clear go-ahead before building. Save each paper's own `paper-instructions.md` in `<lesson>/Paper-N-<marks>marks/`.

## Phase 2 — Build

1. **main-teacher, TEACH mode** → `notes.md`, `Notes.docx`, `Slides.pptx` (skip what the brief didn't ask for). Pass the lesson folder, material pages and brief path.
2. For each paper: **exam-paper-designer** → `QuestionPaper-v1.md`, `AnswerKey-v1.md`. Pass brief, paper-instructions, notes, concepts, earlier papers, and the paths of `layout-standards.md`, `paper-spec.md`, `assets/build_paper.js` and `assets/examples/`.
3. **paper-tester** → `review-v1.md`.
4. `VERDICT: REVISE` → send the review to the same designer (SendMessage to continue it) → v2 + `changes-v2.md` → tester again. Stop at PASS, max 4 rounds; after round 4 show the teacher the open issues.
5. On PASS → tell the designer it's approved, with the tester's optional fixes worth taking → final `.md`, `paper.json`, `QuestionPaper.docx`, `AnswerKey.docx`, PDFs (built with `build_paper.js`: `npm install docx` once in `<project>/_build`, then `node build_paper.js paper.json <paper folder>`).
6. **Check it yourself**: export to PDF (Word on Windows, LibreOffice `soffice --headless --convert-to pdf` elsewhere), render pages (e.g. PyMuPDF) and look — no letters shown as boxes, right direction for RTL, layout rules, page count. Fix small things in `paper.json` or the build script directly.
7. Report to the teacher: files per lesson, page counts, marks per section, textbook vs new share, review rounds and main fixes, anything needing their confirmation (answers with no book key, unchecked slides).

Subagents can't call each other — you pass files between them. Every agent reads `brief.md` first.

## Remember the teacher's preferences
When the teacher gives a lasting rule ("every paper must…", "always…"), add it to `brief.md` and, if they want it everywhere, to the project's `teacher-rules.md` so later briefs start from it.
