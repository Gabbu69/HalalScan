import { scoreIngredients, getModelMetadata } from './src/utils/mlModel';
import { evaluateModel } from './src/utils/modelEvaluation';
import { evaluateKRREngine } from './src/utils/evaluateModel';

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
