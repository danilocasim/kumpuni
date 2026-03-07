"use client";

import { useCallback, useState } from "react";
import imageCompression from "browser-image-compression";

const MAX_FILES = 3;
const MAX_SIZE_MB = 0.5;
const MAX_DIMENSION = 1200;

export interface JobPhotoFile {
  file: File;
  preview: string;
}

interface JobPhotoUploadProps {
  value: JobPhotoFile[];
  onChange: (files: JobPhotoFile[]) => void;
  className?: string;
}

export function JobPhotoUpload({ value, onChange, className = "" }: JobPhotoUploadProps) {
  const [compressing, setCompressing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFileChange = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const inputFiles = e.target.files;
      if (!inputFiles?.length) return;
      setError(null);
      setCompressing(true);
      try {
        const existing = value.length;
        const toAdd = Math.min(MAX_FILES - existing, inputFiles.length);
        const newItems: JobPhotoFile[] = [];
        for (let i = 0; i < toAdd; i++) {
          const file = inputFiles[i];
          if (!file.type.startsWith("image/")) continue;
          const compressed = await imageCompression(file, {
            maxSizeMB: MAX_SIZE_MB,
            maxWidthOrHeight: MAX_DIMENSION,
            useWebWorker: true,
          });
          const preview = await new Promise<string>((res) => {
            const r = new FileReader();
            r.onload = () => res(r.result as string);
            r.readAsDataURL(compressed);
          });
          newItems.push({ file: compressed, preview });
        }
        onChange([...value, ...newItems].slice(0, MAX_FILES));
      } catch (err) {
        console.error(err);
        setError("Hindi ma-compress ang larawan. Subukan muli.");
      } finally {
        setCompressing(false);
        e.target.value = "";
      }
    },
    [value, onChange]
  );

  const remove = useCallback(
    (index: number) => {
      onChange(value.filter((_, i) => i !== index));
    },
    [value, onChange]
  );

  return (
    <div className={className}>
      <label className="label-kumpuni">
        Mga litrato (max {MAX_FILES}, bawat isa &lt;500KB)
      </label>
      <div className="flex flex-wrap gap-2 mb-2">
        {value.map((item, i) => (
          <div key={i} className="relative">
            <img
              src={item.preview}
              alt=""
              className="h-[100px] w-[100px] object-cover rounded-kumpuni-md border-2 border-card-border"
            />
            <button
              type="button"
              onClick={() => remove(i)}
              className="absolute -top-1 -right-1 h-6 w-6 rounded-full bg-danger-red text-white text-xs font-bold flex items-center justify-center hover:opacity-90 active:scale-95"
              aria-label="Alisin"
            >
              ×
            </button>
          </div>
        ))}
      </div>
      {value.length < MAX_FILES && (
        <label className="min-h-[100px] w-[100px] rounded-kumpuni-md border-2 border-dashed border-grain-bg flex flex-col items-center justify-center gap-1 text-caption text-muted-gray cursor-pointer hover:border-action-orange hover:text-slate-text transition-colors">
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp"
            multiple
            onChange={handleFileChange}
            disabled={compressing}
            className="sr-only"
          />
          <span className="text-2xl">+</span>
          {compressing ? "Nagco-compress..." : "Mag-upload"}
        </label>
      )}
      {error && (
        <p className="text-caption text-danger-red mt-1" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
