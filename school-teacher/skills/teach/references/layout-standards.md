# Printed question paper — layout standards (any language, any subject)

Two goals, in this order: **1. easy for students to read and write in · 2. cheap to print (fewest pages).** Never trade (1) for (2).
Build with `assets/build_paper.js` (spec: `paper-spec.md`); it follows everything below.

## Easy to read and write
- **MCQ:** options BELOW the question in 2 rows — 1st/2nd option on row 1, 3rd/4th on row 2 — wide gap between columns. Long options: one per line. Answer bracket `(    )` at the end of the question line.
- **Rough work:** ~0.8–1 cm empty space after every objective question.
- **Fill in the blanks:** long blanks; NO word choices beside the question. All choices go in a small grey **hints** box at the END of the section (smaller font, numbered, two columns). The instruction says the hints are at the end.
- **Written answers:** ruled lines under the question — about 3 for a 2-mark answer, 8–10 for a 5-mark answer (match the "write in N lines" wording).
- **Long answer with a choice:** main question, centred "OR" word in the paper's language, second choice; marks at the line end.
- **Maths / numericals / diagrams / map work:** a dotted working-space box sized to the work (≈4 cm for a 3-mark sum, more for constructions, graphs, maps). Units asked for clearly. Diagrams as images, labelled.
- **Match the following:** a two-column table with answer brackets.
- One clear header bar per section with its marks.
- Underline only what a question calls "underlined"; bold for emphasis. **No italics** — they distort many scripts.

## Language and script
- **Everything printed is in the paper's language**: section names, option labels, "OR", "marks", hints title, header words (name, class, roll no., date), page numbers. Set them in `labels`.
- **Option labels follow the language's custom**: English (a)(b)(c)(d) · Hindi/Marathi/Sanskrit (अ)(आ)(इ)(ई) · Telugu (అ)(ఆ)(ఇ)(ఈ) · Tamil (அ)(ஆ)(இ)(ஈ) · Kannada (ಅ)(ಆ)(ಇ)(ಈ) · Malayalam (അ)(ആ)(ഇ)(ഈ) · Bengali (ক)(খ)(গ)(ঘ) · Gujarati (ક)(ખ)(ગ)(ઘ) · Punjabi (ੳ)(ਅ)(ੲ)(ਸ) · Odia (କ)(ଖ)(ଗ)(ଘ) · Urdu/Arabic (الف)(ب)(ج)(د) · Chinese/Japanese A. B. C. D. — or whatever the board uses; ask the teacher if unsure.
- **Right-to-left languages** (Urdu, Arabic, Persian, Hebrew, Sindhi, Kashmiri): set `"rtl": true`; the whole page mirrors (numbers and brackets on the correct side).
- **Mixed scripts** (e.g. a Hindi paper with a Telugu instruction line, or English terms in a Chinese science paper) are fine — choose fonts that cover all of them.
- **Fonts** (pick by script and by the computer that will open the file):

| Script | Windows | macOS | Any OS (free, Google Noto) |
|---|---|---|---|
| Latin, Greek, Cyrillic | Segoe UI / Calibri | Helvetica Neue | Noto Sans |
| Devanagari, Bengali, Gujarati, Gurmukhi, Odia, Tamil, Telugu, Kannada, Malayalam, Sinhala | Nirmala UI | Kohinoor / system Indic fonts | Noto Sans <Script> |
| Arabic, Urdu, Persian | Segoe UI (Urdu: Urdu Typesetting) | Geeza Pro | Noto Naskh Arabic / Noto Nastaliq Urdu |
| Hebrew | Segoe UI | Arial Hebrew | Noto Sans Hebrew |
| Chinese (Simplified / Traditional) | Microsoft YaHei / Microsoft JhengHei | PingFang SC / TC | Noto Sans SC / TC |
| Japanese | Yu Gothic | Hiragino Sans | Noto Sans JP |
| Korean | Malgun Gothic | Apple SD Gothic Neo | Noto Sans KR |
| Thai | Leelawadee UI | Thonburi | Noto Sans Thai |
| Ethiopic, other African | Ebrima | – | Noto Sans Ethiopic |

  In the spec: `"font": { "latin": ..., "complex": ... (Indic, Arabic, Hebrew, Thai), "eastAsia": ... (CJK) }`. After building, export to PDF and check no letters show as boxes.
- **Numerals**: use what the board uses (Western 0–9, Devanagari ०–९, Arabic-Indic ٠–٩, Urdu ۰–۹…). Be consistent within a paper.

## Cheap to print
- Header compact: school line, title line(s), one line for name / class / roll no. / date, one line for marks / time.
- Instructions: one short paragraph + one line in the students' home language if needed.
- Margins ~1.5 cm, A4 portrait (or the board's paper size), "page x / y" footer.
- No forced page breaks except to keep a section with its hints box; no nearly empty last page.
- Target ≤ 3 A4 pages for a 20–25 mark objective/short-answer paper; maths/science papers with working space may need more — never shrink working space to save a page.
- Report the page count after building.

## Answer key
- Tables: Q | answer | source (textbook p.__ / new) | element/concept | difficulty | note.
- Model answers + marking split for every written answer (e.g. any 2 correct points × 1; long answer content 3 + language 1 + presentation 1; numericals: formula 1 + working 1 + answer with unit 1).
- Element-coverage table and an honest note on overlap with earlier papers.
