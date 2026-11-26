// build_paper.js — generic question-paper + answer-key builder (any language, any subject).
// Usage:  node build_paper.js paper.json [outDir]
// Needs:  Node 18+, `npm install docx` (run npm in your project's _build folder).
// The JSON spec is described in references/paper-spec.md; examples are in assets/examples/.
// Layout rules (references/layout-standards.md): options in 2 rows, rough-work gaps, hints box at the
// end of fill-in sections, ruled answer lines, working-space boxes, fewest pages without cramping.
const fs = require('fs');
const path = require('path');
const {
  Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell, WidthType, AlignmentType,
  BorderStyle, TabStopType, ShadingType, Footer, PageNumber, UnderlineType, ImageRun,
} = require('docx');

const specPath = process.argv[2];
if (!specPath) { console.error('usage: node build_paper.js paper.json [outDir]'); process.exit(1); }
const S = JSON.parse(fs.readFileSync(specPath, 'utf8'));
const OUT = path.resolve(process.argv[3] || S.outDir || path.dirname(specPath));
const BASE = path.dirname(path.resolve(specPath));

// ---------- language / script settings ----------
const RTL = !!S.rtl;
const f = typeof S.font === 'string' ? { latin: S.font, complex: S.font, eastAsia: S.font } : (S.font || {});
const FONT = {
  ascii: f.latin || 'Segoe UI', hAnsi: f.latin || 'Segoe UI',
  cs: f.complex || f.latin || 'Segoe UI', eastAsia: f.eastAsia || f.latin || 'Segoe UI',
};
const L = Object.assign({
  options: ['(a)', '(b)', '(c)', '(d)'], or: 'OR', marks: 'marks', mark: 'mark',
  hints: 'Hints – choose the right word', school: '(School name)', name: 'Name', cls: 'Class',
  roll: 'Roll No.', date: 'Date', total: 'Total marks', time: 'Time', page: 'Page', of: '/',
  end: '*** All the best ***', instructions: 'Instructions', answerKey: 'Answer Key',
}, S.labels || {});
const SZ = Object.assign({ q: 23, small: 19, title: 28, sub: 24, head: 25 }, S.sizes || {}); // half-points
const NO_ITALIC = true; // italics distort many non-Latin scripts in Word; never used

// ---------- page geometry ----------
const PAGE_W = 11906, PAGE_H = 16838;                         // A4 portrait, twips
const MARGIN = Math.round((S.marginCm || 1.5) * 567);
const CW = PAGE_W - 2 * MARGIN;
const ROUGH = Math.round((S.roughWorkCm == null ? 0.9 : S.roughWorkCm) * 567);
const LINE_GAP = Math.round((S.answerLineCm || 0.95) * 567);

