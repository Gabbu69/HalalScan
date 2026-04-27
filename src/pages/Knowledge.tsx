import React, { useState } from 'react';
import { HALAL_RULES } from '../constants/halalRules';
import { Search, ChevronDown, ChevronUp } from 'lucide-react';
import { useAppStore } from '../store/useAppStore';
import { useTranslation } from '../hooks/useTranslation';

export function Knowledge() {
  const { t } = useTranslation();
  const [expanded, setExpanded] = useState<string | null>(null);
  const [search, setSearch] = useState('');

  const filteredRules = HALAL_RULES.filter(rule => {
    const title = t(`knowledge.rule_${rule.id}_title`) || rule.title;
    const content = t(`knowledge.rule_${rule.id}_content`) || rule.content;
    return title.toLowerCase().includes(search.toLowerCase()) || 
           content.toLowerCase().includes(search.toLowerCase());
  });

  return (
    <div className="flex flex-col h-full mx-auto max-w-md w-full pt-4">
      <div className="px-5 mb-4">
        <h2 className="font-amiri italic text-2xl text-[#1B6B3A] dark:text-green-400 font-bold mb-4">{t('knowledge.title') || 'Knowledge Base'}</h2>
        <div className="bg-white dark:bg-[#1a2e22] rounded-xl p-3 flex items-center gap-2 border border-gray-100 dark:border-gray-800 shadow-sm">
          <Search size={16} className="text-gray-400" />
          <input 
            placeholder={t('knowledge.search') || "Search E-Numbers or Additives"}
            className="flex-1 bg-transparent text-[10px] sm:text-xs text-gray-900 dark:text-gray-100 focus:outline-none placeholder-gray-400"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-5 pb-20 w-full space-y-3">
        {filteredRules.map(item => {
          let borderClass = 'border-gray-300 dark:border-gray-600';
          if (item.category === 'Ingredients' && item.title.includes('HARAM')) borderClass = 'border-[#D32F2F]';
          if (item.category === 'Ingredients' && item.title.includes('MASHBOOH')) borderClass = 'border-amber-500';
          if (item.category === 'Ingredients' && item.title.includes('ALWAYS HALAL')) borderClass = 'border-green-500';

          return (
            <div key={item.id} className={`bg-white dark:bg-[#1a2e22] rounded-xl overflow-hidden shadow-sm transition-all duration-200 border border-gray-100 dark:border-gray-800 border-l-4 rtl:border-l-0 rtl:border-r-4 ${borderClass}`}>
              <button
                onClick={() => setExpanded(expanded === item.id ? null : item.id)}
                className="flex flex-row items-center justify-between p-4 w-full text-start bg-white dark:bg-[#1a2e22]"
              >
                <div className="flex-1 px-4">
                  <h3 className="text-[11px] font-bold text-[#1B6B3A] dark:text-green-400 leading-tight">{t(`knowledge.rule_${item.id}_title`) || item.title}</h3>
                </div>
                <div className="text-gray-400 flex-shrink-0">
                  {expanded === item.id ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                </div>
              </button>
              
              <div className={`overflow-hidden transition-all duration-300 ${expanded === item.id ? 'max-h-[1000px] opacity-100' : 'max-h-0 opacity-0'}`}>
                <div className="px-4 pb-4 pt-0 text-start">
                  <p className="text-[9px] sm:text-[10px] leading-relaxed text-gray-600 dark:text-gray-400">
                    {t(`knowledge.rule_${item.id}_content`) || item.content}
                  </p>
                </div>
              </div>
            </div>
          )
        })}

        <div className="mt-6">
          <div className="bg-[#1B6B3A]/5 dark:bg-green-900/10 p-4 rounded-2xl border border-[#1B6B3A]/10 dark:border-green-900/30">
            <h4 className="text-[10px] font-bold text-[#1B6B3A] dark:text-green-400 uppercase mb-2 tracking-wider">{t('knowledge.spotlight') || 'Guideline Spotlight'}</h4>
            <p className="text-[9px] sm:text-[10px] text-gray-600 dark:text-gray-300 italic leading-relaxed">
              {useAppStore.getState().madhab === 'General' 
                ? (t('knowledge.spotlight_general') || "Checking ingredients allows us to align our consumption with our ethical, dietary, or allergy boundaries.")
                : (t('knowledge.spotlight_muslim') || '"Everything is Halal until proven otherwise, except in the case of meat, where it is Haram until proven Halal."')}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
