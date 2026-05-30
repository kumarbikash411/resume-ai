import { useState } from 'react';
import { resumeApi } from '../../services/api';
import toast from 'react-hot-toast';
import {
  Brain, TrendingUp, AlertCircle, CheckCircle2,
  MessageSquare, Send, Loader2, Star, Zap
} from 'lucide-react';
import { RadarChart, PolarGrid, PolarAngleAxis, Radar, ResponsiveContainer, Tooltip } from 'recharts';

export default function ResumeAnalysis({ resume, onAnalyzed }) {
  const [analyzing, setAnalyzing] = useState(false);
  const [chatMsg, setChatMsg] = useState('');
  const [chatLoading, setChatLoading] = useState(false);
  const [chatHistory, setChatHistory] = useState([]);

  const analysis = resume.aiAnalysis ? tryParseJSON(resume.aiAnalysis) : null;

  const handleAnalyze = async () => {
    setAnalyzing(true);
    try {
      const { data } = await resumeApi.analyze(resume.id);
      toast.success('Analysis complete!');
      onAnalyzed?.(data.data);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Analysis failed');
    } finally {
      setAnalyzing(false);
    }
  };

  const handleChat = async (e) => {
    e.preventDefault();
    if (!chatMsg.trim()) return;
    const question = chatMsg.trim();
    setChatMsg('');
    setChatHistory(h => [...h, { role: 'user', text: question }]);
    setChatLoading(true);
    try {
      const { data } = await resumeApi.chat(resume.id, question);
      setChatHistory(h => [...h, { role: 'ai', text: data.data.answer }]);
    } catch {
      setChatHistory(h => [...h, { role: 'ai', text: 'Sorry, I could not answer that.' }]);
    } finally {
      setChatLoading(false);
    }
  };

  const radarData = analysis?.sections ? Object.entries(analysis.sections).map(([key, val]) => ({
    subject: key.charAt(0).toUpperCase() + key.slice(1),
    score: val.score * 10,
  })) : [];

  const scoreColor = (s) => s >= 80 ? 'text-green-600' : s >= 60 ? 'text-yellow-600' : 'text-red-500';
  const scoreBg = (s) => s >= 80 ? 'bg-green-100' : s >= 60 ? 'bg-yellow-100' : 'bg-red-100';

  if (!analysis && resume.status !== 'ANALYZING') {
    return (
      <div className="bg-white rounded-2xl border border-slate-200 p-6 text-center">
        <div className="flex flex-col items-center gap-4 py-4">
          <div className="bg-blue-100 p-4 rounded-full">
            <Brain className="w-8 h-8 text-blue-600" />
          </div>
          <div>
            <h3 className="font-semibold text-slate-800 mb-1">AI Analysis Ready</h3>
            <p className="text-sm text-slate-500">Get detailed feedback on your resume using GPT-4</p>
          </div>
          <button
            onClick={handleAnalyze}
            disabled={analyzing}
            className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-semibold px-6 py-3 rounded-xl transition-colors flex items-center gap-2 text-sm"
          >
            {analyzing ? <><Loader2 className="w-4 h-4 animate-spin" />Analyzing...</> : <><Zap className="w-4 h-4" />Analyze with AI</>}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Score Card */}
      {analysis && (
        <div className={`rounded-2xl border p-6 ${scoreBg(analysis.overallScore)} border-slate-200`}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-600">Overall Score</p>
              <p className={`text-5xl font-bold mt-1 ${scoreColor(analysis.overallScore)}`}>
                {analysis.overallScore}
                <span className="text-xl text-slate-400">/100</span>
              </p>
            </div>
            <Star className={`w-12 h-12 ${scoreColor(analysis.overallScore)}`} />
          </div>
          <p className="mt-3 text-sm text-slate-700">{analysis.summary}</p>
        </div>
      )}

      {/* Radar Chart */}
      {radarData.length > 0 && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6">
          <h3 className="font-semibold text-slate-800 mb-4">Section Scores</h3>
          <ResponsiveContainer width="100%" height={220}>
            <RadarChart data={radarData}>
              <PolarGrid />
              <PolarAngleAxis dataKey="subject" tick={{ fontSize: 12 }} />
              <Radar name="Score" dataKey="score" stroke="#2563eb" fill="#2563eb" fillOpacity={0.2} />
              <Tooltip formatter={(v) => [`${v}/100`]} />
            </RadarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Strengths & Improvements */}
      {analysis && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-white rounded-2xl border border-slate-200 p-5">
            <h3 className="font-semibold text-green-700 mb-3 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4" /> Strengths
            </h3>
            <ul className="space-y-2">
              {analysis.strengths?.map((s, i) => (
                <li key={i} className="text-sm text-slate-700 flex gap-2">
                  <span className="text-green-500 mt-0.5">•</span>{s}
                </li>
              ))}
            </ul>
          </div>
          <div className="bg-white rounded-2xl border border-slate-200 p-5">
            <h3 className="font-semibold text-orange-600 mb-3 flex items-center gap-2">
              <AlertCircle className="w-4 h-4" /> Improvements
            </h3>
            <ul className="space-y-2">
              {analysis.improvements?.map((s, i) => (
                <li key={i} className="text-sm text-slate-700 flex gap-2">
                  <span className="text-orange-400 mt-0.5">•</span>{s}
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {/* ATS + Suggested Roles */}
      {analysis?.atsCompatibility && (
        <div className="bg-white rounded-2xl border border-slate-200 p-5">
          <h3 className="font-semibold text-slate-800 mb-2 flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-blue-600" />
            ATS Compatibility — {analysis.atsCompatibility.score}/100
          </h3>
          <p className="text-sm text-slate-600 mb-3">{analysis.atsCompatibility.feedback}</p>
          {analysis.suggestedJobTitles?.length > 0 && (
            <>
              <p className="text-xs font-medium text-slate-500 mb-2">SUGGESTED JOB TITLES</p>
              <div className="flex flex-wrap gap-2">
                {analysis.suggestedJobTitles.map((t, i) => (
                  <span key={i} className="px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-xs font-medium">{t}</span>
                ))}
              </div>
            </>
          )}
        </div>
      )}

      {/* Chat with Resume */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5">
        <h3 className="font-semibold text-slate-800 mb-4 flex items-center gap-2">
          <MessageSquare className="w-4 h-4 text-blue-600" />
          Ask AI about this Resume
        </h3>

        <div className="space-y-3 max-h-64 overflow-y-auto mb-4">
          {chatHistory.length === 0 && (
            <p className="text-sm text-slate-400 text-center py-4">
              Ask anything — "What jobs fit this resume?" or "Improve my summary"
            </p>
          )}
          {chatHistory.map((m, i) => (
            <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-xs px-4 py-2 rounded-2xl text-sm ${
                m.role === 'user'
                  ? 'bg-blue-600 text-white rounded-br-sm'
                  : 'bg-slate-100 text-slate-800 rounded-bl-sm'
              }`}>
                {m.text}
              </div>
            </div>
          ))}
          {chatLoading && (
            <div className="flex justify-start">
              <div className="bg-slate-100 px-4 py-2 rounded-2xl rounded-bl-sm">
                <Loader2 className="w-4 h-4 animate-spin text-slate-500" />
              </div>
            </div>
          )}
        </div>

        <form onSubmit={handleChat} className="flex gap-2">
          <input
            value={chatMsg}
            onChange={(e) => setChatMsg(e.target.value)}
            placeholder="Ask a question..."
            className="flex-1 px-4 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            type="submit"
            disabled={chatLoading || !chatMsg.trim()}
            className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white p-2 rounded-xl transition-colors"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
}

function tryParseJSON(str) {
  try { return JSON.parse(str); } catch { return null; }
}
