# Teacher Agents for Claude Code

A small "teaching staff" for [Claude Code](https://code.claude.com): give it a textbook (PDF, photos or text) for **any subject, class, board or language**, and it prepares:

Any language (including right-to-left scripts like Urdu and Arabic, and Chinese/Japanese/Korean), any subject (languages, maths, sciences, social studies, computers, commerce…), any board or country.

- **Notes** (`Notes.docx`) — child-friendly, interactive, with explanations in the languages you choose (e.g. a Hindi lesson explained in Telugu and English, a science lesson explained in Urdu)
- **Slides** (`Slides.pptx`) for the classroom
- **Question papers + answer keys** (`.docx` + PDF) — easy for students to read and write in, and cheap to print

## Who does what

| | Role | What it does |
|---|---|---|
| 🚪 | **`/school-teacher:teach`** (gate skill) | Asks for everything needed — material, outputs, paper structure and counts, must-include topics, layout/printing and other rules — checks the topics against the material with the Main Teacher, writes `brief.md`, then runs the agents below |
| 1 | **main-teacher** | *Scan mode:* lists which concepts/topics the lesson really has. *Teach mode:* writes the notes, Notes.docx and Slides.pptx |
| 2 | **exam-paper-designer** | Writes the paper and answer key — textbook questions first, then new ones; covers every must-include topic; builds the Word/PDF files once approved |
| 3 | **paper-tester** | Takes the test as a student, checks every question and answer, sends a review back; loops with the designer until `VERDICT: PASS` |

```
teacher ──► gate (/teach) ──► brief.md
                │  ▲
                ▼  │  "is this topic in the lesson?"  (loop)
          main-teacher (scan → concepts.md)
                │
                ▼
          main-teacher (teach → notes, Notes.docx, Slides.pptx)
                │
                ▼
     exam-paper-designer ⇄ paper-tester   (until PASS)
                │
                ▼
     QuestionPaper.docx/.pdf + AnswerKey.docx/.pdf
```

## Install

In a Claude Code session (terminal, desktop app Code tab, or IDE):

```
/plugin marketplace add Chrkrishna970/teacher-agents
/plugin install school-teacher@teacher-agents
```

From a local copy of this folder instead: `/plugin marketplace add ./Teacher-Agents`.

Then start with:

```
/school-teacher:teach
```

and point it at your textbook.

**Needs:** Claude Code; Node.js 18+ (for building .docx/.pptx); fonts for your language's script (built into Windows/macOS for most languages, or free [Google Noto](https://fonts.google.com/noto) fonts). Python with PyMuPDF helps to read PDFs whose text is garbled (legacy fonts). Microsoft Word or LibreOffice is used to export and check PDFs.

## Tested

The paper builder has been checked by printing to PDF in: English (maths, with working-space boxes and match-the-following), Hindi + Telugu, Tamil, Urdu (right-to-left) and Chinese (science). The examples are in `school-teacher/skills/teach/assets/examples/`.

## Customising

- `school-teacher/skills/teach/references/presets.md` — must-include topic lists: generic language list plus Hindi, Sanskrit, Telugu, Tamil, other Indian languages, Urdu/Arabic/Persian, English, foreign languages; Maths; Science (Physics, Chemistry, Biology); Social studies; Computers; Commerce; Arts/PE. Add your own.
- `school-teacher/skills/teach/references/layout-standards.md` — printed layout, printing-cost rules, option labels per language, right-to-left, font table per script.
- `school-teacher/skills/teach/assets/build_paper.js` + `references/paper-spec.md` — the paper/answer-key builder and its JSON format.
- `school-teacher/agents/*.md` — the three agents' instructions.

Standing rules a teacher gives ("every paper must include…") go into the project's `brief.md` / `teacher-rules.md`, so they apply to later papers automatically.
