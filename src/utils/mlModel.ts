// src/utils/mlModel.ts

export type Label = 'HALAL' | 'HARAM' | 'MASHBOOH';

export interface TrainingData {
  text: string;
  label: Label;
}

export const TRAINING_DATA: TrainingData[] = [
  // HALAL samples
  { text: 'sugar water salt lemon juice', label: 'HALAL' },
  { text: 'wheat flour yeast salt water', label: 'HALAL' },
  { text: 'milk cocoa butter sugar vanilla', label: 'HALAL' },
  { text: 'rice beans tomatoes onions', label: 'HALAL' },
  { text: 'water salt organic sugar', label: 'HALAL' },
  { text: 'chicken stock broth spices', label: 'HALAL' },
  { text: 'soy sauce maltodextrin wheat soybeans', label: 'HALAL' },
  { text: 'potatoes sunflower oil salt', label: 'HALAL' },
  { text: 'orange juice ascorbic acid vitamin c', label: 'HALAL' },
  { text: 'tuna water salt', label: 'HALAL' },
  { text: 'rolled oats sugar iron vitamin a', label: 'HALAL' },
  { text: 'extra virgin olive oil', label: 'HALAL' },
  { text: 'roasted peanuts salt', label: 'HALAL' },
  { text: 'chickpeas water salt calcium chloride', label: 'HALAL' },
  { text: 'green tea leaves', label: 'HALAL' },
  { text: 'corn starch vegetable oil sea salt', label: 'HALAL' },

  // HARAM samples
  { text: 'pork fat lard e120 cochineal', label: 'HARAM' },
  { text: 'beef broth rum extract wine', label: 'HARAM' },
  { text: 'chicken carmine e920 l-cysteine', label: 'HARAM' },
  { text: 'pork belly salt', label: 'HARAM' },
  { text: 'wine vinegar salt', label: 'HARAM' },
  { text: 'beef tallow from non zabiha source', label: 'HARAM' },
  { text: 'bacon fat natural smoke flavor', label: 'HARAM' },
  { text: 'pork blood rice onions pork fat', label: 'HARAM' },
  { text: 'prosciutto black pepper cured pork', label: 'HARAM' },
  { text: 'ham cheese croissant', label: 'HARAM' },
  { text: 'beer battered fish wheat flour', label: 'HARAM' },
  { text: 'mascarpone sugar rum marsala dessert', label: 'HARAM' },
  { text: 'gelatin from pork marshmallow', label: 'HARAM' },
  { text: 'shellac e904 confectionery glaze', label: 'HARAM' },
  { text: 'bone phosphate e542 animal bone', label: 'HARAM' },
  { text: 'vodka whiskey brandy liqueur alcohol', label: 'HARAM' },
  { text: 'pig fat seasoning', label: 'HARAM' },
  { text: 'porcine gelatin capsule', label: 'HARAM' },
  { text: 'swine extract flavor base', label: 'HARAM' },
  { text: 'boar meat sausage', label: 'HARAM' },
  { text: 'pork broth pork stock pork flavor', label: 'HARAM' },

  // MASHBOOH samples
  { text: 'whey natural flavors e471 mono and diglycerides', label: 'MASHBOOH' },
  { text: 'soy lecithin artificial flavor colors', label: 'MASHBOOH' },
  { text: 'glycerin calcium stearate enzymes', label: 'MASHBOOH' },
  { text: 'gelatin natural flavors artificial colors', label: 'MASHBOOH' },
  { text: 'rennet whey e471 cheddar cheese', label: 'MASHBOOH' },
  { text: 'glycerol stabilizer natural vanilla flavoring', label: 'MASHBOOH' },
  { text: 'lecithin whey powder natural flavors', label: 'MASHBOOH' },
  { text: 'modified starch gelatin natural flavors e471', label: 'MASHBOOH' },
  { text: 'mono and diglycerides calcium stearate whey', label: 'MASHBOOH' },
  { text: 'lipase enzymes artificial color processed cheese', label: 'MASHBOOH' },
  { text: 'confectioners glaze artificial flavor', label: 'MASHBOOH' },
  { text: 'e481 emulsifier vegetable oil', label: 'MASHBOOH' },
  { text: 'e422 glycerol humectant', label: 'MASHBOOH' },
  { text: 'e570 stearic acid anti caking agent', label: 'MASHBOOH' },
  { text: 'e472a e476 emulsifier unknown source', label: 'MASHBOOH' },
  { text: 'pepsin trypsin enzyme source unspecified', label: 'MASHBOOH' },
  { text: 'beef gelatin source not certified', label: 'MASHBOOH' },
  { text: 'bovine gelatin animal source unknown', label: 'MASHBOOH' },
  { text: 'animal shortening animal fat source unknown', label: 'MASHBOOH' },
  { text: 'animal enzymes animal rennet source unspecified', label: 'MASHBOOH' },
  { text: 'beef tallow source not halal certified', label: 'MASHBOOH' }
];

const LABELS: Label[] = ['HALAL', 'HARAM', 'MASHBOOH'];

const normalizeIngredientText = (text: string) => text
  .toLowerCase()
  .replace(/[‐‑‒–—]/g, '-')
  .replace(/\be[\s-]+(?=\d)/g, 'e');

