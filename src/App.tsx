import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { MainLayout } from './components/layout/MainLayout';
import { AppProvider, useAppStore } from './store/AppContext';
import { Dashboard } from './pages/Dashboard';
import { UploadResume } from './pages/UploadResume';
import { JDScanner } from './pages/JDScanner';
import { BiasReport } from './pages/BiasReport';
import { isGeminiConfigured } from './services/geminiService';
import { AlertCircle, LogIn, Loader2 } from 'lucide-react';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, authLoading, login } = useAppStore();

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F8F9FA]">
        <Loader2 className="animate-spin text-blue-600" size={48} />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F8F9FA]">
        <div className="bg-white p-8 rounded-3xl shadow-xl max-w-md w-full text-center border border-gray-100">
          <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <LogIn size={32} className="text-blue-600" />
          </div>
          <h2 className="text-2xl font-bold font-mono tracking-tight text-gray-900 mb-2">FairHire Engine</h2>
          <p className="text-gray-500 mb-8">Please sign in to access the recruitment platform.</p>
          <button 
            onClick={login}
            className="w-full bg-black text-white px-6 py-3 rounded-xl font-semibold hover:bg-gray-800 transition-colors shadow-lg flex items-center justify-center gap-2"
          >
            Sign in with Google
          </button>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}

function AppContent() {
  const isConfigured = isGeminiConfigured();

  return (
    <Router>
      <ProtectedRoute>
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
      </ProtectedRoute>
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