// ---------- text helpers ----------
// inline markup: **bold**  __underline__
function parse(str) {
  const out = [];
  const re = /(\*\*[^*]+\*\*|__[^_]+__)/g;
  let last = 0, m;
  while ((m = re.exec(str))) {
    if (m.index > last) out.push({ t: str.slice(last, m.index) });
    const s = m[0];
    out.push(s.startsWith('**') ? { t: s.slice(2, -2), b: true } : { t: s.slice(2, -2), u: true });
    last = m.index + s.length;
  }
  if (last < str.length) out.push({ t: str.slice(last) });
  return out;
}
function runs(segs, base = {}) {
  if (!Array.isArray(segs)) segs = [segs];
  const flat = [];
  segs.forEach(s => {
    if (typeof s === 'string') flat.push(...parse(s));
    else if (s && s.t !== undefined && !s.b && !s.u && typeof s.t === 'string' && /\*\*|__/.test(s.t)) flat.push(...parse(s.t));
    else flat.push(s);
  });
  return flat.map(s => {
    if (s.tab) return new TextRun({ text: '\t', font: FONT, size: base.size || SZ.q, rightToLeft: RTL });
    return new TextRun({
      text: s.t, font: FONT, size: s.size || base.size || SZ.q,
      bold: s.b !== undefined ? s.b : base.b, italics: NO_ITALIC ? false : undefined,
      color: s.color || base.color, rightToLeft: RTL,
      underline: s.u ? { type: UnderlineType.SINGLE } : undefined,
    });
  });
}
const START = RTL ? AlignmentType.RIGHT : AlignmentType.LEFT;
function P(segs, o = {}) {
  return new Paragraph({
    children: o.children || runs(segs, o),
    alignment: o.align || START,
    bidirectional: RTL,
    spacing: { before: o.before || 0, after: o.after !== undefined ? o.after : 60, line: o.line || 276 },
    indent: o.indent, tabStops: o.tabs, keepNext: o.keepNext, keepLines: true,
    border: o.border, shading: o.shading, pageBreakBefore: o.pageBreakBefore,
  });
}
const END_TAB = [{ type: TabStopType.RIGHT, position: CW }];
const noB = { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' };
const thin = { style: BorderStyle.SINGLE, size: 4, color: '808080' };
const box4 = b => ({ top: b, bottom: b, left: b, right: b });
const hr = () => P('', { after: 80, border: { bottom: { style: BorderStyle.SINGLE, size: 8, color: '000000', space: 1 } } });
const ind = (n) => (RTL ? { right: n } : { left: n });
const hang = (n) => (RTL ? { right: n, hanging: n } : { left: n, hanging: n });

function oneCellTable(children, o = {}) {
  return new Table({
    width: { size: CW, type: WidthType.DXA }, columnWidths: [CW], visuallyRightToLeft: RTL,
    rows: [new TableRow({ cantSplit: true, height: o.height ? { value: o.height, rule: 'atLeast' } : undefined,
      children: [new TableCell({
        width: { size: CW, type: WidthType.DXA }, borders: box4(o.border || thin),
        shading: o.fill ? { type: ShadingType.CLEAR, color: 'auto', fill: o.fill } : undefined,
        margins: { top: 100, bottom: 100, left: 160, right: 160 }, children,
      })] })],
  });
}
function table(widths, rows, o = {}) {
  return new Table({
    width: { size: widths.reduce((a, b) => a + b, 0), type: WidthType.DXA }, columnWidths: widths, visuallyRightToLeft: RTL,
    rows: rows.map((r, ri) => new TableRow({
      tableHeader: o.header && ri === 0, cantSplit: true,
      children: r.map((c, ci) => new TableCell({
        width: { size: widths[ci], type: WidthType.DXA },
        margins: { top: 50, bottom: 50, left: 90, right: 90 },
        shading: o.header && ri === 0 ? { type: ShadingType.CLEAR, color: 'auto', fill: 'E7E6E6' } : undefined,
        borders: o.borders || box4(thin),
        children: [P(String(c), { size: o.size, b: o.header && ri === 0, after: 0 })],
      })),
    })),
  });
}
function image(spec) {
  const p = path.resolve(BASE, spec.src);
  const ext = path.extname(p).slice(1).toLowerCase();
  const wcm = spec.widthCm || 8, hcm = spec.heightCm || 5;
  return new Paragraph({ alignment: AlignmentType.CENTER, spacing: { before: 40, after: 60 }, keepNext: true,
    children: [new ImageRun({ type: ext === 'jpg' ? 'jpg' : ext, data: fs.readFileSync(p),
      transformation: { width: Math.round(wcm * 37.8), height: Math.round(hcm * 37.8) } })] });
}

// ---------- blocks ----------
const BR = '(          )';
const sectionHead = (sec) => P([{ t: sec.title, b: true }, { tab: true }, { t: sec.marksText || '', b: true }],
  { tabs: END_TAB, before: 140, after: 50, size: SZ.head, keepNext: true, pageBreakBefore: !!sec.newPage,
    shading: { type: ShadingType.CLEAR, color: 'auto', fill: 'E7E6E6' } });
function sectionIntro(sec) {
  const out = [];
  if (sec.instruction) out.push(P([{ t: sec.instruction, b: true }], { after: 20, keepNext: true }));
  if (sec.instruction2) out.push(P(sec.instruction2, { size: SZ.small + 1, after: 80, keepNext: true, color: '333333' }));
  return out;
}
let qno = 0;
const num = (q) => { qno = q.n || qno + 1; return `${qno}. `; };
function qLine(q, right) {
  const segs = [{ t: num(q), b: true }, ...(Array.isArray(q.q) ? q.q : [q.q])];
  if (right) segs.push({ tab: true }, right);
  return P(segs, { tabs: END_TAB, keepNext: true, before: 60, after: 60, indent: hang(360) });
}
function mcq(q) {
  const out = [qLine(q, BR)];
  if (q.image) out.push(image(q.image));
  const opts = q.options;
  const long = q.oneOptionPerLine || opts.some(o => o.length > (S.longOptionChars || 30));
  if (!long && opts.length === 4) {
    const col2 = 360 + Math.floor((CW - 360) / 2);
    const tabs = [{ type: TabStopType.LEFT, position: col2 }];
    out.push(P([`${L.options[0]} ${opts[0]}`, { tab: true }, `${L.options[1]} ${opts[1]}`], { indent: ind(720), tabs, after: 50, keepNext: true }));
    out.push(P([`${L.options[2]} ${opts[2]}`, { tab: true }, `${L.options[3]} ${opts[3]}`], { indent: ind(720), tabs, after: ROUGH }));
  } else {
    opts.forEach((o, i) => out.push(P(`${L.options[i] || `(${i + 1})`} ${o}`, { indent: ind(720), after: i < opts.length - 1 ? 40 : ROUGH, keepNext: i < opts.length - 1 })));
  }
  return out;
}
const blank = '____________________';
function fill(q) {
  return [P([{ t: num(q), b: true }, q.before || '', blank, q.after || ''], { before: 60, after: ROUGH, indent: hang(360), keepNext: !!q.keepNext })];
}
function hintsBox(sec) {
  const list = sec.questions.filter(q => q.hint).map(q => [q.n, q.hint]);
  if (!list.length) return [];
  const half = Math.ceil(list.length / 2), col2 = Math.floor(CW / 2);
  const kids = [P([{ t: sec.hintsTitle || L.hints, b: true }], { size: SZ.small, after: 60, keepNext: true })];
  for (let i = 0; i < half; i++) {
    const a = list[i], b = list[i + half];
    kids.push(P([`${a[0]}. ${a[1]}`, ...(b ? [{ tab: true }, `${b[0]}. ${b[1]}`] : [])],
      { size: SZ.small, color: '444444', tabs: [{ type: TabStopType.LEFT, position: col2 }], after: 30, keepNext: i < half - 1 }));
  }
  return [oneCellTable(kids, { fill: 'F5F5F5' }), P('', { after: 60 })];
}
// ruled answer lines: a borderless table whose rows have only a bottom line
// (Word merges identical paragraph borders into one box, so paragraphs can't be used for this)
function ruled(n) {
  const line = { style: BorderStyle.SINGLE, size: 4, color: '999999' };
  const rows = [];
  for (let i = 0; i < n; i++) rows.push(new TableRow({ cantSplit: true, height: { value: LINE_GAP, rule: 'exact' },
    children: [new TableCell({ width: { size: CW, type: WidthType.DXA },
      borders: { top: noB, left: noB, right: noB, bottom: line }, children: [P('', { after: 0, keepNext: i < n - 1 })] })] }));
  return [new Table({ width: { size: CW, type: WidthType.DXA }, columnWidths: [CW], visuallyRightToLeft: RTL, rows }), P('', { after: 120 })];
}
const marksTag = (m) => `(${m} ${m === 1 ? L.mark : L.marks})`;
function written(q, lines) {
  const out = [qLine(q, marksTag(q.marks))];
  if (q.image) out.push(image(q.image));
  if (q.or) {
    out.push(P([{ t: L.or, b: true }], { align: AlignmentType.CENTER, keepNext: true, after: 40 }));
    out.push(P([...(Array.isArray(q.or) ? q.or : [q.or]), { tab: true }, marksTag(q.marks)], { tabs: END_TAB, indent: ind(360), keepNext: true, after: 60 }));
  }
  return out.concat(ruled(q.lines || lines));
}
function workBox(q, cm) { // maths / science: blank working space with a light border
  const out = [qLine(q, marksTag(q.marks))];
  if (q.image) out.push(image(q.image));
  out.push(oneCellTable([P('')], { height: Math.round((q.spaceCm || cm || 4) * 567), border: { style: BorderStyle.DOTTED, size: 4, color: 'AAAAAA' } }));
  out.push(P('', { after: 100 }));
  return out;
}
function match(q) { // match the following: two columns + answer brackets
  const w = [Math.floor(CW * 0.45), Math.floor(CW * 0.1), CW - Math.floor(CW * 0.45) - Math.floor(CW * 0.1)];
  const rows = q.left.map((l, i) => [l, '(     )', q.right[i] || '']);
  return [qLine(q, marksTag(q.marks)), table(w, [[q.leftTitle || 'A', '', q.rightTitle || 'B'], ...rows], { header: true }), P('', { after: ROUGH })];
}

// ---------- paper ----------
function header() {
  const out = [
    P(`______________________________ ${L.school}`, { align: AlignmentType.CENTER, b: true, size: SZ.sub, after: 40 }),
    P(S.title || '', { align: AlignmentType.CENTER, b: true, size: SZ.title, after: 30 }),
  ];
  if (S.subtitle) out.push(P(S.subtitle, { align: AlignmentType.CENTER, b: true, size: SZ.sub, after: 60 }));
  const q = Math.floor(CW / 4);
  out.push(P([`${L.name}: ____________________`, { tab: true }, `${L.cls}: ______`, { tab: true }, `${L.roll}: ______`, { tab: true }, `${L.date}: __________`],
    { tabs: [1, 2, 3].map(k => ({ type: TabStopType.LEFT, position: q * k + 400 })), size: SZ.q - 1, after: 40 }));
  out.push(P([{ t: `${L.total}: ${S.totalMarks}`, b: true }, { tab: true }, { t: `${L.time}: ${S.time}`, b: true }], { tabs: END_TAB, after: 0 }));
  out.push(hr());
  if (S.instructions && S.instructions.length) {
    out.push(P([{ t: `${L.instructions}: `, b: true }, S.instructions.join(' ')], { size: SZ.small + 2, after: 30 }));
  }
  if (S.instructions2) out.push(P(S.instructions2, { size: SZ.small + 1, after: 40, color: '333333' }));
  out.push(hr());
  return out;
}
function paperBody() {
  const out = header();
  (S.sections || []).forEach(sec => {
    out.push(sectionHead(sec), ...sectionIntro(sec));
    const qs = sec.questions || [];
    qs.forEach((q, i) => {
      if (sec.type === 'fill' && i === qs.length - 1) q.keepNext = true;   // last fill-in stays with the hints box
      if (sec.type === 'mcq') out.push(...mcq(q));
      else if (sec.type === 'fill') out.push(...fill(q));
      else if (sec.type === 'short') out.push(...written(q, sec.lines || 3));
      else if (sec.type === 'long') out.push(...written(q, sec.lines || 9));
      else if (sec.type === 'work') out.push(...workBox(q, sec.spaceCm));
      else if (sec.type === 'match') out.push(...match(q));
      else out.push(...written(q, sec.lines || 3));
      q.n = qno;
    });
    if (sec.type === 'fill') out.push(...hintsBox(sec));
  });
  out.push(P([{ t: L.end, b: true }], { align: AlignmentType.CENTER, before: 200 }));
  return out;
}
function keyBody() {
  const K = S.answerKey || {};
  const out = [
    P(K.title || L.answerKey, { align: AlignmentType.CENTER, b: true, size: SZ.title + 2, after: 30 }),
    P(S.title || '', { align: AlignmentType.CENTER, b: true, size: SZ.sub, after: 20 }),
    P([{ t: `${L.total}: ${S.totalMarks}`, b: true }, { tab: true }, { t: `${L.time}: ${S.time}`, b: true }], { tabs: END_TAB, after: 0 }),
    hr(),
  ];
  (K.notes || []).forEach(n => out.push(P(n, { size: SZ.small + 2, after: 30 })));
  (K.tables || []).forEach(t => {
    if (t.title) out.push(P([{ t: t.title, b: true }], { before: 120, after: 50, size: SZ.head, keepNext: true,
      shading: { type: ShadingType.CLEAR, color: 'auto', fill: 'E7E6E6' } }));
    const n = t.columns.length;
    const widths = t.widths || Array(n).fill(Math.floor(CW / n));
    out.push(table(widths, [t.columns, ...t.rows], { header: true, size: SZ.small }));
  });
  (K.after || []).forEach(n => out.push(P(n, { size: SZ.small + 2, before: 40, after: 30 })));
  return out;
}
function doc(children) {
  return new Document({
    styles: { default: { document: { run: { font: FONT, size: SZ.q, rightToLeft: RTL } } } },
    sections: [{
      properties: { page: { size: { width: PAGE_W, height: PAGE_H }, margin: { top: 850, bottom: 850, left: MARGIN, right: MARGIN } } },
      footers: { default: new Footer({ children: [new Paragraph({ alignment: AlignmentType.CENTER, bidirectional: RTL, children: [
        new TextRun({ children: [`${L.page} `, PageNumber.CURRENT, ` ${L.of} `, PageNumber.TOTAL_PAGES], font: FONT, size: 18, color: '666666', rightToLeft: RTL })] })] }) },
      children,
    }],
  });
}
(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  qno = 0;
  fs.writeFileSync(path.join(OUT, S.paperFile || 'QuestionPaper.docx'), await Packer.toBuffer(doc(paperBody())));
  if (S.answerKey) fs.writeFileSync(path.join(OUT, S.keyFile || 'AnswerKey.docx'), await Packer.toBuffer(doc(keyBody())));
  console.log('written to', OUT);
})();
