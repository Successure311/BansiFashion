// Fallback list so the app renders instantly before the QualityMaster sheet
// finishes loading. The sheet is the source of truth once fetched.
// A quality can have several colour ranges.
export const defaultQualities = [
  { name: 'PURE MUL CHANDERI 56"', ranges: [{ start: 201, end: 319 }] },
  { name: 'SIYA SILK 56"', ranges: [{ start: 1, end: 101 }] },
  { name: 'MUL CRUSH 56"', ranges: [{ start: 1901, end: 1939 }] },
  { name: 'BANARAS MUL CHIFFON 44"', ranges: [{ start: 1501, end: 1528 }] },
  { name: 'MUL LINEN 56"', ranges: [{ start: 901, end: 924 }] },
  { name: 'FLORENCE CRUSH SATIN 56"', ranges: [{ start: 801, end: 824 }] },
];
