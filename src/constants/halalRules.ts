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
  },
  {
    id: 'R004',
    category: 'Slaughter Method',
    title: 'Zabiha Requirements',
    content: 'Meat must be slaughtered by a sane adult Muslim. The name of Allah must be invoked. The throat, windpipe, and blood vessels must be severed in a single swipe.',
    source: 'JAKIM MS 1500:2019'
  },
  {
    id: 'R005',
    category: 'Cross-Contamination',
    title: 'Processing Facilities',
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
  }
];

export const ENUMBERS_LIST = {
  HARAM: ['E120', 'E441', 'E542', 'E904', 'E920'],
  MASHBOOH: ['E471', 'E472', 'E472a', 'E472b', 'E472c', 'E472e', 'E473', 'E474', 'E475', 'E476', 'E477', 'E481', 'E482', 'E483', 'E570', 'E422', 'E153', 'E470', 'E491', 'E492', 'E493', 'E494', 'E495'],
  HALAL: ['E300', 'E330', 'E406', 'E412', 'E415', 'E440', 'E100', 'E160a', 'E162', 'E200', 'E202', 'E211']
};
