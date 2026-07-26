'use client';

import { useState, useEffect } from 'react';
import { getProjectFiles, uploadFileToStorageAction, deleteFileRecord } from '@/app/actions/files';
import {
  FileText,
  FileImage,
  FileArchive,
  FileCode,
  File as FileIcon,
  Upload,
  Download,
  Trash2,
  Loader2,
  FolderOpen,
} from 'lucide-react';

interface FileManagerProps {
  projectId: string;
  currentUserRole: 'ADMIN' | 'CLIENT';
}

export default function FileManager({ projectId, currentUserRole }: FileManagerProps) {
  const [files, setFiles] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);

  // Load files
  useEffect(() => {
    async function loadFiles() {
      setIsLoading(true);
      try {
        const list = await getProjectFiles(projectId);
        setFiles(list);
      } catch (err) {
        console.error('Failed to load project files:', err);
      } finally {
        setIsLoading(false);
      }
    }
    loadFiles();
  }, [projectId]);

  // Format file sizes
  const formatBytes = (bytes: number, decimals = 1) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
  };

  // Get file type icon
  const getFileIcon = (name: string) => {
    const ext = name.split('.').pop()?.toLowerCase();
    if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'].includes(ext || '')) {
      return FileImage;
    }
    if (['zip', 'rar', '7z', 'tar', 'gz'].includes(ext || '')) {
      return FileArchive;
    }
    if (['html', 'css', 'js', 'ts', 'tsx', 'json', 'py', 'sh'].includes(ext || '')) {
      return FileCode;
    }
    if (['pdf', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx', 'txt'].includes(ext || '')) {
      return FileText;
    }
    return FileIcon;
  };

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    setIsUploading(true);
    const reader = new FileReader();
    reader.onloadend = async () => {
      const base64 = (reader.result as string).split(',')[1];
      try {
        const res = await uploadFileToStorageAction(
          projectId,
          selectedFile.name,
          base64,
          selectedFile.size,
          selectedFile.type
        );
        if (res.success && res.file) {
          setFiles((prev) => [res.file, ...prev]);
        }
      } catch (err) {
        console.error('Upload failed:', err);
      } finally {
        setIsUploading(false);
      }
    };
    reader.readAsDataURL(selectedFile);
  };

  const handleDelete = async (fileId: string) => {
    try {
      const res = await deleteFileRecord(fileId);
      if (res.success) {
        setFiles((prev) => prev.filter((f) => f.id !== fileId));
      }
    } catch (err) {
      console.error('Delete failed:', err);
    }
  };

  return (
    <div className="bg-slate-900/40 border border-slate-900 rounded-2xl p-5 space-y-5 shadow-xl">
      {/* Header & Upload Button */}
      <div className="flex justify-between items-center pb-3 border-b border-slate-900">
        <div className="flex items-center gap-2">
          <FolderOpen className="w-4 h-4 text-blue-400" />
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-200">
            Project File Vault
          </h3>
        </div>

        {/* Upload Trigger Button */}
        <label className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-950 hover:bg-slate-900 border border-slate-900 text-xs font-semibold text-slate-300 rounded-xl cursor-pointer transition-colors">
          {isUploading ? (
            <>
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
              <span>Uploading...</span>
            </>
          ) : (
            <>
              <Upload className="w-3.5 h-3.5" />
              <span>Upload File</span>
            </>
          )}
          <input
            type="file"
            onChange={handleUpload}
            disabled={isUploading}
            className="hidden"
          />
        </label>
      </div>

      {/* Files List */}
      {isLoading ? (
        <div className="py-12 flex justify-center text-slate-500">
          <Loader2 className="w-5 h-5 animate-spin" />
        </div>
      ) : files.length > 0 ? (
        <div className="space-y-2.5 max-h-80 overflow-y-auto pr-1">
          {files.map((file) => {
            const Icon = getFileIcon(file.name);
            return (
              <div
                key={file.id}
                className="p-3.5 bg-slate-950 border border-slate-900/80 rounded-xl flex items-center justify-between gap-4 hover:border-slate-800 transition-colors"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="p-2 bg-slate-900 border border-slate-800 text-slate-400 rounded-lg flex-shrink-0">
                    <Icon className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <h4 className="text-xs font-semibold text-slate-200 truncate" title={file.name}>
                      {file.name}
                    </h4>
                    <p className="text-[9px] text-slate-500 font-medium mt-0.5">
                      {formatBytes(file.size)} &bull; {new Date(file.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <a
                    href={file.fileUrl}
                    download={file.name}
                    target="_blank"
                    rel="noreferrer"
                    className="p-1.5 text-slate-400 hover:text-blue-400 rounded hover:bg-slate-900 transition-colors"
                    title="Download"
                  >
                    <Download className="w-3.5 h-3.5" />
                  </a>

                  <button
                    onClick={() => handleDelete(file.id)}
                    className="p-1.5 text-slate-500 hover:text-red-400 rounded hover:bg-red-950/20 transition-colors"
                    title="Delete File"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="py-12 text-center text-slate-650 text-xs">
          No files uploaded to this vault.
        </div>
      )}
    </div>
  );
}
