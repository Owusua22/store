// src/components/products/ImageUpload.tsx
'use client';

import { useState, useCallback } from 'react';
import Image from 'next/image';
import { Upload, X, Loader2 } from 'lucide-react';

interface ImageUploadProps {
  value: string[];
  onChange: (urls: string[]) => void;
  maxFiles?: number;
  folder?: string;
}

export function ImageUpload({
  value = [],
  onChange,
  maxFiles = 3,
  folder = 'products',
}: ImageUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);

  const uploadFile = async (file: File): Promise<string> => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('folder', folder);

    const response = await fetch('/api/upload', {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Upload failed');
    }

    const { data } = await response.json();
    return data.url;
  };

  const handleFiles = useCallback(
    async (files: FileList | File[]) => {
      const fileArray = Array.from(files);
      const remainingSlots = maxFiles - value.length;

      if (fileArray.length > remainingSlots) {
        alert(`You can only upload ${remainingSlots} more image(s)`);
        return;
      }

      setUploading(true);
      try {
        const uploadPromises = fileArray.map(uploadFile);
        const newUrls = await Promise.all(uploadPromises);
        onChange([...value, ...newUrls]);
      } catch (error) {
        console.error('Upload error:', error);
        alert('Failed to upload one or more files');
      } finally {
        setUploading(false);
      }
    },
    [value, onChange, maxFiles]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragOver(false);
      handleFiles(e.dataTransfer.files);
    },
    [handleFiles]
  );

  const removeImage = async (index: number) => {
    const newUrls = value.filter((_, i) => i !== index);
    onChange(newUrls);
  };

  return (
    <div className="space-y-4">
      {/* Upload Area */}
      {value.length < maxFiles && (
        <div
          onDrop={handleDrop}
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors ${
            dragOver ? 'border-red-500 bg-red-50' : 'border-gray-300 hover:border-gray-400'
          }`}
        >
          <input
            type="file"
            multiple
            accept="image/jpeg,image/png,image/webp,image/gif"
            onChange={(e) => e.target.files && handleFiles(e.target.files)}
            className="hidden"
            id="image-upload"
            disabled={uploading}
          />
          <label htmlFor="image-upload" className="cursor-pointer">
            {uploading ? (
              <div className="flex flex-col items-center gap-2">
                <Loader2 className="w-10 h-10 text-red-600 animate-spin" />
                <p className="text-gray-600">Uploading...</p>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-3">
                <Upload className="w-10 h-10 text-gray-400" />
                <div>
                  <p className="text-gray-600 font-medium">
                    Drop images here or <span className="text-red-600">browse</span>
                  </p>
                  <p className="text-xs text-gray-400 mt-1">
                    PNG, JPG, WebP up to 5MB • Max {maxFiles} images
                  </p>
                </div>
              </div>
            )}
          </label>
        </div>
      )}

      {/* Image Preview Grid */}
      {value.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          {value.map((url, index) => (
            <div key={url} className="relative group aspect-square rounded-lg overflow-hidden border border-gray-200">
              <Image
                src={url}
                alt={`Product image ${index + 1}`}
                fill
                className="object-cover"
                sizes="(max-width: 768px) 50vw, 33vw"
              />
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors" />
              <button
                type="button"
                onClick={() => removeImage(index)}
                className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"
              >
                <X className="w-4 h-4" />
              </button>
              {index === 0 && (
                <span className="absolute bottom-2 left-2 bg-red-600 text-white text-xs px-2 py-0.5 rounded-full">
                  Thumbnail
                </span>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}