'use client';

import { useState } from 'react';
import { UploadButton } from '@uploadthing/react';
import { Paperclip, X, File, Image, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import toast from 'react-hot-toast';

export function FileAttachment({ attachments = [], onUploadComplete, onRemove, readOnly = false }) {
  const [uploading, setUploading] = useState(false);

  const getFileIcon = (fileType) => {
    if (fileType?.startsWith('image/')) return <Image className="w-4 h-4" />;
    return <File className="w-4 h-4" />;
  };

  const formatFileSize = (bytes) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  return (
    <div className="space-y-3">
      {/* Upload Button */}
      {!readOnly && (
        <div className="flex items-center gap-2">
          <UploadButton
            endpoint="taskAttachment"
            onUploadBegin={() => {
              setUploading(true);
              toast.loading('Uploading...', { id: 'upload' });
            }}
            onClientUploadComplete={(res) => {
              setUploading(false);
              toast.success('Upload complete!', { id: 'upload' });
              
              // Format attachments for your database
              const uploadedFiles = res.map(file => ({
                name: file.name,
                url: file.url,
                size: file.size,
                type: file.type,
                uploadthingKey: file.key,
              }));
              
              onUploadComplete?.(uploadedFiles);
            }}
            onUploadError={(error) => {
              setUploading(false);
              toast.error(`Upload failed: ${error.message}`, { id: 'upload' });
            }}
            appearance={{
              button: 'bg-primary-600 text-white hover:bg-primary-700 px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2',
              allowedContent: 'text-xs text-gray-500 dark:text-gray-400',
            }}
          />
          <span className="text-xs text-gray-500">
            Max 5 files, up to 4MB each (images, PDFs, text)
          </span>
        </div>
      )}

      {/* Attachments List */}
      {attachments.length > 0 && (
        <div className="space-y-2">
          <h4 className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300">
            <Paperclip className="w-4 h-4" />
            Attachments ({attachments.length})
          </h4>
          <div className="space-y-2">
            {attachments.map((file, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-2 border border-gray-200 rounded-lg bg-gray-50 dark:bg-gray-800 dark:border-gray-700"
              >
                <div className="flex items-center min-w-0 gap-3">
                  {getFileIcon(file.type)}
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate">{file.name}</p>
                    <p className="text-xs text-gray-500">{formatFileSize(file.size)}</p>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <a
                    href={file.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-700"
                  >
                    <Download className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                  </a>
                  {!readOnly && (
                    <button
                      onClick={() => onRemove?.(index)}
                      className="p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-700"
                    >
                      <X className="w-4 h-4 text-red-500" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}