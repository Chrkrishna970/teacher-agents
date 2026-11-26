// EXAMPLE build script from a real paper (AP Class 10 Hindi, Lesson 1, Paper 3: 7 MCQ + 7 fill-in + 3x2 + 1x5).
// Adapt the OUT path and the question data; keep the helpers (mcq, fib, hints box, ruled lines) and the layout constants.
// Needs: Node 18+, npm install docx
// build_paper_l01_p3.js — Paper 3 (25 marks) QuestionPaper.docx + AnswerKey.docx for Lesson 01 (बरसते बादल)
// Source of truth: Lesson-01-Baraste-Badal/Paper-3-25marks/QuestionPaper-final.md / AnswerKey-final.md
// Adapted from build_paper_l01_p2.js. Printing rule: <= 3 A4 pages, ~1.5 cm margins, compact header,
// never shrink the question font or the writing space.
const fs = require('fs');
const path = require('path');
const {
  Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell, WidthType, HeightRule,
  AlignmentType, BorderStyle, TabStopType, ShadingType, Footer, PageNumber, UnderlineType,
} = require('docx');

const OUT = path.resolve(__dirname, '..', 'Lesson-01-Baraste-Badal', 'Paper-3-25marks');
const FONT = { ascii: 'Nirmala UI', hAnsi: 'Nirmala UI', cs: 'Nirmala UI', eastAsia: 'Nirmala UI' };
const PAGE_W = 11906, MARGIN = 850; // A4, ~1.5 cm margins
const CW = PAGE_W - 2 * MARGIN; // 10206

