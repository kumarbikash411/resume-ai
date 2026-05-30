import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { resumeApi } from '../../services/api';
import UploadResume from '../resume/UploadResume';
import ResumeAnalysis from '../resume/ResumeAnalysis';
import toast from 'react-hot-toast';
import {
  FileText, LogOut, Trash2, Clock, CheckCircle,
  AlertCircle, Upload, ChevronRight, BarChart2
} from 'lucide-react';

const STATUS_ICON = {
  UPLOADED: <Clock className="w-4 h-4 text-yellow-500" />,
  PROCESSING: <Clock className="w-4 h-4 text-blue-500 animate-spin" />,
  ANALYZED: <CheckCircle className="w-4 h-4 text-green-500" />,
  FAILED: <AlertCircle className="w-4 h-4 text-red-500" />,
};

export default function Dashboard() {
  const { user, logout } = useAuth();
  const [resumes, setResumes] = useState([]);
  const [selected, setSelected] = useState(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('list');

  useEffect(() => {
    loadResumes();
  }, []);

  const loadResumes = async () => {
    try {
      const { data } = await resumeApi.getAll();
      setResumes(data);
    } catch {
      toast.error('Failed to load resumes');
    } finally {
      setLoading(false);
    }
  };

  const handleUploaded = (resume) => {
    setResumes(r => [resume, ...r]);
    setSelected(resume);
    setTab('analysis');
  };

  const handleAnalyzed = (updated) => {
    setResumes(r => r.map(x => x.id === updated.id ? updated : x));
    setSelected(updated);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this resume?')) return;
    try {
      await resumeApi.delete(id);
      setResumes(r => r.filter(x => x.id !== id));
      if (selected?.id === id) { setSelected(null); setTab('list'); }
      toast.success('Deleted');
    } catch {
      toast.error('Delete failed');
    }
  };

  const selectResume = (r) => {
    setSelected(r);
    setTab('analysis');
  };

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Navbar */}
      <nav className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="bg-blue-600 p-1.5 rounded-lg">
              <FileText className="w-5 h-5 text-white" />
            </div>
            <span className="font-bold text-slate-800">ResumeAI</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-sm text-slate-600 hidden sm:block">
              {user?.fullName}
            </span>
            <button
              onClick={logout}
              className="flex items-center gap-1.5 text-slate-500 hover:text-red-600 transition-colors text-sm font-medium"
            >
              <LogOut className="w-4 h-4" />
              Sign out
            </button>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Stats Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
          {[
            { label: 'Total Resumes', value: resumes.length, icon: FileText, color: 'text-blue-600 bg-blue-50' },
            { label: 'Analyzed', value: resumes.filter(r => r.status === 'ANALYZED').length, icon: CheckCircle, color: 'text-green-600 bg-green-50' },
            { label: 'Pending', value: resumes.filter(r => r.status === 'UPLOADED').length, icon: Clock, color: 'text-yellow-600 bg-yellow-50' },
            { label: 'Avg Score', value: avgScore(resumes) || '—', icon: BarChart2, color: 'text-purple-600 bg-purple-50' },
          ].map(({ label, value, icon: Icon, color }) => (
            <div key={label} className="bg-white rounded-xl border border-slate-200 p-4 flex items-center gap-3">
              <div className={`p-2 rounded-lg ${color}`}>
                <Icon className="w-4 h-4" />
              </div>
              <div>
                <p className="text-xl font-bold text-slate-800">{value}</p>
                <p className="text-xs text-slate-500">{label}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Panel */}
          <div className="space-y-4">
            <UploadResume onUploaded={handleUploaded} />

            {/* Resume List */}
            <div className="bg-white rounded-2xl border border-slate-200">
              <div className="p-4 border-b border-slate-100">
                <h2 className="font-semibold text-slate-800 text-sm">Your Resumes</h2>
              </div>
              {loading ? (
                <div className="p-8 text-center text-slate-400 text-sm">Loading...</div>
              ) : resumes.length === 0 ? (
                <div className="p-8 text-center">
                  <Upload className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                  <p className="text-sm text-slate-400">No resumes yet</p>
                </div>
              ) : (
                <ul className="divide-y divide-slate-100">
                  {resumes.map((r) => (
                    <li key={r.id}>
                      <button
                        onClick={() => selectResume(r)}
                        className={`w-full flex items-center gap-3 p-4 text-left hover:bg-slate-50 transition-colors ${
                          selected?.id === r.id ? 'bg-blue-50' : ''
                        }`}
                      >
                        {STATUS_ICON[r.status] || STATUS_ICON.UPLOADED}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-slate-700 truncate">{r.originalFileName}</p>
                          <p className="text-xs text-slate-400">
                            {r.aiScore ? `Score: ${r.aiScore}/100` : r.status.toLowerCase()}
                          </p>
                        </div>
                        <div className="flex items-center gap-1">
                          <button
                            onClick={(e) => { e.stopPropagation(); handleDelete(r.id); }}
                            className="text-slate-300 hover:text-red-500 transition-colors p-1"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                          <ChevronRight className="w-4 h-4 text-slate-300" />
                        </div>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>

          {/* Right Panel */}
          <div className="lg:col-span-2">
            {selected ? (
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <FileText className="w-4 h-4 text-blue-600" />
                  <span className="font-medium text-slate-700 text-sm truncate">{selected.originalFileName}</span>
                </div>
                <ResumeAnalysis resume={selected} onAnalyzed={handleAnalyzed} />
              </div>
            ) : (
              <div className="bg-white rounded-2xl border border-slate-200 h-64 flex items-center justify-center">
                <div className="text-center">
                  <FileText className="w-12 h-12 text-slate-200 mx-auto mb-3" />
                  <p className="text-slate-400 text-sm">Select a resume to analyze</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function avgScore(resumes) {
  const analyzed = resumes.filter(r => r.aiScore);
  if (!analyzed.length) return null;
  const avg = analyzed.reduce((s, r) => s + parseInt(r.aiScore, 10), 0) / analyzed.length;
  return Math.round(avg);
}
