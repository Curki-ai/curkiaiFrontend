import React, { useEffect, useRef, useState } from "react";
import { FiX, FiDownload, FiSave, FiRefreshCw, FiMail } from "react-icons/fi";
import "superdoc/style.css";
import "../../../../Styles/SupportAtHomeModule/CareVoice/FilePreviewModal.css"
const FilePreviewModal = ({
  doc,
  fileIndex,
  isOpen,
  onClose,
  careVoiceFiles = [],
  setCareVoiceFiles,
  userEmail,
  staffEmail,
  staffName
}) => {
  const editorRef = useRef(null);
  const containerRef = useRef(null);
  const toolbarRef = useRef(null);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [reloadKey, setReloadKey] = useState(0);
  const [showEmailDialog, setShowEmailDialog] = useState(false);
  const [sendingEmail, setSendingEmail] = useState(false);
  const fileName = doc?.name || "Document.docx";

  useEffect(() => {
    if (!isOpen || !doc) return;

    let editor = null;

    const initEditor = async () => {
      try {
        setLoading(true);

        const { SuperDoc } = await import('superdoc');

        // Simple configuration - just like documentation
        const config = {
          selector: '#superdoc-container',
          toolbar: '#superdoc-toolbar',
          documentMode: "editing",
          editable: true,
          readOnly: false,
          pagination: true,
          rulers: true,
          features: {
            zoom: true,
            fonts: true,
            fontSize: true,
            textColor: true,
            highlight: true,
            link: true,
            table: true,
            alignment: true,
            lists: true,
            indent: true,
            lineSpacing: true,
            formatPainter: true,
            editingMode: true
          },
          onReady: () => {
            console.log("SuperDoc editor ready");
            setLoading(false);
          },
          onError: (error) => {
            console.error("SuperDoc error:", error);
            setLoading(false);
          }
        };

        const currentFile = careVoiceFiles[fileIndex];
        if (currentFile) {
          config.document = currentFile;
        } else if (doc) {
          config.document = doc;
        }

        editor = new SuperDoc(config);
        editorRef.current = editor;

      } catch (error) {
        console.error("Failed to initialize editor:", error);
        setLoading(false);
      }
    };

    // Small delay to ensure DOM is ready
    const timer = setTimeout(() => {
      initEditor();
    }, 100);

    return () => {
      clearTimeout(timer);
      if (editorRef.current) {
        editorRef.current.destroy();
        editorRef.current = null;
      }
    };
  }, [isOpen, doc, reloadKey, fileIndex, careVoiceFiles]);

  const getEditorInstance = () => {
    if (!editorRef.current) {
      throw new Error("Editor not initialized");
    }
    return editorRef.current;
  };

  const updateParentFile = (file) => {
    setCareVoiceFiles((prev) => {
      const updated = [...prev];
      updated[fileIndex] = file;
      return updated;
    });
  };

  const handleSendEmail = async () => {
    try {
      setSendingEmail(true);
      const instance = getEditorInstance();
      const blob = await instance.export({ triggerDownload: false });
      const reader = new FileReader();

      reader.onloadend = async () => {
        const base64 = reader.result.split(",")[1];
        const res = await fetch(
          "https://curki-test-prod-auhyhehcbvdmh3ef.canadacentral-01.azurewebsites.net/api/send-email",
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              documents: [{ filename: fileName, base64: base64 }],
              userEmail,
              staffEmail: staffEmail?.trim() || undefined,
              staffName: staffName?.trim() || undefined
            })
          }
        );

        if (!res.ok) throw new Error("Email failed");
        alert("Email sent successfully");
        setShowEmailDialog(false);
      };
      reader.readAsDataURL(blob);
    } catch (error) {
      console.error(error);
      alert("Email failed");
    } finally {
      setSendingEmail(false);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      const instance = getEditorInstance();
      const blob = await instance.export({ triggerDownload: false });
      const updatedFile = new File([blob], fileName, {
        type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
      });
      updateParentFile(updatedFile);
      alert("Document saved successfully");
      setReloadKey(prev => prev + 1);
    } catch (error) {
      console.error("Save failed:", error);
      alert("Save failed. Check browser console.");
    } finally {
      setSaving(false);
    }
  };

  const handleDownload = async () => {
    try {
      const instance = getEditorInstance();
      const blob = await instance.export({ triggerDownload: false });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Download failed:", error);
      alert("Download failed");
    }
  };

  const handleReload = () => {
    setReloadKey(prev => prev + 1);
    setLoading(true);
  };

  if (!isOpen || !doc) return null;

  return (
    <div className="file-preview-overlay">
      <div className="file-preview-modal" onClick={(e) => e.stopPropagation()}>
        <div className="file-preview-header">
          <div className="file-preview-title">{fileName}</div>
          <div className="file-preview-actions">
            <button className="file-preview-icon-btn" onClick={handleReload} title="Reload">
              <FiRefreshCw />
            </button>
            <button className="file-preview-icon-btn" onClick={handleDownload} title="Download">
              <FiDownload />
            </button>
            <button className="file-preview-icon-btn" onClick={() => setShowEmailDialog(true)} title="Send Email">
              <FiMail />
            </button>
            <button className="file-preview-save-btn" onClick={handleSave} disabled={saving}>
              <FiSave />
              {saving ? "Saving..." : "Save"}
            </button>
            <button className="file-preview-close-btn" onClick={onClose} title="Close">
              <FiX />
            </button>
          </div>
        </div>

        <div className="file-preview-body">
          {loading && (
            <div className="file-preview-loader">
              <div className="file-preview-loader-box">
                <div className="file-preview-loader-spinner"></div>
                <div className="file-preview-loader-title">Opening document...</div>
                <div className="file-preview-loader-subtitle">
                  Please wait while the editor loads
                </div>
              </div>
            </div>
          )}

          {/* Simple structure like documentation */}
          <div id="superdoc-toolbar" className="superdoc-toolbar" ref={toolbarRef} />
          <div id="superdoc-container" className="superdoc-container" ref={containerRef} />
        </div>
      </div>

      {showEmailDialog && (
        <div className="file-preview-dialog-overlay">
          <div className="file-preview-dialog-box">
            <div className="file-preview-dialog-title">Send Email?</div>
            <div className="file-preview-dialog-message">
              Do you want to send this document by email?
            </div>
            <div className="file-preview-dialog-actions">
              <button className="file-preview-yes-btn" onClick={handleSendEmail} disabled={sendingEmail}>
                {sendingEmail ? "Sending..." : "Yes, Send"}
              </button>
              <button className="file-preview-no-btn" onClick={() => setShowEmailDialog(false)}>
                No
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FilePreviewModal;