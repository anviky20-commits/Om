import React, { useState } from 'react';
import { X, Calendar, ArrowRightLeft, Check } from 'lucide-react';
import { adToBs, bsToAd, getTodayIso, BsDateResult, AdDateResult, OM_BS_MONTHS_NE, OM_BS_MONTHS_EN } from '../lib/nepaliDate';

interface BsDateModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const BsDateModal: React.FC<BsDateModalProps> = ({ isOpen, onClose }) => {
  const todayIso = getTodayIso();
  const [adDate, setAdDate] = useState(todayIso);
  const [bsDate, setBsDate] = useState(() => {
    try {
      return adToBs(todayIso).iso;
    } catch {
      return '2083-06-08';
    }
  });

  const [convertedBs, setConvertedBs] = useState<BsDateResult | null>(() => {
    try {
      return adToBs(todayIso);
    } catch {
      return null;
    }
  });

  const [convertedAd, setConvertedAd] = useState<AdDateResult | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleAdToBs = () => {
    setErrorMsg(null);
    try {
      const res = adToBs(adDate);
      setConvertedBs(res);
      setConvertedAd(null);
      setBsDate(res.iso);
    } catch (e: any) {
      setErrorMsg(e.message || 'Error converting AD to BS');
    }
  };

  const handleBsToAd = () => {
    setErrorMsg(null);
    try {
      const res = bsToAd(bsDate);
      setConvertedAd(res);
      setConvertedBs(null);
      setAdDate(res.iso);
    } catch (e: any) {
      setErrorMsg(e.message || 'Error converting BS to AD');
    }
  };

  const handleSetToday = () => {
    setErrorMsg(null);
    const today = getTodayIso();
    setAdDate(today);
    try {
      const res = adToBs(today);
      setConvertedBs(res);
      setConvertedAd(null);
      setBsDate(res.iso);
    } catch (e: any) {
      setErrorMsg(e.message);
    }
  };

  const currentYear = convertedBs ? convertedBs.year : 2083;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-sm">
      <div className="w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-3xl border border-slate-200 bg-white p-5 sm:p-6 shadow-2xl dark:border-slate-800 dark:bg-slate-900 animate-in fade-in zoom-in-95">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3 dark:border-slate-800">
          <div className="flex items-center gap-2.5">
            <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-base">
              🇳🇵
            </span>
            <div>
              <h2 className="text-sm font-bold text-slate-900 dark:text-white">
                Bikram Sambat (BS) ↔ AD Converter
              </h2>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Official Nepali Calendar system (1978 BS – 2099 BS)
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800 dark:hover:text-slate-200"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="mt-4 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-300">
                Gregorian (AD) Date
              </label>
              <input
                type="date"
                value={adDate}
                onChange={e => setAdDate(e.target.value)}
                className="mt-1 h-9 w-full rounded-xl border border-slate-200 bg-white px-3 font-mono text-xs text-slate-900 focus:border-indigo-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-300">
                Bikram Sambat (BS) YYYY-MM-DD
              </label>
              <input
                type="text"
                value={bsDate}
                onChange={e => setBsDate(e.target.value)}
                placeholder="2083-06-08"
                className="mt-1 h-9 w-full rounded-xl border border-slate-200 bg-white px-3 font-mono text-xs text-slate-900 focus:border-indigo-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              />
            </div>
          </div>

          {errorMsg && (
            <div className="rounded-xl bg-red-50 p-2.5 text-xs text-red-700 dark:bg-red-950/40 dark:text-red-300">
              {errorMsg}
            </div>
          )}

          {/* Action buttons */}
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={handleAdToBs}
              className="flex-1 rounded-xl bg-indigo-600 py-2.5 px-3 text-xs font-semibold text-white shadow-sm hover:bg-indigo-500 active:scale-98 transition-transform"
            >
              Convert AD → BS
            </button>
            <button
              type="button"
              onClick={handleBsToAd}
              className="flex-1 rounded-xl border border-slate-200 bg-white py-2.5 px-3 text-xs font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700 active:scale-98 transition-transform"
            >
              Convert BS → AD
            </button>
            <button
              type="button"
              onClick={handleSetToday}
              className="rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-xs font-medium text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
            >
              Today
            </button>
          </div>

          {/* Result Card */}
          <div className="rounded-2xl border border-indigo-100 bg-indigo-50/50 p-4 dark:border-indigo-900/40 dark:bg-indigo-950/20">
            <div className="text-[10px] font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
              Conversion Result
            </div>

            {convertedBs && (
              <div className="mt-2 space-y-1">
                <div className="text-lg font-bold text-slate-900 dark:text-white font-serif">
                  {convertedBs.formattedNe}
                </div>
                <div className="text-xs font-medium text-indigo-600 dark:text-indigo-400">
                  {convertedBs.formattedEn} ({convertedBs.iso})
                </div>
                <div className="text-[11px] text-slate-500 dark:text-slate-400">
                  Corresponding Gregorian AD: {adDate}
                </div>
              </div>
            )}

            {convertedAd && (
              <div className="mt-2 space-y-1">
                <div className="text-lg font-bold text-slate-900 dark:text-white">
                  {convertedAd.formatted}
                </div>
                <div className="text-xs font-medium text-indigo-600 dark:text-indigo-400 font-mono">
                  ISO: {convertedAd.iso}
                </div>
                <div className="text-[11px] text-slate-500 dark:text-slate-400">
                  From Bikram Sambat BS: {bsDate}
                </div>
              </div>
            )}
          </div>

          {/* Quick Nepali Months Navigator */}
          <div className="border-t border-slate-100 pt-3 dark:border-slate-800">
            <div className="text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-2">
              Nepali BS Months (Year {currentYear} BS)
            </div>
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-1.5">
              {OM_BS_MONTHS_NE.map((mNe, idx) => {
                const mNum = String(idx + 1).padStart(2, '0');
                const isSelected = convertedBs?.month === idx + 1;
                return (
                  <button
                    key={mNe}
                    type="button"
                    onClick={() => {
                      const testBs = `${currentYear}-${mNum}-01`;
                      setBsDate(testBs);
                      try {
                        const res = bsToAd(testBs);
                        setConvertedAd(res);
                        setConvertedBs(null);
                        setAdDate(res.iso);
                      } catch {}
                    }}
                    className={`rounded-xl p-2 text-left border transition-all ${
                      isSelected
                        ? 'border-indigo-500 bg-indigo-50 font-bold text-indigo-600 dark:bg-indigo-950/50 dark:text-indigo-400'
                        : 'border-slate-100 hover:border-slate-200 dark:border-slate-800 dark:hover:border-slate-700 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    <div className="text-xs font-semibold">{mNe}</div>
                    <div className="text-[9px] text-slate-400">{OM_BS_MONTHS_EN[idx]}</div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
