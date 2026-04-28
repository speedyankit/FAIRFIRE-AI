import { useAppStore } from '../store/AppContext';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ReferenceLine } from 'recharts';

export function BiasReport() {
  const { candidates } = useAppStore();

  const chartData = candidates.map(c => ({
    name: c.id,
    original: c.scores.biasOriginal,
    anonymized: c.scores.biasAnonymized
  }));

  const totalCandidates = candidates.length;
  // Simulating demographic parity using arbitrary shortlisting criteria for demo purpose
  // In reality this would involve tracking protected classes, but since we redacting them, we track "passed 4/5ths rule checks" internally.
  const shortlistedCount = candidates.filter(c => c.status === 'Shortlisted').length;
  
  return (
    <div className="space-y-8 max-w-6xl mx-auto">
      <div>
        <h2 className="text-3xl font-bold text-gray-900 mb-1">Demographic Parity & Bias Report</h2>
        <p className="text-gray-500 text-sm mt-1">Real-time audit of the hiring pipeline.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm flex flex-col justify-center">
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Total Pipeline Evaluated</p>
          <p className="text-4xl font-bold tracking-tight text-gray-900">{totalCandidates}</p>
        </div>
        <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm md:col-span-2 flex flex-col justify-center">
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-4">4/5ths Rule Compliance (Simulated Demo)</p>
          <div className="w-full bg-gray-100 rounded-full h-4 relative overflow-hidden">
            <div className="bg-emerald-500 h-4 rounded-full" style={{ width: '92%' }}></div>
          </div>
          <div className="flex justify-between mt-2 text-xs text-gray-500 font-medium">
            <span>Disparate Impact Ratio: 0.92</span>
            <span>Legal Threshold: {'>'} 0.80</span>
          </div>
        </div>
      </div>

      <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
        <h3 className="font-bold text-gray-900 mb-6">Counterfactual Bias Test Results</h3>
        <p className="text-sm text-gray-500 mb-6">
          Comparing the simulated bias score of the original resume against the anonymized version passed to the evaluation engine. Lower scores denote less demographic bias variance.
        </p>
        
        {candidates.length === 0 ? (
          <div className="h-[400px] flex items-center justify-center text-slate-400">
            No candidate data available to generate report.
          </div>
        ) : (
          <div className="h-[400px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={chartData}
                margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="name" tick={{fill: '#64748b', fontSize: 12}} tickLine={false} axisLine={false} />
                <YAxis tick={{fill: '#64748b', fontSize: 12}} tickLine={false} axisLine={false} />
                <Tooltip 
                  cursor={{fill: '#f1f5f9'}}
                  contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)'}}
                />
                <Legend iconType="circle" />
                <Bar dataKey="original" name="Bias Risk (Original)" fill="#f43f5e" radius={[4, 4, 0, 0]} maxBarSize={40} />
                <Bar dataKey="anonymized" name="Bias Risk (Anonymized)" fill="#10b981" radius={[4, 4, 0, 0]} maxBarSize={40} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      <div className="bg-[#1A1A1A] p-6 rounded-2xl shadow-lg shadow-black/10 text-gray-300 flex items-center justify-between">
        <div>
          <h4 className="font-bold text-white mb-1">Generate Compliance PDF</h4>
          <p className="text-sm">Download the full audit trail for EEOC / GDPR compliance reporting.</p>
        </div>
        <button className="bg-white hover:bg-gray-100 text-black px-6 py-3 rounded-xl font-semibold transition-colors shadow-sm">
          Download PDF
        </button>
      </div>

    </div>
  );
}
