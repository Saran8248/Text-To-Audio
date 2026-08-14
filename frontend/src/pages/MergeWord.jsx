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
  FileCheck
} from "lucide-react";
import { toast } from "react-toastify";

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
    script.src = "https://cdnjs.cloudflare.com/ajax/libs/mammoth/1.6.0/mammoth.browser.min.js";
    script.async = true;
    script.onload = () => {
      setMammothLoaded(true);
      console.log("Mammoth.js successfully loaded via CDN");
    };
    script.onerror = () => {
      toast.error("Failed to load Word document helper library. Please check your internet connection.");
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

  const handleFiles = async (fileList) => {
    const validExtensions = [".docx", ".txt"];
    const textOrDocxFiles = fileList.filter((file) => {
      const ext = file.name.slice(file.name.lastIndexOf(".")).toLowerCase();
      return validExtensions.includes(ext) || file.type === "text/plain";
    });

    if (textOrDocxFiles.length === 0) {
      toast.error("Please select valid Word (.docx) or Text (.txt) files.");
      return;
    }

    const newDocs = [];
    for (const file of textOrDocxFiles) {
      newDocs.push({
        id: Date.now() + Math.random().toString(36).substr(2, 9),
        name: file.name,
        size: (file.size / 1024).toFixed(1) + " KB",
        file: file,
      });
    }

    if (newDocs.length > 0) {
      setDocuments((prev) => [...prev, ...newDocs]);
      toast.success(`${newDocs.length} document(s) added.`);
      setMergedBlob(null);
      setMergedUrl(null);
    }
  };

  const deleteDocument = (id) => {
    setDocuments(documents.filter((doc) => doc.id !== id));
    setMergedBlob(null);
    setMergedUrl(null);
  };

  const moveDocument = (index, direction) => {
    const newIndex = index + direction;
    if (newIndex < 0 || newIndex >= documents.length) return;

    const updatedDocs = [...documents];
    const temp = updatedDocs[index];
    updatedDocs[index] = updatedDocs[newIndex];
    updatedDocs[newIndex] = temp;

    setDocuments(updatedDocs);
    setMergedBlob(null);
    setMergedUrl(null);
  };

  // Read .txt file as HTML paragraph string
  const readTextFile = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const text = e.target.result;
        // Escape HTML tags to prevent XSS/rendering issues and convert newlines to paragraphs
        const escaped = text
          .replace(/&/g, "&amp;")
          .replace(/</g, "&lt;")
          .replace(/>/g, "&gt;");
        const paragraphs = escaped
          .split(/\n+/)
          .map((p) => `<p>${p.trim()}</p>`)
          .join("");
        resolve(paragraphs);
      };
      reader.onerror = (err) => reject(err);
      reader.readAsText(file);
    });
  };

  // Convert docx ArrayBuffer to HTML using Mammoth
  const readDocxFile = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const arrayBuffer = e.target.result;
        if (!window.mammoth) {
          reject(new Error("Mammoth library is not loaded."));
          return;
        }
        window.mammoth
          .convertToHtml({ arrayBuffer: arrayBuffer })
          .then((result) => {
            resolve(result.value); // The generated HTML
          })
          .catch((err) => reject(err));
      };
      reader.onerror = (err) => reject(err);
      reader.readAsArrayBuffer(file);
    });
  };

  const handleMerge = async () => {
    if (documents.length < 2) {
      toast.warn("Add at least 2 documents to merge.");
      return;
    }

    if (!mammothLoaded && documents.some(d => d.name.endsWith(".docx"))) {
      toast.error("Document helper library is still loading. Please wait a moment.");
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
            // Standard CSS for page breaking in print and Word conversion
            mergedHtmlBody += `<div style="page-break-after: always; break-after: page; clear: both;"></div>`;
          } else if (mergeType === "double-space") {
            mergedHtmlBody += `<p style="margin-bottom: 24pt;">&nbsp;</p><p style="margin-bottom: 24pt;">&nbsp;</p>`;
          } else {
            // continuous
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
            p {
              margin-top: 0;
              margin-bottom: 8pt;
            }
            h1, h2, h3, h4 {
              color: #1e3a8a;
              font-family: 'Segoe UI', 'Arial', sans-serif;
            }
          </style>
        </head>
        <body>
      `;
      const footer = "</body></html>";

      const finalHtml = header + mergedHtmlBody + footer;
      const blob = new Blob(["\ufeff" + finalHtml], { type: "application/msword;charset=utf-8" });
      const url = URL.createObjectURL(blob);

      setMergedBlob(blob);
      setMergedUrl(url);
      toast.dismiss(mergeToast);
      toast.success("Documents successfully merged!");
    } catch (err) {
      console.error(err);
      toast.dismiss(mergeToast);
      toast.error("An error occurred while merging documents.");
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
    <div className="space-y-8 max-w-4xl">
      {/* Header */}
      <div className="flex justify-between items-start"
      >
        <div>
          <h1 className="text-4xl font-bold text-slate-900 mb-2">Merge Word</h1>
          <p className="text-slate-600">
            Combine Word documents (.docx) and Text files (.txt) into a single Word file.
          </p>
        </div>
        {documents.length > 0 && (
          <button onClick={resetAll}
            className="flex items-center gap-1.5 px-4 py-2 border border-red-500/20 bg-red-500/5 text-red-400 rounded-xl text-sm font-medium hover:bg-red-500/10 transition-all"
          >
            <RefreshCw size={15} />
            Reset All
          </button>
        )}
      </div>

      {/* Screen 1: File Uploader */}
      {documents.length === 0 ? (
        <div onDragEnter={handleDrag}
          onDragOver={handleDrag}
          onDragLeave={handleDrag}
          onDrop={handleDrop}
          className={`flex flex-col items-center justify-center border-2 border-dashed rounded-3xl p-16 text-center cursor-pointer transition-all duration-300 ${
            dragActive
              ? "border-blue-400 bg-blue-500/5 shadow-2xl scale-[1.01]"
              : "border-white/10 bg-white/5 hover:border-white/20"
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
          <div className="w-16 h-16 rounded-full bg-blue-500/10 border border-blue-500/20 flex items-center justify-center mb-6">
            <Upload className="text-blue-400" size={28} />
          </div>
          <h3 className="text-2xl font-semibold text-slate-900 mb-2">
            Merge Word Files Online - Join DOCX Free
          </h3>
          <p className="text-slate-600 mb-6 max-w-sm">
            Select or Drag & Drop Word (.docx) or plain text (.txt) files to combine them.
          </p>
          <button className="px-6 py-3 rounded-2xl bg-blue-500 text-white font-medium hover:bg-blue-600 transition-colors shadow-lg shadow-blue-500/25"
          >
            Select Word Files
          </button>
        </div>
      ) : (
        /* Screen 2: Document Editor & Merger */
        <div className="space-y-6">
          {/* Controls Bar */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center p-5 glass rounded-2xl border border-slate-200 gap-6"
          >
            {/* Merge Options */}
            <div className="flex flex-wrap items-center gap-6">
              {/* Alignment Control */}
              <div className="flex flex-col gap-1.5">
                <span className="text-xs text-slate-600 font-semibold uppercase tracking-wider">
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
                            ? "bg-blue-500 text-white shadow-md"
                            : "text-gray-400 hover:text-white hover:bg-white/5"
                        }`}
                        title={alignOpt.label}
                      >
                        <Icon size={18} />
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Merge Type Control */}
              <div className="flex flex-col gap-1.5">
                <span className="text-xs text-slate-600 font-semibold uppercase tracking-wider">
                  Merging Separation
                </span>
                <div className="flex bg-slate-50 p-1 rounded-xl border border-slate-200 text-sm font-medium">
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
                          ? "bg-blue-500 text-white shadow-md"
                          : "text-gray-400 hover:text-white hover:bg-white/5"
                      }`}
                    >
                      {typeOpt.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex gap-3 w-full md:w-auto self-end md:self-auto">
              <button onClick={() => fileInputRef.current.click()}
                className="flex-1 md:flex-none px-4 py-2 border border-slate-200 hover:bg-slate-50 rounded-xl text-sm font-medium text-slate-900 transition-colors"
              >
                + Add Files
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
                  key={doc.id} layout
                  className="flex items-center gap-4 p-4 glass rounded-2xl border border-slate-200 group"
                >
                  {/* Delete Button */}
                  <button onClick={() => deleteDocument(doc.id)}
                    className="p-2 border border-red-500/20 bg-red-500/5 text-red-400 rounded-xl hover:bg-red-500/15"
                  >
                    <Trash2 size={16} />
                  </button>

                  {/* Document Details */}
                  <div className="flex-1 min-w-0 flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
                      <FileText size={20} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <span className="text-sm font-medium text-slate-900 truncate block">
                        {doc.name}
                      </span>
                      <span className="text-xs text-slate-500 block mt-0.5">
                        {doc.size}
                      </span>
                    </div>
                  </div>

                  {/* Reordering Controls */}
                  <div className="flex flex-col gap-1.5">
                    <button
                      onClick={() => moveDocument(idx, -1)}
                      disabled={idx === 0}
                      className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-600 hover:text-slate-900 disabled:opacity-30 disabled:hover:bg-transparent"
                    >
                      <ArrowUp size={15} />
                    </button>
                    <button
                      onClick={() => moveDocument(idx, 1)}
                      disabled={idx === documents.length - 1}
                      className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-600 hover:text-slate-900 disabled:opacity-30 disabled:hover:bg-transparent"
                    >
                      <ArrowDown size={15} />
                    </button>
                  </div>
                </div>
              ))}
            
          </div>

          {/* Merge Trigger Button */}
          {!mergedUrl && (
            <div className="flex justify-end pt-2"
            >
              <button onClick={handleMerge}
                disabled={isMerging || documents.length < 2}
                className="px-8 py-3 rounded-2xl bg-gradient-to-r from-blue-500 to-purple-600 font-medium text-white hover:shadow-lg disabled:opacity-50"
              >
                {isMerging ? "Merging Documents..." : "Merge Documents"}
              </button>
            </div>
          )}
        </div>
      )}

      {/* Screen 3: Merged Results Panel */}
      {mergedUrl && (
        <div className="glass p-6 rounded-3xl border border-emerald-500/20 bg-emerald-500/5 space-y-6"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
              <CheckCircle className="text-emerald-400" size={20} />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900">
                Merge Completed successfully!
              </h3>
              <p className="text-xs text-slate-600">
                Your single merged Word document is ready for download.
              </p>
            </div>
          </div>

          <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-200 gap-4">
            <div className="w-12 h-12 rounded-full bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
              <FileCheck size={24} />
            </div>

            <div className="flex-1 text-sm font-medium text-slate-900 truncate">
              Merged-Document-{documents.length}-Files.doc
            </div>

            <div className="flex gap-3">
              <a
                href={mergedUrl}
                download={`merged-document-${Date.now()}.doc`}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white text-sm font-medium hover:shadow-lg transition-all"
              >
                <Download size={16} />
                Download
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MergeWord;
