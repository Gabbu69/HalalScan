import { scoreIngredients } from './src/utils/mlModel';
import { evaluateModel } from './src/utils/modelEvaluation';

console.log('--- ML Model Prediction Test ---');
console.log('Test 1 (sugar water salt):', scoreIngredients('sugar water salt'));
console.log('Test 2 (pork fat e120):', scoreIngredients('pork fat e120'));
console.log('Test 3 (e471 natural flavors):', scoreIngredients('e471 natural flavors'));

console.log('\n--- Model Evaluation Test ---');
console.log(JSON.stringify(evaluateModel(), null, 2));