function runs(segs, base = {}) {
  if (!Array.isArray(segs)) segs = [segs];
  return segs.map(s => {
    if (typeof s === 'string') s = { t: s };
    if (s.tab) return new TextRun({ text: '\t', font: FONT, size: base.size || 23 });
    return new TextRun({
      text: s.t, font: FONT, size: s.size || base.size || 23,
      bold: s.b !== undefined ? s.b : base.b, italics: s.i || base.i,
      color: s.color || base.color,
      underline: s.u ? { type: UnderlineType.SINGLE } : undefined,
    });
  });
}
function P(segs, o = {}) {
  return new Paragraph({
    children: runs(segs, o),
    alignment: o.align,
    spacing: { before: o.before || 0, after: o.after !== undefined ? o.after : 60, line: o.line || 276 },
    indent: o.indent,
    tabStops: o.tabs,
    keepNext: o.keepNext,
    keepLines: true,
    border: o.border,
    shading: o.shading,
  });
}
const RIGHT_TAB = [{ type: TabStopType.RIGHT, position: CW }];
const noB = { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' };
const thin = { style: BorderStyle.SINGLE, size: 4, color: '808080' };

function cell(segs, w, o = {}) {
  const content = Array.isArray(segs) && segs.length && segs[0] instanceof Paragraph ? segs
    : [P(segs, { size: o.size, b: o.b, after: 0, align: o.align })];
  return new TableCell({
    width: { size: w, type: WidthType.DXA },
    margins: { top: 50, bottom: 50, left: 90, right: 90 },
    shading: o.fill ? { type: ShadingType.CLEAR, color: 'auto', fill: o.fill } : undefined,
    borders: o.borders || { top: thin, bottom: thin, left: thin, right: thin },
    children: content,
  });
}
function table(widths, rows, o = {}) {
  return new Table({
    width: { size: widths.reduce((a, b) => a + b, 0), type: WidthType.DXA },
    columnWidths: widths,
    rows: rows.map((r, ri) => new TableRow({
      tableHeader: o.header && ri === 0,
      cantSplit: true,
      children: r.map((c, ci) => cell(c, widths[ci], {
        size: o.size, b: o.header && ri === 0, fill: o.header && ri === 0 ? 'E7E6E6' : undefined,
        borders: o.borders, align: o.align && o.align[ci],
      })),
    })),
  });
}
const hr = (after = 60) => P('', { after, line: 120, border: { bottom: { style: BorderStyle.SINGLE, size: 8, color: '000000', space: 1 } } });
const sectionHead = (t, marks) => [P([{ t, b: true }, { tab: true }, { t: marks, b: true }],
  { tabs: RIGHT_TAB, before: 100, after: 40, size: 25, shading: { type: ShadingType.CLEAR, color: 'auto', fill: 'E7E6E6' }, keepNext: true })];
const telugu = t => P([{ t }], { size: 20, after: 60, keepNext: true, color: '333333' });

// ---------- QUESTION PAPER ----------
const BR = '(          )';
const ROUGH = 500; // rough-work space after each question (~0.9 cm)
// long = true -> very long options, one per line
function mcq(n, stem, opts, long = false) {
  const out = [P([{ t: `${n}. `, b: true }, ...stem, { tab: true }, BR], { tabs: RIGHT_TAB, keepNext: true, before: 40, after: 40, indent: { left: 360, hanging: 360 } })];
  const L = ['(अ)', '(आ)', '(इ)', '(ई)'];
  if (long) {
    opts.forEach((o, i) => out.push(P(`${L[i]} ${o}`, { indent: { left: 720 }, after: i < 3 ? 30 : ROUGH, keepNext: i < 3 })));
    return out;
  }
  const col2 = 360 + Math.floor((CW - 360) / 2);
  const tabs = [{ type: TabStopType.LEFT, position: col2 }];
  out.push(P([`${L[0]} ${opts[0]}`, { tab: true }, `${L[1]} ${opts[1]}`], { indent: { left: 720 }, tabs, after: 30, keepNext: true }));
  out.push(P([`${L[2]} ${opts[2]}`, { tab: true }, `${L[3]} ${opts[3]}`], { indent: { left: 720 }, tabs, after: ROUGH }));
  return out;
}
const blank = '____________________';
function fib(n, before, after, last = false) {
  return P([{ t: `${n}. `, b: true }, ...(Array.isArray(before) ? before : [before]), blank, after], { before: 40, after: ROUGH, indent: { left: 360, hanging: 360 }, keepNext: last });
}
function hints(list) {
  const half = Math.ceil(list.length / 2);
  const col2 = Math.floor(CW / 2);
  const box = { top: thin, bottom: thin, left: thin, right: thin };
  const rows = [P([{ t: 'संकेत शब्द (Hints) – इनमें से सही शब्द चुनिए  ·  సూచన పదాలు', b: true }], { size: 19, after: 50, keepNext: true })];
  for (let i = 0; i < half; i++) {
    const a = list[i], b = list[i + half];
    rows.push(P([`${a[0]}. ${a[1]}`, ...(b ? [{ tab: true }, `${b[0]}. ${b[1]}`] : [])],
      { size: 19, color: '444444', tabs: [{ type: TabStopType.LEFT, position: col2 }], after: 20, keepNext: i < half - 1 }));
  }
  return new Table({
    width: { size: CW, type: WidthType.DXA }, columnWidths: [CW],
    rows: [new TableRow({ cantSplit: true, children: [new TableCell({
      width: { size: CW, type: WidthType.DXA }, borders: box,
      shading: { type: ShadingType.CLEAR, color: 'auto', fill: 'F5F5F5' },
      margins: { top: 80, bottom: 80, left: 160, right: 160 }, children: rows,
    })] })],
  });
}
// ruled answer lines (table rows with bottom border only, ~0.95 cm each)
function ruled(count) {
  const line = { style: BorderStyle.SINGLE, size: 4, color: '7F7F7F' };
  return new Table({
    width: { size: CW - 360, type: WidthType.DXA }, columnWidths: [CW - 360],
    indent: { size: 360, type: WidthType.DXA },
    rows: Array.from({ length: count }, () => new TableRow({
      cantSplit: true, height: { value: 540, rule: HeightRule.EXACT },
      children: [new TableCell({ width: { size: CW - 360, type: WidthType.DXA },
        borders: { top: noB, left: noB, right: noB, bottom: line }, children: [new Paragraph({ children: [] })] })],
    })),
  });
}
function shortQ(n, stem) {
  return [
    P([{ t: `${n}. `, b: true }, ...stem, { tab: true }, { t: '(2 अंक)', b: true }], { tabs: RIGHT_TAB, before: 80, after: 0, keepNext: true, indent: { left: 360, hanging: 360 } }),
    ruled(3),
    P('', { after: 60, line: 200 }),
  ];
}

const paper = [
  P('_________________________________ (विद्यालय का नाम)', { align: AlignmentType.CENTER, b: true, size: 24, after: 20 }),
  P('इकाई परीक्षा – हिंदी (द्वितीय भाषा) – कक्षा 10 · पाठ 1 : बरसते बादल (सुमित्रानंदन पंत) · प्रश्न-पत्र 3', { align: AlignmentType.CENTER, b: true, size: 24, after: 60 }),
  P(['नाम : ________________________     कक्षा : 10 ____     क्रमांक : ______     दिनांक : ___________'], { size: 22, after: 40 }),
  P([{ t: 'कुल अंक : 25', b: true }, { tab: true }, { t: 'समय : 45 मिनट', b: true }], { tabs: RIGHT_TAB, after: 0, size: 23 }),
  hr(40),
  P([{ t: 'सामान्य निर्देश : ', b: true }, "सभी प्रश्न अनिवार्य हैं। खंड 'अ' – सही विकल्प का अक्षर कोष्ठक में लिखिए। खंड 'आ' – रिक्त स्थान भरिए; खंड के अंत में दिए संकेत शब्द (Hints) बॉक्स की मदद ले सकते हैं। खंड 'इ' – उत्तर एक-दो वाक्यों में लिखिए। खंड 'ई' – दो में से किसी एक प्रश्न का उत्तर लिखिए। हर प्रश्न के नीचे खाली जगह में रफ़ काम कर सकते हैं।"], { size: 21, after: 30 }),
  P([{ t: "తెలుగులో : అన్ని ప్రశ్నలు తప్పనిసరి. 'ఆ' విభాగం చివర సూచన పదాల (Hints) బాక్స్ ఉంది. 'ఈ' విభాగంలో రెండింటిలో ఏదో ఒక ప్రశ్నకు మాత్రమే జవాబు రాయండి. ప్రతి ప్రశ్న కింద రఫ్ వర్క్ చేసుకోవచ్చు." }], { size: 20, after: 20, color: '333333' }),
  hr(40),

  ...sectionHead('खंड – अ : बहुविकल्पीय प्रश्न', '(7 × 1 = 7 अंक)'),
  P([{ t: 'सही विकल्प चुनकर उसका अक्षर कोष्ठक में लिखिए।', b: true }], { after: 10, keepNext: true }),
  telugu('సరైన జవాబును ఎంచుకొని దాని అక్షరాన్ని బ్రాకెట్‌లో రాయండి.'),
  ...mcq(1, ["इनमें से कौन-सा शब्द 'आकाश' का पर्यायवाची ", { t: 'नहीं', b: true }, ' है?'], ['गगन', 'नभ', 'तरु', 'अंबर']),
  ...mcq(2, ['"दादुर टर-टर करते ', { t: 'झिल्ली', b: true }, " बजती झन-झन\" – इस पंक्ति में 'झिल्ली' का अर्थ है –"], ['मेंढक', 'झींगुर', 'मोर', 'बिजली']),
  ...mcq(3, ['इनमें से ', { t: 'द्वंद्व समास', b: true }, ' का उदाहरण कौन-सा है?'], ['तृण-तृण', 'कण-कण', 'फिर-फिर', 'चाँद-सितारे']),
  ...mcq(4, ["'युगांत' शब्द का सही संधि-विच्छेद है –"], ['युग + अंत', 'यु + गांत', 'युगां + त', 'युग + नांत']),
  ...mcq(5, ["पंत जी का निधन सन् 1977 में हुआ। '1977' को शब्दों में लिखने का सही रूप है –"], ['उन्नीस सौ सत्तर', 'उन्नीस सौ सत्तासी', 'उन्नीस सौ सतहत्तर', 'उन्नीस सौ सत्ताईस']),
  ...mcq(6, ['इनमें से ', { t: 'शुद्ध', b: true }, ' शब्द कौन-सा है?'], ['इंद्रधनूष', 'इंद्रधनुष', 'ईंद्रधनुष', 'इंद्रधणुष']),
  ...mcq(7, ['"बादलों के घोर अंधकार के बीच बिजली चमक रही है।" – इस भाव की पंक्ति है –'],
    ['चम-चम बिजली चमक रही रे उर में घन के', 'झम-झम-झम-झम मेघ बरसते हैं सावन के',
     'रिमझिम-रिमझिम क्या कुछ कहते बूँदों के स्वर', 'पकड़ वारि की धार झूलता है मेरा मन'], true),

  ...sectionHead('खंड – आ : रिक्त स्थान भरिए', '(7 × 1 = 7 अंक)'),
  P([{ t: 'रिक्त स्थान में सही शब्द लिखिए। (संकेत शब्द खंड के अंत में दिए गए हैं।)', b: true }], { after: 10, keepNext: true }),
  telugu('ఖాళీలో సరైన పదం రాయండి. (సూచన పదాలు ఈ విభాగం చివర ఉన్నాయి.)'),
  fib(8, "'कृपा' शब्द का तद्भव रूप ", ' है।'),
  fib(9, ['"पकड़ वारि ', { t: 'की', b: true }, " धार\" – इसमें 'की' "], ' कारक का चिह्न है।'),
  fib(10, "'भीतर' शब्द का विलोम (उल्टा) शब्द ", ' है।'),
  fib(11, "साहित्य लेखन के लिए पंत जी को 'साहित्य अकादमी', '", "' और 'ज्ञानपीठ' पुरस्कार मिले।"),
  fib(12, 'कविता की पंक्ति पूरी कीजिए – "घुमड़-घुमड़ गिर मेघ गगन में भरते ', '।"'),
  fib(13, 'पाठ के आरंभ की कविता (कोयल रानी) में प्यासी धरती ', ' से पानी माँगती है।'),
  fib(14, 'कविता में बूँदें तरुओं (पेड़ों) से छनकर ', ' गिरती हैं।', true),
  hints([
    [8, 'किरपा / कृपालु / कृपया'], [9, 'संबंध / कर्म / अधिकरण'], [10, 'बाहर / अंदर / अंतर'],
    [11, 'सोवियत रूस / भारत रत्न / ऑस्कर'],
    [12, 'गर्जन / क्रंदन / स्वर'], [13, 'मेघों / तारों / फूलों'], [14, 'छम-छम / टर-टर / म्यव-म्यव'],
  ]),
  P('', { after: 0, line: 240 }),

  ...sectionHead('खंड – इ : लघु उत्तरीय प्रश्न', '(3 × 2 = 6 अंक)'),
  P([{ t: 'नीचे दिए गए प्रश्नों के उत्तर एक-दो वाक्यों में लिखिए।', b: true }], { after: 10, keepNext: true }),
  telugu('కింది ప్రశ్నలకు ఒకటి-రెండు వాక్యాలలో జవాబులు రాయండి.'),
  ...shortQ(15, ["'तृण-तृण की प्रसन्नता' का क्या भाव है?"]),
  ...shortQ(16, ['वर्षा सभी प्राणियों के लिए जीवन का आधार है। कैसे?']),
  ...shortQ(17, ['सुमित्रानंदन पंत का जन्म कब और कहाँ हुआ? उनकी कोई दो रचनाओं के नाम लिखिए।']),

  ...sectionHead('खंड – ई : दीर्घ उत्तरीय प्रश्न', '(1 × 5 = 5 अंक)'),
  P([{ t: 'नीचे दिए गए प्रश्न का उत्तर आठ-दस पंक्तियों में लिखिए। (केवल एक प्रश्न)', b: true }], { after: 10, keepNext: true }),
  telugu('కింది ప్రశ్నకు ఎనిమిది-పది వాక్యాలలో జవాబు రాయండి. (ఏదో ఒక ప్రశ్న మాత్రమే)'),
  P([{ t: '18. ', b: true }, "'बरसते बादल' कविता में प्रकृति का सुंदर चित्रण है। उसे अपने शब्दों में लिखिए।", { tab: true }, { t: '(5 अंक)', b: true }],
    { tabs: RIGHT_TAB, before: 80, after: 20, keepNext: true, indent: { left: 360, hanging: 360 } }),
  P([{ t: 'अथवा', b: true }], { align: AlignmentType.CENTER, after: 20, keepNext: true }),
  P(["वर्षा ऋतु के प्राकृतिक सौंदर्य पर अपने विचार लिखिए। ('बरसते बादल' कविता के आधार पर)", { tab: true }, { t: '(5 अंक)', b: true }],
    { tabs: RIGHT_TAB, after: 0, keepNext: true, indent: { left: 360 } }),
  ruled(10),
  P([{ t: '*** शुभकामनाएँ ***', b: true }], { align: AlignmentType.CENTER, before: 120, after: 0 }),
];

// ---------- ANSWER KEY ----------
const KW = [520, 2300, 2700, 1500, 520, 2666]; // sum 10206
const keyHead = ['प्र.', 'उत्तर', 'स्रोत', 'तत्व', 'स्तर', 'टिप्पणी'];
const keyA = [
  ['1', '(इ) तरु', "[पाठ्यपुस्तक p.11] भाषा की बात (अ) 1 – 'गगन' के पर्याय; नभ, अंबर p.10 पद्यांश से", 'पर्याय शब्द', 'म', 'गगन, नभ, अंबर = आकाश। तरु = पेड़, वृक्ष'],
  ['2', '(आ) झींगुर', '[नया] – आधार: पद 2 (p.9), शब्दार्थ', 'शब्दार्थ', 'स', 'झिल्ली = झींगुर। मेंढक = दादुर (भटकाने वाला विकल्प)'],
  ['3', '(ई) चाँद-सितारे', '[पाठ्यपुस्तक p.11] भाषा की बात (आ) 5 – समास पहचान; शब्द p.10 से', 'समास', 'म', 'चाँद और सितारे – द्वंद्व। बाकी तीनों पुनरुक्ति शब्द (p.11 (अ) 4)'],
  ['4', '(अ) युग + अंत', "[नया] – आधार: कवि परिचय p.8 (रचना 'युगांत')", 'संधि-विच्छेद', 'स', "अ + अ = आ (दीर्घ संधि)। 'युगा + अंत', 'युग + आंत' जानबूझकर नहीं रखे"],
  ['5', '(इ) उन्नीस सौ सतहत्तर', '[नया] – आधार: कवि परिचय p.8 ("निधन सन् 1977")', 'अंक', 'स', '70 = सत्तर, 87 = सत्तासी, 27 = सत्ताईस'],
  ['6', '(आ) इंद्रधनुष', '[नया] – आधार: पद 4 (p.9)', 'शुद्ध शब्द', 'स', "'इन्द्रधनुष' भी शुद्ध है, इसलिए विकल्प में नहीं रखा"],
  ['7', '(अ) चम-चम बिजली चमक रही रे उर में घन के', '[पाठ्यपुस्तक p.10] अर्थग्राह्यता (इ) 1 – MCQ रूप', 'कविता का भाव', 'म', 'उर = हृदय/बीच, घन = बादल; केवल इसी पंक्ति में बिजली'],
];
const KW2 = [520, 2600, 4200, 2366, 520]; // sum 10206
const keyB = [
  ['8', 'किरपा', '[पाठ्यपुस्तक p.12] तत्सम–तद्भव उदाहरण', 'तत्सम–तद्भव', 'स'],
  ['9', 'संबंध', '[नया] – आधार: पद 4 "पकड़ वारि की धार"', 'कारक', 'म'],
  ['10', 'बाहर', '[नया] – आधार: पद 3 "छूते वे भीतर अंतर"', 'विलोम (उल्टा) शब्द', 'स'],
  ['11', 'सोवियत रूस', '[नया] – आधार: कवि परिचय p.8', 'कवि परिचय', 'स'],
  ['12', 'गर्जन', '[पाठ्यपुस्तक p.10] अर्थग्राह्यता (आ) 2', 'कविता की पंक्ति', 'स'],
  ['13', "मेघों ('बादलों' भी स्वीकार्य)", '[पाठ्यपुस्तक p.8] उन्मुखीकरण (कोयल रानी) प्र. 2', 'कविता का भाव', 'स'],
  ['14', 'छम-छम', '[पाठ्यपुस्तक p.9] पाठ के बीच प्र. 1 (बूँदों का वर्णन)', 'कविता का दृश्य', 'स'],
];
const S = 21;
const para = (segs, o = {}) => P(segs, { size: S, after: 30, ...o });
const bullet = t => P(t, { size: S, indent: { left: 360, hanging: 240 }, after: 20 });
function saBlock(n, q, src, model, marking, marks = '(2 अंक)') {
  return [
    P([{ t: `प्र. ${n} – ${q}`, b: true }, { tab: true }, { t: marks, b: true }], { size: S, tabs: RIGHT_TAB, before: 80, after: 20, keepNext: true }),
    para([{ t: 'स्रोत : ', b: true }, src], { keepNext: true }),
    para([{ t: 'आदर्श उत्तर : ', b: true }, model], { keepNext: true }),
    para([{ t: 'अंक-विभाजन : ', b: true }, marking], { after: 60 }),
  ];
}
const CVW = [2400, 3700, 2306, 1800]; // 10206
const coverage = [
  ['अनिवार्य तत्व', 'प्रश्न (मुख्य)', 'और कहाँ', 'स्रोत'],
  ['तत्सम–तद्भव', 'प्र. 8 (कृपा → किरपा)', '–', 'पाठ्यपुस्तक p.12'],
  ['शब्दार्थ', 'प्र. 2 (झिल्ली = झींगुर)', 'प्र. 7 (उर, घन)', 'नया (पद 2)'],
  ['समास', 'प्र. 3 (चाँद-सितारे – द्वंद्व)', '–', 'पाठ्यपुस्तक p.11'],
  ['संधि-विच्छेद', 'प्र. 4 (युगांत = युग + अंत)', '–', 'नया (p.8)'],
  ['अंक (संख्या ↔ शब्द)', 'प्र. 5 (1977 = उन्नीस सौ सतहत्तर)', '–', 'नया (p.8)'],
  ['कारक', "प्र. 9 ('की' – संबंध कारक)", '–', 'नया (पद 4)'],
  ['उल्टे शब्द (विलोम)', 'प्र. 10 (भीतर – बाहर)', '–', 'नया (पद 3)'],
  ['पर्याय शब्द', 'प्र. 1 (आकाश – गगन, नभ, अंबर; तरु नहीं)', '–', 'पाठ्यपुस्तक p.11'],
  ['शुद्ध शब्द', 'प्र. 6 (इंद्रधनुष)', '–', 'नया (पद 4)'],
  ['कवि परिचय', 'प्र. 11 (सोवियत रूस)', 'प्र. 17, 4, 5, 18', 'नया (p.8)'],
  ['कविता के दृश्य / पंक्तियाँ', 'प्र. 7, 12, 14', 'प्र. 18', 'पाठ्यपुस्तक p.9–10'],
  ['कविता का भाव / संदेश', 'प्र. 13, 15, 16', 'प्र. 18 / अथवा', 'पाठ्यपुस्तक p.8, 9, 11'],
];
const key = [
  P('उत्तर कुंजी (Answer Key) – प्रश्न-पत्र 3', { align: AlignmentType.CENTER, b: true, size: 28, after: 20 }),
  P('पाठ 1 : बरसते बादल (सुमित्रानंदन पंत) · कक्षा 10 · हिंदी (द्वितीय भाषा)', { align: AlignmentType.CENTER, b: true, size: 23, after: 20 }),
  P([{ t: 'कुल अंक : 25', b: true }, { tab: true }, { t: 'समय : 45 मिनट', b: true }], { tabs: RIGHT_TAB, before: 40, after: 0 }),
  hr(40),
  para("खंड 'अ' और 'आ' : प्रत्येक प्रश्न 1 अंक, आंशिक अंक नहीं। खंड 'आ' में सही शब्द की मामूली वर्तनी-भूल पर अंक दिए जाएँ, यदि शब्द साफ़ पहचाना जा सके (प्र. 6 स्वयं वर्तनी का प्रश्न है)।"),
  para("खंड 'इ' : प्रत्येक प्रश्न 2 अंक – नीचे दिया अंक-विभाजन देखें। अपने शब्दों में लिखा सही भाव स्वीकार्य; मामूली वर्तनी/व्याकरण की भूल पर अंक न काटें।"),
  para("खंड 'ई' : 5 अंक = विषय-वस्तु 3 + भाषा 1 + प्रस्तुति 1। छात्र केवल एक विकल्प लिखे; दोनों लिखे तो अधिक अंक वाला गिनें।"),
  para('स्तर : स = सरल, म = मध्यम, चि = चिंतनात्मक (पाठ के भीतर)', { after: 40 }),
  ...sectionHead('खंड – अ : बहुविकल्पीय प्रश्न', '(7 अंक)'),
  table(KW, [keyHead, ...keyA.map(r => [r[0], { t: r[1], b: true }, r[2], r[3], r[4], r[5]])], { header: true, size: 19 }),
  para('उत्तर-वितरण : अ – 2, आ – 2, इ – 2, ई – 1', { before: 40 }),
  ...sectionHead('खंड – आ : रिक्त स्थान', '(7 अंक)'),
  table(KW2, [['प्र.', 'उत्तर', 'स्रोत', 'तत्व', 'स्तर'], ...keyB.map(r => [r[0], { t: r[1], b: true }, r[2], r[3], r[4]])], { header: true, size: 19 }),
  ...sectionHead('खंड – इ : लघु उत्तरीय प्रश्न', '(6 अंक)'),
  ...saBlock(15, "'तृण-तृण की प्रसन्नता' का क्या भाव है?",
    '[पाठ्यपुस्तक p.9] पाठ के बीच के प्रश्न, प्र. 3 · कविता का भाव · स्तर : चि',
    'वर्षा का पानी पाकर मिट्टी (रज) के कण-कण से घास के कोमल तिनके उग आते हैं। कवि कहते हैं कि घास का हर तिनका मानो खुशी से पुलकित हो उठा है, यानी वर्षा से धरती पर नया जीवन और हरियाली आ गई है।',
    '1 अंक – वर्षा से मिट्टी में से घास / अंकुर / तिनके उग आते हैं; 1 अंक – भाव: घास का हर तिनका खुश / पुलकित है = धरती पर नया जीवन / हरियाली / खुशी।'),
  ...saBlock(16, 'वर्षा सभी प्राणियों के लिए जीवन का आधार है। कैसे?',
    '[पाठ्यपुस्तक p.11] अभिव्यक्ति-सृजनात्मकता (अ) 1 · कविता का संदेश · स्तर : चि',
    'वर्षा से हमें पीने का पानी मिलता है और खेतों में फसलें उगती हैं, जिससे सबको भोजन मिलता है। पेड़-पौधों और पशु-पक्षियों को भी पानी और हरियाली मिलती है; नदी, तालाब और कुएँ भर जाते हैं।',
    'कोई भी दो अलग-अलग सही बिंदु, प्रत्येक 1 अंक: पीने का पानी · फसलें / भोजन · पेड़-पौधे हरे-भरे · पशु-पक्षियों को पानी / चारा · नदी, तालाब, कुएँ भरना · धरती की प्यास बुझना।'),
  ...saBlock(17, 'सुमित्रानंदन पंत का जन्म कब और कहाँ हुआ? उनकी कोई दो रचनाओं के नाम लिखिए।',
    '[नया] – आधार: कवि परिचय p.8 · कवि परिचय · स्तर : स',
    "सुमित्रानंदन पंत का जन्म 20 मई सन् 1900 में अल्मोड़ा जिले के कौसानी गाँव में हुआ। उनकी दो रचनाएँ हैं – 'पल्लव' और 'गुंजन'।",
    '½ – जन्म का समय (1900 / 20 मई 1900); ½ – स्थान (कौसानी या अल्मोड़ा, कोई एक भी पर्याप्त); ½ + ½ – दो रचनाएँ (वीणा, ग्रंथि, पल्लव, गुंजन, युगांत, ग्राम्या, स्वर्णकिरण, कला और बूढ़ा चाँद, चिदंबरा में से कोई भी)।'),
  ...sectionHead('खंड – ई : दीर्घ उत्तरीय प्रश्न', '(5 अंक)'),
  para([{ t: 'अंक-विभाजन (दोनों विकल्पों के लिए) : ', b: true }, 'विषय-वस्तु 3 (तीन अलग सही बिंदु, प्रत्येक 1) + भाषा 1 (सरल, सही हिंदी; मामूली वर्तनी-भूल पर न काटें) + प्रस्तुति 1 (क्रम से, साफ़; 7–8 पंक्तियों का सही, क्रमबद्ध उत्तर भी पूरा 1 अंक पाए; केवल 4–5 पंक्तियाँ हों तो ½)।'], { keepNext: true }),
  ...saBlock(18, "'बरसते बादल' कविता में प्रकृति का सुंदर चित्रण है। उसे अपने शब्दों में लिखिए।",
    '[पाठ्यपुस्तक p.11] अभिव्यक्ति-सृजनात्मकता (आ) · कविता के दृश्य, भाव, संदेश + कवि · स्तर : म',
    "'बरसते बादल' कविता प्रकृति के कवि सुमित्रानंदन पंत ने लिखी है। इसमें सावन की वर्षा का सुंदर चित्रण है। सावन के बादल झम-झम बरसते हैं और पेड़ों से छनकर बूँदें छम-छम गिरती हैं। घने बादलों के बीच बिजली चम-चम चमकती है और दिन में भी अँधेरा छा जाता है। मेंढक टर-टर करते हैं, झींगुर झन-झन बजते हैं, मोर और चातक पक्षी बोलते हैं। बादल घुमड़-घुमड़ कर आकाश में गरजते हैं। रिमझिम बूँदें मन को छूती हैं, धरती पर पानी की धाराएँ गिरती हैं और मिट्टी से घास उग आती है। कवि का मन खुशी से झूलने लगता है। वे चाहते हैं कि सब मिलकर इंद्रधनुष के झूले में झूलें और मनभावन सावन जीवन में बार-बार आए।",
    'विषय-वस्तु के मान्य बिंदु (कोई तीन): (1) बादल झम-झम, बूँदें छम-छम, बिजली चम-चम, दिन में अँधेरा (पद 1) · (2) मेंढक, झींगुर, मोर, चातक, सोनबालक की आवाज़ें / बादलों का गरजना (पद 2) · (3) रिमझिम बूँदें मन को छूती हैं / धाराएँ / मिट्टी से घास उगना (पद 3) · (4) कवि का मन झूलना, इंद्रधनुष का झूला, सावन बार-बार आए (पद 4) · (5) कवि का नाम और कविता का विषय।', '(5 अंक)'),
  ...saBlock('18 (अथवा)', "वर्षा ऋतु के प्राकृतिक सौंदर्य पर अपने विचार लिखिए। ('बरसते बादल' कविता के आधार पर)",
    '[पाठ्यपुस्तक p.11] अभिव्यक्ति-सृजनात्मकता (अ) 2 · कविता का भाव + संदेश · स्तर : म',
    "वर्षा ऋतु सबकी प्रिय ऋतु है। इस ऋतु में आकाश में काले-काले बादल छा जाते हैं, बिजली चमकती है और रिमझिम बारिश होती है। पेड़-पौधे धुलकर हरे-भरे हो जाते हैं और धरती मानो हरी चादर ओढ़ लेती है। मिट्टी से नई घास उग आती है, फूल खिलते हैं। मोर नाचते हैं, मेंढक टर्राते हैं और पक्षी खुशी से उड़ते हैं। नदी, तालाब और झरने पानी से भर जाते हैं। बारिश के बाद आकाश में सात रंगों का इंद्रधनुष दिखाई देता है। 'बरसते बादल' कविता में पंत जी ने भी यही सुंदरता दिखाई है। यह दृश्य मन को बहुत आनंद देता है, इसलिए हमें प्रकृति की रक्षा करनी चाहिए।",
    'विषय-वस्तु के मान्य बिंदु (कोई तीन): काले बादल, बिजली, गरजना, वर्षा · धरती हरी-भरी, घास, फूल · मोर, मेंढक, पक्षियों की खुशी · नदी-तालाब भरना / इंद्रधनुष · मन का आनंद, सावन बार-बार आने की इच्छा, प्रकृति की रक्षा। शर्त: 3 में से कम-से-कम 1 बिंदु \'बरसते बादल\' कविता से होना चाहिए (झम-झम बादल / छम-छम बूँदें / चम-चम बिजली, दादुर-झींगुर-मोर-चातक, तृण-तृण उगना, इंद्रधनुष का झूला, "सावन बार-बार आए")। कविता का कोई बिंदु न हो तो विषय-वस्तु के अधिकतम 2 अंक।', '(5 अंक)'),
  ...sectionHead('तत्व-कवरेज तालिका (Element coverage)', ''),
  table(CVW, coverage, { header: true, size: 19 }),
  ...sectionHead('सारांश', '(कुल 25 अंक)'),
  bullet('• खंड अ (प्र. 1–7) : 7 · खंड आ (प्र. 8–14) : 7 · खंड इ (प्र. 15–17) : 6 · खंड ई (प्र. 18, अथवा सहित) : 5 · कुल 18 प्रश्न, 25 अंक'),
  bullet('• पाठ्यपुस्तक से : प्र. 1, 3, 7, 8, 12, 13, 14, 15, 16, 18 = 16 अंक (64%) · नया : प्र. 2, 4, 5, 6, 9, 10, 11, 17 = 9 अंक (36%)'),
  bullet('• स्तर : सरल 12 (48%) – प्र. 2, 4, 5, 6, 8, 10–14, 17 · मध्यम 9 (36%) – प्र. 1, 3, 7, 9, 18 · चिंतनात्मक 4 (16%) – प्र. 15, 16'),
  bullet("• प्रश्न-पत्र 1 और 2 से संबंध : कोई प्रश्न ज्यों-का-त्यों नहीं दोहराया गया। नए रूप में दोबारा आए तथ्य/प्रकार: प्र. 1 (गगन–आकाश समूह, उलटा रूप), प्र. 3 (द्वंद्व समास, नया शब्द), प्र. 5 (1977 – अब शब्दों में), प्र. 8 (तत्सम–तद्भव, नई जोड़ी), प्र. 11 (पुरस्कार वाक्य, नया तथ्य), प्र. 17 (जन्म व रचनाएँ – लिखित कवि परिचय)।"),
  bullet("• उत्तर संकेत न मिलें : प्र. 7 के विकल्पों में प्र. 12, 14, 15 की पंक्तियाँ नहीं; प्र. 17 में पुरस्कार नहीं पूछे (प्र. 11 में छपे हैं)। प्र. 4 का शब्द 'युगांत' (पंत जी की रचना) प्र. 17 में मामूली संकेत दे सकता है – जानबूझकर रखा गया।"),
  bullet("• पाठ्यपुस्तक की छपाई : p.9 पर \"तृण-तृण को पुलकावलि थर\" छपा है (मूल: \"तृण-तृण की पुलकावलि भर\") – यह पंक्ति किसी वस्तुनिष्ठ प्रश्न में नहीं ली गई।"),
];

function doc(children) {
  return new Document({
    styles: { default: { document: { run: { font: FONT, size: 23 } } } },
    sections: [{
      properties: { page: { size: { width: 11906, height: 16838 }, margin: { top: 850, bottom: 850, left: MARGIN, right: MARGIN, footer: 400 } } },
      footers: { default: new Footer({ children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [
        new TextRun({ children: ['पृष्ठ ', PageNumber.CURRENT, ' / ', PageNumber.TOTAL_PAGES], font: FONT, size: 18, color: '666666' })] })] }) },
      children,
    }],
  });
}
(async () => {
  fs.writeFileSync(path.join(OUT, 'QuestionPaper.docx'), await Packer.toBuffer(doc(paper)));
  fs.writeFileSync(path.join(OUT, 'AnswerKey.docx'), await Packer.toBuffer(doc(key)));
  console.log('written to', OUT);
})();
