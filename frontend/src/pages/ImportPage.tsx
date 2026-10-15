import React, { useState } from 'react';
import {
  FileSpreadsheet,
  Upload,
  Download,
  CheckCircle,
  AlertTriangle,
  FileCheck,
  XCircle,
  Info,
  Layers,
  ArrowRight
} from 'lucide-react';
import { CsvPreview } from '../types';
import { api } from '../services/api';

export const ImportPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'products' | 'sales'>('products');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<CsvPreview | null>(null);
  const [validating, setValidating] = useState<boolean>(false);
  const [committing, setCommitting] = useState<boolean>(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleDownloadTemplate = (type: 'products' | 'sales') => {
    window.open(`/api/import/template/${type}`, '_blank');
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setSelectedFile(file);
    setPreview(null);
    setSuccessMsg(null);
    setErrorMsg(null);
    setValidating(true);

    try {
      const res = await api.previewCsv(file, activeTab);
      setPreview(res);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to parse and validate CSV file.');
    } finally {
      setValidating(false);
    }
  };

  const handleCommitImport = async () => {
    if (!selectedFile) return;
    setCommitting(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      const res = await api.commitCsv(selectedFile, activeTab);
      if (res.success) {
        setSuccessMsg(res.message);
        setPreview(null);
        setSelectedFile(null);
      } else {
        setErrorMsg(res.message);
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Import execution failed.');
    } finally {
      setCommitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">CSV Bulk Import & Data Templates</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Import product catalogs and historical sales transactions with pre-flight schema validation
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center space-x-2 bg-slate-100 p-1.5 rounded-xl">
          <button
            onClick={() => {
              setActiveTab('products');
              setPreview(null);
              setSelectedFile(null);
              setErrorMsg(null);
              setSuccessMsg(null);
            }}
            className={`px-4 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
              activeTab === 'products'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Products Catalog CSV
          </button>
          <button
            onClick={() => {
              setActiveTab('sales');
              setPreview(null);
              setSelectedFile(null);
              setErrorMsg(null);
              setSuccessMsg(null);
            }}
            className={`px-4 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
              activeTab === 'sales'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Sales History CSV
          </button>
        </div>
      </div>

      {/* Template Download Card */}
      <div className="bg-slate-900 text-white rounded-2xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-slate-800 flex items-center justify-center text-emerald-400">
            <Download className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold">
              Download Official CSV Templates ({activeTab === 'products' ? 'Products' : 'Sales History'})
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Includes pre-filled sample rows for Kirana or Electricals shops and strict column headers
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2 shrink-0">
          <button
            onClick={() => handleDownloadTemplate(activeTab)}
            className="bg-emerald-600 hover:bg-emerald-700 text-white px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center justify-center space-x-1.5 transition-colors cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Kirana Template</span>
          </button>
          <button
            onClick={() => window.open(`/api/import/template/electricals_${activeTab}`, '_blank')}
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center justify-center space-x-1.5 transition-colors cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Electricals Template</span>
          </button>
        </div>
      </div>

      {/* File Upload Zone */}
      <div className="bg-white p-6 rounded-2xl border-2 border-dashed border-slate-200 hover:border-emerald-500 transition-colors text-center space-y-3">
        <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto">
          <Upload className="w-6 h-6" />
        </div>
        <div>
          <h4 className="text-sm font-bold text-slate-900">
            Upload your {activeTab === 'products' ? 'Products' : 'Sales History'} CSV file
          </h4>
          <p className="text-xs text-slate-500 mt-0.5">
            File will be inspected and validated before making any database modifications
          </p>
        </div>

        <label className="inline-flex items-center space-x-2 bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-2.5 rounded-xl text-xs font-semibold cursor-pointer shadow-sm transition-all">
          <span>Choose CSV File</span>
          <input
            type="file"
            accept=".csv"
            onChange={handleFileChange}
            className="hidden"
          />
        </label>
        {selectedFile && (
          <p className="text-xs font-mono font-medium text-slate-600 mt-2">
            Selected: {selectedFile.name} ({(selectedFile.size / 1024).toFixed(1)} KB)
          </p>
        )}
      </div>

      {/* Validation Status / Messages */}
      {validating && (
        <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl text-xs text-center text-slate-600 flex items-center justify-center space-x-2">
          <div className="w-4 h-4 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin" />
          <span>Validating CSV headers, data types, and checking duplicates...</span>
        </div>
      )}

      {successMsg && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs flex items-center space-x-2">
          <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0" />
          <span className="font-semibold">{successMsg}</span>
        </div>
      )}

      {errorMsg && (
        <div className="p-4 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-xs flex items-center space-x-2">
          <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0" />
          <span className="font-semibold">{errorMsg}</span>
        </div>
      )}

      {/* Preview and Validation Report */}
      {preview && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-100 gap-3">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Pre-Import Validation Report</h3>
              <p className="text-xs text-slate-500">
                {preview.total_rows} total rows analyzed in {selectedFile?.name}
              </p>
            </div>

            <div className="flex items-center space-x-3 text-xs">
              <span className="px-3 py-1 rounded-lg bg-emerald-50 text-emerald-700 font-bold border border-emerald-200">
                {preview.valid_rows_count} Valid
              </span>
              <span className={`px-3 py-1 rounded-lg font-bold border ${
                preview.invalid_rows_count > 0
                  ? 'bg-rose-50 text-rose-700 border-rose-200'
                  : 'bg-slate-100 text-slate-600 border-slate-200'
              }`}>
                {preview.invalid_rows_count} Invalid
              </span>
            </div>
          </div>

          {/* Validation Errors List if any */}
          {preview.errors.length > 0 && (
            <div className="bg-rose-50 border border-rose-200 rounded-xl p-4 space-y-2">
              <div className="flex items-center space-x-2 text-xs font-bold text-rose-900">
                <XCircle className="w-4 h-4 text-rose-600" />
                <span>Validation Errors Detected ({preview.errors.length}) — Fix before importing:</span>
              </div>
              <div className="max-h-48 overflow-y-auto space-y-1 divide-y divide-rose-100 text-xs text-rose-800">
                {preview.errors.map((err, idx) => (
                  <div key={idx} className="pt-1 flex items-start space-x-2 font-mono text-[11px]">
                    <span className="font-bold">Row {err.row_number}:</span>
                    <span>[{err.field}] {err.message} {err.sku && `(SKU: ${err.sku})`}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Data Preview Table */}
          <div>
            <h4 className="text-xs font-bold text-slate-700 mb-2">First 10 Rows Sample</h4>
            <div className="overflow-x-auto rounded-xl border border-slate-200">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-500 font-semibold uppercase text-[10px]">
                  <tr>
                    {preview.preview_data.length > 0 &&
                      Object.keys(preview.preview_data[0]).map((col) => (
                        <th key={col} className="px-3 py-2">{col}</th>
                      ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-[11px]">
                  {preview.preview_data.map((row, idx) => (
                    <tr key={idx} className="hover:bg-slate-50">
                      {Object.values(row).map((val: any, vIdx) => (
                        <td key={vIdx} className="px-3 py-2 font-mono">{String(val)}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Commit Button */}
          <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
            <span className="text-xs text-slate-500">
              {preview.invalid_rows_count === 0
                ? 'All rows passed schema and duplicate validation checks.'
                : 'Import is disabled until errors are resolved in the source CSV.'}
            </span>

            <button
              onClick={handleCommitImport}
              disabled={preview.invalid_rows_count > 0 || committing}
              className="bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-2.5 rounded-xl text-xs font-bold flex items-center space-x-2 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
            >
              {committing ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <FileCheck className="w-4 h-4" />
                  <span>Commit Import to Database ({preview.valid_rows_count} rows)</span>
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
