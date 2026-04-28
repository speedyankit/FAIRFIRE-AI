import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { MainLayout } from './components/layout/MainLayout';
import { AppProvider, useAppStore } from './store/AppContext';
import { Dashboard } from './pages/Dashboard';
import { UploadResume } from './pages/UploadResume';
import { JDScanner } from './pages/JDScanner';
import { BiasReport } from './pages/BiasReport';
import { isGeminiConfigured } from './services/geminiService';
import { AlertCircle } from 'lucide-react';

function AppContent() {
  const isConfigured = isGeminiConfigured();

  return (
    <Router>
      <MainLayout>
        {!isConfigured && (
          <div className="mb-6 bg-red-50 border border-red-100 text-red-900 p-4 rounded-2xl flex items-start gap-3 shadow-sm">
             <AlertCircle className="shrink-0 mt-0.5 text-red-600" size={20} />
             <div>
               <h3 className="font-bold">Missing Gemini API Key</h3>
               <p className="text-sm mt-1 text-red-700">Please set your GEMINI_API_KEY in the settings to use the AI evaluation features. The app will simulate interactions or fail without it.</p>
             </div>
          </div>
        )}
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/upload" element={<UploadResume />} />
          <Route path="/jd-scanner" element={<JDScanner />} />
          <Route path="/bias-report" element={<BiasReport />} />
        </Routes>
      </MainLayout>
    </Router>
  );
}

export default function App() {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
}
