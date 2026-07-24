import React from 'react';
import { FileDown, FileCode, CheckCircle2 } from 'lucide-react';
import { GeneratedCv } from '../../types';

interface CvGenerateResultProps {
  generatedCv: GeneratedCv;
  fileNameBase: string;
}

const downloadBlob = (blob: Blob, filename: string) => {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};

const base64ToBytes = (base64: string): Uint8Array => {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
};

export const CvGenerateResult: React.FC<CvGenerateResultProps> = ({ generatedCv, fileNameBase }) => {
  const handleDownloadPdf = () => {
    const bytes = base64ToBytes(generatedCv.pdfBase64);
    downloadBlob(new Blob([bytes], { type: 'application/pdf' }), `${fileNameBase}.pdf`);
  };

  const handleDownloadTex = () => {
    downloadBlob(new Blob([generatedCv.texSource], { type: 'application/x-tex' }), `${fileNameBase}.tex`);
  };

  return (
    <div className="bg-white border border-gray-200/80 rounded-2xl p-5 space-y-4 shadow-sm">
      <div className="flex items-center gap-2">
        <CheckCircle2 className="w-4 h-4 text-emerald-500" />
        <h4 className="text-sm font-bold text-gray-900">Updated CV Generated (Jake's Resume Template)</h4>
      </div>
      <p className="text-xs text-gray-500">
        Compiled successfully. Download the polished PDF, or the raw LaTeX source if you'd like to keep editing it yourself.
      </p>
      <div className="flex items-center gap-3">
        <button
          onClick={handleDownloadPdf}
          className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium transition-all shadow-2xs flex items-center gap-2"
        >
          <FileDown className="w-3.5 h-3.5" />
          <span>Download PDF</span>
        </button>
        <button
          onClick={handleDownloadTex}
          className="px-3.5 py-2 rounded-xl bg-white hover:bg-gray-50 text-gray-700 text-xs font-semibold transition-colors flex items-center gap-2 border border-gray-200 shadow-2xs"
        >
          <FileCode className="w-3.5 h-3.5" />
          <span>Download .tex source</span>
        </button>
      </div>
    </div>
  );
};
