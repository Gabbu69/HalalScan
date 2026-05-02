// ─────────────────────────────────────────────────────────────────────────────
// HalalScan ML Model Evaluation Harness
// Purpose: Evaluates the hybrid Neuro-Symbolic system against a curated
//          test dataset to compute accuracy, precision, recall, and F1-score.
// ─────────────────────────────────────────────────────────────────────────────

import { runRuleBasedInference, VerdictStatus } from './reasoningEngine';

// ─── TEST DATASET ────────────────────────────────────────────────────────────
// 25 curated test cases with known ground-truth verdicts.
// Sources: OpenFoodFacts, JAKIM certified product database, manual verification.

export interface TestCase {
  id: string;
  name: string;
  ingredients: string;
  expectedVerdict: VerdictStatus;
  source: string;
}

export const TEST_DATASET: TestCase[] = [
  // ── HALAL Products (8 cases) ──
  {
    id: 'TC001', name: 'White Rice (Generic)',
    ingredients: 'Long grain white rice',
    expectedVerdict: 'HALAL', source: 'Manual Verification'
  },
  {
    id: 'TC002', name: 'Coca-Cola Classic',
    ingredients: 'Carbonated water, high fructose corn syrup, caramel color, phosphoric acid, caffeine, citric acid',
    expectedVerdict: 'HALAL', source: 'OpenFoodFacts #5449000000996'
  },
  {
    id: 'TC003', name: 'Lay\'s Classic Potato Chips',
    ingredients: 'Potatoes, vegetable oil (sunflower, corn, canola), salt',
    expectedVerdict: 'HALAL', source: 'OpenFoodFacts #0028400064545'
  },
  {
    id: 'TC004', name: 'Organic Green Tea',
    ingredients: 'Organic green tea leaves',
    expectedVerdict: 'HALAL', source: 'Manual Verification'
  },
  {
    id: 'TC005', name: 'Barilla Spaghetti',
    ingredients: 'Semolina wheat flour, durum wheat flour, niacin, iron, thiamine mononitrate, riboflavin, folic acid',
    expectedVerdict: 'HALAL', source: 'OpenFoodFacts #8076802085738'
  },
  {
    id: 'TC006', name: 'Heinz Tomato Ketchup',
    ingredients: 'Tomato concentrate, distilled vinegar, high fructose corn syrup, corn syrup, salt, spice, onion powder',
    expectedVerdict: 'HALAL', source: 'OpenFoodFacts #0013000006101'
  },
  {
    id: 'TC007', name: 'Fresh Orange Juice',
    ingredients: '100% pure orange juice, calcium, vitamin D',
    expectedVerdict: 'HALAL', source: 'Manual Verification'
  },
  {
    id: 'TC008', name: 'Quaker Oats',
    ingredients: '100% whole grain rolled oats',
    expectedVerdict: 'HALAL', source: 'Manual Verification'
  },

  // ── HARAM Products (10 cases) ──
  {
    id: 'TC009', name: 'Oscar Mayer Bacon',
    ingredients: 'Cured with water, salt, sugar, sodium phosphates, sodium erythorbate, sodium nitrite, pork',
    expectedVerdict: 'HARAM', source: 'OpenFoodFacts #0044700011539'
  },
  {
    id: 'TC010', name: 'Haribo Goldbears (EU)',
    ingredients: 'Glucose syrup, sugar, gelatin, dextrose, citric acid, fruit juice, carnauba wax',
    expectedVerdict: 'HARAM', source: 'OpenFoodFacts #4001686301234 (contains pork gelatin)'
  },
  {
    id: 'TC011', name: 'Red Velvet Cake Mix',
    ingredients: 'Sugar, flour, cocoa, carmine (E120), baking soda, salt, vegetable oil',
    expectedVerdict: 'HARAM', source: 'Manual Verification (E120 insect dye)'
  },
  {
    id: 'TC012', name: 'Budweiser Beer',
    ingredients: 'Water, barley malt, rice, yeast, hops, beer, alcohol content 5%',
    expectedVerdict: 'HARAM', source: 'Manual Verification'
  },
  {
    id: 'TC013', name: 'Spam Luncheon Meat',
    ingredients: 'Pork with ham, salt, water, modified potato starch, sugar, sodium nitrite',
    expectedVerdict: 'HARAM', source: 'OpenFoodFacts #0037600202596'
  },
  {
    id: 'TC014', name: 'Jimmy Dean Sausage',
    ingredients: 'Pork, water, contains 2% or less of: salt, spices, sugar, lard',
    expectedVerdict: 'HARAM', source: 'Manual Verification'
  },
  {
    id: 'TC015', name: 'Blood Sausage (Morcilla)',
    ingredients: 'Pork blood, pork fat, rice, onion, salt, spices, black pudding mix',
    expectedVerdict: 'HARAM', source: 'Manual Verification'
  },
  {
    id: 'TC016', name: 'Shellac-Coated Candy',
    ingredients: 'Sugar, corn syrup, citric acid, shellac, E904, carnauba wax',
    expectedVerdict: 'HARAM', source: 'Manual Verification (shellac = insect resin)'
  },
  {
    id: 'TC017', name: 'Instant Noodles (Pork Flavor)',
    ingredients: 'Wheat flour, palm oil, salt, sugar, pork extract, lard, soy sauce powder, garlic powder',
    expectedVerdict: 'HARAM', source: 'Manual Verification'
  },
  {
    id: 'TC018', name: 'Wine-Marinated Chicken',
    ingredients: 'Chicken breast, wine, olive oil, garlic, rosemary, salt, black pepper',
    expectedVerdict: 'HARAM', source: 'Manual Verification (contains wine)'
  },

  // ── MASHBOOH Products (7 cases) ──
  {
    id: 'TC019', name: 'Oreo Cookies (Standard)',
    ingredients: 'Sugar, unbleached enriched flour, palm oil, cocoa, high fructose corn syrup, leavening, lecithin, natural flavor, salt',
    expectedVerdict: 'MASHBOOH', source: 'OpenFoodFacts (natural flavor unspecified)'
  },
  {
    id: 'TC020', name: 'Kraft Cheese Singles',
    ingredients: 'Cheddar cheese (milk, cheese culture, salt, enzymes), whey, milkfat, emulsifier, natural flavor',
    expectedVerdict: 'MASHBOOH', source: 'Manual Verification (enzymes/rennet source unknown)'
  },
  {
    id: 'TC021', name: 'Generic Vitamin D Supplement',
    ingredients: 'Vitamin D3, gelatin capsule, magnesium stearate, calcium stearate',
    expectedVerdict: 'MASHBOOH', source: 'Manual Verification (gelatin+stearate source unknown)'
  },
  {
    id: 'TC022', name: 'Bread with E471',
    ingredients: 'Wheat flour, water, yeast, sugar, salt, E471, soy flour',
    expectedVerdict: 'MASHBOOH', source: 'Manual Verification (E471 source unclear)'
  },
  {
    id: 'TC023', name: 'Ice Cream with Vanilla Extract',
    ingredients: 'Cream, milk, sugar, vanilla extract, egg yolks, glycerin',
    expectedVerdict: 'MASHBOOH', source: 'Manual Verification (vanilla extract + glycerin)'
  },
  {
    id: 'TC024', name: 'Cheese with Rennet',
    ingredients: 'Pasteurized milk, salt, rennet, cheese cultures',
    expectedVerdict: 'MASHBOOH', source: 'Manual Verification (rennet source unspecified)'
  },
  {
    id: 'TC025', name: 'Cake with E481',
    ingredients: 'Wheat flour, sugar, vegetable oil, E481, baking powder, salt, emulsifier, natural flavour',
    expectedVerdict: 'MASHBOOH', source: 'Manual Verification (E481 + natural flavour)'
  },
];

