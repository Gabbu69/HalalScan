import React, { useEffect, useState } from 'react';
import { HALAL_RULES, HalalRule } from '../constants/halalRules';
import { CANONICAL_RULES, type CanonicalRuleStatus } from '../utils/canonicalKnowledgeBase';
import { Search, ChevronDown, ChevronUp } from 'lucide-react';
import { useAppStore } from '../store/useAppStore';
import { useTranslation } from '../hooks/useTranslation';

type KnowledgeRuleStatus = CanonicalRuleStatus | 'DOUBTFUL';

type KnowledgeRule = HalalRule & {
  status: KnowledgeRuleStatus;
  eNumbers?: string[];
  keywords?: string[];
};

const inferLegacyStatus = (rule: HalalRule): KnowledgeRuleStatus => {
  const haystack = `${rule.title} ${rule.content}`.toUpperCase();
  if (haystack.includes('HARAM')) return 'HARAM';
  if (haystack.includes('MASHBOOH') || haystack.includes('DOUBTFUL')) return 'DOUBTFUL';
  if (haystack.includes('HALAL')) return 'HALAL';
  return 'INFO';
};

const statusStyles: Record<KnowledgeRuleStatus, { border: string; badge: string; text: string }> = {
  HARAM: {
    border: 'border-[#D32F2F]',
    badge: 'bg-red-50 text-red-700 border-red-100 dark:bg-red-900/30 dark:text-red-300 dark:border-red-900/40',
    text: 'text-red-700 dark:text-red-300',
  },
  DOUBTFUL: {
    border: 'border-amber-500',
    badge: 'bg-amber-50 text-amber-700 border-amber-100 dark:bg-amber-900/30 dark:text-amber-300 dark:border-amber-900/40',
    text: 'text-amber-700 dark:text-amber-300',
  },
  UNKNOWN: {
    border: 'border-gray-400 dark:border-gray-600',
    badge: 'bg-gray-50 text-gray-600 border-gray-100 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-700',
    text: 'text-gray-600 dark:text-gray-300',
  },
  HALAL: {
    border: 'border-green-500',
    badge: 'bg-green-50 text-green-700 border-green-100 dark:bg-green-900/30 dark:text-green-300 dark:border-green-900/40',
    text: 'text-green-700 dark:text-green-300',
  },
  INFO: {
    border: 'border-blue-400 dark:border-blue-600',
    badge: 'bg-blue-50 text-blue-700 border-blue-100 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-900/40',
    text: 'text-blue-700 dark:text-blue-300',
  },
};

export function Knowledge() {
  const { t } = useTranslation();
  const [expanded, setExpanded] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [rules, setRules] = useState<KnowledgeRule[]>(() =>
    CANONICAL_RULES.map(rule => ({
      id: rule.id,
      category: rule.category,
      title: rule.title,
      status: rule.status,
      eNumbers: rule.e_numbers,
      keywords: rule.keywords,
      content: `${rule.reason}${rule.e_numbers?.length ? ` E-numbers: ${rule.e_numbers.join(', ')}.` : ''}${rule.keywords?.length ? ` Keywords: ${rule.keywords.slice(0, 8).join(', ')}.` : ''}`,
      source: rule.source
    }))
  );

  useEffect(() => {
    const loadBackendRules = async () => {
      try {
        const response = await fetch('/api/rules');
        if (!response.ok) return;
        const data = await response.json();
        const backendRules: KnowledgeRule[] = (data.rules || []).map((rule: any) => ({
          id: rule.id,
          category: rule.category,
          status: rule.status || 'INFO',
          title: rule.title,
          eNumbers: rule.e_numbers || [],
          keywords: rule.keywords || [],
          content: `${rule.reason}${rule.e_numbers?.length ? ` E-numbers: ${rule.e_numbers.join(', ')}.` : ''}${rule.keywords?.length ? ` Keywords: ${rule.keywords.slice(0, 8).join(', ')}.` : ''}`,
          source: rule.source
        }));
        if (backendRules.length > 0) setRules(backendRules);
      } catch {
        // Keep bundled canonical JSON rules when Flask is not running.
        if (rules.length === 0) {
          setRules(HALAL_RULES.map(rule => ({
            ...rule,
            status: inferLegacyStatus(rule),
          })));
        }
      }
    };

    loadBackendRules();
  }, [rules.length]);

  const filteredRules = rules.filter(rule => {
    const title = t(`knowledge.rule_${rule.id}_title`) || rule.title;
    const content = t(`knowledge.rule_${rule.id}_content`) || rule.content;
    return title.toLowerCase().includes(search.toLowerCase()) || 
           content.toLowerCase().includes(search.toLowerCase()) ||
           rule.status.toLowerCase().includes(search.toLowerCase()) ||
           rule.category.toLowerCase().includes(search.toLowerCase()) ||
           rule.source.toLowerCase().includes(search.toLowerCase());
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
          const style = statusStyles[item.status] || statusStyles.INFO;

          return (
            <div key={item.id} className={`bg-white dark:bg-[#1a2e22] rounded-xl overflow-hidden shadow-sm transition-all duration-200 border border-gray-100 dark:border-gray-800 border-l-4 rtl:border-l-0 rtl:border-r-4 ${style.border}`}>
              <button
                onClick={() => setExpanded(expanded === item.id ? null : item.id)}
                className="flex flex-row items-center justify-between p-4 w-full text-start bg-white dark:bg-[#1a2e22]"
              >
                <div className="flex-1 px-4 min-w-0">
                  <div className="flex flex-wrap items-center gap-1.5 mb-1">
                    <span className={`px-1.5 py-0.5 rounded border text-[8px] font-bold uppercase tracking-wider ${style.badge}`}>
                      {item.status}
                    </span>
                    <span className="text-[8px] font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500">
                      {item.category}
                    </span>
                  </div>
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
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    <span className={`px-1.5 py-0.5 rounded border text-[8px] font-bold ${style.badge}`}>
                      Status: {item.status}
                    </span>
                    {item.eNumbers && item.eNumbers.length > 0 && (
                      <span className="max-w-full whitespace-normal break-words px-1.5 py-0.5 rounded border border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-[#0f1a13] text-[8px] font-bold text-gray-500 dark:text-gray-400">
                        E-numbers: {item.eNumbers.slice(0, 4).join(', ')}
                      </span>
                    )}
                    <span className={`max-w-full whitespace-normal break-words px-1.5 py-0.5 rounded border border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-[#0f1a13] text-[8px] font-bold ${style.text}`}>
                      Source: {item.source}
                    </span>
                  </div>
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
