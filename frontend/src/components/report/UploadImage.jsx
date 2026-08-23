import { useState } from "react";
import { Upload, Image as ImageIcon } from "lucide-react";

export default function UploadImage({
  image,
  setImage,
}) {
  const [preview, setPreview] = useState(null);

  const handleImage = (e) => {
    const file = e.target.files[0];

    if (!file) return;

    setImage(file);
    setPreview(URL.createObjectURL(file));
  };

  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-[0_2px_8px_rgba(15,23,42,0.04)]">
      <h2 className="mb-6 text-[18px] font-semibold text-slate-900 tracking-tight">
        Upload Evidence
      </h2>

      <label className="flex min-h-[280px] cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-blue-200/80 bg-slate-50 transition-all hover:bg-blue-50/50 hover:border-blue-400">
        {preview ? (
          <img
            src={preview}
            alt="Preview"
            className="h-full w-full rounded-2xl object-cover min-h-[280px]"
          />
        ) : (
          <div className="flex flex-col items-center text-center p-8">
            <div className="rounded-full bg-blue-100/80 p-4 text-blue-600 mb-4 transition-transform hover:scale-105">
              <Upload size={28} />
            </div>
            <p className="text-[15px] font-semibold text-slate-900">
              Click to upload an image
            </p>
            <p className="mt-1.5 text-[13px] font-medium text-slate-500">
              PNG, JPG, JPEG up to 10MB
            </p>
          </div>
        )}
        <input
          type="file"
          accept="image/*"
          onChange={handleImage}
          hidden
        />
      </label>

      {image && (
        <div className="mt-5 flex items-center gap-3 rounded-xl border border-slate-100 bg-slate-50 p-4">
          <ImageIcon className="text-blue-600 shrink-0" size={20} />
          <span className="text-[14px] font-medium text-slate-700 truncate">
            {image.name}
          </span>
        </div>
      )}
    </div>
  );
}