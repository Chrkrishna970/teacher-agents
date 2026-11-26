# Paper spec for `assets/build_paper.js`

Write the approved paper as a JSON file, then build it:

```
cd <project>/_build
npm install docx          # once per project
node <skill>/assets/build_paper.js ../<Lesson>/Paper-1/paper.json ../<Lesson>/Paper-1
```

It writes `QuestionPaper.docx` (and `AnswerKey.docx` if `answerKey` is given). Then export to PDF and look at every page.
Ready examples in `assets/examples/`: `maths-english.json` (working space, match table, answer key), `hindi.json` (Devanagari + Telugu line), `tamil.json`, `urdu-rtl.json` (right-to-left), `science-chinese.json` (CJK).

## Top level
| key | meaning | default |
|---|---|---|
| `title`, `subtitle` | header lines | – |
| `totalMarks`, `time` | shown in the header | – |
| `font` | one name, or `{ "latin", "complex", "eastAsia" }` — see the font table in layout-standards.md | Segoe UI |
| `rtl` | `true` for Urdu, Arabic, Persian, Hebrew, Sindhi, Kashmiri… (mirrors the whole page) | false |
| `labels` | every word printed by the builder, in the paper's language — see below | English |
| `instructions` | list of short sentences (joined into one paragraph) | – |
| `instructions2` | one line in the students' home language | – |
| `marginCm`, `roughWorkCm`, `answerLineCm` | spacing | 1.5, 0.9, 0.95 |
| `sizes` | half-points `{ q, small, title, sub, head }` | 23, 19, 28, 24, 25 |
| `longOptionChars` | options longer than this print one per line | 30 |

`labels`: `options` (e.g. `["(a)","(b)","(c)","(d)"]`, `["(अ)","(आ)","(इ)","(ई)"]`, `["A.","B.","C.","D."]`, `["(الف)","(ب)","(ج)","(د)"]`), `or`, `marks`, `mark`, `hints`, `school`, `name`, `cls`, `roll`, `date`, `total`, `time`, `page`, `of`, `end`, `instructions`, `answerKey`.

## Sections
`{ "title", "marksText", "type", "instruction", "instruction2", "newPage", "questions": [...] }`

| type | question fields | prints |
|---|---|---|
| `mcq` | `q`, `options` (4), optional `oneOptionPerLine`, `image` | options in 2 rows, bracket at the line end, rough-work gap |
| `fill` | `before`, `after`, `hint` | blank, rough-work gap; all hints in a box at the section end (`hintsTitle` to rename) |
| `short` | `q`, `marks`, optional `or`, `lines` (section default 3) | ruled answer lines |
| `long` | `q`, `marks`, `or`, `lines` (section default 9) | "OR" choice + ruled lines |
| `work` | `q`, `marks`, `spaceCm` (section default 4), `image` | dotted working-space box — maths, numericals, diagrams, map work |
| `match` | `q`, `marks`, `left[]`, `right[]`, `leftTitle`, `rightTitle` | two-column table with answer brackets |

Text markup inside any string: `**bold**`, `__underlined__`. Maths: use Unicode (x², √, ½, ×, ÷, π, ≤, θ) — or put an equation/diagram image in `image: { "src": "fig1.png", "widthCm": 8, "heightCm": 5 }` (path relative to the JSON file).

## Answer key
`"answerKey": { "title", "notes": [..], "tables": [ { "title", "columns": [..], "widths": [twips..], "rows": [[..]] } ], "after": [..] }` — widths should add up to ~9900 (A4 with 1.5 cm margins).
