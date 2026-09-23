import { useRef, useState } from "react";
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
} from "lucide-react";
import "./App.css";

function App() {
  const [file, setFile] = useState(null);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [analysis, setAnalysis] = useState(null);
  const [darkMode, setDarkMode] = useState(false);

  const [completedItems, setCompletedItems] = useState({});

  const fileInputRef = useRef(null);

  const allowedTypes = [
    "application/pdf",
    "image/jpeg",
    "image/png",
  ];

  const handleFileChange = (event) => {
    const selectedFile = event.target.files[0];

    if (!selectedFile) return;

    setError("");
    setMessage("");
    setAnalysis(null);
    setCompletedItems({});

    if (!allowedTypes.includes(selectedFile.type)) {
      setError("Please upload a PDF, JPG, or PNG file.");
      event.target.value = "";
      return;
    }

    if (selectedFile.size > 10 * 1024 * 1024) {
      setError("File size must be less than 10 MB.");
      event.target.value = "";
      return;
    }

    setFile(selectedFile);
  };

  const handleRemoveFile = () => {
    setFile(null);
    setError("");
    setMessage("");
    setAnalysis(null);
    setCompletedItems({});

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleUpload = async () => {
    if (!file) {
      setError("Please select a form first.");
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

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || "Form analysis failed."
        );
      }

      setAnalysis(data.analysis);
      setMessage("Form analyzed successfully!");
    } catch (error) {
      setError(
        error.message ||
          "Unable to connect to FormBuddy server."
      );
    } finally {
      setIsUploading(false);
    }
  };

  const handleAnalyzeAnother = () => {
    setFile(null);
    setError("");
    setMessage("");
    setAnalysis(null);
    setCompletedItems({});

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  const formatFileSize = (bytes) => {
    if (bytes < 1024) {
      return `${bytes} Bytes`;
    }

    if (bytes < 1024 * 1024) {
      return `${(bytes / 1024).toFixed(1)} KB`;
    }

    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  /* ================================
     SMART CHECKLIST
  ================================= */

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
    setCompletedItems((previous) => ({
      ...previous,
      [id]: !previous[id],
    }));
  };

  const completedCount = checklistItems.filter(
    (item) => completedItems[item.id]
  ).length;

  const progress = Math.round(
    (completedCount / checklistItems.length) * 100
  );

  return (
    <div className={`app ${darkMode ? "dark" : ""}`}>
      {/* ================================
          NAVBAR
      ================================= */}

      <nav className="navbar">
        <div className="brand">
          <div className="brand-icon">
            <Sparkles size={20} />
          </div>

          <div>
            <h2>FormBuddy</h2>
            <span>AI Form Assistant</span>
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
          </div>

          <button
            className="theme-button"
            onClick={() => setDarkMode(!darkMode)}
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

      {/* ================================
          HERO
      ================================= */}

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
              Complete It With Confidence.
            </span>
          </h1>

          <p className="description">
            Upload a complex form and FormBuddy AI will
            explain every important field in simple language.
          </p>

          {/* UPLOAD BOX */}

          <div className="upload-box">
            {!file ? (
              <>
                <div className="upload-icon">
                  <Upload size={30} />
                </div>

                <h3>Upload your form</h3>

                <p>
                  Drop your PDF or image here, or choose a file
                </p>

                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf,.jpg,.jpeg,.png"
                  onChange={handleFileChange}
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
                  PDF, JPG or PNG • Maximum 10 MB
                </small>
              </>
            ) : (
              <>
                <div className="selected-file-icon">
                  <FileText size={34} />
                </div>

                <h3 className="file-name">
                  {file.name}
                </h3>

                <p>
                  {formatFileSize(file.size)}
                </p>

                <div className="file-actions">
                  <button
                    className="primary-button"
                    onClick={handleUpload}
                    disabled={isUploading}
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
                        <Sparkles size={18} />
                        Analyze Form
                      </>
                    )}
                  </button>

                  <button
                    className="secondary-button"
                    onClick={handleRemoveFile}
                    disabled={isUploading}
                  >
                    <X size={18} />
                    Remove
                  </button>
                </div>
              </>
            )}

            {error && (
              <p className="error-message">
                <AlertTriangle size={16} />
                {error}
              </p>
            )}

            {message && (
              <p className="success-message">
                <CheckCircle2 size={16} />
                {message}
              </p>
            )}
          </div>

          <div className="privacy-note">
            🔒 Your uploaded document is processed securely.
          </div>
        </div>
      </main>

      {/* ================================
          HOW IT WORKS
      ================================= */}

      <section
        className="how-section"
        id="how-it-works"
      >
        <div className="section-heading">
          <span>Simple process</span>

          <h2>How FormBuddy works</h2>

          <p>
            No complicated instructions. Just upload and
            understand.
          </p>
        </div>

        <div className="steps">
          <div className="step">
            <div className="step-number">1</div>

            <Upload size={25} />

            <h3>Upload</h3>

            <p>
              Upload your PDF or image of the form.
            </p>
          </div>

          <div className="step">
            <div className="step-number">2</div>

            <Sparkles size={25} />

            <h3>AI Analysis</h3>

            <p>
              FormBuddy reads and understands the form.
            </p>
          </div>

          <div className="step">
            <div className="step-number">3</div>

            <CheckCircle2 size={25} />

            <h3>Understand</h3>

            <p>
              Get simple explanations and useful guidance.
            </p>
          </div>
        </div>
      </section>

      {/* ================================
          ANALYSIS
      ================================= */}

      {analysis && (
        <section className="analysis-section">
          <div className="analysis-container">

            {/* ANALYSIS HEADER */}

            <div className="analysis-top">
              <div>
                <div className="analysis-label">
                  <Sparkles size={16} />
                  AI Analysis Complete
                </div>

                <h2>Your Form Breakdown</h2>

                <p>
                  FormBuddy has analyzed your document and
                  simplified the important information.
                </p>
              </div>

              <button
                className="secondary-button"
                onClick={handleAnalyzeAnother}
              >
                <RefreshCw size={17} />
                Analyze Another
              </button>
            </div>

            {/* ================================
                SMART CHECKLIST
            ================================= */}

            <div className="checklist-card">
              <div className="checklist-header">
                <div>
                  <div className="checklist-title">
                    <ClipboardCheck size={20} />
                    Form Completion Checklist
                  </div>

                  <p>
                    {completedCount} of{" "}
                    {checklistItems.length} completed
                  </p>
                </div>

                <strong>{progress}%</strong>
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
                {checklistItems.map((item) => (
                  <label
                    key={item.id}
                    className={
                      completedItems[item.id]
                        ? "checklist-item completed"
                        : "checklist-item"
                    }
                  >
                    <input
                      type="checkbox"
                      checked={
                        !!completedItems[item.id]
                      }
                      onChange={() =>
                        toggleChecklistItem(item.id)
                      }
                    />

                    <span className="check-box">
                      {completedItems[item.id] && (
                        <CheckCircle2 size={16} />
                      )}
                    </span>

                    <div>
                      <strong>{item.title}</strong>

                      <p>
                        {item.description}
                      </p>
                    </div>
                  </label>
                ))}
              </div>

              {progress === 100 && (
                <div className="checklist-success">
                  <CheckCircle2 size={18} />
                  Your form is ready for final review!
                </div>
              )}
            </div>

            {/* ================================
                PURPOSE
            ================================= */}

            <div className="summary-grid">
              <div className="analysis-card">
                <div className="card-icon blue">
                  <FileCheck size={22} />
                </div>

                <h3>
                  What is this form for?
                </h3>

                <p>
                  {analysis.formPurpose}
                </p>
              </div>

              <div className="analysis-card">
                <div className="card-icon purple">
                  <User size={22} />
                </div>

                <h3>
                  Who needs this form?
                </h3>

                <p>
                  {analysis.whoNeedsIt}
                </p>
              </div>
            </div>

            {/* ================================
                FIELDS
            ================================= */}

            <div className="analysis-card large-card">
              <div className="card-heading">
                <div className="card-icon green">
                  <FileText size={22} />
                </div>

                <div>
                  <h3>Form Fields</h3>

                  <p>
                    Understand what each field means and
                    what you should enter.
                  </p>
                </div>
              </div>

              <div className="fields-list">
                {analysis.fields?.map(
                  (field, index) => (
                    <div
                      className="field-item"
                      key={index}
                    >
                      <div className="field-number">
                        {index + 1}
                      </div>

                      <div className="field-content">
                        <h4>
                          {field.fieldName}
                        </h4>

                        <div className="field-answer">
                          <strong>
                            What does it mean?
                          </strong>

                          <p>
                            {field.explanation}
                          </p>
                        </div>

                        <div className="field-answer">
                          <strong>
                            What should I enter?
                          </strong>

                          <p>
                            {field.whatToEnter}
                          </p>
                        </div>
                      </div>
                    </div>
                  )
                )}
              </div>
            </div>

            {/* ================================
                DOCUMENTS + MISTAKES
            ================================= */}

            <div className="two-column">

              {/* DOCUMENTS */}

              <div className="analysis-card">
                <div className="card-heading">
                  <div className="card-icon orange">
                    <FileCheck size={22} />
                  </div>

                  <div>
                    <h3>
                      Required Documents
                    </h3>

                    <p>
                      Keep these ready before applying.
                    </p>
                  </div>
                </div>

                {analysis.documents?.length > 0 ? (
                  <ul className="check-list">
                    {analysis.documents.map(
                      (document, index) => (
                        <li key={index}>
                          <CheckCircle2 size={17} />

                          <span>
                            {document}
                          </span>
                        </li>
                      )
                    )}
                  </ul>
                ) : (
                  <p>
                    No specific documents identified.
                  </p>
                )}
              </div>

              {/* MISTAKES */}

              <div className="analysis-card">
                <div className="card-heading">
                  <div className="card-icon red">
                    <AlertTriangle size={22} />
                  </div>

                  <div>
                    <h3>
                      Common Mistakes
                    </h3>

                    <p>
                      Things to check before submitting.
                    </p>
                  </div>
                </div>

                {analysis.mistakes?.length > 0 ? (
                  <ul className="warning-list">
                    {analysis.mistakes.map(
                      (mistake, index) => (
                        <li key={index}>
                          <AlertTriangle size={17} />

                          <span>
                            {mistake}
                          </span>
                        </li>
                      )
                    )}
                  </ul>
                ) : (
                  <p>
                    No specific mistakes identified.
                  </p>
                )}
              </div>
            </div>

            {/* ================================
                IMPORTANT NOTES
            ================================= */}

            <div className="analysis-card notes-card">
              <div className="card-heading">
                <div className="card-icon yellow">
                  <Lightbulb size={22} />
                </div>

                <div>
                  <h3>Important Notes</h3>

                  <p>
                    Extra information you should know.
                  </p>
                </div>
              </div>

              {analysis.importantNotes?.length > 0 ? (
                <ul className="notes-list">
                  {analysis.importantNotes.map(
                    (note, index) => (
                      <li key={index}>
                        {note}
                      </li>
                    )
                  )}
                </ul>
              ) : (
                <p>
                  No additional notes.
                </p>
              )}
            </div>
          </div>
        </section>
      )}

      {/* ================================
          FEATURES
      ================================= */}

      <section
        className="features"
        id="features"
      >
        <div className="section-heading">
          <span>
            Built for real-world forms
          </span>

          <h2>
            Everything you need to understand a form
          </h2>

          <p>
            FormBuddy turns confusing paperwork into simple,
            understandable information.
          </p>
        </div>

        <div className="feature-container">

          <div className="feature-card">
            <div className="feature-icon">
              <Lightbulb size={24} />
            </div>

            <h3>
              Simple Explanations
            </h3>

            <p>
              Understand complicated fields without confusing
              technical language.
            </p>
          </div>

          <div className="feature-card">
            <div className="feature-icon">
              <FileCheck size={24} />
            </div>

            <h3>
              Document Checklist
            </h3>

            <p>
              Know which documents you should keep ready
              before submitting your form.
            </p>
          </div>

          <div className="feature-card">
            <div className="feature-icon">
              <AlertTriangle size={24} />
            </div>

            <h3>
              Mistake Detection
            </h3>

            <p>
              Identify possible mistakes and important
              instructions before submission.
            </p>
          </div>

        </div>
      </section>

      {/* ================================
          FOOTER
      ================================= */}

      <footer>
        <div className="footer-brand">
          <Sparkles size={18} />
          <strong>FormBuddy AI</strong>
        </div>

        <p>
          Making complicated forms easier to understand.
        </p>
      </footer>
    </div>
  );
}

export default App;
