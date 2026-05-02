import React, { useState, useMemo } from 'react';
import { evaluateKRREngine, EvaluationReport, Verdict } from '../utils/evaluateModel';
import { evaluateModel, type ModelEvaluationReport } from '../utils/modelEvaluation';
import { EVALUATION_DATASET } from '../utils/evaluationDataset';
import { FlaskConical, CheckCircle, XCircle, BarChart3, ChevronDown, ChevronUp, Brain, Database, Cpu } from 'lucide-react';
import { useTranslation } from '../hooks/useTranslation';

const verdictColors: Record<Verdict, { bg: string; text: string; darkBg: string; darkText: string }> = {
  HALAL:    { bg: 'bg-green-50',  text: 'text-green-700',  darkBg: 'dark:bg-green-900/30', darkText: 'dark:text-green-400' },
  HARAM:    { bg: 'bg-red-50',    text: 'text-red-700',    darkBg: 'dark:bg-red-900/30',   darkText: 'dark:text-red-400' },
  MASHBOOH: { bg: 'bg-amber-50',  text: 'text-amber-700',  darkBg: 'dark:bg-amber-900/30', darkText: 'dark:text-amber-400' },
};

export function Evaluation() {
  const { t } = useTranslation();
  const [hasRun, setHasRun] = useState(false);
  const [report, setReport] = useState<EvaluationReport | null>(null);
  const [mlReport, setMlReport] = useState<ModelEvaluationReport | null>(null);
  const [showDetails, setShowDetails] = useState(false);
  const [showMatrix, setShowMatrix] = useState(false);

  const handleRunEvaluation = () => {
    const result = evaluateKRREngine();
    const mlResult = evaluateModel();
    setReport(result);
    setMlReport(mlResult);
    setHasRun(true);
  };

  const pct = (n: number) => (n * 100).toFixed(1) + '%';

  return (
    <div className="flex flex-col h-full mx-auto max-w-md w-full pt-4">
      <div className="px-5 mb-4">
        <h2 className="font-amiri italic text-2xl text-[#1B6B3A] dark:text-green-400 font-bold mb-1">
          Model Evaluation
        </h2>
        <p className="text-[10px] text-gray-500 dark:text-gray-400 leading-relaxed">
          Evaluate the KR&R Reasoning Engine against a curated dataset of {EVALUATION_DATASET.length} products 
          with ground-truth labels. Computes accuracy, precision, recall, F1-score, and confusion matrix.
        </p>
      </div>

      <div className="flex-1 overflow-y-auto px-5 pb-20 w-full space-y-4">
        
        {/* Dataset Info Card */}
        <div className="bg-white dark:bg-[#1a2e22] rounded-2xl p-4 shadow-sm border border-gray-100 dark:border-gray-800">
          <div className="flex items-center gap-2 mb-3">
            <Database size={14} className="text-[#1B6B3A] dark:text-green-400" />
            <h3 className="text-[11px] font-bold uppercase tracking-wider text-[#1B6B3A] dark:text-green-400">Test Dataset</h3>
          </div>
          <div className="grid grid-cols-3 gap-2">
            <div className="bg-green-50 dark:bg-green-900/20 rounded-xl p-3 text-center border border-green-100 dark:border-green-900/30">
              <div className="text-lg font-bold text-green-700 dark:text-green-400">10</div>
              <div className="text-[8px] font-bold uppercase tracking-wider text-green-600 dark:text-green-500">Halal</div>
            </div>
            <div className="bg-red-50 dark:bg-red-900/20 rounded-xl p-3 text-center border border-red-100 dark:border-red-900/30">
              <div className="text-lg font-bold text-red-700 dark:text-red-400">10</div>
              <div className="text-[8px] font-bold uppercase tracking-wider text-red-600 dark:text-red-500">Haram</div>
            </div>
            <div className="bg-amber-50 dark:bg-amber-900/20 rounded-xl p-3 text-center border border-amber-100 dark:border-amber-900/30">
              <div className="text-lg font-bold text-amber-700 dark:text-amber-400">10</div>
              <div className="text-[8px] font-bold uppercase tracking-wider text-amber-600 dark:text-amber-500">Mashbooh</div>
            </div>
          </div>
        </div>

        {/* Run Button */}
        {!hasRun && (
          <button 
            onClick={handleRunEvaluation}
            className="w-full bg-[#1B6B3A] hover:bg-[#14532b] text-white py-4 rounded-xl font-bold text-xs uppercase tracking-widest transition-colors shadow-md flex items-center justify-center gap-2"
          >
            <FlaskConical size={16} />
            Run KR&R Engine Evaluation
          </button>
        )}

        {/* Results */}
        {report && (
          <>
            {/* Accuracy Banner */}
            <div className="bg-white dark:bg-[#1a2e22] rounded-2xl p-5 shadow-sm border border-gray-100 dark:border-gray-800 text-center">
              <div className="flex items-center justify-center gap-2 mb-3">
                <BarChart3 size={14} className="text-indigo-500" />
                <h3 className="text-[11px] font-bold uppercase tracking-wider text-gray-700 dark:text-gray-300">Overall Accuracy</h3>
              </div>
              <div className="text-4xl font-bold text-[#1B6B3A] dark:text-green-400 mb-1">
                {pct(report.accuracy)}
              </div>
              <p className="text-[9px] text-gray-500 dark:text-gray-400">
                {report.totalCorrect} / {report.totalCases} test cases correctly classified
              </p>
            </div>

            {mlReport && (
              <div className="bg-white dark:bg-[#1a2e22] rounded-2xl p-4 shadow-sm border border-gray-100 dark:border-gray-800">
                <div className="flex items-center gap-2 mb-3">
                  <Brain size={14} className="text-blue-500" />
                  <h3 className="text-[11px] font-bold uppercase tracking-wider text-gray-700 dark:text-gray-300">Local ML Fallback Evaluation</h3>
                </div>
                <div className="flex items-end justify-between gap-3 mb-3">
                  <div>
                    <div className="text-3xl font-bold text-blue-600 dark:text-blue-400">{pct(mlReport.accuracy)}</div>
                    <p className="text-[9px] text-gray-500 dark:text-gray-400">
                      {mlReport.totalCorrect} / {mlReport.totalCases} holdout cases correctly classified
                    </p>
                  </div>
                  <div className="text-right text-[8px] text-gray-400 dark:text-gray-500 leading-relaxed">
                    <div>{mlReport.metadata.trainingSamples} training samples</div>
                    <div>{mlReport.metadata.vocabularySize} n-gram features</div>
                  </div>
                </div>

                <div className="grid grid-cols-5 gap-1 mb-2 px-1">
                  <div className="text-[8px] font-bold uppercase tracking-wider text-gray-400">Class</div>
                  <div className="text-[8px] font-bold uppercase tracking-wider text-gray-400 text-center">Precision</div>
                  <div className="text-[8px] font-bold uppercase tracking-wider text-gray-400 text-center">Recall</div>
                  <div className="text-[8px] font-bold uppercase tracking-wider text-gray-400 text-center">F1</div>
                  <div className="text-[8px] font-bold uppercase tracking-wider text-gray-400 text-center">Support</div>
                </div>

                {(['HALAL', 'HARAM', 'MASHBOOH'] as Verdict[]).map(v => {
                  const m = mlReport.metrics[v];
                  const vc = verdictColors[v];
                  return (
                    <div key={v} className={`grid grid-cols-5 gap-1 py-2 px-1 rounded-lg mb-1 ${vc.bg} ${vc.darkBg}`}>
                      <div className={`text-[10px] font-bold ${vc.text} ${vc.darkText}`}>{v}</div>
                      <div className={`text-[10px] font-bold text-center ${vc.text} ${vc.darkText}`}>{pct(m.precision)}</div>
                      <div className={`text-[10px] font-bold text-center ${vc.text} ${vc.darkText}`}>{pct(m.recall)}</div>
                      <div className={`text-[10px] font-bold text-center ${vc.text} ${vc.darkText}`}>{pct(m.f1Score)}</div>
                      <div className={`text-[10px] font-bold text-center ${vc.text} ${vc.darkText}`}>{m.support}</div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Per-Class Metrics */}
            <div className="bg-white dark:bg-[#1a2e22] rounded-2xl p-4 shadow-sm border border-gray-100 dark:border-gray-800">
              <div className="flex items-center gap-2 mb-3">
                <Brain size={14} className="text-indigo-500" />
                <h3 className="text-[11px] font-bold uppercase tracking-wider text-gray-700 dark:text-gray-300">Per-Class Metrics</h3>
              </div>
              
              {/* Table Header */}
              <div className="grid grid-cols-5 gap-1 mb-2 px-1">
                <div className="text-[8px] font-bold uppercase tracking-wider text-gray-400">Class</div>
                <div className="text-[8px] font-bold uppercase tracking-wider text-gray-400 text-center">Precision</div>
                <div className="text-[8px] font-bold uppercase tracking-wider text-gray-400 text-center">Recall</div>
                <div className="text-[8px] font-bold uppercase tracking-wider text-gray-400 text-center">F1</div>
                <div className="text-[8px] font-bold uppercase tracking-wider text-gray-400 text-center">Support</div>
              </div>

              {(['HALAL', 'HARAM', 'MASHBOOH'] as Verdict[]).map(v => {
                const m = report.perClassMetrics[v];
                const vc = verdictColors[v];
                return (
                  <div key={v} className={`grid grid-cols-5 gap-1 py-2 px-1 rounded-lg mb-1 ${vc.bg} ${vc.darkBg}`}>
                    <div className={`text-[10px] font-bold ${vc.text} ${vc.darkText}`}>{v}</div>
                    <div className={`text-[10px] font-bold text-center ${vc.text} ${vc.darkText}`}>{pct(m.precision)}</div>
                    <div className={`text-[10px] font-bold text-center ${vc.text} ${vc.darkText}`}>{pct(m.recall)}</div>
                    <div className={`text-[10px] font-bold text-center ${vc.text} ${vc.darkText}`}>{pct(m.f1Score)}</div>
                    <div className={`text-[10px] font-bold text-center ${vc.text} ${vc.darkText}`}>{m.support}</div>
                  </div>
                );
              })}

              {/* Averages */}
              <div className="border-t border-gray-100 dark:border-gray-700 mt-2 pt-2 px-1">
                <div className="grid grid-cols-5 gap-1 mb-1">
                  <div className="text-[9px] font-bold text-gray-600 dark:text-gray-300">Macro Avg</div>
                  <div className="col-span-2"></div>
                  <div className="text-[9px] font-bold text-center text-indigo-600 dark:text-indigo-400">{pct(report.macroAvgF1)}</div>
                  <div className="text-[9px] font-bold text-center text-gray-500">{report.totalCases}</div>
                </div>
                <div className="grid grid-cols-5 gap-1">
                  <div className="text-[9px] font-bold text-gray-600 dark:text-gray-300">Weighted</div>
                  <div className="col-span-2"></div>
                  <div className="text-[9px] font-bold text-center text-indigo-600 dark:text-indigo-400">{pct(report.weightedAvgF1)}</div>
                  <div className="text-[9px] font-bold text-center text-gray-500">{report.totalCases}</div>
                </div>
              </div>
            </div>

            {/* Confusion Matrix */}
            <div className="bg-white dark:bg-[#1a2e22] rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 overflow-hidden">
              <button
                onClick={() => setShowMatrix(!showMatrix)}
                className="w-full flex items-center justify-between p-4 bg-gray-50/50 dark:bg-gray-800/30"
              >
                <div className="flex items-center gap-2">
                  <Cpu size={14} className="text-indigo-500" />
                  <span className="text-[10px] font-bold uppercase tracking-wider text-gray-700 dark:text-gray-300">Confusion Matrix</span>
                </div>
                {showMatrix ? <ChevronUp size={14} className="text-gray-400" /> : <ChevronDown size={14} className="text-gray-400" />}
              </button>

              {showMatrix && (
                <div className="p-4 border-t border-gray-100 dark:border-gray-800">
                  <div className="text-[8px] text-gray-400 mb-2 text-center font-bold uppercase tracking-wider">
                    Rows = Actual &nbsp;|&nbsp; Columns = Predicted
                  </div>
                  
                  {/* Header row */}
                  <div className="grid grid-cols-4 gap-1 mb-1">
                    <div></div>
                    {(['HALAL', 'HARAM', 'MASHBOOH'] as Verdict[]).map(v => (
                      <div key={v} className="text-[8px] font-bold text-center text-gray-500 dark:text-gray-400 uppercase">{v}</div>
                    ))}
                  </div>

                  {/* Matrix rows */}
                  {(['HALAL', 'HARAM', 'MASHBOOH'] as Verdict[]).map(actual => (
                    <div key={actual} className="grid grid-cols-4 gap-1 mb-1">
                      <div className={`text-[9px] font-bold ${verdictColors[actual].text} ${verdictColors[actual].darkText} flex items-center`}>{actual}</div>
                      {(['HALAL', 'HARAM', 'MASHBOOH'] as Verdict[]).map(predicted => {
                        const val = report.confusionMatrix[actual][predicted];
                        const isDiag = actual === predicted;
                        return (
                          <div
                            key={predicted}
                            className={`text-center py-2 rounded-lg text-[11px] font-bold border ${
                              isDiag 
                                ? 'bg-[#1B6B3A]/10 dark:bg-green-900/30 text-[#1B6B3A] dark:text-green-400 border-[#1B6B3A]/20 dark:border-green-800' 
                                : val > 0 
                                  ? 'bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 border-red-100 dark:border-red-900/30'
                                  : 'bg-gray-50 dark:bg-gray-800/50 text-gray-400 dark:text-gray-600 border-gray-100 dark:border-gray-700'
                            }`}
                          >
                            {val}
                          </div>
                        );
                      })}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Detailed Results */}
            <div className="bg-white dark:bg-[#1a2e22] rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 overflow-hidden">
              <button
                onClick={() => setShowDetails(!showDetails)}
                className="w-full flex items-center justify-between p-4 bg-gray-50/50 dark:bg-gray-800/30"
              >
                <div className="flex items-center gap-2">
                  <FlaskConical size={14} className="text-indigo-500" />
                  <span className="text-[10px] font-bold uppercase tracking-wider text-gray-700 dark:text-gray-300">Per-Product Results ({report.totalCases} cases)</span>
                </div>
                {showDetails ? <ChevronUp size={14} className="text-gray-400" /> : <ChevronDown size={14} className="text-gray-400" />}
              </button>

              {showDetails && (
                <div className="p-3 border-t border-gray-100 dark:border-gray-800 space-y-2 max-h-[400px] overflow-y-auto">
                  {report.rows.map((row, idx) => {
                    const expected = verdictColors[row.testCase.expectedVerdict];
                    const predicted = verdictColors[row.predictedVerdict];
                    return (
                      <div key={idx} className={`rounded-xl p-3 border ${row.isCorrect ? 'border-green-100 dark:border-green-900/30 bg-green-50/30 dark:bg-green-900/10' : 'border-red-100 dark:border-red-900/30 bg-red-50/30 dark:bg-red-900/10'}`}>
                        <div className="flex items-start justify-between mb-1">
                          <div className="flex-1">
                            <div className="flex items-center gap-1.5">
                              {row.isCorrect 
                                ? <CheckCircle size={12} className="text-green-500 flex-shrink-0" /> 
                                : <XCircle size={12} className="text-red-500 flex-shrink-0" />
                              }
                              <span className="text-[10px] font-bold text-gray-800 dark:text-gray-200">{row.testCase.productName}</span>
                            </div>
                            <p className="text-[8px] text-gray-400 mt-0.5 ml-5 italic">{row.testCase.category}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 ml-5 mt-1">
                          <span className="text-[8px] text-gray-500">Expected:</span>
                          <span className={`text-[9px] font-bold ${expected.text} ${expected.darkText}`}>{row.testCase.expectedVerdict}</span>
                          <span className="text-[8px] text-gray-400">→</span>
                          <span className="text-[8px] text-gray-500">Got:</span>
                          <span className={`text-[9px] font-bold ${predicted.text} ${predicted.darkText}`}>{row.predictedVerdict}</span>
                        </div>
                        {!row.isCorrect && (
                          <p className="text-[8px] text-red-500 dark:text-red-400 mt-1 ml-5">
                            Rationale: {row.testCase.rationale}
                          </p>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Re-run Button */}
            <button 
              onClick={handleRunEvaluation}
              className="w-full bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 py-3 rounded-xl font-bold text-[10px] uppercase tracking-widest transition-colors flex items-center justify-center gap-2 mb-4"
            >
              <FlaskConical size={14} />
              Re-Run Evaluation
            </button>
          </>
        )}
      </div>
    </div>
  );
}
