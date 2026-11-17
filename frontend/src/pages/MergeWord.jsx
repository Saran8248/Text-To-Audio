import React, { useState, useRef, useEffect } from "react";
import {
  Upload,
  FileText,
  Trash2,
  ArrowUp,
  ArrowDown,
  Download,
  CheckCircle,
  RefreshCw,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  FileCheck,
  Split,
} from "lucide-react";
import { toast } from "react-toastify";
import HeroBanner from "../components/HeroBanner";

const MergeWord = () => {
  const fileInputRef = useRef(null);
  const [documents, setDocuments] = useState([]);
  const [alignment, setAlignment] = useState("left"); // left, center, right, justify
  const [mergeType, setMergeType] = useState("page-break"); // page-break, continuous, double-space
  const [isMerging, setIsMerging] = useState(false);
  const [, setMergedBlob] = useState(null);
  const [mergedUrl, setMergedUrl] = useState(null);
  const [dragActive, setDragActive] = useState(false);
  const [mammothLoaded, setMammothLoaded] = useState(false);

  // Load mammoth.js dynamically from CDN
  useEffect(() => {
    if (window.mammoth) {
      setMammothLoaded(true);
      return;
    }

    const script = document.createElement("script");
    script.src =
      "https://cdnjs.cloudflare.com/ajax/libs/mammoth/1.4.18/mammoth.browser.min.js";
    script.async = true;
    script.onload = () => {
      setMammothLoaded(true);
    };
    script.onerror = () => {
      console.warn("Failed to load mammoth.js from CDN");
    };
    document.body.appendChild(script);

    return () => {
      if (document.body.contains(script)) {
        document.body.removeChild(script);
      }
    };
  }, []);

  useEffect(() => {
    return () => {
      if (mergedUrl) URL.revokeObjectURL(mergedUrl);
    };
  }, [mergedUrl]);

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      await handleFiles(Array.from(e.dataTransfer.files));
    }
  };

  const handleFileSelect = async (e) => {
    if (e.target.files && e.target.files[0]) {
      await handleFiles(Array.from(e.target.files));
    }
  };

  const handleFiles = async (files) => {
    const validFiles = files.filter(
      (file) =>
        file.name.endsWith(".docx") ||
        file.name.endsWith(".txt") ||
        file.type === "text/plain" ||
        file.type ===
          "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
    );

    if (validFiles.length === 0) {
      toast.error(
        "Please select valid Word (.docx) or plain text (.txt) files."
      );
      return;
    }

    const newDocs = validFiles.map((file) => ({
      id: Math.random().toString(36).substring(7),
      file,
      name: file.name,
      size: `${(file.size / 1024).toFixed(1)} KB`,
    }));

    setDocuments((prev) => [...prev, ...newDocs]);
    toast.success(`Added ${newDocs.length} document(s)`);
  };

  const deleteDocument = (id) => {
    setDocuments((prev) => prev.filter((d) => d.id !== id));
    if (mergedUrl) {
      URL.revokeObjectURL(mergedUrl);
      setMergedUrl(null);
      setMergedBlob(null);
    }
  };

  const moveDocument = (index, direction) => {
    const targetIndex = index + direction;
    if (targetIndex < 0 || targetIndex >= documents.length) return;

    const updated = [...documents];
    const [moved] = updated.splice(index, 1);
    updated.splice(targetIndex, 0, moved);
    setDocuments(updated);

    if (mergedUrl) {
      URL.revokeObjectURL(mergedUrl);
      setMergedUrl(null);
      setMergedBlob(null);
    }
  };

  const readDocxFile = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = function (loadEvent) {
        const arrayBuffer = loadEvent.target.result;
        if (window.mammoth && mammothLoaded) {
          window.mammoth
            .convertToHtml({ arrayBuffer: arrayBuffer })
            .then(function (resultObject) {
              resolve(resultObject.value);
            })
            .catch(function (err) {
              reject(err);
            });
        } else {
          // Fallback if mammoth isn't loaded
          const decoder = new TextDecoder("utf-8");
          const text = decoder.decode(arrayBuffer);
          const cleanText = text.replace(/<[^>]*>?/gm, " ");
          resolve(`<p>${cleanText}</p>`);
        }
      };
      reader.onerror = reject;
      reader.readAsArrayBuffer(file);
    });
  };

  const readTextFile = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const text = e.target.result;
        const paragraphs = text
          .split("\n")
          .map((p) => `<p>${p || "&nbsp;"}</p>`)
          .join("");
        resolve(paragraphs);
      };
      reader.onerror = reject;
      reader.readAsText(file);
    });
  };

  const handleMerge = async () => {
    if (documents.length < 2) {
      toast.warn("Add at least 2 files to merge.");
      return;
    }

    setIsMerging(true);
    const mergeToast = toast.loading("Processing and merging documents...");

    try {
      let mergedHtmlBody = "";

      for (let i = 0; i < documents.length; i++) {
        const doc = documents[i];
        let fileHtml = "";

        if (doc.name.endsWith(".docx")) {
          fileHtml = await readDocxFile(doc.file);
        } else {
          fileHtml = await readTextFile(doc.file);
        }

        // Apply formatting and alignment wrap
        const alignedHtml = `<div style="text-align: ${alignment};">${fileHtml}</div>`;
        mergedHtmlBody += alignedHtml;

        // Apply merge type separations
        if (i < documents.length - 1) {
          if (mergeType === "page-break") {
            mergedHtmlBody += `<div style="page-break-after: always; break-after: page; clear: both;"></div>`;
          } else if (mergeType === "double-space") {
            mergedHtmlBody += `<p style="margin-bottom: 24pt;">&nbsp;</p><p style="margin-bottom: 24pt;">&nbsp;</p>`;
          } else {
            mergedHtmlBody += `<p style="margin-bottom: 12pt;">&nbsp;</p>`;
          }
        }
      }

      // Word specific HTML schema header to support styled DOC import
      const header = `
        <html xmlns:o='urn:schemas-microsoft-com:office:office' 
              xmlns:w='urn:schemas-microsoft-com:office:word' 
              xmlns='http://www.w3.org/TR/REC-html40'>
        <head>
          <title>Merged Document</title>
          <!--[if gte mso 9]>
          <xml>
            <w:WordDocument>
              <w:View>Print</w:View>
              <w:Zoom>100</w:Zoom>
              <w:DoNotOptimizeForBrowser/>
            </w:WordDocument>
          </xml>
          <![endif]-->
          <style>
            body { 
              font-family: 'Calibri', 'Arial', sans-serif; 
              line-height: 1.5; 
              color: #111111; 
              margin: 1in;
            }
            p { margin-top: 0; margin-bottom: 8pt; }
          </style>
        </head>
        <body>
      `;
      const footer = "</body></html>";
      const sourceHtml = header + mergedHtmlBody + footer;

      const blob = new Blob([sourceHtml], {
        type: "application/msword;charset=utf-8",
      });

      const url = URL.createObjectURL(blob);
      setMergedBlob(blob);
      setMergedUrl(url);

      toast.dismiss(mergeToast);
      toast.success("Documents merged successfully!");
    } catch (err) {
      console.error("Document Merge Error:", err);
      toast.dismiss(mergeToast);
      toast.error("Failed to merge documents.");
    } finally {
      setIsMerging(false);
    }
  };

  const resetAll = () => {
    setDocuments([]);
    setMergedBlob(null);
    setMergedUrl(null);
  };

  return (
    <div className="space-y-6">
      {/* Signature Ocean-to-Teal Hero Banner */}
      <HeroBanner
        kicker="AI AUDIO STUDIO"
        title="Merge Word Documents"
        description="Combine Word documents (.docx) and text files (.txt) into a single cohesive document."
        pills={[
          {
            icon: FileText,
            label: "Documents",
            value:
              documents.length > 0 ? `${documents.length} files` : "0 files",
          },
          {
            icon: Split,
            label: "Separation",
            value: mergeType === "page-break" ? "Page Break" : "Continuous",
          },
          {
            icon: FileCheck,
            label: "Format",
            value: ".DOCX / .DOC",
          },
        ]}
        sloganTop="DOCUMENTS"
        sloganBottom="COMBINE FILES"
      />

      {/* Screen 1: File Uploader */}
      {documents.length === 0 ? (
        <div
          onDragEnter={handleDrag}
          onDragOver={handleDrag}
          onDragLeave={handleDrag}
          onDrop={handleDrop}
          className={`flex flex-col items-center justify-center border-2 border-dashed rounded-3xl p-16 text-center cursor-pointer transition-all duration-300 bg-white ${
            dragActive
              ? "border-sky-500 bg-sky-50/50 shadow-md scale-[1.01]"
              : "border-slate-200 hover:border-[#006699]"
          }`}
          onClick={() => fileInputRef.current.click()}
        >
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept=".docx,.txt"
            className="hidden"
            onChange={handleFileSelect}
          />
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-sky-50 to-teal-50 border border-sky-100 flex items-center justify-center mb-5 text-[#006699]">
            <Upload size={28} />
          </div>
          <h3 className="text-xl font-bold text-slate-900 mb-2">
            Merge Word Files Online — Join DOCX Free
          </h3>
          <p className="text-slate-500 text-sm mb-6 max-w-sm">
            Select or drag & drop Word (.docx) or plain text (.txt) files to combine them into one file.
          </p>
          <button
            type="button"
            className="px-6 py-3 rounded-2xl bg-gradient-to-r from-blue-600 via-sky-500 to-cyan-500 hover:from-blue-700 hover:to-cyan-600 text-white font-semibold shadow-md shadow-sky-500/20 transition-all text-sm"
          >
            Select Word Files
          </button>
        </div>
      ) : (
        /* Screen 2: Document Editor & Merger */
        <div className="space-y-6">
          {/* Controls Bar */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center p-5 bg-white rounded-3xl border border-slate-200/80 shadow-sm gap-6">
            {/* Merge Options */}
            <div className="flex flex-wrap items-center gap-6">
              {/* Alignment Control */}
              <div className="flex flex-col gap-1.5">
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                  Text Alignment
                </span>
                <div className="flex bg-slate-50 p-1 rounded-xl border border-slate-200">
                  {[
                    { id: "left", icon: AlignLeft, label: "Left" },
                    { id: "center", icon: AlignCenter, label: "Center" },
                    { id: "right", icon: AlignRight, label: "Right" },
                    { id: "justify", icon: AlignJustify, label: "Justify" },
                  ].map((alignOpt) => {
                    const Icon = alignOpt.icon;
                    return (
                      <button
                        key={alignOpt.id}
                        type="button"
                        onClick={() => setAlignment(alignOpt.id)}
                        className={`p-2 rounded-lg transition-all ${
                          alignment === alignOpt.id
                            ? "bg-gradient-to-r from-blue-600 to-[#006699] text-white shadow-sm"
                            : "text-slate-500 hover:text-slate-900 hover:bg-slate-100"
                        }`}
                        title={alignOpt.label}
                      >
                        <Icon size={16} />
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Merge Type Control */}
              <div className="flex flex-col gap-1.5">
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                  Merging Separation
                </span>
                <div className="flex bg-slate-50 p-1 rounded-xl border border-slate-200 text-xs font-semibold">
                  {[
                    { id: "page-break", label: "Page Break" },
                    { id: "continuous", label: "Continuous" },
                    { id: "double-space", label: "Double Space" },
                  ].map((typeOpt) => (
                    <button
                      key={typeOpt.id}
                      type="button"
                      onClick={() => setMergeType(typeOpt.id)}
                      className={`px-3 py-1.5 rounded-lg transition-all ${
                        mergeType === typeOpt.id
                          ? "bg-gradient-to-r from-blue-600 to-[#006699] text-white shadow-sm"
                          : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                      }`}
                    >
                      {typeOpt.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2.5 w-full md:w-auto self-end md:self-auto">
              <button
                onClick={() => fileInputRef.current.click()}
                className="flex-1 md:flex-none px-4 py-2 border border-slate-200 hover:bg-slate-50 rounded-xl text-xs font-semibold text-slate-700 transition-colors"
              >
                + Add Files
              </button>
              <button
                onClick={resetAll}
                className="flex items-center gap-1.5 px-4 py-2 border border-red-200 bg-red-50 text-red-600 rounded-xl text-xs font-semibold hover:bg-red-100 transition-all"
              >
                <RefreshCw size={13} />
                Reset
              </button>
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept=".docx,.txt"
                className="hidden"
                onChange={handleFileSelect}
              />
            </div>
          </div>

          {/* Document List */}
          <div className="space-y-3">
            {documents.map((doc, idx) => (
              <div
                key={doc.id}
                className="flex items-center gap-4 p-4 bg-white rounded-2xl border border-slate-200/80 shadow-sm group hover:border-sky-300 transition-all"
              >
                {/* Delete Button */}
                <button
                  onClick={() => deleteDocument(doc.id)}
                  className="p-2 border border-red-100 bg-red-50 text-red-500 rounded-xl hover:bg-red-100 transition-colors"
                  title="Remove document"
                >
                  <Trash2 size={16} />
                </button>

                {/* Document Details */}
                <div className="flex-1 min-w-0 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-sky-50 border border-sky-100 flex items-center justify-center text-[#006699] shrink-0">
                    <FileText size={18} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <span className="text-xs font-semibold text-slate-900 truncate block">
                      {doc.name}
                    </span>
                    <span className="text-[11px] text-slate-400 block mt-0.5 font-medium">
                      {doc.size}
                    </span>
                  </div>
                </div>

                {/* Reordering Controls */}
                <div className="flex flex-col gap-1">
                  <button
                    onClick={() => moveDocument(idx, -1)}
                    disabled={idx === 0}
                    className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-600 hover:text-slate-900 disabled:opacity-30 disabled:hover:bg-transparent"
                    title="Move up"
                  >
                    <ArrowUp size={14} />
                  </button>
                  <button
                    onClick={() => moveDocument(idx, 1)}
                    disabled={idx === documents.length - 1}
                    className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-600 hover:text-slate-900 disabled:opacity-30 disabled:hover:bg-transparent"
                    title="Move down"
                  >
                    <ArrowDown size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Merge Trigger Button */}
          {!mergedUrl && (
            <div className="flex justify-end pt-2">
              <button
                onClick={handleMerge}
                disabled={isMerging || documents.length < 2}
                className="px-8 py-3 rounded-2xl bg-gradient-to-r from-blue-600 via-sky-500 to-cyan-500 hover:from-blue-700 hover:to-cyan-600 font-semibold text-white text-sm shadow-md shadow-sky-500/20 disabled:opacity-50 transition-all"
              >
                {isMerging ? "Merging Documents..." : "Merge Documents"}
              </button>
            </div>
          )}
        </div>
      )}

      {/* Screen 3: Merged Results Panel */}
      {mergedUrl && (
        <div className="bg-white rounded-3xl border border-teal-200 p-6 shadow-sm space-y-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-teal-50 border border-teal-100 flex items-center justify-center text-[#009688]">
              <CheckCircle size={20} />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">
                Merge Completed Successfully!
              </h3>
              <p className="text-xs text-slate-500">
                Your single merged Word document is ready for download.
              </p>
            </div>
          </div>

          <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-200 gap-4">
            <div className="w-11 h-11 rounded-2xl bg-sky-50 border border-sky-100 flex items-center justify-center text-[#006699]">
              <FileCheck size={22} />
            </div>

            <div className="flex-1 text-xs font-semibold text-slate-900 truncate">
              Merged-Document-{documents.length}-Files.doc
            </div>

            <div className="flex gap-3">
              <a
                href={mergedUrl}
                download={`merged-document-${Date.now()}.doc`}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-600 hover:to-emerald-600 text-white text-xs font-semibold shadow-md shadow-teal-500/20 transition-all"
              >
                <Download size={14} />
                Download Document
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MergeWord;
