import { useState } from 'react';
import { useAppStore } from '../store/AppContext';
import { scanJobDescription } from '../services/geminiService';
import { JDScanResult } from '../types';
import { ScanSearch, AlertTriangle, CheckCircle, Loader2 } from 'lucide-react';

export function JDScanner() {
  const { jobDescription, setJobDescription } = useAppStore();
  const [isScanning, setIsScanning] = useState(false);
  const [result, setResult] = useState<JDScanResult | null>(null);

  const handleScan = async () => {
    if (!jobDescription) return;
    setIsScanning(true);
    try {
      const res = await scanJobDescription(jobDescription);
      setResult(res);
    } catch (e) {
      console.error(e);
      alert("Failed to scan JD. Ensure Gemini API key is set.");
    } finally {
      setIsScanning(false);
    }
  };

  const applyCleanJD = () => {
    if (result) {
      setJobDescription(result.cleanJD);
      setResult(null);
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-3xl font-bold text-gray-900 mb-1">Job Description Bias Scanner</h2>
          <p className="text-gray-500 text-sm">Detect coded language and re-write job postings to be inclusive.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="space-y-4 flex flex-col h-full">
          <div className="flex items-center gap-2 text-gray-900 font-bold text-lg">
            Raw Job Description
          </div>
          <textarea
            className="w-full flex-1 p-4 min-h-[400px] text-sm text-gray-700 bg-white border border-gray-200 rounded-2xl focus:ring-1 focus:ring-black focus:outline-none resize-none shadow-sm"
            value={jobDescription}
            onChange={(e) => setJobDescription(e.target.value)}
            placeholder="Paste job description here..."
          />
          <button
            onClick={handleScan}
            disabled={!jobDescription || isScanning}
            className="flex items-center justify-center gap-2 bg-black text-white px-8 py-3 rounded-xl font-semibold hover:bg-gray-800 transition-colors disabled:opacity-50 shadow-lg shadow-black/10 w-full"
          >
            {isScanning ? <><Loader2 className="animate-spin" /> Scanning...</> : <><ScanSearch /> Scan for Bias</>}
          </button>
        </div>

        <div className="space-y-4 flex flex-col h-full opacity-100 transition-opacity">
          <div className="flex items-center gap-2 text-gray-900 font-bold text-lg">
            Analysis Results
          </div>
          
          <div className="flex-1 bg-white border border-gray-200 rounded-2xl shadow-sm p-6 overflow-y-auto">
            {!result && !isScanning && (
              <div className="text-gray-400 flex flex-col items-center justify-center h-full text-center">
                <ScanSearch size={48} className="mb-4 opacity-20" />
                <p>Run a scan to see bias analysis and rewrite suggestions.</p>
              </div>
            )}
            
            {isScanning && (
              <div className="text-black flex flex-col items-center justify-center h-full">
                <Loader2 size={48} className="animate-spin mb-4" />
                <p className="font-medium animate-pulse">Analyzing semantics...</p>
              </div>
            )}

            {result && !isScanning && (
              <div className="space-y-6">
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl border border-gray-200">
                  <div className="flex items-center gap-3">
                    {result.overallBiasScore > 50 ? (
                      <AlertTriangle className="text-red-500" size={32} />
                    ) : result.overallBiasScore > 20 ? (
                      <AlertTriangle className="text-amber-500" size={32} />
                    ) : (
                      <CheckCircle className="text-green-500" size={32} />
                    )}
                    <div>
                      <p className="text-[10px] text-gray-400 uppercase font-bold tracking-widest mb-1">Overall Bias Score</p>
                      <p className="text-2xl font-bold text-gray-900">{result.overallBiasScore}/100</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Flagged Phrases</p>
                    <p className="text-xl font-bold text-gray-900">{result.flaggedPhrases.length}</p>
                  </div>
                </div>

                {result.flaggedPhrases.length > 0 && (
                  <div className="space-y-3">
                    <h4 className="font-bold text-gray-900 border-b border-gray-100 pb-2">Issues Detected</h4>
                    {result.flaggedPhrases.map((flag, idx) => (
                      <div key={idx} className="bg-red-50 border border-red-100 p-4 rounded-xl">
                        <div className="flex items-start gap-2">
                          <AlertTriangle className="text-red-500 shrink-0 mt-0.5" size={16} />
                          <div>
                            <p className="text-sm font-semibold text-red-900 line-through">"{flag.phrase}"</p>
                            <p className="text-xs text-red-700 mt-1">{flag.reason}</p>
                            <p className="text-sm font-semibold text-emerald-700 mt-2">Suggestion: {flag.suggestion}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                <div className="space-y-3">
                  <h4 className="font-bold text-gray-900 border-b border-gray-100 pb-2">Proposed Inclusive Rewrite</h4>
                  <div className="bg-gray-50 text-gray-700 p-4 rounded-xl font-mono text-sm leading-relaxed whitespace-pre-wrap border border-gray-200">
                    {result.cleanJD}
                  </div>
                  <button 
                    onClick={applyCleanJD}
                    className="w-full bg-black text-white font-semibold py-3 rounded-xl hover:bg-gray-800 transition-colors shadow-lg shadow-black/10"
                  >
                    Apply Clean Version
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
