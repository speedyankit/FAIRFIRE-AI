import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { UploadCloud, FileText, CheckCircle, Loader2, Target } from 'lucide-react';
import { useAppStore } from '../store/AppContext';
import { processResumePipeline } from '../services/geminiService';
import { useNavigate } from 'react-router-dom';
import { cn } from '../lib/utils';

import * as mammoth from 'mammoth';
import * as pdfjsLib from 'pdfjs-dist';

pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.mjs`;

export function UploadResume() {
  const { jobDescription, setJobDescription, addCandidate, user } = useAppStore();
  const navigate = useNavigate();
  const [resumeText, setResumeText] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [progressStep, setProgressStep] = useState(0); // 0: Idle, 1: Uploading, 2: Client Anonymizing, 3: Extracting, 4: Evaluating, 5: Scoring
  const [clientAnonPreview, setClientAnonPreview] = useState('');

  const clientSideAnonymize = (text: string) => {
    // Basic frontend simulation of PII redaction
    let anon = text.replace(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g, '[REDACTED EMAIL]');
    anon = anon.replace(/\+?[\d\s\-\(\)]{10,15}/g, '[REDACTED PHONE]');
    return anon;
  };

  const onDrop = useCallback(async (acceptedFiles: any[]) => {
    const file = acceptedFiles[0];
    if (!file) return;

    try {
      let rawText = '';
      if (file.type === 'application/pdf' || file.name.endsWith('.pdf')) {
        const arrayBuffer = await file.arrayBuffer();
        const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
        for (let i = 1; i <= pdf.numPages; i++) {
          const page = await pdf.getPage(i);
          const content = await page.getTextContent();
          const strings = content.items.map((item: any) => item.str);
          rawText += strings.join(' ') + '\n';
        }
      } else if (
        file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' || 
        file.name.endsWith('.docx')
      ) {
        const arrayBuffer = await file.arrayBuffer();
        const result = await mammoth.extractRawText({ arrayBuffer });
        rawText = result.value;
      } else {
        const reader = new FileReader();
        const text = await new Promise<string>((resolve) => {
            reader.onload = (e) => resolve(e.target?.result as string);
            reader.readAsText(file);
        });
        rawText = text;
      }
      setResumeText(rawText);
      setClientAnonPreview(clientSideAnonymize(rawText));
    } catch (err) {
      console.error("Error reading file:", err);
      alert("Failed to parse file. Please paste the text directly.");
    }
  }, []);

  // @ts-ignore
  const { getRootProps, getInputProps, isDragActive } = useDropzone({ 
    onDrop: onDrop as any,
    accept: {
      'text/plain': ['.txt'],
      'application/pdf': ['.pdf'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx']
    }
  });

  const handleProcess = async () => {
    if (!resumeText || !jobDescription) return;
    
    setIsProcessing(true);
    setProgressStep(1); // Upload

    try {
      // Simulate UI steps with delays
      await new Promise(r => setTimeout(r, 800));
      setProgressStep(2); // Client Anon
      setClientAnonPreview(clientSideAnonymize(resumeText));
      await new Promise(r => setTimeout(r, 1000));
      setProgressStep(3); // Extracting
      await new Promise(r => setTimeout(r, 1000));
      setProgressStep(4); // Evaluating
      await new Promise(r => setTimeout(r, 1000));
      setProgressStep(5); // Scoring

      const result = await processResumePipeline(resumeText, jobDescription);
      
      let newStatus: 'Shortlisted' | 'Reviewed' | 'Rejected' | 'Pending' = 'Reviewed';
      if (result.scores.skill >= 80) {
        newStatus = 'Shortlisted';
      } else if (result.scores.skill < 60) {
        newStatus = 'Rejected';
      }

      const newCandidate = {
        id: `CAND-${Math.floor(1000 + Math.random() * 9000)}`,
        originalText: resumeText,
        anonymizedText: result.anonymizedText,
        skills: result.skills,
        metrics: result.metrics,
        demographics: result.demographics,
        scores: result.scores,
        explanation: result.explanation,
        status: newStatus,
        uploadDate: new Date().toISOString(),
        auditTrail: [
          {
            timestamp: new Date().toISOString(),
            reviewerId: user?.email || 'SYSTEM',
            action: 'Created',
            reason: 'Initial pipeline extraction'
          },
          {
            timestamp: new Date().toISOString(),
            reviewerId: 'SYSTEM',
            action: `Auto-assigned status: ${newStatus}`,
            reason: `Based on score rules (score: ${result.scores.skill})`
          }
        ]
      };

      addCandidate(newCandidate);
      navigate('/');
    } catch (error) {
      console.error(error);
      alert("Failed to process resume. Ensure Gemini API key is set.");
    } finally {
      setIsProcessing(false);
      setProgressStep(0);
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* Left Column: JD Source */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-gray-900 font-bold text-lg">
            <Target className="text-black" />
            1. Target Job Description
          </div>
          <p className="text-sm text-gray-500">Paste the job description you are hiring for. Candidates will be scored against this.</p>
          <textarea
            className="w-full h-[400px] p-4 text-sm text-gray-700 bg-white border border-gray-200 rounded-2xl focus:ring-1 focus:ring-black focus:outline-none resize-none shadow-sm"
            value={jobDescription}
            onChange={(e) => setJobDescription(e.target.value)}
            placeholder="Paste job description here..."
          />
        </div>

        {/* Right Column: Resume Upload */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-gray-900 font-bold text-lg">
            <FileText className="text-black" />
            2. Candidate Resume
          </div>
          <p className="text-sm text-gray-500">Upload a TXT, PDF, or DOCX file or paste resume text directly.</p>
          
          <div 
            {...getRootProps()} 
            className={cn(
              "border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-colors flex flex-col items-center justify-center",
              isDragActive ? "border-black bg-gray-50" : "border-gray-200 bg-gray-50 hover:bg-gray-100"
            )}
          >
            <input {...getInputProps()} />
            <UploadCloud size={40} className="text-gray-400 mb-4" />
            <p className="text-gray-900 font-medium">Drag & drop resume here</p>
            <p className="text-gray-500 text-sm mt-1">or click to browse (.txt, .pdf, .docx)</p>
          </div>

          <div className="relative">
            <div className="absolute inset-0 flex items-center" aria-hidden="true">
              <div className="w-full border-t border-gray-200" />
            </div>
            <div className="relative flex justify-center">
              <span className="bg-[#F8F9FA] px-3 text-sm text-gray-400 font-bold tracking-widest uppercase">Or Paste Text</span>
            </div>
          </div>

          <textarea
            className="w-full h-[160px] p-4 text-sm text-gray-700 bg-white border border-gray-200 rounded-2xl focus:ring-1 focus:ring-black focus:outline-none resize-none shadow-sm"
            value={resumeText}
            onChange={(e) => {
              setResumeText(e.target.value);
              setClientAnonPreview(clientSideAnonymize(e.target.value));
            }}
            placeholder="Paste candidate resume here..."
          />
          
          {clientAnonPreview && (
            <div className="mt-4 p-4 border border-emerald-200 bg-emerald-50 rounded-2xl text-xs text-emerald-800 h-[100px] overflow-y-auto">
              <strong className="block mb-1 text-emerald-700">Client-Side Anonymization Preview:</strong>
              {clientAnonPreview}
            </div>
          )}
        </div>
      </div>

      {/* Action Area */}
      <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm flex flex-col items-center justify-center">
        {!isProcessing ? (
          <button
            onClick={handleProcess}
            disabled={!resumeText || !jobDescription}
            className="flex items-center gap-2 bg-black text-white px-8 py-3 rounded-xl font-semibold hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-black/10"
          >
            Process Candidate through FairHire
          </button>
        ) : (
          <div className="w-full max-w-3xl space-y-6 flex flex-col items-center py-4">
            <div className="flex justify-between w-full relative">
              <div className="absolute top-1/2 left-0 w-full h-1 bg-slate-100 -z-10 -translate-y-1/2"></div>
              <div className="absolute top-1/2 left-0 h-1 bg-black -z-10 -translate-y-1/2 transition-all duration-500" style={{ width: `${((progressStep - 1) / 4) * 100}%` }}></div>
              
              {[
                { step: 1, label: 'Upload' },
                { step: 2, label: 'Anonymize' },
                { step: 3, label: 'Extract' },
                { step: 4, label: 'Evaluate' },
                { step: 5, label: 'Score' }
              ].map((s) => (
                <div key={s.step} className="flex flex-col items-center gap-2">
                  <div className={cn(
                    "w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs shadow-sm transition-colors duration-300",
                    progressStep > s.step ? "bg-black text-white" : 
                    progressStep === s.step ? "bg-white border-2 border-black text-black" :
                    "bg-gray-100 text-gray-400"
                  )}>
                    {progressStep > s.step ? <CheckCircle size={16} /> : s.step}
                  </div>
                  <span className={cn("text-[10px] font-bold uppercase tracking-widest", progressStep >= s.step ? "text-gray-900" : "text-gray-400")}>
                    {s.label}
                  </span>
                </div>
              ))}
            </div>
            <div className="flex items-center gap-3 text-blue-600 font-medium animate-pulse mt-4 text-sm">
              <Loader2 className="animate-spin" />
              {progressStep === 1 ? "Uploading and parsing file..." :
               progressStep === 2 ? "Redacting sensitive demographic signals..." :
               progressStep === 3 ? "Extracting skills and credentials..." :
               progressStep === 4 ? "Running AI evaluation counterfactual tests..." :
               "Calculating unbiased match scores..."}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
