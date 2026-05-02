/**
 * Model Evaluation Module for HalalScan
 * 
 * Provides functions to evaluate the KR&R reasoning engine against the
 * curated test dataset and compute standard ML evaluation metrics:
 * accuracy, precision, recall, F1-score, and a confusion matrix.
 * 
 * This module addresses the "Training, evaluation" requirement of the
 * ML Model Implementation rubric deliverable.
 */

import { runRuleBasedInference } from './reasoningEngine';
import { EVALUATION_DATASET, TestCase } from './evaluationDataset';

export type Verdict = 'HALAL' | 'HARAM' | 'MASHBOOH';

export type EvaluationRow = {
  testCase: TestCase;
  predictedVerdict: Verdict;
  isCorrect: boolean;
};

export type ConfusionMatrix = {
  // Rows = Actual, Cols = Predicted
  // [actual][predicted] = count
  HALAL:    { HALAL: number; HARAM: number; MASHBOOH: number };
  HARAM:    { HALAL: number; HARAM: number; MASHBOOH: number };
  MASHBOOH: { HALAL: number; HARAM: number; MASHBOOH: number };
};

export type ClassMetrics = {
  precision: number;
  recall: number;
  f1Score: number;
  support: number;  // number of actual instances
};

export type EvaluationReport = {
  rows: EvaluationRow[];
  accuracy: number;
  totalCorrect: number;
  totalCases: number;
  confusionMatrix: ConfusionMatrix;
  perClassMetrics: Record<Verdict, ClassMetrics>;
  macroAvgF1: number;
  weightedAvgF1: number;
};

/**
 * Runs the KR&R rule-based inference engine against all test cases
 * and produces a full evaluation report with metrics.
 */
export function evaluateKRREngine(): EvaluationReport {
  const verdicts: Verdict[] = ['HALAL', 'HARAM', 'MASHBOOH'];

  // Initialize confusion matrix
  const cm: ConfusionMatrix = {
    HALAL:    { HALAL: 0, HARAM: 0, MASHBOOH: 0 },
    HARAM:    { HALAL: 0, HARAM: 0, MASHBOOH: 0 },
    MASHBOOH: { HALAL: 0, HARAM: 0, MASHBOOH: 0 },
  };

  const rows: EvaluationRow[] = [];
  let totalCorrect = 0;

  for (const tc of EVALUATION_DATASET) {
    const result = runRuleBasedInference(tc.ingredients);
    // Map UNKNOWN to HALAL (no violations found = considered HALAL by default)
    const predicted: Verdict = result.status === 'UNKNOWN' ? 'HALAL' : result.status;
    const isCorrect = predicted === tc.expectedVerdict;
    if (isCorrect) totalCorrect++;

    cm[tc.expectedVerdict][predicted]++;
    rows.push({ testCase: tc, predictedVerdict: predicted, isCorrect });
  }

  const totalCases = EVALUATION_DATASET.length;
  const accuracy = totalCases > 0 ? totalCorrect / totalCases : 0;

  // Per-class precision, recall, F1
  const perClassMetrics: Record<Verdict, ClassMetrics> = {} as any;
  
  for (const v of verdicts) {
    // True positives: predicted v AND actual v
    const tp = cm[v][v];
    // False positives: predicted v BUT actual was something else
    const fp = verdicts.filter(a => a !== v).reduce((sum, a) => sum + cm[a][v], 0);
    // False negatives: actual v BUT predicted something else
    const fn = verdicts.filter(p => p !== v).reduce((sum, p) => sum + cm[v][p], 0);
    // Support: total actual instances of this class
    const support = verdicts.reduce((sum, p) => sum + cm[v][p], 0);

    const precision = (tp + fp) > 0 ? tp / (tp + fp) : 0;
    const recall = (tp + fn) > 0 ? tp / (tp + fn) : 0;
    const f1Score = (precision + recall) > 0 ? 2 * (precision * recall) / (precision + recall) : 0;

    perClassMetrics[v] = { precision, recall, f1Score, support };
  }

  // Macro-average F1 (unweighted mean of per-class F1)
  const macroAvgF1 = verdicts.reduce((sum, v) => sum + perClassMetrics[v].f1Score, 0) / verdicts.length;

  // Weighted-average F1 (weighted by support)
  const totalSupport = verdicts.reduce((sum, v) => sum + perClassMetrics[v].support, 0);
  const weightedAvgF1 = totalSupport > 0
    ? verdicts.reduce((sum, v) => sum + perClassMetrics[v].f1Score * perClassMetrics[v].support, 0) / totalSupport
    : 0;

  return {
    rows,
    accuracy,
    totalCorrect,
    totalCases,
    confusionMatrix: cm,
    perClassMetrics,
    macroAvgF1,
    weightedAvgF1,
  };
}
