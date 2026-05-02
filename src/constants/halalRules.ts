import { KNOWLEDGE_BASE_RULES } from '../utils/reasoningEngine';

// ─── HALAL RULES (Display/UI layer) ─────────────────────────────────────────
// These are human-readable educational rules displayed on the Knowledge page.
// The actual inference rules are in reasoningEngine.ts (KNOWLEDGE_BASE_RULES).

export const HALAL_RULES = [
  {
    id: '1',
    category: 'Ingredients',
    title: 'HARAM Ingredients to Avoid',
    content: 'Pork and all pork by-products (lard, bacon, ham, pepperoni, prosciutto, salami, chorizo), L-cysteine (E920) from pork bristles, carmine/cochineal (E120), gelatin (E441) from non-halal sources, bone phosphate (E542), shellac (E904), blood and blood plasma, tallow and suet (unless zabiha-certified), isinglass, and bone char.'
  },
  {
    id: '2',
    category: 'Ingredients',
    title: 'MASHBOOH (Doubtful) Ingredients',
    content: 'Natural flavors (source unknown), emulsifiers (E471-E477, E481-E482), mono and diglycerides, whey (if non-zabiha rennet used), glycerin/glycerol (E422), calcium stearate, magnesium stearate, pepsin, lipase, casein, rennet (unless microbial), vanilla extract (contains ~35% ethanol), lecithin (verify source), confectioner\'s glaze, disodium inosinate (E631), and disodium ribonucleotides (E635).'
  },
  {
    id: '3',
    category: 'Ingredients',
    title: 'ALWAYS HALAL Ingredients',
    content: 'All vegetables, fruits, grains, legumes, nuts, seeds, fish (with scales per Shafi\'i/Hanbali), plant-based oils, water, salt, sugar (if not bone-char refined), honey, vinegar (non-wine based), soy sauce (naturally brewed, alcohol evaporated), and zabiha-certified meats with valid halal certification.'
  },
  {
    id: '4',
    category: 'Slaughter Method',
    title: 'Zabiha / Dhabihah Rules',
    content: 'The animal must be slaughtered by a sane adult Muslim. The name of Allah (Bismillah) must be invoked at the time of slaughter. The throat, windpipe, and blood vessels must be severed with a sharp knife in a single swipe to drain blood completely. The animal must be alive and healthy at the time of slaughter. Stunning is debated among scholars.'
  },
  {
    id: '5',
    category: 'Cross-Contamination',
    title: 'Processing Facilities',
    content: 'Halal products must not be prepared, processed, or stored using equipment that has been contaminated with non-Halal items unless strictly cleaned according to Islamic laws (Ritual cleansing / Samak). Shared production lines with pork products require full sertu (ritual purification with soil and water).'
  },
  {
    id: '6',
    category: 'Food Additives',
    title: 'E-Number Classification Guide',
    content: `The knowledge base currently tracks ${KNOWLEDGE_BASE_RULES.length} classified ingredients and additives. Key E-numbers: E120 (Carmine — HARAM), E441 (Gelatin — HARAM unless fish/plant), E471-E477 (Emulsifiers — MASHBOOH), E481-E482 (Stearoyl lactylates — MASHBOOH), E542 (Bone phosphate — HARAM), E631/E635 (Flavor enhancers — MASHBOOH), E904 (Shellac — HARAM), E920 (L-Cysteine — HARAM), E422 (Glycerol — MASHBOOH).`
  },
  {
    id: '7',
    category: 'Alcohol',
    title: 'Alcohol in Food Products',
    content: 'All intoxicating substances are forbidden (Quran 5:90-91). This includes ethanol, wine, beer, rum, vodka, whiskey, brandy, and liquor. Wine vinegar is debated — HARAM in Shafi\'i madhab (Al-Nawawi, Al-Majmu\' Vol. 2). Vanilla extract typically contains ~35% alcohol (FDA 21 CFR 169.175). Alcohol-free variants are preferable.'
  }
];