const extractFeatures = (text: string): string[] => {
  const tokens = normalizeIngredientText(text).match(/\b[a-z0-9]+(?:-[a-z0-9]+)?\b/g) || [];
  const features = [...tokens];

  for (let n = 2; n <= 3; n++) {
    for (let i = 0; i <= tokens.length - n; i++) {
      features.push(tokens.slice(i, i + n).join('_'));
    }
  }

  return features;
};

class HalalNaiveBayes {
  private vocabulary: Set<string> = new Set();
  private classCounts: Record<Label, number> = { HALAL: 0, HARAM: 0, MASHBOOH: 0 };
  private featureWeights: Record<Label, Record<string, number>> = {
    HALAL: {}, HARAM: {}, MASHBOOH: {}
  };
  private totalFeatureWeights: Record<Label, number> = { HALAL: 0, HARAM: 0, MASHBOOH: 0 };
  private documentFrequency: Record<string, number> = {};
  private totalDocs = 0;

  constructor(private readonly trainingData: TrainingData[] = TRAINING_DATA) {
    this.train();
  }

  private train() {
    const preparedDocs = this.trainingData.map(doc => {
      const features = extractFeatures(doc.text);
      const uniqueFeatures = new Set(features);

      uniqueFeatures.forEach(feature => {
        this.vocabulary.add(feature);
        this.documentFrequency[feature] = (this.documentFrequency[feature] || 0) + 1;
      });

      return { ...doc, features };
    });

    this.totalDocs = preparedDocs.length;

    preparedDocs.forEach(doc => {
      this.classCounts[doc.label]++;
      const featureCounts: Record<string, number> = {};

      doc.features.forEach(feature => {
        featureCounts[feature] = (featureCounts[feature] || 0) + 1;
      });

      Object.entries(featureCounts).forEach(([feature, count]) => {
        const idf = Math.log((1 + this.totalDocs) / (1 + this.documentFrequency[feature])) + 1;
        const weight = count * idf;
        this.featureWeights[doc.label][feature] = (this.featureWeights[doc.label][feature] || 0) + weight;
        this.totalFeatureWeights[doc.label] += weight;
      });
    });
  }

  public predict(text: string): { verdict: Label; confidence: number; influencingTerms: string[] } {
    const features = extractFeatures(text);
    const featureCounts: Record<string, number> = {};
    features.forEach(feature => {
      featureCounts[feature] = (featureCounts[feature] || 0) + 1;
    });

    const scores: Record<Label, number> = { HALAL: 0, HARAM: 0, MASHBOOH: 0 };
    const termInfluence: Record<string, Record<Label, number>> = {};
    const vocabSize = Math.max(this.vocabulary.size, 1);
    const alpha = 1;

    LABELS.forEach(label => {
      scores[label] = Math.log(this.classCounts[label] / this.totalDocs);

      Object.entries(featureCounts).forEach(([feature, count]) => {
        const idf = Math.log((1 + this.totalDocs) / (1 + (this.documentFrequency[feature] || 0))) + 1;
        const inputWeight = count * idf;
        const trainedWeight = this.featureWeights[label][feature] || 0;
        const probability = (trainedWeight + alpha) / (this.totalFeatureWeights[label] + alpha * vocabSize);
        const contribution = inputWeight * Math.log(probability);

        scores[label] += contribution;

        if (!termInfluence[feature]) termInfluence[feature] = { HALAL: 0, HARAM: 0, MASHBOOH: 0 };
        termInfluence[feature][label] = contribution;
      });
    });

    let bestLabel: Label = 'HALAL';
    let maxScore = -Infinity;

    LABELS.forEach(label => {
      if (scores[label] > maxScore) {
        maxScore = scores[label];
        bestLabel = label;
      }
    });

    const maxLog = Math.max(scores.HALAL, scores.HARAM, scores.MASHBOOH);
    const temperature = 3;
    const expScores = {
      HALAL: Math.exp((scores.HALAL - maxLog) / temperature),
      HARAM: Math.exp((scores.HARAM - maxLog) / temperature),
      MASHBOOH: Math.exp((scores.MASHBOOH - maxLog) / temperature),
    };
    const sumExp = expScores.HALAL + expScores.HARAM + expScores.MASHBOOH;
    const confidence = expScores[bestLabel] / sumExp;

    const influencingTerms = Object.keys(featureCounts)
      .filter(feature => this.vocabulary.has(feature))
      .sort((a, b) => termInfluence[b][bestLabel] - termInfluence[a][bestLabel])
      .slice(0, 5)
      .map(feature => feature.replace(/_/g, ' '));

    return {
      verdict: bestLabel,
      confidence: parseFloat(confidence.toFixed(4)),
      influencingTerms: Array.from(new Set(influencingTerms))
    };
  }

  public getMetadata() {
    return {
      algorithm: 'TF-IDF weighted Multinomial Naive Bayes',
      trainingSamples: this.trainingData.length,
      vocabularySize: this.vocabulary.size,
      labels: LABELS,
      featureTypes: ['unigram', 'bigram', 'trigram']
    };
  }
}

export const modelInstance = new HalalNaiveBayes();

export const scoreIngredients = (ingredients: string) => {
  return modelInstance.predict(ingredients);
};

export const getModelMetadata = () => modelInstance.getMetadata();
