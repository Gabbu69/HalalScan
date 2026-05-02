<<<<<<< HEAD
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
=======
// src/constants/halalRules.ts

export interface HalalRule {
  id: string;
  category: string;
  title: string;
  content: string;
  source: string;
}

export const HALAL_RULES: HalalRule[] = [
  {
    id: 'R001',
    category: 'Additives',
    title: 'Haram E-Numbers',
    content: 'E120 (Carmine/Cochineal), E441 (Gelatin from pork), E542 (Bone phosphate), E904 (Shellac), E920 (L-Cysteine from pork/human). These additives are derived from haram animals, insects, or human sources and are strictly forbidden.',
    source: 'JAKIM Manual Procedure for Halal Certification'
  },
  {
    id: 'R002',
    category: 'Additives',
    title: 'Mashbooh E-Numbers',
    content: 'E471, E472, E473-E477, E481-E483 (Emulsifiers), E570 (Stearic Acid), E422 (Glycerol). These can be derived from plant or animal sources. If the animal source is not certified zabiha, they are haram. Default status is doubtful (mashbooh).',
    source: 'IFANCA Ingredients Guidance'
  },
  {
    id: 'R003',
    category: 'Additives',
    title: 'Halal E-Numbers',
    content: 'E300 (Vitamin C), E330 (Citric Acid), E406 (Agar), E412 (Guar Gum), E415 (Xanthan Gum), E440 (Pectin). These are strictly plant, mineral, or microbial based and are permissible.',
    source: 'JAKIM General Halal Standards'
>>>>>>> e3afe0f9ccf5d047b4e9d43239da8e0792adb203
  },
  {
    id: 'R004',
    category: 'Slaughter Method',
<<<<<<< HEAD
    title: 'Zabiha / Dhabihah Rules',
    content: 'The animal must be slaughtered by a sane adult Muslim. The name of Allah (Bismillah) must be invoked at the time of slaughter. The throat, windpipe, and blood vessels must be severed with a sharp knife in a single swipe to drain blood completely. The animal must be alive and healthy at the time of slaughter. Stunning is debated among scholars.'
=======
    title: 'Zabiha Requirements',
    content: 'Meat must be slaughtered by a sane adult Muslim. The name of Allah must be invoked. The throat, windpipe, and blood vessels must be severed in a single swipe.',
    source: 'JAKIM MS 1500:2019'
>>>>>>> e3afe0f9ccf5d047b4e9d43239da8e0792adb203
  },
  {
    id: 'R005',
    category: 'Cross-Contamination',
    title: 'Processing Facilities',
<<<<<<< HEAD
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
=======
    content: 'Halal products must not be processed or stored using equipment that handled haram items unless ritually cleansed (Samak/Sertu) according to Islamic law.',
    source: 'JAKIM MS 1500:2019'
  },
  {
    id: 'R006',
    category: 'Alcohol Derivatives',
    title: 'Alcohol in Beverages',
    content: 'Any beverage containing more than 0.5% ethanol naturally is haram. Added alcohol for intoxication is strictly haram regardless of percentage.',
    source: 'IFANCA Alcohol Standard'
  },
  {
    id: 'R007',
    category: 'Alcohol Derivatives',
    title: 'Alcohol as Solvent (Flavorings)',
    content: 'Flavorings (e.g., vanilla extract) using alcohol as a solvent are generally mashbooh. If the alcohol completely evaporates during cooking and the residual is less than 0.1%, some scholars permit it, but caution is advised.',
    source: 'JAKIM Fatwa Committee'
  },
  {
    id: 'R008',
    category: 'Ingredients',
    title: 'Pork & Derivatives',
    content: 'Pork, lard, bacon, ham, pork-based gelatin, and pork enzymes are strictly haram. There are no exceptions for consumption.',
    source: 'Quran (Al-Baqarah 2:173)'
  },
  {
    id: 'R009',
    category: 'Ingredients',
    title: 'Blood Products',
    content: 'Flowing blood and blood-derived products (e.g., black pudding, blood plasma used as a binder) are strictly haram.',
    source: 'Quran (Al-Ma\'idah 5:3)'
  },
  {
    id: 'R010',
    category: 'Ingredients',
    title: 'Carnivorous Animals',
    content: 'Animals with fangs (lions, tigers, dogs, cats) and birds of prey with talons (eagles, falcons) are haram for consumption.',
    source: 'Hadith (Sahih Muslim)'
  },
  {
    id: 'R011',
    category: 'Ingredients',
    title: 'Insects',
    content: 'Insects are generally haram, with the specific exception of locusts. Products like carmine (E120) derived from crushed cochineal insects are considered haram by the majority.',
    source: 'JAKIM Fatwa Committee'
  },
  {
    id: 'R012',
    category: 'Ingredients',
    title: 'Aquatic Animals',
    content: 'Fish with scales are unanimously halal. Crustaceans and mollusks are halal according to the majority of schools (Shafi\'i, Maliki, Hanbali), though debated in Hanafi. Poisonous or hazardous sea creatures are haram.',
    source: 'IFANCA Seafood Guidelines'
  },
  {
    id: 'R013',
    category: 'Ingredients',
    title: 'Enzymes',
    content: 'Enzymes (pepsin, lipase, rennet) derived from microbial fermentation or plants are halal. Those derived from pigs or non-zabiha cattle are haram. Unspecified sources are mashbooh.',
    source: 'IFANCA Enzyme Standards'
  },
  {
    id: 'R014',
    category: 'Ingredients',
    title: 'Whey and Cheese',
    content: 'Whey and cheese are halal only if the rennet used in the coagulation process is microbial, plant-based, or from a zabiha-slaughtered animal.',
    source: 'JAKIM Halal Dairy Protocol'
  },
  {
    id: 'R015',
    category: 'Certification',
    title: 'Recognized Halal Logos',
    content: 'Products bearing valid logos from recognized bodies like JAKIM, MUI, MUIS, and IFANCA are considered halal verified, overriding individual ambiguous ingredient checks.',
    source: 'Global Halal Authority Network'
>>>>>>> e3afe0f9ccf5d047b4e9d43239da8e0792adb203
  }
];

export const ENUMBERS_LIST = {
  HARAM: ['E120', 'E441', 'E542', 'E904', 'E920'],
  MASHBOOH: ['E471', 'E472', 'E472a', 'E472b', 'E472c', 'E472e', 'E473', 'E474', 'E475', 'E476', 'E477', 'E481', 'E482', 'E483', 'E570', 'E422', 'E153', 'E470', 'E491', 'E492', 'E493', 'E494', 'E495'],
  HALAL: ['E300', 'E330', 'E406', 'E412', 'E415', 'E440', 'E100', 'E160a', 'E162', 'E200', 'E202', 'E211']
};
