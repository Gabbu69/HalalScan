import React, { useState } from 'react';
import { useAppStore } from '../store/useAppStore';
import { Badge } from '../components/Badge';
import { Trash2 } from 'lucide-react';
import { useTranslation } from '../hooks/useTranslation';

export function History() {
  const { t } = useTranslation();
  const { scans, deleteScan, clearScans, getStats } = useAppStore();
  const [filter, setFilter] = useState('ALL');
  const stats = getStats();

  const filteredScans = scans.filter(scan => filter === 'ALL' || scan.verdict === filter);

  const handleClear = () => {
    if (window.confirm(t('history.clear_confirm') || "Are you sure you want to delete all scans?")) {
      clearScans();
    }
  };

  return (
    <div className="flex flex-col h-full mx-auto max-w-md w-full pt-4">
      <div className="px-5 mb-4 flex justify-between items-center">
        <h2 className="font-amiri italic text-2xl text-[#1B6B3A] dark:text-green-400 font-bold">{t('history.title') || 'Scan History'}</h2>
        {scans.length > 0 && (
          <button onClick={handleClear} className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-full transition-colors flex items-center gap-1">
            <Trash2 size={16} />
            <span className="text-[10px] font-bold uppercase tracking-wider">{t('history.clear') || 'Clear'}</span>
          </button>
        )}
      </div>

      <div className="px-5 mb-6">
        <div className="flex flex-row overflow-x-auto gap-2 no-scrollbar pb-1">
          {['ALL', 'HALAL', 'HARAM', 'MASHBOOH'].map(f => {
            let activeClass = 'bg-[#1B6B3A] text-white border-[#1B6B3A]';
            if (f === 'HALAL') activeClass = 'bg-green-600 text-white border-green-600';
            if (f === 'HARAM') activeClass = 'bg-red-600 text-white border-red-600';
            if (f === 'MASHBOOH') activeClass = 'bg-amber-600 text-white border-amber-600';

            const count = 
              f === 'ALL' ? stats.total : 
              f === 'HALAL' ? stats.halal : 
              f === 'HARAM' ? stats.haram : 
              stats.mashbooh;

            return (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-4 py-1.5 rounded-full whitespace-nowrap text-[10px] font-bold tracking-wider uppercase transition-colors shadow-sm border flex items-center gap-1.5 ${filter === f ? activeClass : 'bg-white dark:bg-[#1a2e22] text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-700'}`}
              >
                <span>{f === 'ALL' ? (t('history.total') || 'All') : f === 'MASHBOOH' ? (t('history.mashbooh') || 'MASHBOOH') : f}</span>
                <span className={`px-1.5 py-0.5 rounded-full text-[8px] bg-black/10 dark:bg-white/10 ${filter === f ? 'text-white' : 'text-gray-500 dark:text-gray-400'}`}>
                  {count}
                </span>
              </button>
            )
          })}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-5 pb-20 w-full space-y-3">
        {filteredScans.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <p className="text-xs text-gray-500 dark:text-gray-400 font-bold uppercase tracking-wider">{t('history.no_history') || 'No scans found.'}</p>
          </div>
        ) : (
          filteredScans.map(item => {
            const borderClass = item.verdict === 'HALAL' 
              ? 'border-green-600' 
              : item.verdict === 'HARAM' 
              ? 'border-red-600' 
              : 'border-amber-600';

            return (
              <div key={item.id} className="relative bg-white dark:bg-[#1a2e22] p-4 rounded-2xl shadow-sm overflow-hidden flex flex-col gap-1 border border-gray-100 dark:border-gray-800 group">
                <div className="flex flex-row justify-between items-start mb-1">
                  <div className="flex-1 px-4">
                    <h3 className="font-bold text-sm text-[#1B6B3A] dark:text-green-400 truncate tracking-wide" title={item.name}>{item.name}</h3>
                    <p className="text-[10px] text-gray-500 dark:text-gray-400 truncate mt-0.5">{item.brand}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge verdict={item.verdict} />
                    <button
                      onClick={() => deleteScan(item.id)}
                      className="text-gray-400 hover:text-red-500 transition-colors p-1"
                      title="Delete scan"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
                <div className={`mt-2 pl-2 border-l-2 rtl:pl-0 rtl:pr-2 rtl:border-l-0 rtl:border-r-2 ${borderClass}`}>
                  <p className="text-[10px] leading-relaxed text-gray-600 dark:text-gray-300 line-clamp-2">
                    <span className="font-bold tracking-wider text-[9px] uppercase mr-1 rtl:ml-1 rtl:mr-0">{t('analysis.reason') || 'Reason'}:</span> 
                    {item.reason}
                  </p>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
