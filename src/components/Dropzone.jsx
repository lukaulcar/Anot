import { useRef, useState } from 'react';
import { UploadCloud } from 'lucide-react';

export default function Dropzone({ onImageSelected }) {
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef(null);

  const supportedFormats = [
    { label: 'PNG', ext: '.png' },
    { label: 'JPEG', ext: '.jpg, .jpeg' },
    { label: 'WEBP', ext: '.webp' },
    { label: 'SVG', ext: '.svg' },
    { label: 'GIF', ext: '.gif' },
    { label: 'BMP', ext: '.bmp' },
    { label: 'AVIF', ext: '.avif' },
  ];

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      processFile(file);
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      processFile(e.target.files[0]);
    }
  };

  const processFile = (file) => {
    if (!file.type.startsWith('image/') && !file.name.match(/\.(svg|webp|avif|bmp|gif|png|jpe?g)$/i)) {
      alert('Please upload a valid image file.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        onImageSelected({
          src: event.target.result,
          name: file.name,
          width: img.naturalWidth,
          height: img.naturalHeight,
          type: file.type || 'image/png',
          size: file.size,
        });
      };
      img.src = event.target.result;
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="flex-1 flex flex-col items-center justify-center p-6 md:p-12 max-w-4xl mx-auto w-full">
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`w-full group cursor-pointer transition-all duration-300 rounded-2xl border-2 border-dashed p-10 md:p-16 flex flex-col items-center justify-center text-center bg-white shadow-xs ${
          isDragging
            ? 'border-neutral-900 bg-neutral-50 scale-[1.01]'
            : 'border-neutral-300 hover:border-neutral-900 hover:bg-neutral-50/50'
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*,.svg,.webp,.avif,.bmp,.gif,.png,.jpg,.jpeg"
          onChange={handleFileChange}
          className="hidden"
        />

        <div className="w-16 h-16 rounded-full bg-neutral-900 text-white flex items-center justify-center mb-6 transition-transform group-hover:scale-110 shadow-sm">
          <UploadCloud className="w-8 h-8" />
        </div>

        <h3 className="text-xl md:text-2xl font-bold tracking-tight text-neutral-900 mb-2">
          Upload an image to annotate
        </h3>

        <p className="text-sm text-neutral-500 max-w-md mb-6 leading-relaxed">
          Drag & drop your file here, or click to browse. You can also paste directly from your clipboard using <kbd className="px-1.5 py-0.5 text-xs bg-neutral-100 border border-neutral-300 rounded font-mono text-neutral-800">Ctrl + V</kbd>.
        </p>

        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            fileInputRef.current?.click();
          }}
          className="px-6 py-2.5 bg-neutral-900 text-white text-sm font-medium rounded-full hover:bg-neutral-700 cursor-pointer transition-colors shadow-xs hover:shadow"
        >
          Select from device
        </button>

        <div className="mt-8 pt-6 border-t border-neutral-100 flex flex-wrap justify-center items-center gap-2">
          <span className="text-xs uppercase tracking-wider font-semibold text-neutral-400 mr-2">
            Formats:
          </span>
          {supportedFormats.map((f) => (
            <span
              key={f.label}
              className="text-xs font-mono font-medium px-2 py-0.5 rounded bg-neutral-100 text-neutral-600 border border-neutral-200"
            >
              {f.label}
            </span>
          ))}
        </div>
      </div>

      <div className="mt-8 text-xs font-medium text-neutral-400 flex items-center gap-1.5">
        <span>Made by</span>
        <a
          href="https://lukaulcar.com"
          target="_blank"
          rel="noopener noreferrer"
          className="text-neutral-700 hover:text-neutral-950 font-semibold underline underline-offset-2 transition-colors"
        >
          lukaulcar.com
        </a>
      </div>
    </div>
  );
}
