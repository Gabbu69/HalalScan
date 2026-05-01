// src/utils/mlModel.ts

type Label = 'HALAL' | 'HARAM' | 'MASHBOOH';

interface TrainingData {
  text: string;
  label: Label;
}

const TRAINING_DATA: TrainingData[] = [
  { text: 'sugar water salt lemon juice', label: 'HALAL' },
  { text: 'pork fat lard gelatin e120 cochineal', label: 'HARAM' },
  { text: 'whey natural flavors e471 mono and diglycerides', label: 'MASHBOOH' },
  { text: 'wheat flour yeast salt water', label: 'HALAL' },
  { text: 'beef broth rum extract wine', label: 'HARAM' },
  { text: 'soy lecithin artificial flavor colors', label: 'MASHBOOH' },
  { text: 'milk cocoa butter sugar vanilla', label: 'HALAL' },
  { text: 'chicken carmine e920 l-cysteine', label: 'HARAM' },
  { text: 'glycerin calcium stearate enzymes', label: 'MASHBOOH' },
  { text: 'rice beans tomatoes onions', label: 'HALAL' }
];

// TF-IDF and Naive Bayes Implementation
class HalalNaiveBayes {
  private vocabulary: Set<string> = new Set();
  private classCounts: Record<Label, number> = { HALAL: 0, HARAM: 0, MASHBOOH: 0 };
  private wordCounts: Record<Label, Record<string, number>> = {
    HALAL: {}, HARAM: {}, MASHBOOH: {}
  };
  private totalWords: Record<Label, number> = { HALAL: 0, HARAM: 0, MASHBOOH: 0 };
  private totalDocs = 0;

  constructor() {
    this.train();
  }

  private tokenize(text: string): string[] {
    return text.toLowerCase().match(/\b[a-z0-9-]+\b/g) || [];
  }

  private train() {
    TRAINING_DATA.forEach(doc => {
      this.totalDocs++;
      this.classCounts[doc.label]++;
      
      const words = this.tokenize(doc.text);
      words.forEach(word => {
        this.vocabulary.add(word);
        this.totalWords[doc.label]++;
        this.wordCounts[doc.label][word] = (this.wordCounts[doc.label][word] || 0) + 1;
      });
    });
  }

  public predict(text: string): { verdict: Label; confidence: number; influencingTerms: string[] } {
    const words = this.tokenize(text);
    const scores: Record<Label, number> = { HALAL: 0, HARAM: 0, MASHBOOH: 0 };
    const termInfluence: Record<string, Record<Label, number>> = {};

    const vocabSize = this.vocabulary.size;

    // Calculate probabilities using Laplace smoothing
    (Object.keys(this.classCounts) as Label[]).forEach(label => {
      // Prior probability log(P(C))
      scores[label] = Math.log(this.classCounts[label] / this.totalDocs);

      words.forEach(word => {
        // Likelihood log(P(W|C))
        const wordCount = this.wordCounts[label][word] || 0;
        const prob = (wordCount + 1) / (this.totalWords[label] + vocabSize);
        const logProb = Math.log(prob);
        scores[label] += logProb;

        if (!termInfluence[word]) termInfluence[word] = { HALAL: 0, HARAM: 0, MASHBOOH: 0 };
        termInfluence[word][label] = logProb;
      });
    });

    // Find best label
    let bestLabel: Label = 'HALAL';
    let maxScore = -Infinity;
    
    (Object.keys(scores) as Label[]).forEach(label => {
      if (scores[label] > maxScore) {
        maxScore = scores[label];
        bestLabel = label;
      }
    });

    // Softmax for confidence
    const maxLog = Math.max(scores.HALAL, scores.HARAM, scores.MASHBOOH);
    const expScores = {
      HALAL: Math.exp(scores.HALAL - maxLog),
      HARAM: Math.exp(scores.HARAM - maxLog),
      MASHBOOH: Math.exp(scores.MASHBOOH - maxLog),
    };
    const sumExp = expScores.HALAL + expScores.HARAM + expScores.MASHBOOH;
    const confidence = expScores[bestLabel] / sumExp;

    // Identify top influencing terms for the predicted class
    const influencingTerms = words
      .filter(word => this.vocabulary.has(word))
      .sort((a, b) => termInfluence[b][bestLabel] - termInfluence[a][bestLabel])
      .slice(0, 3);

    return {
      verdict: bestLabel,
      confidence: parseFloat(confidence.toFixed(4)),
      influencingTerms: Array.from(new Set(influencingTerms))
    };
  }
}

export const modelInstance = new HalalNaiveBayes();

export const scoreIngredients = (ingredients: string) => {
  return modelInstance.predict(ingredients);
};