// ─── EVALUATION METRICS ──────────────────────────────────────────────────────

export interface ConfusionMatrix {
  // Predicted → Actual
  truePositives: number;   // Correctly classified
  falsePositives: number;  // Incorrectly classified as this
  falseNegatives: number;  // Should have been this but wasn't
}

export interface ClassMetrics {
  precision: number;
  recall: number;
  f1Score: number;
  support: number; // number of test cases for this class
}

export interface EvaluationReport {
  totalTests: number;
  correctPredictions: number;
  accuracy: number;
  perClass: Record<string, ClassMetrics>;
  confusionMatrix: Record<string, Record<string, number>>;
  predictions: {
    testId: string;
    name: string;
    expected: VerdictStatus;
    predicted: VerdictStatus;
    correct: boolean;
    confidence: number;
    rulesTriggered: number;
  }[];
  timestamp: string;
}

// Map UNKNOWN → HALAL for comparison (no flags = HALAL assumption)
function normalizeVerdict(v: VerdictStatus): 'HALAL' | 'HARAM' | 'MASHBOOH' {
  if (v === 'UNKNOWN') return 'HALAL';
  return v;
}

/**
 * Runs the KR&R engine against the full test dataset and computes
 * accuracy, precision, recall, and F1-score for each class.
 */
