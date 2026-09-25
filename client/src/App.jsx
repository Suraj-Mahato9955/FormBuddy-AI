import { useEffect, useRef, useState } from "react";

import {
  Upload,
  FileText,
  X,
  Sparkles,
  FileCheck,
  AlertTriangle,
  Lightbulb,
  User,
  RefreshCw,
  Moon,
  Sun,
  CheckCircle2,
  ClipboardCheck,
  Languages,
  Download,
  History,
  Trash2,
  Eye,
  Clock,
} from "lucide-react";

import { jsPDF } from "jspdf";

import "./App.css";

function App() {
  const [file, setFile] = useState(null);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [isUploading, setIsUploading] = useState(false);

  const [analysis, setAnalysis] = useState(null);

  const [darkMode, setDarkMode] = useState(false);

  const [language, setLanguage] =
    useState("english");

  const [completedItems, setCompletedItems] =
    useState({});

  const [isDownloading, setIsDownloading] =
    useState(false);

  const [history, setHistory] = useState([]);

  const [showHistory, setShowHistory] =
    useState(false);

  const fileInputRef = useRef(null);

  const allowedTypes = [
    "application/pdf",
    "image/jpeg",
    "image/png",
  ];

  /* =====================================================
     LOAD HISTORY FROM LOCAL STORAGE
  ===================================================== */

  useEffect(() => {
    try {
      const savedHistory =
        localStorage.getItem(
          "formbuddy-history"
        );

      if (savedHistory) {
        setHistory(
          JSON.parse(savedHistory)
        );
      }
    } catch (error) {
      console.error(
        "Unable to load history:",
        error
      );
    }
  }, []);

  /* =====================================================
     SAVE HISTORY TO LOCAL STORAGE
  ===================================================== */

  useEffect(() => {
    try {
      localStorage.setItem(
        "formbuddy-history",
        JSON.stringify(history)
      );
    } catch (error) {
      console.error(
        "Unable to save history:",
        error
      );
    }
  }, [history]);

  /* =====================================================
     FILE CHANGE
  ===================================================== */

  const handleFileChange = (event) => {
    const selectedFile =
      event.target.files[0];

    if (!selectedFile) return;

    setError("");
    setMessage("");
    setAnalysis(null);
    setCompletedItems({});
    setLanguage("english");

    if (
      !allowedTypes.includes(
        selectedFile.type
      )
    ) {
      setError(
        "Please upload a PDF, JPG, or PNG file."
      );

      event.target.value = "";
      return;
    }

    if (
      selectedFile.size >
      10 * 1024 * 1024
    ) {
      setError(
        "File size must be less than 10 MB."
      );

      event.target.value = "";
      return;
    }

    setFile(selectedFile);
  };

  /* =====================================================
     REMOVE FILE
  ===================================================== */

  const handleRemoveFile = () => {
    setFile(null);
    setError("");
    setMessage("");
    setAnalysis(null);
    setCompletedItems({});
    setLanguage("english");

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  /* =====================================================
     UPLOAD + ANALYZE
  ===================================================== */

  const handleUpload = async () => {
    if (!file) {
      setError(
        "Please select a form first."
      );
      return;
    }

    setIsUploading(true);
    setError("");
    setMessage("");
    setAnalysis(null);
    setCompletedItems({});

    const formData = new FormData();

    formData.append("form", file);

    try {
      const response = await fetch(
        "http://localhost:5000/api/analyze",
        {
          method: "POST",
          body: formData,
        }
      );

      const data =
        await response.json();

      if (!response.ok) {
        throw new Error(
          data.message ||
            "Form analysis failed."
        );
      }

      const newAnalysis =
        data.analysis;

      setAnalysis(newAnalysis);

      setMessage(
        "Form analyzed successfully!"
      );

      /* =================================================
         SAVE NEW ANALYSIS TO HISTORY
      ================================================= */

      const historyItem = {
        id: Date.now(),
        fileName: file.name,
        createdAt:
          new Date().toISOString(),
        analysis: newAnalysis,
        language: "english",
        completedItems: {},
        progress: 0,
      };

      setHistory(
        (previousHistory) => [
          historyItem,
          ...previousHistory,
        ]
      );
    } catch (error) {
      setError(
        error.message ||
          "Unable to connect to FormBuddy server."
      );
    } finally {
      setIsUploading(false);
    }
  };

  /* =====================================================
     ANALYZE ANOTHER
  ===================================================== */

  const handleAnalyzeAnother = () => {
    setFile(null);
    setError("");
    setMessage("");
    setAnalysis(null);
    setCompletedItems({});
    setLanguage("english");

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  /* =====================================================
     FILE SIZE
  ===================================================== */

  const formatFileSize = (bytes) => {
    if (bytes < 1024) {
      return `${bytes} Bytes`;
    }

    if (bytes < 1024 * 1024) {
      return `${(
        bytes / 1024
      ).toFixed(1)} KB`;
    }

    return `${(
      bytes /
      (1024 * 1024)
    ).toFixed(1)} MB`;
  };

  /* =====================================================
     CHECKLIST
  ===================================================== */

  const checklistItems = [
    {
      id: "fields",
      title: "Complete Form Fields",
      description:
        "Review and complete all important fields.",
    },

    {
      id: "documents",
      title: "Prepare Required Documents",
      description:
        "Keep all required documents ready.",
    },

    {
      id: "mistakes",
      title: "Check for Mistakes",
      description:
        "Review possible mistakes before submitting.",
    },

    {
      id: "notes",
      title: "Read Important Notes",
      description:
        "Check deadlines, instructions and declarations.",
    },
  ];

  const toggleChecklistItem = (id) => {
    setCompletedItems(
      (previous) => {
        const updated = {
          ...previous,
          [id]: !previous[id],
        };

        /*
          Update currently opened history item
        */
        if (analysis) {
          setHistory(
            (previousHistory) =>
              previousHistory.map(
                (item) =>
                  item.analysis === analysis
                    ? {
                        ...item,
                        completedItems:
                          updated,
                        progress:
                          Math.round(
                            (checklistItems.filter(
                              (checkItem) =>
                                updated[
                                  checkItem.id
                                ]
                            ).length /
                              checklistItems.length) *
                              100
                          ),
                      }
                    : item
              )
          );
        }

        return updated;
      }
    );
  };

  const completedCount =
    checklistItems.filter(
      (item) =>
        completedItems[item.id]
    ).length;

  const progress = Math.round(
    (completedCount /
      checklistItems.length) *
      100
  );

  /* =====================================================
     LANGUAGE
  ===================================================== */

  const isHinglish =
    language === "hinglish";

  const getText = (
    english,
    hinglish
  ) => {
    if (
      isHinglish &&
      hinglish
    ) {
      return hinglish;
    }

    return english;
  };

  /* =====================================================
     OPEN HISTORY
  ===================================================== */

  const handleOpenHistory = (item) => {
    setAnalysis(item.analysis);

    setFile(null);

    setCompletedItems(
      item.completedItems || {}
    );

    setLanguage(
      item.language || "english"
    );

    setError("");

    setMessage(
      "Previous form analysis opened."
    );

    setShowHistory(false);

    setTimeout(() => {
      document
        .querySelector(
          ".analysis-section"
        )
        ?.scrollIntoView({
          behavior: "smooth",
        });
    }, 100);
  };

  /* =====================================================
     DELETE HISTORY ITEM
  ===================================================== */

  const handleDeleteHistory = (id) => {
    setHistory(
      (previousHistory) =>
        previousHistory.filter(
          (item) =>
            item.id !== id
        )
    );

    setMessage(
      "History item deleted."
    );
  };

  /* =====================================================
     CLEAR HISTORY
  ===================================================== */

  const handleClearHistory = () => {
    if (history.length === 0) {
      return;
    }

    const confirmed =
      window.confirm(
        "Are you sure you want to delete all FormBuddy history?"
      );

    if (!confirmed) {
      return;
    }

    setHistory([]);

    setMessage(
      "All form history cleared."
    );
  };

  /* =====================================================
     FORMAT HISTORY DATE
  ===================================================== */

  const formatHistoryDate = (
    date
  ) => {
    try {
      return new Date(
        date
      ).toLocaleString();
    } catch {
      return "Unknown date";
    }
  };

  /* =====================================================
     PDF HELPER
  ===================================================== */

  const addWrappedText = (
    doc,
    text,
    x,
    y,
    maxWidth,
    lineHeight = 6
  ) => {
    const safeText =
      text || "Not specified.";

    const lines =
      doc.splitTextToSize(
        String(safeText),
        maxWidth
      );

    for (
      let i = 0;
      i < lines.length;
      i++
    ) {
      if (y > 275) {
        doc.addPage();
        y = 20;
      }

      doc.text(
        lines[i],
        x,
        y
      );

      y += lineHeight;
    }

    return y;
  };

  /* =====================================================
     PDF SECTION TITLE
  ===================================================== */

  const addSectionTitle = (
    doc,
    title,
    y
  ) => {
    if (y > 265) {
      doc.addPage();
      y = 20;
    }

    doc.setFont(
      "helvetica",
      "bold"
    );

    doc.setFontSize(15);

    doc.text(
      title,
      15,
      y
    );

    return y + 9;
  };

  /* =====================================================
     DOWNLOAD PDF
  ===================================================== */

  const handleDownloadPDF = () => {
    if (!analysis) {
      setError(
        "Please analyze a form before downloading."
      );

      return;
    }

    try {
      setIsDownloading(true);
      setError("");

      const doc =
        new jsPDF();

      const pageWidth =
        doc.internal.pageSize.getWidth();

      const margin = 15;

      const contentWidth =
        pageWidth -
        margin * 2;

      let y = 20;

      /* TITLE */

      doc.setFont(
        "helvetica",
        "bold"
      );

      doc.setFontSize(24);

      doc.text(
        "FormBuddy AI",
        margin,
        y
      );

      y += 9;

      doc.setFontSize(17);

      doc.text(
        "Form Analysis Report",
        margin,
        y
      );

      y += 9;

      doc.setFont(
        "helvetica",
        "normal"
      );

      doc.setFontSize(10);

      doc.text(
        `Language: ${
          isHinglish
            ? "Hinglish"
            : "English"
        }`,
        margin,
        y
      );

      y += 6;

      if (file) {
        doc.text(
          `File: ${file.name}`,
          margin,
          y
        );

        y += 6;
      } else {
        const historyFile =
          history.find(
            (item) =>
              item.analysis ===
              analysis
          );

        if (historyFile) {
          doc.text(
            `File: ${historyFile.fileName}`,
            margin,
            y
          );

          y += 6;
        }
      }

      doc.text(
        `Generated: ${new Date().toLocaleString()}`,
        margin,
        y
      );

      y += 12;

      /* PURPOSE */

      y =
        addSectionTitle(
          doc,
          "1. What is this form for?",
          y
        );

      doc.setFont(
        "helvetica",
        "normal"
      );

      doc.setFontSize(11);

      y = addWrappedText(
        doc,
        getText(
          analysis.formPurpose,
          analysis.formPurposeHinglish
        ),
        margin,
        y,
        contentWidth
      );

      y += 7;

      /* WHO NEEDS IT */

      y =
        addSectionTitle(
          doc,
          "2. Who needs this form?",
          y
        );

      doc.setFont(
        "helvetica",
        "normal"
      );

      doc.setFontSize(11);

      y = addWrappedText(
        doc,
        getText(
          analysis.whoNeedsIt,
          analysis.whoNeedsItHinglish
        ),
        margin,
        y,
        contentWidth
      );

      y += 7;

      /* FIELDS */

      y =
        addSectionTitle(
          doc,
          "3. Form Fields",
          y
        );

      if (
        analysis.fields &&
        analysis.fields.length > 0
      ) {
        analysis.fields.forEach(
          (field, index) => {
            if (y > 250) {
              doc.addPage();
              y = 20;
            }

            doc.setFont(
              "helvetica",
              "bold"
            );

            doc.setFontSize(12);

            y = addWrappedText(
              doc,
              `${index + 1}. ${field.fieldName}`,
              margin,
              y,
              contentWidth
            );

            doc.setFontSize(10);

            y = addWrappedText(
              doc,
              isHinglish
                ? "Iska kya matlab hai?"
                : "What does it mean?",
              margin + 5,
              y,
              contentWidth - 5
            );

            doc.setFont(
              "helvetica",
              "normal"
            );

            y = addWrappedText(
              doc,
              getText(
                field.explanation,
                field.hinglishExplanation
              ),
              margin + 5,
              y,
              contentWidth - 5
            );

            y += 2;

            doc.setFont(
              "helvetica",
              "bold"
            );

            y = addWrappedText(
              doc,
              isHinglish
                ? "Kya enter karein?"
                : "What should I enter?",
              margin + 5,
              y,
              contentWidth - 5
            );

            doc.setFont(
              "helvetica",
              "normal"
            );

            y = addWrappedText(
              doc,
              getText(
                field.whatToEnter,
                field.hinglishWhatToEnter
              ),
              margin + 5,
              y,
              contentWidth - 5
            );

            y += 7;
          }
        );
      }

      /* DOCUMENTS */

      y =
        addSectionTitle(
          doc,
          "4. Required Documents",
          y
        );

      if (
        analysis.documents &&
        analysis.documents.length > 0
      ) {
        analysis.documents.forEach(
          (
            document,
            index
          ) => {
            const text =
              isHinglish
                ? analysis
                    .documentsHinglish?.[
                    index
                  ] || document
                : document;

            doc.setFont(
              "helvetica",
              "normal"
            );

            doc.setFontSize(11);

            y = addWrappedText(
              doc,
              `• ${text}`,
              margin,
              y,
              contentWidth
            );

            y += 1;
          }
        );
      } else {
        y = addWrappedText(
          doc,
          "No specific documents identified.",
          margin,
          y,
          contentWidth
        );
      }

      y += 7;

      /* MISTAKES */

      y =
        addSectionTitle(
          doc,
          "5. Common Mistakes",
          y
        );

      if (
        analysis.mistakes &&
        analysis.mistakes.length > 0
      ) {
        analysis.mistakes.forEach(
          (
            mistake,
            index
          ) => {
            const text =
              isHinglish
                ? analysis
                    .mistakesHinglish?.[
                    index
                  ] || mistake
                : mistake;

            y = addWrappedText(
              doc,
              `• ${text}`,
              margin,
              y,
              contentWidth
            );

            y += 1;
          }
        );
      } else {
        y = addWrappedText(
          doc,
          "No specific mistakes identified.",
          margin,
          y,
          contentWidth
        );
      }

      y += 7;

      /* NOTES */

      y =
        addSectionTitle(
          doc,
          "6. Important Notes",
          y
        );

      if (
        analysis.importantNotes &&
        analysis.importantNotes
          .length > 0
      ) {
        analysis.importantNotes.forEach(
          (
            note,
            index
          ) => {
            const text =
              isHinglish
                ? analysis
                    .importantNotesHinglish?.[
                    index
                  ] || note
                : note;

            y = addWrappedText(
              doc,
              `• ${text}`,
              margin,
              y,
              contentWidth
            );

            y += 1;
          }
        );
      } else {
        y = addWrappedText(
          doc,
          "No additional notes.",
          margin,
          y,
          contentWidth
        );
      }

      y += 8;

      /* CHECKLIST */

      y =
        addSectionTitle(
          doc,
          "7. Form Completion Checklist",
          y
        );

      doc.setFont(
        "helvetica",
        "normal"
      );

      doc.setFontSize(11);

      y = addWrappedText(
        doc,
        `Progress: ${progress}% (${completedCount}/${checklistItems.length} completed)`,
        margin,
        y,
        contentWidth
      );

      y += 3;

      checklistItems.forEach(
        (item) => {
          const status =
            completedItems[
              item.id
            ]
              ? "[DONE]"
              : "[ ]";

          y = addWrappedText(
            doc,
            `${status} ${item.title}`,
            margin,
            y,
            contentWidth
          );

          y = addWrappedText(
            doc,
            item.description,
            margin + 8,
            y,
            contentWidth - 8
          );

          y += 2;
        }
      );

      /* FOOTER */

      const totalPages =
        doc.internal.getNumberOfPages();

      for (
        let page = 1;
        page <= totalPages;
        page++
      ) {
        doc.setPage(page);

        const pageHeight =
          doc.internal.pageSize.getHeight();

        doc.setFontSize(8);

        doc.setFont(
          "helvetica",
          "normal"
        );

        doc.text(
          `FormBuddy AI • Page ${page} of ${totalPages}`,
          margin,
          pageHeight - 10
        );
      }

      /* FILE NAME */

      let pdfFileName =
        "form-analysis";

      if (file) {
        pdfFileName =
          file.name
            .replace(
              /\.[^/.]+$/,
              ""
            )
            .replace(
              /[^a-z0-9]/gi,
              "-"
            )
            .toLowerCase();
      } else {
        const historyFile =
          history.find(
            (item) =>
              item.analysis ===
              analysis
          );

        if (historyFile) {
          pdfFileName =
            historyFile.fileName
              .replace(
                /\.[^/.]+$/,
                ""
              )
              .replace(
                /[^a-z0-9]/gi,
                "-"
              )
              .toLowerCase();
        }
      }

      doc.save(
        `FormBuddy-${pdfFileName}-Analysis.pdf`
      );

      setMessage(
        "Analysis PDF downloaded successfully!"
      );
    } catch (error) {
      console.error(
        "PDF generation error:",
        error
      );

      setError(
        "Unable to generate the PDF. Please try again."
      );
    } finally {
      setIsDownloading(false);
    }
  };

  /* =====================================================
     RETURN UI
  ===================================================== */

  return (
    <div
      className={`app ${
        darkMode ? "dark" : ""
      }`}
    >
      {/* =================================================
          NAVBAR
      ================================================= */}

      <nav className="navbar">
        <div className="brand">
          <div className="brand-icon">
            <Sparkles size={20} />
          </div>

          <div>
            <h2>FormBuddy</h2>

            <span>
              AI Form Assistant
            </span>
          </div>
        </div>

        <div className="nav-right">
          <div className="nav-links">
            <a href="#how-it-works">
              How it works
            </a>

            <a href="#features">
              Features
            </a>

            <button
              className="history-nav-button"
              onClick={() =>
                setShowHistory(
                  !showHistory
                )
              }
            >
              <History size={17} />

              History

              {history.length >
                0 && (
                <span className="history-count">
                  {history.length}
                </span>
              )}
            </button>
          </div>

          <button
            className="theme-button"
            onClick={() =>
              setDarkMode(
                !darkMode
              )
            }
            aria-label="Toggle theme"
          >
            {darkMode ? (
              <Sun size={19} />
            ) : (
              <Moon size={19} />
            )}
          </button>
        </div>
      </nav>

      {/* =================================================
          HISTORY PANEL
      ================================================= */}

      {showHistory && (
        <section className="history-section">
          <div className="history-container">

            <div className="history-header">
              <div>
                <div className="analysis-label">
                  <History size={16} />

                  Form History
                </div>

                <h2>
                  Your Previous Forms
                </h2>

                <p>
                  Previously analyzed
                  forms are stored
                  locally on this
                  device.
                </p>
              </div>

              {history.length >
                0 && (
                <button
                  className="secondary-button"
                  onClick={
                    handleClearHistory
                  }
                >
                  <Trash2 size={17} />

                  Clear All
                </button>
              )}
            </div>

            {history.length ===
            0 ? (
              <div className="empty-history">
                <div className="empty-history-icon">
                  <History
                    size={32}
                  />
                </div>

                <h3>
                  No form history yet
                </h3>

                <p>
                  Analyze your first
                  form and it will
                  appear here.
                </p>
              </div>
            ) : (
              <div className="history-list">
                {history.map(
                  (item) => (
                    <div
                      className="history-item"
                      key={item.id}
                    >
                      <div className="history-file-icon">
                        <FileText
                          size={24}
                        />
                      </div>

                      <div className="history-info">
                        <h3>
                          {
                            item.fileName
                          }
                        </h3>

                        <div className="history-meta">
                          <span>
                            <Clock
                              size={14}
                            />

                            {formatHistoryDate(
                              item.createdAt
                            )}
                          </span>

                          <span>
                            <ClipboardCheck
                              size={14}
                            />

                            {
                              item.progress
                            }%
                            completed
                          </span>
                        </div>
                      </div>

                      <div className="history-actions">
                        <button
                          className="secondary-button"
                          onClick={() =>
                            handleOpenHistory(
                              item
                            )
                          }
                        >
                          <Eye
                            size={16}
                          />

                          Open
                        </button>

                        <button
                          className="history-delete-button"
                          onClick={() =>
                            handleDeleteHistory(
                              item.id
                            )
                          }
                          aria-label="Delete history"
                        >
                          <Trash2
                            size={17}
                          />
                        </button>
                      </div>
                    </div>
                  )
                )}
              </div>
            )}

          </div>
        </section>
      )}

      {/* =================================================
          HERO
      ================================================= */}

      <main className="hero">
        <div className="hero-content">

          <div className="badge">
            <Sparkles size={15} />

            AI-Powered Form Assistant
          </div>

          <h1>
            Understand Any Form.
            <br />

            <span>
              Complete It With
              Confidence.
            </span>
          </h1>

          <p className="description">
            Upload a complex form and
            FormBuddy AI will explain
            every important field in
            simple language.
          </p>

          <div className="upload-box">
            {!file ? (
              <>
                <div className="upload-icon">
                  <Upload size={30} />
                </div>

                <h3>
                  Upload your form
                </h3>

                <p>
                  Drop your PDF or
                  image here, or choose
                  a file
                </p>

                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf,.jpg,.jpeg,.png"
                  onChange={
                    handleFileChange
                  }
                  hidden
                />

                <button
                  className="primary-button"
                  onClick={() =>
                    fileInputRef.current?.click()
                  }
                >
                  <Upload size={18} />

                  Choose Form
                </button>

                <small>
                  PDF, JPG or PNG •
                  Maximum 10 MB
                </small>
              </>
            ) : (
              <>
                <div className="selected-file-icon">
                  <FileText
                    size={34}
                  />
                </div>

                <h3 className="file-name">
                  {file.name}
                </h3>

                <p>
                  {formatFileSize(
                    file.size
                  )}
                </p>

                <div className="file-actions">
                  <button
                    className="primary-button"
                    onClick={
                      handleUpload
                    }
                    disabled={
                      isUploading
                    }
                  >
                    {isUploading ? (
                      <>
                        <RefreshCw
                          size={18}
                          className="spin"
                        />

                        Analyzing...
                      </>
                    ) : (
                      <>
                        <Sparkles
                          size={18}
                        />

                        Analyze Form
                      </>
                    )}
                  </button>

                  <button
                    className="secondary-button"
                    onClick={
                      handleRemoveFile
                    }
                    disabled={
                      isUploading
                    }
                  >
                    <X size={18} />

                    Remove
                  </button>
                </div>
              </>
            )}

            {error && (
              <p className="error-message">
                <AlertTriangle
                  size={16}
                />

                {error}
              </p>
            )}

            {message && (
              <p className="success-message">
                <CheckCircle2
                  size={16}
                />

                {message}
              </p>
            )}
          </div>

          <div className="privacy-note">
            🔒 Your uploaded document is
            processed for analysis.
          </div>
        </div>
      </main>

      {/* =================================================
          HOW IT WORKS
      ================================================= */}

      <section
        className="how-section"
        id="how-it-works"
      >
        <div className="section-heading">
          <span>
            Simple process
          </span>

          <h2>
            How FormBuddy works
          </h2>

          <p>
            No complicated
            instructions. Just upload
            and understand.
          </p>
        </div>

        <div className="steps">

          <div className="step">
            <div className="step-number">
              1
            </div>

            <Upload size={25} />

            <h3>
              Upload
            </h3>

            <p>
              Upload your PDF or
              image of the form.
            </p>
          </div>

          <div className="step">
            <div className="step-number">
              2
            </div>

            <Sparkles size={25} />

            <h3>
              AI Analysis
            </h3>

            <p>
              FormBuddy reads and
              understands the form.
            </p>
          </div>

          <div className="step">
            <div className="step-number">
              3
            </div>

            <CheckCircle2
              size={25}
            />

            <h3>
              Understand
            </h3>

            <p>
              Get simple explanations
              and useful guidance.
            </p>
          </div>

        </div>
      </section>

      {/* =================================================
          ANALYSIS
      ================================================= */}

      {analysis && (
        <section className="analysis-section">
          <div className="analysis-container">

            {/* TOP */}

            <div className="analysis-top">
              <div>
                <div className="analysis-label">
                  <Sparkles size={16} />

                  AI Analysis Complete
                </div>

                <h2>
                  Your Form Breakdown
                </h2>

                <p>
                  FormBuddy has analyzed
                  your document and
                  simplified the important
                  information.
                </p>
              </div>

              <div
                style={{
                  display: "flex",
                  gap: "10px",
                  flexWrap: "wrap",
                }}
              >
                <button
                  className="primary-button"
                  onClick={
                    handleDownloadPDF
                  }
                  disabled={
                    isDownloading
                  }
                >
                  {isDownloading ? (
                    <>
                      <RefreshCw
                        size={17}
                        className="spin"
                      />

                      Creating PDF...
                    </>
                  ) : (
                    <>
                      <Download
                        size={17}
                      />

                      Download
                      Analysis
                    </>
                  )}
                </button>

                <button
                  className="secondary-button"
                  onClick={
                    handleAnalyzeAnother
                  }
                >
                  <RefreshCw
                    size={17}
                  />

                  Analyze Another
                </button>
              </div>
            </div>

            {/* LANGUAGE */}

            <div
              className="language-switch"
              style={{
                display: "flex",
                alignItems:
                  "center",
                justifyContent:
                  "space-between",
                gap: "15px",
                padding:
                  "14px 18px",
                marginBottom:
                  "20px",
                borderRadius:
                  "14px",
                border:
                  "1px solid #e5e7eb",
                background:
                  darkMode
                    ? "#151922"
                    : "#ffffff",
              }}
            >
              <div
                style={{
                  display:
                    "flex",
                  alignItems:
                    "center",
                  gap: "10px",
                }}
              >
                <Languages
                  size={20}
                />

                <div>
                  <strong>
                    Explanation
                    Language
                  </strong>

                  <div
                    style={{
                      fontSize:
                        "13px",
                      color:
                        "#6b7280",
                      marginTop:
                        "3px",
                    }}
                  >
                    Choose how
                    FormBuddy
                    explains the
                    form.
                  </div>
                </div>
              </div>

              <div
                style={{
                  display:
                    "flex",
                  gap: "6px",
                  padding: "4px",
                  borderRadius:
                    "10px",
                  background:
                    darkMode
                      ? "#252b38"
                      : "#f1f5f9",
                }}
              >
                <button
                  onClick={() =>
                    setLanguage(
                      "english"
                    )
                  }
                  style={{
                    border: "none",
                    cursor:
                      "pointer",
                    padding:
                      "8px 14px",
                    borderRadius:
                      "7px",
                    fontWeight:
                      "600",
                    background:
                      !isHinglish
                        ? "#6366f1"
                        : "transparent",
                    color:
                      !isHinglish
                        ? "#ffffff"
                        : darkMode
                        ? "#ffffff"
                        : "#374151",
                  }}
                >
                  🇬🇧 English
                </button>

                <button
                  onClick={() =>
                    setLanguage(
                      "hinglish"
                    )
                  }
                  style={{
                    border: "none",
                    cursor:
                      "pointer",
                    padding:
                      "8px 14px",
                    borderRadius:
                      "7px",
                    fontWeight:
                      "600",
                    background:
                      isHinglish
                        ? "#6366f1"
                        : "transparent",
                    color:
                      isHinglish
                        ? "#ffffff"
                        : darkMode
                        ? "#ffffff"
                        : "#374151",
                  }}
                >
                  🇮🇳 Hinglish
                </button>
              </div>
            </div>

            {/* CHECKLIST */}

            <div className="checklist-card">
              <div className="checklist-header">
                <div>
                  <div className="checklist-title">
                    <ClipboardCheck
                      size={20}
                    />

                    Form Completion
                    Checklist
                  </div>

                  <p>
                    {completedCount} of{" "}
                    {
                      checklistItems.length
                    }{" "}
                    completed
                  </p>
                </div>

                <strong>
                  {progress}%
                </strong>
              </div>

              <div className="progress-bar">
                <div
                  className="progress-fill"
                  style={{
                    width: `${progress}%`,
                  }}
                />
              </div>

              <div className="checklist-items">
                {checklistItems.map(
                  (item) => (
                    <label
                      key={
                        item.id
                      }
                      className={
                        completedItems[
                          item.id
                        ]
                          ? "checklist-item completed"
                          : "checklist-item"
                      }
                    >
                      <input
                        type="checkbox"
                        checked={
                          !!completedItems[
                            item.id
                          ]
                        }
                        onChange={() =>
                          toggleChecklistItem(
                            item.id
                          )
                        }
                      />

                      <span className="check-box">
                        {completedItems[
                          item.id
                        ] && (
                          <CheckCircle2
                            size={16}
                          />
                        )}
                      </span>

                      <div>
                        <strong>
                          {
                            item.title
                          }
                        </strong>

                        <p>
                          {
                            item.description
                          }
                        </p>
                      </div>
                    </label>
                  )
                )}
              </div>

              {progress ===
                100 && (
                <div className="checklist-success">
                  <CheckCircle2
                    size={18}
                  />

                  Your form is
                  ready for
                  final review!
                </div>
              )}
            </div>

            {/* SUMMARY */}

            <div className="summary-grid">

              <div className="analysis-card">
                <div className="card-icon blue">
                  <FileCheck
                    size={22}
                  />
                </div>

                <h3>
                  What is this
                  form for?
                </h3>

                <p>
                  {getText(
                    analysis.formPurpose,
                    analysis.formPurposeHinglish
                  )}
                </p>
              </div>

              <div className="analysis-card">
                <div className="card-icon purple">
                  <User size={22} />
                </div>

                <h3>
                  Who needs this
                  form?
                </h3>

                <p>
                  {getText(
                    analysis.whoNeedsIt,
                    analysis.whoNeedsItHinglish
                  )}
                </p>
              </div>

            </div>

            {/* FIELDS */}

            <div className="analysis-card large-card">
              <div className="card-heading">

                <div className="card-icon green">
                  <FileText
                    size={22}
                  />
                </div>

                <div>
                  <h3>
                    Form Fields
                  </h3>

                  <p>
                    Understand what
                    each field means
                    and what you should
                    enter.
                  </p>
                </div>

              </div>

              <div className="fields-list">
                {analysis.fields?.map(
                  (
                    field,
                    index
                  ) => (
                    <div
                      className="field-item"
                      key={index}
                    >
                      <div className="field-number">
                        {index + 1}
                      </div>

                      <div className="field-content">

                        <h4>
                          {
                            field.fieldName
                          }
                        </h4>

                        <div className="field-answer">
                          <strong>
                            {isHinglish
                              ? "Iska kya matlab hai?"
                              : "What does it mean?"}
                          </strong>

                          <p>
                            {getText(
                              field.explanation,
                              field.hinglishExplanation
                            )}
                          </p>
                        </div>

                        <div className="field-answer">
                          <strong>
                            {isHinglish
                              ? "Kya enter karein?"
                              : "What should I enter?"}
                          </strong>

                          <p>
                            {getText(
                              field.whatToEnter,
                              field.hinglishWhatToEnter
                            )}
                          </p>
                        </div>

                      </div>
                    </div>
                  )
                )}
              </div>
            </div>

            {/* DOCUMENTS + MISTAKES */}

            <div className="two-column">

              <div className="analysis-card">
                <div className="card-heading">

                  <div className="card-icon orange">
                    <FileCheck
                      size={22}
                    />
                  </div>

                  <div>
                    <h3>
                      Required
                      Documents
                    </h3>

                    <p>
                      Keep these ready
                      before applying.
                    </p>
                  </div>

                </div>

                {analysis.documents
                  ?.length > 0 ? (
                  <ul className="check-list">
                    {analysis.documents.map(
                      (
                        document,
                        index
                      ) => (
                        <li
                          key={
                            index
                          }
                        >
                          <CheckCircle2
                            size={17}
                          />

                          <span>
                            {isHinglish
                              ? analysis
                                  .documentsHinglish?.[
                                  index
                                ] ||
                                document
                              : document}
                          </span>
                        </li>
                      )
                    )}
                  </ul>
                ) : (
                  <p>
                    No specific
                    documents
                    identified.
                  </p>
                )}
              </div>

              <div className="analysis-card">
                <div className="card-heading">

                  <div className="card-icon red">
                    <AlertTriangle
                      size={22}
                    />
                  </div>

                  <div>
                    <h3>
                      Common
                      Mistakes
                    </h3>

                    <p>
                      Things to check
                      before submitting.
                    </p>
                  </div>

                </div>

                {analysis.mistakes
                  ?.length > 0 ? (
                  <ul className="warning-list">
                    {analysis.mistakes.map(
                      (
                        mistake,
                        index
                      ) => (
                        <li
                          key={
                            index
                          }
                        >
                          <AlertTriangle
                            size={17}
                          />

                          <span>
                            {isHinglish
                              ? analysis
                                  .mistakesHinglish?.[
                                  index
                                ] ||
                                mistake
                              : mistake}
                          </span>
                        </li>
                      )
                    )}
                  </ul>
                ) : (
                  <p>
                    No specific
                    mistakes
                    identified.
                  </p>
                )}
              </div>

            </div>

            {/* NOTES */}

            <div className="analysis-card notes-card">

              <div className="card-heading">

                <div className="card-icon yellow">
                  <Lightbulb
                    size={22}
                  />
                </div>

                <div>
                  <h3>
                    Important
                    Notes
                  </h3>

                  <p>
                    Extra information
                    you should know.
                  </p>
                </div>

              </div>

              {analysis
                .importantNotes
                ?.length > 0 ? (
                <ul className="notes-list">
                  {analysis.importantNotes.map(
                    (
                      note,
                      index
                    ) => (
                      <li
                        key={
                          index
                        }
                      >
                        {isHinglish
                          ? analysis
                              .importantNotesHinglish?.[
                              index
                            ] ||
                            note
                          : note}
                      </li>
                    )
                  )}
                </ul>
              ) : (
                <p>
                  No additional
                  notes.
                </p>
              )}

            </div>

          </div>
        </section>
      )}

      {/* =================================================
          FEATURES
      ================================================= */}

      <section
        className="features"
        id="features"
      >
        <div className="section-heading">

          <span>
            Built for real-world
            forms
          </span>

          <h2>
            Everything you need to
            understand a form
          </h2>

          <p>
            FormBuddy turns confusing
            paperwork into simple,
            understandable information.
          </p>

        </div>

        <div className="feature-container">

          <div className="feature-card">
            <div className="feature-icon">
              <Lightbulb
                size={24}
              />
            </div>

            <h3>
              Simple Explanations
            </h3>

            <p>
              Understand complicated
              fields without confusing
              technical language.
            </p>
          </div>

          <div className="feature-card">
            <div className="feature-icon">
              <FileCheck
                size={24}
              />
            </div>

            <h3>
              Document Checklist
            </h3>

            <p>
              Know which documents you
              should keep ready before
              submitting your form.
            </p>
          </div>

          <div className="feature-card">
            <div className="feature-icon">
              <AlertTriangle
                size={24}
              />
            </div>

            <h3>
              Mistake Detection
            </h3>

            <p>
              Identify possible mistakes
              and important instructions
              before submission.
            </p>
          </div>

        </div>
      </section>

      {/* =================================================
          FOOTER
      ================================================= */}

      <footer>

        <div className="footer-brand">
          <Sparkles size={18} />

          <strong>
            FormBuddy AI
          </strong>
        </div>

        <p>
          Making complicated forms
          easier to understand.
        </p>

      </footer>
    </div>
  );
}

export default App;
