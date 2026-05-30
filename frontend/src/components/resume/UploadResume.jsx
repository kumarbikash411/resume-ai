import { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, FileText, X, CheckCircle, Loader2 } from 'lucide-react';
import { resumeApi } from '../../services/api';
import toast from 'react-hot-toast';

export default function UploadResume({ onUploaded }) {
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);

  const onDrop = useCallback((acceptedFiles) => {
    if (acceptedFiles.length > 0) setFile(acceptedFiles[0]);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
    },
    maxFiles: 1,
    maxSize: 10 * 1024 * 1024,
  });

  const handleUpload = async () => {
    if (!file) return;
    setUploading(true);
    try {
      const { data } = await resumeApi.upload(file);
      toast.success('Resume uploaded!');
      onUploaded?.(data.data);
      setFile(null);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-6">
      <h2 className="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2">
        <Upload className="w-5 h-5 text-blue-600" />
        Upload Resume
      </h2>

      <div
        {...getRootProps()}
        className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors ${
          isDragActive
            ? 'border-blue-500 bg-blue-50'
            : 'border-slate-300 hover:border-blue-400 hover:bg-slate-50'
        }`}
      >
        <input {...getInputProps()} />
        <div className="flex flex-col items-center gap-3">
          <div className="bg-slate-100 p-3 rounded-full">
            <FileText className="w-8 h-8 text-slate-400" />
          </div>
          {isDragActive ? (
            <p className="text-blue-600 font-medium">Drop it here!</p>
          ) : (
            <>
              <p className="text-slate-600 font-medium">Drag & drop your resume here</p>
              <p className="text-slate-400 text-sm">or click to browse</p>
              <p className="text-slate-400 text-xs">PDF or DOCX · Max 10MB</p>
            </>
          )}
        </div>
      </div>

      {file && (
        <div className="mt-4 flex items-center gap-3 p-3 bg-blue-50 rounded-xl">
          <CheckCircle className="w-5 h-5 text-blue-600 shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-slate-800 truncate">{file.name}</p>
            <p className="text-xs text-slate-500">{(file.size / 1024).toFixed(0)} KB</p>
          </div>
          <button
            onClick={() => setFile(null)}
            className="text-slate-400 hover:text-red-500 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {file && (
        <button
          onClick={handleUpload}
          disabled={uploading}
          className="mt-4 w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-semibold py-3 rounded-xl transition-colors flex items-center justify-center gap-2 text-sm"
        >
          {uploading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Uploading...
            </>
          ) : (
            <>
              <Upload className="w-4 h-4" />
              Upload Resume
            </>
          )}
        </button>
      )}
    </div>
  );
}
