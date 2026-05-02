import { scoreIngredients, getModelMetadata } from './src/utils/mlModel';
import { evaluateModel } from './src/utils/modelEvaluation';
import { evaluateKRREngine } from './src/utils/evaluateModel';
import { runRuleBasedInference, type InferenceResult } from './src/utils/reasoningEngine';

console.log('--- Local ML Fallback Metadata ---');
console.log(JSON.stringify(getModelMetadata(), null, 2));

console.log('\n--- Local ML Prediction Smoke Test ---');
[
  'sugar water salt',
  'pork fat e120',
  'e471 natural flavors',
  'prosciutto melon black pepper',
  'soy sauce maltodextrin'
].forEach(sample => {
  console.log(sample, scoreIngredients(sample));
});

console.log('\n--- Local ML Holdout Evaluation ---');
const mlReport = evaluateModel();
console.log(JSON.stringify({
  accuracy: mlReport.accuracy,
  totalCorrect: mlReport.totalCorrect,
  totalCases: mlReport.totalCases,
  macroAvgF1: mlReport.macroAvgF1,
  confusionMatrix: mlReport.confusionMatrix,
  failed: mlReport.rows.filter(row => !row.isCorrect)
}, null, 2));

console.log('\n--- KR&R Rule Engine Evaluation ---');
const krrReport = evaluateKRREngine();
console.log(JSON.stringify({
  accuracy: krrReport.accuracy,
  totalCorrect: krrReport.totalCorrect,
  totalCases: krrReport.totalCases,
  macroAvgF1: krrReport.macroAvgF1,
  confusionMatrix: krrReport.confusionMatrix,
  failed: krrReport.rows.filter(row => !row.isCorrect).map(row => ({
    id: row.testCase.id,
    product: row.testCase.productName,
    expected: row.testCase.expectedVerdict,
    predicted: row.predictedVerdict
  }))
}, null, 2));

console.log('\n--- Edge Case Regression Tests ---');

const assertKrrStatus = (input: string, expected: InferenceResult['status']) => {
  const result = runRuleBasedInference(input);
  console.log(input, '->', result.status);
  if (result.status !== expected) {
    throw new Error(`Expected KR&R ${expected} for "${input}", got ${result.status}.`);
  }
};

const assertKrrNotStatus = (input: string, unexpected: InferenceResult['status']) => {
  const result = runRuleBasedInference(input);
  console.log(input, '->', result.status);
  if (result.status === unexpected) {
    throw new Error(`Expected KR&R not ${unexpected} for "${input}".`);
  }
};

const assertMlVerdict = (input: string, expected: ReturnType<typeof scoreIngredients>['verdict']) => {
  const result = scoreIngredients(input);
  console.log(input, '->', result.verdict);
  if (result.verdict !== expected) {
    throw new Error(`Expected local ML ${expected} for "${input}", got ${result.verdict}.`);
  }
};

assertKrrStatus('No ingredients listed.', 'MASHBOOH');
assertKrrStatus('pig fat', 'HARAM');
assertKrrStatus('porcine gelatin', 'HARAM');
assertKrrStatus('swine extract', 'HARAM');
assertKrrStatus('beef gelatin', 'MASHBOOH');
assertKrrStatus('bovine gelatin', 'MASHBOOH');
assertKrrStatus('animal shortening', 'MASHBOOH');
assertKrrStatus('E-120', 'HARAM');
assertKrrNotStatus('E1200', 'HARAM');
assertKrrStatus('sugar, water, salt', 'HALAL');
assertKrrStatus('sugar, water, salt, pork flavor', 'HARAM');
assertMlVerdict('porcine gelatin capsule', 'HARAM');
assertMlVerdict('swine extract flavor base', 'HARAM');
assertMlVerdict('beef gelatin source not certified', 'MASHBOOH');
assertMlVerdict('animal shortening animal fat source unknown', 'MASHBOOH');