export function runEvaluation(): EvaluationReport {
  const classes: ('HALAL' | 'HARAM' | 'MASHBOOH')[] = ['HALAL', 'HARAM', 'MASHBOOH'];

  // Initialize confusion matrix
  const confusionMatrix: Record<string, Record<string, number>> = {};
  for (const actual of classes) {
    confusionMatrix[actual] = {};
    for (const predicted of classes) {
      confusionMatrix[actual][predicted] = 0;
    }
  }

  const predictions: EvaluationReport['predictions'] = [];
  let correct = 0;

  // Run inference on each test case
  for (const tc of TEST_DATASET) {
    const result = runRuleBasedInference(tc.ingredients);
    const predicted = normalizeVerdict(result.status);
    const expected = normalizeVerdict(tc.expectedVerdict);
    const isCorrect = predicted === expected;

    if (isCorrect) correct++;

    confusionMatrix[expected][predicted]++;

    predictions.push({
      testId: tc.id,
      name: tc.name,
      expected: tc.expectedVerdict,
      predicted: result.status,
      correct: isCorrect,
      confidence: result.confidence,
      rulesTriggered: result.rulesTriggered,
    });
  }

  // Compute per-class metrics
  const perClass: Record<string, ClassMetrics> = {};
  for (const cls of classes) {
    const tp = confusionMatrix[cls][cls]; // True positives
    let fp = 0; // False positives: predicted as cls but actually something else
    let fn = 0; // False negatives: actually cls but predicted as something else

    for (const other of classes) {
      if (other !== cls) {
        fp += confusionMatrix[other][cls]; // Other classes predicted as cls
        fn += confusionMatrix[cls][other]; // cls predicted as other classes
      }
    }

    const precision = tp + fp > 0 ? tp / (tp + fp) : 0;
    const recall = tp + fn > 0 ? tp / (tp + fn) : 0;
    const f1Score = precision + recall > 0 ? 2 * (precision * recall) / (precision + recall) : 0;
    const support = classes.reduce((sum, c) => sum + confusionMatrix[cls][c], 0);

    perClass[cls] = {
      precision: Math.round(precision * 10000) / 100,
      recall: Math.round(recall * 10000) / 100,
      f1Score: Math.round(f1Score * 10000) / 100,
      support,
    };
  }

  return {
    totalTests: TEST_DATASET.length,
    correctPredictions: correct,
    accuracy: Math.round((correct / TEST_DATASET.length) * 10000) / 100,
    perClass,
    confusionMatrix,
    predictions,
    timestamp: new Date().toISOString(),
  };
}

/**
 * Formats the evaluation report as a printable summary string.
 */
export function formatEvaluationReport(report: EvaluationReport): string {
  const lines: string[] = [];

  lines.push('═══════════════════════════════════════════════════════');
  lines.push('  HalalScan KR&R Engine — Evaluation Report');
  lines.push('═══════════════════════════════════════════════════════');
  lines.push(`  Timestamp: ${report.timestamp}`);
  lines.push(`  Test Cases: ${report.totalTests}`);
  lines.push(`  Correct: ${report.correctPredictions}/${report.totalTests}`);
  lines.push(`  Overall Accuracy: ${report.accuracy}%`);
  lines.push('');

  lines.push('  ── Per-Class Metrics ──');
  lines.push('  Class      | Precision | Recall  | F1-Score | Support');
  lines.push('  -----------|-----------|---------|----------|--------');
  for (const cls of ['HALAL', 'HARAM', 'MASHBOOH']) {
    const m = report.perClass[cls];
    if (m) {
      lines.push(
        `  ${cls.padEnd(10)} | ${(m.precision + '%').padEnd(9)} | ${(m.recall + '%').padEnd(7)} | ${(m.f1Score + '%').padEnd(8)} | ${m.support}`
      );
    }
  }
  lines.push('');

  lines.push('  ── Confusion Matrix ──');
  lines.push('                  Predicted →');
  lines.push('  Actual ↓  | HALAL  | HARAM  | MASHBOOH');
  lines.push('  ----------|--------|--------|--------');
  for (const actual of ['HALAL', 'HARAM', 'MASHBOOH']) {
    const row = report.confusionMatrix[actual];
    lines.push(
      `  ${actual.padEnd(10)}| ${String(row['HALAL']).padEnd(6)} | ${String(row['HARAM']).padEnd(6)} | ${row['MASHBOOH']}`
    );
  }
  lines.push('');

  lines.push('  ── Individual Predictions ──');
  for (const p of report.predictions) {
    const mark = p.correct ? '✓' : '✗';
    lines.push(`  [${mark}] ${p.testId} ${p.name.substring(0, 30).padEnd(30)} | Expected: ${p.expected.padEnd(9)} | Got: ${(p.predicted || 'HALAL').padEnd(9)} | Conf: ${p.confidence}%`);
  }

  lines.push('═══════════════════════════════════════════════════════');
  return lines.join('\n');
}
