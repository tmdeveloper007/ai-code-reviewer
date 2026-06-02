import React, { useState } from 'react';
import { 
  Github, 
  Terminal, 
  ShieldAlert, 
  Zap, 
  Sparkles, 
  FolderGit, 
  FileCode, 
  CheckCircle, 
  AlertOctagon, 
  AlertTriangle,
  Download, 
  Info,
  Layers,
  Code2
} from 'lucide-react';

// Define Types
interface ReviewItem {
  type: string;
  line: number;
  description: string;
  suggestion: string;
}

interface FileReview {
  bugs: ReviewItem[];
  security: ReviewItem[];
  optimization: ReviewItem[];
  styling: ReviewItem[];
}

interface AnalysisData {
  fileReviews: Record<string, FileReview>;
  generatedReadme: string;
}

interface BackendResponse {
  success: boolean;
  repoName: string;
  filesReviewedCount: number;
  analysis: AnalysisData;
}

export default function App() {
  // Input State
  const [repoUrl, setRepoUrl] = useState('');
  const [company, setCompany] = useState('General');
  const [language, setLanguage] = useState('English');
  const [selectedModel, setSelectedModel] = useState('llama-3.3-70b-versatile');
  
  // Loading & Flow State
  const [isLoading, setIsLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState('');
  
  // Response & View State
  const [analysisResult, setAnalysisResult] = useState<BackendResponse | null>(null);
  const [selectedFile, setSelectedFile] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'bugs' | 'security' | 'optimization' | 'styling'>('bugs');
  const [apiError, setApiError] = useState<string | null>(null);

  // GSSoC Issues State (Mentorship Panel)
  const [assignedContributors, setAssignedContributors] = useState<Record<string, string>>({
    'copy-code-button': 'Unassigned',
    'secret-scanning-rules': 'Unassigned',
    'api-documentation': 'Unassigned',
    'persist-assignments': 'Unassigned'
  });

  const handleAssignContributor = (issueKey: string) => {
    const name = prompt("Enter the contributor's GitHub username to assign this issue:");
    if (name) {
      setAssignedContributors(prev => ({
        ...prev,
        [issueKey]: name
      }));
    }
  };

  // Submit Handler to Call Backend API
  const handleAnalyze = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!repoUrl.trim()) return;

    setIsLoading(true);
    setApiError(null);
    setAnalysisResult(null);
    setSelectedFile(null);

    // Simulate structured loading steps for GSSoC wow factor
    const steps = [
      '🔍 Authenticating connection...',
      '📥 Cloning GitHub repository locally...',
      '📁 Traversing directory tree & parsing modules...',
      '🧠 Running LLM analysis using selected AI Model...',
      '📜 Generating custom repository README.md...',
      '🎉 Formatting reports...'
    ];

    let currentStep = 0;
    setLoadingStep(steps[0]);
    const stepInterval = setInterval(() => {
      currentStep++;
      if (currentStep < steps.length) {
        setLoadingStep(steps[currentStep]);
      }
    }, 1200);

    try {
      const response = await fetch('http://localhost:5000/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ repoUrl, company, language, model: selectedModel })
      });

      clearInterval(stepInterval);
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Server error occurred during analysis.');
      }

      const data: BackendResponse = await response.json();
      setAnalysisResult(data);
      
      // Select the first file reviewed automatically
      const filesList = Object.keys(data.analysis.fileReviews);
      if (filesList.length > 0) {
        setSelectedFile(filesList[0]);
      }

    } catch (err: any) {
      console.error(err);
      setApiError(err.message || 'Could not connect to the backend server. Make sure node backend is running on port 5000.');
    } finally {
      clearInterval(stepInterval);
      setIsLoading(false);
    }
  };

  // Helper to trigger README download
  const downloadReadme = () => {
    if (!analysisResult) return;
    const element = document.createElement("a");
    const file = new Blob([analysisResult.analysis.generatedReadme], { type: 'text/plain' });
    element.href = URL.createObjectURL(file);
    element.download = "GENERATED_README.md";
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  // Helper to compile and download complete Code Audit Report in Markdown format
  const downloadAuditReport = () => {
    if (!analysisResult) return;
    
    let md = `# 🛡️ RepoSage AI Code Review & Audit Report\n\n`;
    md += `* **Repository**: ${analysisResult.repoName}\n`;
    md += `* **Date**: ${new Date().toLocaleDateString()}\n`;
    md += `* **Total Modules Scanned**: ${analysisResult.filesReviewedCount} files\n\n`;
    
    md += `## 📊 Overall Code Health Summary\n\n`;
    let totalBugs = 0;
    let totalSecurity = 0;
    let totalPerf = 0;
    let totalStyle = 0;
    
    Object.keys(analysisResult.analysis.fileReviews).forEach(file => {
      const review = analysisResult.analysis.fileReviews[file];
      totalBugs += review.bugs?.length || 0;
      totalSecurity += review.security?.length || 0;
      totalPerf += review.optimization?.length || 0;
      totalStyle += review.styling?.length || 0;
    });
    
    md += `| Category | Findings Count | Severity Level |\n`;
    md += `| :--- | :---: | :--- |\n`;
    md += `| 🐞 Logical Bugs | ${totalBugs} | High |\n`;
    md += `| 🛡️ Security Breaches | ${totalSecurity} | Critical |\n`;
    md += `| ⚡ Performance Issues | ${totalPerf} | Medium |\n`;
    md += `| 🎨 Styling & Conventions | ${totalStyle} | Low |\n\n`;
    
    md += `---\n\n`;
    md += `## 🔍 File-by-File Audit Details\n\n`;
    
    Object.keys(analysisResult.analysis.fileReviews).forEach(file => {
      const review = analysisResult.analysis.fileReviews[file];
      const hasIssues = (review.bugs?.length || 0) + (review.security?.length || 0) + (review.optimization?.length || 0) + (review.styling?.length || 0) > 0;
      
      if (hasIssues) {
        md += `### 📄 File: \`${file}\`\n\n`;
        
        if (review.security && review.security.length > 0) {
          md += `#### 🛡️ Security Vulnerabilities\n`;
          review.security.forEach(item => {
            md += `* **Line ${item.line}** [${item.type}]: ${item.description}\n`;
            md += `  * *AI Suggestion*: \`${item.suggestion}\`\n`;
          });
          md += `\n`;
        }
        
        if (review.bugs && review.bugs.length > 0) {
          md += `#### 🐞 Logical Bugs\n`;
          review.bugs.forEach(item => {
            md += `* **Line ${item.line}** [${item.type}]: ${item.description}\n`;
            md += `  * *AI Suggestion*: \`${item.suggestion}\`\n`;
          });
          md += `\n`;
        }
        
        if (review.optimization && review.optimization.length > 0) {
          md += `#### ⚡ Performance Bottlenecks\n`;
          review.optimization.forEach(item => {
            md += `* **Line ${item.line}** [${item.type}]: ${item.description}\n`;
            md += `  * *AI Suggestion*: \`${item.suggestion}\`\n`;
          });
          md += `\n`;
        }
        
        if (review.styling && review.styling.length > 0) {
          md += `#### 🎨 Style & Conventions\n`;
          review.styling.forEach(item => {
            md += `* **Line ${item.line}** [${item.type}]: ${item.description}\n`;
            md += `  * *AI Suggestion*: \`${item.suggestion}\`\n`;
          });
          md += `\n`;
        }
        
        md += `---\n\n`;
      }
    });
    
    md += `## 📄 Generated README.md\n\n`;
    md += analysisResult.analysis.generatedReadme;
    
    const element = document.createElement("a");
    const fileBlob = new Blob([md], { type: 'text/plain' });
    element.href = URL.createObjectURL(fileBlob);
    element.download = `${analysisResult.repoName}_AUDIT_REPORT.md`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', boxSizing: 'border-box' }}>
      
      {/* 🚀 Modern Navbar */}
      <header className="glass-panel" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 24px', margin: '16px 24px 8px 24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ background: 'linear-gradient(135deg, #a855f7 0%, #3b82f6 100%)', padding: '10px', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Sparkles size={24} style={{ color: 'white' }} />
          </div>
          <div>
            <h1 style={{ margin: 0, fontSize: '22px', fontWeight: 800, background: 'linear-gradient(135deg, #f3f4f6 0%, #9ca3af 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              RepoSage <span style={{ fontSize: '12px', fontWeight: 600, color: '#a855f7', border: '1px solid rgba(168,85,247,0.3)', padding: '2px 8px', borderRadius: '20px', marginLeft: '6px', background: 'rgba(168,85,247,0.1)' }}>GSSoC '26 MVP</span>
            </h1>
            <p style={{ margin: 0, fontSize: '11px', color: '#9ca3af' }}>Open Source AI Developer Copilot</p>
          </div>
        </div>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          {analysisResult && (
            <button 
              onClick={downloadAuditReport}
              style={{ background: 'linear-gradient(135deg, #a855f7 0%, #3b82f6 100%)', color: 'white', border: 'none', borderRadius: '6px', padding: '6px 14px', fontSize: '12px', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', boxShadow: '0 4px 12px rgba(168,85,247,0.2)' }}
            >
              <Download size={14} /> Export Audit Report
            </button>
          )}
          <a href="https://github.com" target="_blank" rel="noreferrer" style={{ color: '#9ca3af', display: 'flex', alignItems: 'center', gap: '6px', textDecoration: 'none', fontSize: '13px', fontWeight: 500 }} className="hover:text-white">
            <Github size={18} /> Codebase
          </a>
          <span style={{ fontSize: '12px', background: '#22c55e', color: '#052e16', fontWeight: 700, padding: '3px 10px', borderRadius: '20px' }}>
            Admin Console
          </span>
        </div>
      </header>

      {/* 🚀 Main Layout Split */}
      <main style={{ flexGrow: 1, padding: '8px 24px 24px 24px', display: 'grid', gridTemplateColumns: '320px 1fr', gap: '20px', boxSizing: 'border-box' }}>
        
        {/* LEFT COLUMN: Setup & GSSoC Contributor Portal */}
        <section style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          
          {/* Setup Console */}
          <div className="glass-panel" style={{ padding: '20px' }}>
            <h2 style={{ fontSize: '16px', fontWeight: 700, color: '#f3f4f6', margin: '0 0 16px 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <FolderGit size={18} style={{ color: '#3b82f6' }} /> Import Repository
            </h2>

            <form onSubmit={handleAnalyze} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: '#9ca3af', marginBottom: '6px', textTransform: 'uppercase' }}>GitHub Repository URL</label>
                <input 
                  type="url" 
                  required
                  placeholder="https://github.com/username/repo"
                  value={repoUrl}
                  onChange={(e) => setRepoUrl(e.target.value)}
                  style={{ width: '100%', padding: '10px 12px', background: 'rgba(15, 23, 42, 0.6)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '6px', color: '#fff', fontSize: '13px', outline: 'none', boxSizing: 'border-box' }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: '#9ca3af', marginBottom: '6px', textTransform: 'uppercase' }}>Target Company</label>
                  <select 
                    value={company}
                    onChange={(e) => setCompany(e.target.value)}
                    style={{ width: '100%', padding: '10px 12px', background: 'rgba(15, 23, 42, 0.6)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '6px', color: '#fff', fontSize: '13px', outline: 'none' }}
                  >
                    <option value="General">General</option>
                    <option value="Google">Google</option>
                    <option value="Stripe">Stripe</option>
                    <option value="Meta">Meta</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: '#9ca3af', marginBottom: '6px', textTransform: 'uppercase' }}>Language</label>
                  <select 
                    value={language}
                    onChange={(e) => setLanguage(e.target.value)}
                    style={{ width: '100%', padding: '10px 12px', background: 'rgba(15, 23, 42, 0.6)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '6px', color: '#fff', fontSize: '13px', outline: 'none' }}
                  >
                    <option value="English">English</option>
                    <option value="Hindi">Hindi</option>
                    <option value="Telugu">Telugu</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: '#9ca3af', marginBottom: '6px', textTransform: 'uppercase' }}>AI Model</label>
                  <select 
                    value={selectedModel}
                    onChange={(e) => setSelectedModel(e.target.value)}
                    style={{ width: '100%', padding: '10px 12px', background: 'rgba(15, 23, 42, 0.6)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '6px', color: '#fff', fontSize: '13px', outline: 'none' }}
                  >
                    <option value="llama-3.3-70b-versatile">Llama 3.3 (70B)</option>
                    <option value="deepseek-r1-distill-llama-70b">DeepSeek R1 (70B)</option>
                    <option value="llama-3.1-8b-instant">Llama 3.1 (8B)</option>
                    <option value="gemma2-9b-it">Google Gemma 2 (9B)</option>
                  </select>
                </div>
              </div>

              <button 
                type="submit" 
                disabled={isLoading}
                className="glow-btn"
                style={{ width: '100%', padding: '12px', borderRadius: '6px', cursor: 'pointer', fontSize: '13px', marginTop: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
              >
                {isLoading ? (
                  <>
                    <span className="spin-slow" style={{ display: 'inline-block', width: '14px', height: '14px', border: '2px solid white', borderTopColor: 'transparent', borderRadius: '50%' }}></span>
                    Analyzing...
                  </>
                ) : (
                  <>
                    <Sparkles size={16} /> Scan & Document Repo
                  </>
                )}
              </button>
            </form>
          </div>

          {/* GSSoC Contributor & Mentorship Portal */}
          <div className="glass-panel" style={{ padding: '20px' }}>
            <h2 style={{ fontSize: '15px', fontWeight: 700, color: '#f3f4f6', margin: '0 0 4px 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Layers size={18} style={{ color: '#a855f7' }} /> Mentorship Portal
            </h2>
            <p style={{ margin: '0 0 16px 0', fontSize: '11px', color: '#9ca3af' }}>GSSoC Assigned Contributor Issues</p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 10px', background: 'rgba(168,85,247,0.05)', borderRadius: '6px', border: '1px solid rgba(168,85,247,0.1)' }}>
                <div>
                  <span style={{ fontSize: '12px', fontWeight: 600, color: '#f3f4f6', display: 'block' }}>Copy Code Button</span>
                  <span style={{ fontSize: '10px', color: '#a855f7' }}>🏷️ good first issue</span>
                </div>
                <button 
                  onClick={() => handleAssignContributor('copy-code-button')}
                  style={{ background: assignedContributors['copy-code-button'] === 'Unassigned' ? '#a855f7' : '#3b82f6', color: 'white', border: 'none', borderRadius: '4px', padding: '4px 8px', fontSize: '10px', fontWeight: 600, cursor: 'pointer' }}
                >
                  {assignedContributors['copy-code-button']}
                </button>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 10px', background: 'rgba(59,130,246,0.05)', borderRadius: '6px', border: '1px solid rgba(59,130,246,0.1)' }}>
                <div>
                  <span style={{ fontSize: '12px', fontWeight: 600, color: '#f3f4f6', display: 'block' }}>Expand Security Rules</span>
                  <span style={{ fontSize: '10px', color: '#3b82f6' }}>🏷️ backend / security</span>
                </div>
                <button 
                  onClick={() => handleAssignContributor('secret-scanning-rules')}
                  style={{ background: assignedContributors['secret-scanning-rules'] === 'Unassigned' ? '#a855f7' : '#3b82f6', color: 'white', border: 'none', borderRadius: '4px', padding: '4px 8px', fontSize: '10px', fontWeight: 600, cursor: 'pointer' }}
                >
                  {assignedContributors['secret-scanning-rules']}
                </button>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 10px', background: 'rgba(168,85,247,0.05)', borderRadius: '6px', border: '1px solid rgba(168,85,247,0.1)' }}>
                <div>
                  <span style={{ fontSize: '12px', fontWeight: 600, color: '#f3f4f6', display: 'block' }}>API Endpoint Spec</span>
                  <span style={{ fontSize: '10px', color: '#a855f7' }}>🏷️ documentation</span>
                </div>
                <button 
                  onClick={() => handleAssignContributor('api-documentation')}
                  style={{ background: assignedContributors['api-documentation'] === 'Unassigned' ? '#a855f7' : '#3b82f6', color: 'white', border: 'none', borderRadius: '4px', padding: '4px 8px', fontSize: '10px', fontWeight: 600, cursor: 'pointer' }}
                >
                  {assignedContributors['api-documentation']}
                </button>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 10px', background: 'rgba(34,197,94,0.05)', borderRadius: '6px', border: '1px solid rgba(34,197,94,0.1)' }}>
                <div>
                  <span style={{ fontSize: '12px', fontWeight: 600, color: '#f3f4f6', display: 'block' }}>Persist Contributor State</span>
                  <span style={{ fontSize: '10px', color: '#22c55e' }}>🏷️ frontend</span>
                </div>
                <button 
                  onClick={() => handleAssignContributor('persist-assignments')}
                  style={{ background: assignedContributors['persist-assignments'] === 'Unassigned' ? '#a855f7' : '#3b82f6', color: 'white', border: 'none', borderRadius: '4px', padding: '4px 8px', fontSize: '10px', fontWeight: 600, cursor: 'pointer' }}
                >
                  {assignedContributors['persist-assignments']}
                </button>
              </div>

            </div>
          </div>

        </section>

        {/* RIGHT COLUMN: Loading, Dashboard Audit, or Fallback Welcome Screen */}
        <section style={{ display: 'flex', flexDirection: 'column', boxSizing: 'border-box' }}>
          
          {/* 1. API Error Banner */}
          {apiError && (
            <div style={{ background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.3)', borderRadius: '8px', padding: '14px 20px', color: '#fca5a5', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
              <AlertOctagon size={20} style={{ color: '#ef4444' }} />
              <div>
                <strong style={{ display: 'block' }}>Backend Connection Error</strong>
                <span>{apiError}</span>
              </div>
            </div>
          )}

          {/* 2. Loading State */}
          {isLoading && (
            <div className="glass-panel" style={{ flexGrow: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '40px', gap: '20px' }}>
              <div className="spin-slow" style={{ width: '48px', height: '48px', border: '4px solid rgba(168,85,247,0.1)', borderTopColor: '#a855f7', borderRadius: '50%' }}></div>
              <div style={{ textAlign: 'center' }}>
                <h3 style={{ fontSize: '16px', fontWeight: 600, margin: '0 0 6px 0', color: '#f3f4f6' }}>AI Analyst is Reviewing Repository</h3>
                <p style={{ margin: 0, fontSize: '13px', color: '#9ca3af', fontStyle: 'italic' }}>{loadingStep}</p>
              </div>
            </div>
          )}

          {/* 3. Welcome / Sandbox Guide (When no scan has occurred yet) */}
          {!isLoading && !analysisResult && (
            <div className="glass-panel" style={{ flexGrow: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '40px', textAlign: 'center', gap: '24px' }}>
              <div style={{ background: 'rgba(59, 130, 246, 0.1)', padding: '16px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Code2 size={48} style={{ color: '#3b82f6' }} />
              </div>
              <div style={{ maxWidth: '500px' }}>
                <h2 style={{ fontSize: '20px', fontWeight: 700, margin: '0 0 10px 0', color: '#f3f4f6' }}>AI-Powered Code Audit Console</h2>
                <p style={{ margin: '0 0 20px 0', fontSize: '14px', color: '#9ca3af', lineHeight: 1.5 }}>
                  Enter a public GitHub repository link on the left panel to trigger a complete multi-file AI evaluation. 
                  Our service clones the codebase, audits variables for null risks or hardcoded credentials, and outputs an automated custom README.md structure.
                </p>
                <div style={{ display: 'flex', justifyContent: 'center', gap: '10px' }}>
                  <button 
                    onClick={() => {
                      setRepoUrl('https://github.com/google/guava');
                      setCompany('Google');
                    }}
                    style={{ background: 'rgba(255,255,255,0.05)', color: '#d1d5db', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '6px', padding: '8px 16px', fontSize: '12px', fontWeight: 600, cursor: 'pointer' }}
                  >
                    💡 Load Sample: Guava
                  </button>
                  <button 
                    onClick={() => {
                      setRepoUrl('https://github.com/KalyanReddyB/AuraCore');
                      setCompany('Stripe');
                    }}
                    style={{ background: 'rgba(255,255,255,0.05)', color: '#d1d5db', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '6px', padding: '8px 16px', fontSize: '12px', fontWeight: 600, cursor: 'pointer' }}
                  >
                    💡 Load Sample: AuraCore
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* 4. The Complete Analysis Dashboard (Split Audit View) */}
          {!isLoading && analysisResult && (
            <div style={{ flexGrow: 1, display: 'grid', gridTemplateColumns: '240px 1fr 1fr', gap: '20px', boxSizing: 'border-box' }}>
              
              {/* File Tree List */}
              <div className="glass-panel" style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '8px', overflowY: 'auto', maxHeight: '72vh' }}>
                <h3 style={{ fontSize: '12px', fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase', marginBottom: '8px', letterSpacing: '0.5px' }}>File Navigator</h3>
                {Object.keys(analysisResult.analysis.fileReviews).map((filePath) => (
                  <button
                    key={filePath}
                    onClick={() => setSelectedFile(filePath)}
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      borderRadius: '6px',
                      background: selectedFile === filePath ? 'rgba(59,130,246,0.1)' : 'transparent',
                      border: selectedFile === filePath ? '1px solid rgba(59,130,246,0.3)' : '1px solid transparent',
                      color: selectedFile === filePath ? '#60a5fa' : '#d1d5db',
                      textAlign: 'left',
                      fontSize: '12px',
                      fontWeight: selectedFile === filePath ? 600 : 500,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap'
                    }}
                  >
                    <FileCode size={14} style={{ color: selectedFile === filePath ? '#60a5fa' : '#9ca3af' }} />
                    {filePath}
                  </button>
                ))}
              </div>

              {/* Central Audit Hub */}
              <div className="glass-panel" style={{ padding: '20px', display: 'flex', flexDirection: 'column', boxSizing: 'border-box' }}>
                <div style={{ borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: '12px', marginBottom: '16px' }}>
                  <span style={{ fontSize: '10px', background: '#3b82f6', color: '#eff6ff', padding: '2px 8px', borderRadius: '20px', fontWeight: 600, textTransform: 'uppercase' }}>File Audit</span>
                  <h3 style={{ fontSize: '15px', fontWeight: 700, color: '#f3f4f6', margin: '4px 0 0 0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    📄 {selectedFile || 'Select a file'}
                  </h3>
                </div>

                {/* Audit Tabs */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '6px', marginBottom: '16px' }}>
                  <button
                    onClick={() => setActiveTab('bugs')}
                    style={{
                      padding: '6px',
                      borderRadius: '6px',
                      fontSize: '11px',
                      fontWeight: 600,
                      cursor: 'pointer',
                      border: '1px solid',
                      background: activeTab === 'bugs' ? 'rgba(249,115,22,0.1)' : 'transparent',
                      borderColor: activeTab === 'bugs' ? 'rgba(249,115,22,0.3)' : 'rgba(255,255,255,0.05)',
                      color: activeTab === 'bugs' ? '#f97316' : '#9ca3af',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '4px'
                    }}
                  >
                    <AlertTriangle size={12} /> Bugs
                  </button>
                  <button
                    onClick={() => setActiveTab('security')}
                    style={{
                      padding: '6px',
                      borderRadius: '6px',
                      fontSize: '11px',
                      fontWeight: 600,
                      cursor: 'pointer',
                      border: '1px solid',
                      background: activeTab === 'security' ? 'rgba(239,68,68,0.1)' : 'transparent',
                      borderColor: activeTab === 'security' ? 'rgba(239,68,68,0.3)' : 'rgba(255,255,255,0.05)',
                      color: activeTab === 'security' ? '#ef4444' : '#9ca3af',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '4px'
                    }}
                  >
                    <ShieldAlert size={12} /> Security
                  </button>
                  <button
                    onClick={() => setActiveTab('optimization')}
                    style={{
                      padding: '6px',
                      borderRadius: '6px',
                      fontSize: '11px',
                      fontWeight: 600,
                      cursor: 'pointer',
                      border: '1px solid',
                      background: activeTab === 'optimization' ? 'rgba(34,197,94,0.1)' : 'transparent',
                      borderColor: activeTab === 'optimization' ? 'rgba(34,197,94,0.3)' : 'rgba(255,255,255,0.05)',
                      color: activeTab === 'optimization' ? '#22c55e' : '#9ca3af',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '4px'
                    }}
                  >
                    <Zap size={12} /> Perf
                  </button>
                  <button
                    onClick={() => setActiveTab('styling')}
                    style={{
                      padding: '6px',
                      borderRadius: '6px',
                      fontSize: '11px',
                      fontWeight: 600,
                      cursor: 'pointer',
                      border: '1px solid',
                      background: activeTab === 'styling' ? 'rgba(59,130,246,0.1)' : 'transparent',
                      borderColor: activeTab === 'styling' ? 'rgba(59,130,246,0.3)' : 'rgba(255,255,255,0.05)',
                      color: activeTab === 'styling' ? '#3b82f6' : '#9ca3af',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '4px'
                    }}
                  >
                    <Terminal size={12} /> Style
                  </button>
                </div>

                {/* Audit Items Render */}
                <div style={{ flexGrow: 1, overflowY: 'auto', maxHeight: '54vh', display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  {selectedFile && analysisResult.analysis.fileReviews[selectedFile]?.[activeTab]?.length > 0 ? (
                    analysisResult.analysis.fileReviews[selectedFile][activeTab].map((item, index) => (
                      <div 
                        key={index}
                        style={{
                          padding: '12px 14px',
                          borderRadius: '8px',
                          background: 'rgba(15,23,42,0.4)',
                          borderLeft: '3px solid',
                          borderColor: activeTab === 'bugs' ? '#f97316' : activeTab === 'security' ? '#ef4444' : activeTab === 'optimization' ? '#22c55e' : '#3b82f6'
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                          <span style={{ fontSize: '12px', fontWeight: 700, color: '#f3f4f6' }}>{item.type}</span>
                          <span style={{ fontSize: '10px', background: 'rgba(255,255,255,0.08)', color: '#9ca3af', padding: '2px 8px', borderRadius: '4px', fontWeight: 600 }}>
                            Line {item.line}
                          </span>
                        </div>
                        <p style={{ margin: '0 0 10px 0', fontSize: '12px', color: '#d1d5db', lineHeight: 1.4 }}>{item.description}</p>
                        <div style={{ background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '6px', padding: '8px 10px' }}>
                          <span style={{ display: 'block', fontSize: '9px', fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase', marginBottom: '4px' }}>💡 AI Recommendation</span>
                          <code style={{ fontSize: '11px', color: '#a855f7', wordBreak: 'break-all' }}>{item.suggestion}</code>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div style={{ textAlign: 'center', padding: '40px 20px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
                      <CheckCircle size={32} style={{ color: '#22c55e' }} />
                      <div>
                        <span style={{ fontSize: '13px', fontWeight: 600, color: '#f3f4f6', display: 'block' }}>All Clean!</span>
                        <span style={{ fontSize: '11px', color: '#9ca3af' }}>No issues found in this category for this file.</span>
                      </div>
                    </div>
                  )}
                </div>

              </div>

              {/* generated README.md Preview */}
              <div className="glass-panel" style={{ padding: '20px', display: 'flex', flexDirection: 'column', boxSizing: 'border-box' }}>
                <div style={{ borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: '12px', marginBottom: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <span style={{ fontSize: '10px', background: '#a855f7', color: '#fae8ff', padding: '2px 8px', borderRadius: '20px', fontWeight: 600, textTransform: 'uppercase' }}>Documentation</span>
                    <h3 style={{ fontSize: '15px', fontWeight: 700, color: '#f3f4f6', margin: '4px 0 0 0' }}>📄 GENERATED_README.md</h3>
                  </div>
                  <button 
                    onClick={downloadReadme}
                    style={{ background: 'rgba(168,85,247,0.1)', border: '1px solid rgba(168,85,247,0.3)', color: '#c084fc', borderRadius: '6px', padding: '6px 12px', fontSize: '11px', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}
                  >
                    <Download size={14} /> Download
                  </button>
                </div>

                <div style={{ flexGrow: 1, overflowY: 'auto', maxHeight: '60vh', background: 'rgba(15,23,42,0.4)', padding: '16px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.05)', fontSize: '12px', lineHeight: 1.5, color: '#d1d5db', fontFamily: 'monospace', whiteSpace: 'pre-wrap' }}>
                  {analysisResult.analysis.generatedReadme}
                </div>
              </div>

            </div>
          )}

        </section>

      </main>

      {/* 🚀 Sleek Footer */}
      <footer style={{ marginTop: 'auto', background: 'rgba(15, 23, 42, 0.4)', padding: '12px 24px', borderTop: '1px solid rgba(255,255,255,0.05)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '11px', color: '#9ca3af' }}>
        <span>RepoSage AI © 2026. Made with 💜 for GirlScript Summer of Code (GSSoC).</span>
        <div style={{ display: 'flex', gap: '16px' }}>
          <span>Mentors: Kalyan Reddy Bhoompally</span>
          <span>Status: Production MVP Ready</span>
        </div>
      </footer>

    </div>
  );
}
