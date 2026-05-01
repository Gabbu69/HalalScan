// src/utils/modelEvaluation.ts
import { scoreIngredients } from './mlModel';

type Label = 'HALAL' | 'HARAM' | 'MASHBOOH';

interface TestData {
  text: string;
  trueLabel: Label;
}

const TEST_DATA: TestData[] = [
  { text: 'water salt organic sugar', trueLabel: 'HALAL' },
  { text: 'pork belly salt', trueLabel: 'HARAM' },
  { text: 'e471 natural flavors salt', trueLabel: 'MASHBOOH' },
  { text: 'chicken stock', trueLabel: 'HALAL' }, 
  { text: 'wine vinegar salt', trueLabel: 'HARAM' },
  { text: 'glycerin enzymes', trueLabel: 'MASHBOOH' },
  { text: 'beef tallow', trueLabel: 'HARAM' },
  { text: 'soy sauce maltodextrin', trueLabel: 'HALAL' },
  { text: 'cochineal color e120', trueLabel: 'HARAM' },
  { text: 'mono and diglycerides', trueLabel: 'MASHBOOH' }
];

export const evaluateModel = () => {
  let correct = 0;
  const confusionMatrix: Record<Label, Record<Label, number>> = {
    HALAL: { HALAL: 0, HARAM: 0, MASHBOOH: 0 },
    HARAM: { HALAL: 0, HARAM: 0, MASHBOOH: 0 },
    MASHBOOH: { HALAL: 0, HARAM: 0, MASHBOOH: 0 }
  };

  const truePositives: Record<Label, number> = { HALAL: 0, HARAM: 0, MASHBOOH: 0 };
  const falsePositives: Record<Label, number> = { HALAL: 0, HARAM: 0, MASHBOOH: 0 };
  const falseNegatives: Record<Label, number> = { HALAL: 0, HARAM: 0, MASHBOOH: 0 };

  TEST_DATA.forEach(testCase => {
    const prediction = scoreIngredients(testCase.text);
    const predicted = prediction.verdict;
    const actual = testCase.trueLabel;

    confusionMatrix[actual][predicted]++;

    if (predicted === actual) {
      correct++;
      truePositives[actual]++;
    } else {
      falsePositives[predicted]++;
      falseNegatives[actual]++;
    }
  });

  const accuracy = correct / TEST_DATA.length;

  const calculateMetrics = (label: Label) => {
    const tp = truePositives[label];
    const fp = falsePositives[label];
    const fn = falseNegatives[label];
    const precision = tp + fp === 0 ? 0 : tp / (tp + fp);
    const recall = tp + fn === 0 ? 0 : tp / (tp + fn);
    return { precision, recall };
  };

  return {
    accuracy: parseFloat(accuracy.toFixed(4)),
    metrics: {
      HALAL: calculateMetrics('HALAL'),
      HARAM: calculateMetrics('HARAM'),
      MASHBOOH: calculateMetrics('MASHBOOH')
    },
    confusionMatrix
  };
};
