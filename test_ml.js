// src/utils/mlModel.ts
var TRAINING_DATA = [
  { text: "sugar water salt lemon juice", label: "HALAL" },
  { text: "pork fat lard gelatin e120 cochineal", label: "HARAM" },
  { text: "whey natural flavors e471 mono and diglycerides", label: "MASHBOOH" },
  { text: "wheat flour yeast salt water", label: "HALAL" },
  { text: "beef broth rum extract wine", label: "HARAM" },
  { text: "soy lecithin artificial flavor colors", label: "MASHBOOH" },
  { text: "milk cocoa butter sugar vanilla", label: "HALAL" },
  { text: "chicken carmine e920 l-cysteine", label: "HARAM" },
  { text: "glycerin calcium stearate enzymes", label: "MASHBOOH" },
  { text: "rice beans tomatoes onions", label: "HALAL" }
];
var HalalNaiveBayes = class {
  constructor() {
    this.vocabulary = /* @__PURE__ */ new Set();
    this.classCounts = { HALAL: 0, HARAM: 0, MASHBOOH: 0 };
    this.wordCounts = {
      HALAL: {},
      HARAM: {},
      MASHBOOH: {}
    };
    this.totalWords = { HALAL: 0, HARAM: 0, MASHBOOH: 0 };
    this.totalDocs = 0;
    this.train();
  }
  tokenize(text) {
    return text.toLowerCase().match(/\b[a-z0-9-]+\b/g) || [];
  }
  train() {
    TRAINING_DATA.forEach((doc) => {
      this.totalDocs++;
      this.classCounts[doc.label]++;
      const words = this.tokenize(doc.text);
      words.forEach((word) => {
        this.vocabulary.add(word);
        this.totalWords[doc.label]++;
        this.wordCounts[doc.label][word] = (this.wordCounts[doc.label][word] || 0) + 1;
      });
    });
  }
  predict(text) {
    const words = this.tokenize(text);
    const scores = { HALAL: 0, HARAM: 0, MASHBOOH: 0 };
    const termInfluence = {};
    const vocabSize = this.vocabulary.size;
    Object.keys(this.classCounts).forEach((label) => {
      scores[label] = Math.log(this.classCounts[label] / this.totalDocs);
      words.forEach((word) => {
        const wordCount = this.wordCounts[label][word] || 0;
        const prob = (wordCount + 1) / (this.totalWords[label] + vocabSize);
        const logProb = Math.log(prob);
        scores[label] += logProb;
        if (!termInfluence[word]) termInfluence[word] = { HALAL: 0, HARAM: 0, MASHBOOH: 0 };
        termInfluence[word][label] = logProb;
      });
    });
    let bestLabel = "HALAL";
    let maxScore = -Infinity;
    Object.keys(scores).forEach((label) => {
      if (scores[label] > maxScore) {
        maxScore = scores[label];
        bestLabel = label;
      }
    });
    const maxLog = Math.max(scores.HALAL, scores.HARAM, scores.MASHBOOH);
    const expScores = {
      HALAL: Math.exp(scores.HALAL - maxLog),
      HARAM: Math.exp(scores.HARAM - maxLog),
      MASHBOOH: Math.exp(scores.MASHBOOH - maxLog)
    };
    const sumExp = expScores.HALAL + expScores.HARAM + expScores.MASHBOOH;
    const confidence = expScores[bestLabel] / sumExp;
    const influencingTerms = words.filter((word) => this.vocabulary.has(word)).sort((a, b) => termInfluence[b][bestLabel] - termInfluence[a][bestLabel]).slice(0, 3);
    return {
      verdict: bestLabel,
      confidence: parseFloat(confidence.toFixed(4)),
      influencingTerms: Array.from(new Set(influencingTerms))
    };
  }
};
var modelInstance = new HalalNaiveBayes();
var scoreIngredients = (ingredients) => {
  return modelInstance.predict(ingredients);
};

// src/utils/modelEvaluation.ts
var TEST_DATA = [
  { text: "water salt organic sugar", trueLabel: "HALAL" },
  { text: "pork belly salt", trueLabel: "HARAM" },
  { text: "e471 natural flavors salt", trueLabel: "MASHBOOH" },
  { text: "chicken stock", trueLabel: "HALAL" },
  { text: "wine vinegar salt", trueLabel: "HARAM" },
  { text: "glycerin enzymes", trueLabel: "MASHBOOH" },
  { text: "beef tallow", trueLabel: "HARAM" },
  { text: "soy sauce maltodextrin", trueLabel: "HALAL" },
  { text: "cochineal color e120", trueLabel: "HARAM" },
  { text: "mono and diglycerides", trueLabel: "MASHBOOH" }
];
var evaluateModel = () => {
  let correct = 0;
  const confusionMatrix = {
    HALAL: { HALAL: 0, HARAM: 0, MASHBOOH: 0 },
    HARAM: { HALAL: 0, HARAM: 0, MASHBOOH: 0 },
    MASHBOOH: { HALAL: 0, HARAM: 0, MASHBOOH: 0 }
  };
  const truePositives = { HALAL: 0, HARAM: 0, MASHBOOH: 0 };
  const falsePositives = { HALAL: 0, HARAM: 0, MASHBOOH: 0 };
  const falseNegatives = { HALAL: 0, HARAM: 0, MASHBOOH: 0 };
  TEST_DATA.forEach((testCase) => {
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
  const calculateMetrics = (label) => {
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
      HALAL: calculateMetrics("HALAL"),
      HARAM: calculateMetrics("HARAM"),
      MASHBOOH: calculateMetrics("MASHBOOH")
    },
    confusionMatrix
  };
};

// test_ml.ts
console.log("--- ML Model Prediction Test ---");
console.log("Test 1 (sugar water salt):", scoreIngredients("sugar water salt"));
console.log("Test 2 (pork fat e120):", scoreIngredients("pork fat e120"));
console.log("Test 3 (e471 natural flavors):", scoreIngredients("e471 natural flavors"));
console.log("\n--- Model Evaluation Test ---");
console.log(JSON.stringify(evaluateModel(), null, 2));
