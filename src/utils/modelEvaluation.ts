// src/utils/modelEvaluation.ts
import { getModelMetadata, scoreIngredients, type Label } from './mlModel';

interface TestData {
  text: string;
  trueLabel: Label;
}

export const ML_TEST_DATA: TestData[] = [
  // HALAL holdout cases
  { text: 'water sea salt cane sugar', trueLabel: 'HALAL' },
  { text: 'brown rice sunflower oil', trueLabel: 'HALAL' },
  { text: 'orange juice vitamin c', trueLabel: 'HALAL' },
  { text: 'chickpeas water salt', trueLabel: 'HALAL' },
  { text: 'green tea leaves', trueLabel: 'HALAL' },
  { text: 'tuna water salt', trueLabel: 'HALAL' },
  { text: 'olive oil', trueLabel: 'HALAL' },
  { text: 'roasted peanuts salt', trueLabel: 'HALAL' },
  { text: 'potato chips vegetable oil salt', trueLabel: 'HALAL' },
  { text: 'oatmeal sugar calcium carbonate', trueLabel: 'HALAL' },

  // HARAM holdout cases
  { text: 'pork sausage spices', trueLabel: 'HARAM' },
  { text: 'red color carmine e120', trueLabel: 'HARAM' },
  { text: 'tiramisu dessert with rum', trueLabel: 'HARAM' },
  { text: 'bacon seasoning bacon fat', trueLabel: 'HARAM' },
  { text: 'wine vinegar dressing wine', trueLabel: 'HARAM' },
  { text: 'prosciutto melon black pepper', trueLabel: 'HARAM' },
  { text: 'ham and cheese croissant', trueLabel: 'HARAM' },
  { text: 'beer batter cod fillet', trueLabel: 'HARAM' },
  { text: 'vodka chocolate liqueur', trueLabel: 'HARAM' },
  { text: 'pork gelatin capsule', trueLabel: 'HARAM' },

  // MASHBOOH holdout cases
  { text: 'gummy bears gelatin natural flavors', trueLabel: 'MASHBOOH' },
  { text: 'e471 emulsifier vegetable oil', trueLabel: 'MASHBOOH' },
  { text: 'rennet whey cheese', trueLabel: 'MASHBOOH' },
  { text: 'glycerin stabilizer natural flavor', trueLabel: 'MASHBOOH' },
  { text: 'mono and diglycerides', trueLabel: 'MASHBOOH' },
  { text: 'soy lecithin whey powder', trueLabel: 'MASHBOOH' },
  { text: 'calcium stearate enzymes', trueLabel: 'MASHBOOH' },
  { text: 'e481 emulsifier', trueLabel: 'MASHBOOH' },
  { text: 'confectioners glaze artificial flavor', trueLabel: 'MASHBOOH' },
  { text: 'lipase enzyme artificial color', trueLabel: 'MASHBOOH' }
];

type ConfusionMatrix = Record<Label, Record<Label, number>>;

type ClassMetrics = {
  precision: number;
  recall: number;
  f1Score: number;
  support: number;
};

export type ModelEvaluationReport = {
  accuracy: number;
  totalCorrect: number;
  totalCases: number;
  metrics: Record<Label, ClassMetrics>;
  confusionMatrix: ConfusionMatrix;
  macroAvgF1: number;
  weightedAvgF1: number;
  metadata: ReturnType<typeof getModelMetadata>;
  rows: Array<{
    text: string;
    expected: Label;
    predicted: Label;
    confidence: number;
    isCorrect: boolean;
    influencingTerms: string[];
  }>;
};

export const evaluateModel = (): ModelEvaluationReport => {
  const labels: Label[] = ['HALAL', 'HARAM', 'MASHBOOH'];
  const confusionMatrix: ConfusionMatrix = {
    HALAL: { HALAL: 0, HARAM: 0, MASHBOOH: 0 },
    HARAM: { HALAL: 0, HARAM: 0, MASHBOOH: 0 },
    MASHBOOH: { HALAL: 0, HARAM: 0, MASHBOOH: 0 }
  };

  let totalCorrect = 0;
  const rows = ML_TEST_DATA.map(testCase => {
    const prediction = scoreIngredients(testCase.text);
    const predicted = prediction.verdict;
    const actual = testCase.trueLabel;
    const isCorrect = predicted === actual;

    confusionMatrix[actual][predicted]++;
    if (isCorrect) totalCorrect++;

    return {
      text: testCase.text,
      expected: actual,
      predicted,
      confidence: prediction.confidence,
      isCorrect,
      influencingTerms: prediction.influencingTerms
    };
  });

  const totalCases = ML_TEST_DATA.length;
  const accuracy = totalCases > 0 ? totalCorrect / totalCases : 0;

  const metrics: Record<Label, ClassMetrics> = {} as Record<Label, ClassMetrics>;
  labels.forEach(label => {
    const tp = confusionMatrix[label][label];
    const fp = labels.filter(actual => actual !== label).reduce((sum, actual) => sum + confusionMatrix[actual][label], 0);
    const fn = labels.filter(predicted => predicted !== label).reduce((sum, predicted) => sum + confusionMatrix[label][predicted], 0);
    const support = labels.reduce((sum, predicted) => sum + confusionMatrix[label][predicted], 0);
    const precision = tp + fp === 0 ? 0 : tp / (tp + fp);
    const recall = tp + fn === 0 ? 0 : tp / (tp + fn);
    const f1Score = precision + recall === 0 ? 0 : 2 * (precision * recall) / (precision + recall);

    metrics[label] = { precision, recall, f1Score, support };
  });

  const macroAvgF1 = labels.reduce((sum, label) => sum + metrics[label].f1Score, 0) / labels.length;
  const weightedAvgF1 = totalCases > 0
    ? labels.reduce((sum, label) => sum + metrics[label].f1Score * metrics[label].support, 0) / totalCases
    : 0;

  return {
    accuracy: parseFloat(accuracy.toFixed(4)),
    totalCorrect,
    totalCases,
    metrics,
    confusionMatrix,
    macroAvgF1,
    weightedAvgF1,
    metadata: getModelMetadata(),
    rows
  };
};
