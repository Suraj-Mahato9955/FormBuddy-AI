import { useRef, useState } from "react";
import "./App.css";

function App() {
  const [file, setFile] = useState(null);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [analysis, setAnalysis] = useState(null);

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

    if (!allowedTypes.includes(selectedFile.type)) {
      setError(
        "Please upload a PDF, JPG, or PNG file."
      );

      event.target.value = "";
      return;
    }

    if (selectedFile.size > 10 * 1024 * 1024) {
      setError(
        "File size must be less than 10 MB."
      );

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
          data.message ||
            "Form analysis failed."
        );
      }

      setAnalysis(data.analysis);

      setMessage(
        "Form analyzed successfully! 🎉"
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

  const formatFileSize = (bytes) => {
    if (bytes < 1024) {
      return `${bytes} Bytes`;
    }

    if (bytes < 1024 * 1024) {
      return `${(bytes / 1024).toFixed(1)} KB`;
    }

    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div className="app">

      {/* Navbar */}

      <nav className="navbar">
        <h2>FormBuddy AI</h2>

        <div className="nav-links">
          <a href="#how-it-works">
            How it works
          </a>

          <a href="#features">
            Features
          </a>
        </div>
      </nav>

      {/* Hero */}

      <main className="hero">
        <div className="hero-content">

          <p className="badge">
            🤖 AI-Powered Form Assistant
          </p>

          <h1>
            Understand Any Form
            <br />

            <span>
              With Your AI Assistant
            </span>
          </h1>

          <p className="description">
            Upload a PDF or image of any complex
            form and FormBuddy AI will explain
            each field in simple language.
          </p>

          {/* Upload Box */}

          <div className="upload-box">

            {!file ? (
              <>
                <div className="upload-icon">
                  📄
                </div>

                <h3>
                  Upload your form
                </h3>

                <p>
                  PDF, JPG or PNG • Maximum 10 MB
                </p>

                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf,.jpg,.jpeg,.png"
                  onChange={handleFileChange}
                  hidden
                />

                <button
                  className="upload-button"
                  onClick={() =>
                    fileInputRef.current.click()
                  }
                >
                  Choose Form
                </button>
              </>
            ) : (
              <>
                <div className="file-icon">
                  {file.type ===
                  "application/pdf"
                    ? "📕"
                    : "🖼️"}
                </div>

                <h3>
                  {file.name}
                </h3>

                <p>
                  {formatFileSize(file.size)}
                </p>

                <div className="file-actions">

                  <button
                    className="upload-button"
                    onClick={handleUpload}
                    disabled={isUploading}
                  >
                    {isUploading
                      ? "Analyzing..."
                      : "Analyze Form"}
                  </button>

                  <button
                    className="remove-button"
                    onClick={
                      handleRemoveFile
                    }
                    disabled={isUploading}
                  >
                    Remove
                  </button>

                </div>
              </>
            )}

            {error && (
              <p className="error-message">
                ❌ {error}
              </p>
            )}

            {message && (
              <p className="success-message">
                {message}
              </p>
            )}

          </div>

          <p className="privacy-text">
            🔒 Your documents are processed securely.
          </p>

        </div>
      </main>

      {/* AI Analysis */}

      {analysis && (
        <section className="analysis-section">

          <div className="analysis-container">

            <div className="analysis-header">
              <span>✨</span>

              <div>
                <h2>
                  FormBuddy Analysis
                </h2>

                <p>
                  Here's a simple explanation
                  of your form.
                </p>
              </div>
            </div>

            {/* Purpose */}

            <div className="analysis-card">
              <h3>
                📋 What is this form for?
              </h3>

              <p>
                {analysis.formPurpose}
              </p>
            </div>

            {/* Who needs it */}

            <div className="analysis-card">
              <h3>
                👤 Who needs this form?
              </h3>

              <p>
                {analysis.whoNeedsIt}
              </p>
            </div>

            {/* Fields */}

            <div className="analysis-card">

              <h3>
                ✏️ Form Fields
              </h3>

              <div className="fields-list">

                {analysis.fields.map(
                  (field, index) => (
                    <div
                      className="field-item"
                      key={index}
                    >
                      <h4>
                        {index + 1}.{" "}
                        {field.fieldName}
                      </h4>

                      <p>
                        <strong>
                          What does it mean?
                        </strong>
                        <br />

                        {field.explanation}
                      </p>

                      <p>
                        <strong>
                          What should I enter?
                        </strong>
                        <br />

                        {field.whatToEnter}
                      </p>
                    </div>
                  )
                )}

              </div>

            </div>

            {/* Documents */}

            <div className="analysis-card">

              <h3>
                📄 Required Documents
              </h3>

              {analysis.documents.length >
              0 ? (
                <ul>
                  {analysis.documents.map(
                    (document, index) => (
                      <li key={index}>
                        {document}
                      </li>
                    )
                  )}
                </ul>
              ) : (
                <p>
                  No specific documents
                  were identified.
                </p>
              )}

            </div>

            {/* Mistakes */}

            <div className="analysis-card">

              <h3>
                ⚠️ Common Mistakes to Avoid
              </h3>

              {analysis.mistakes.length >
              0 ? (
                <ul>
                  {analysis.mistakes.map(
                    (mistake, index) => (
                      <li key={index}>
                        {mistake}
                      </li>
                    )
                  )}
                </ul>
              ) : (
                <p>
                  No specific mistakes
                  were identified.
                </p>
              )}

            </div>

            {/* Important Notes */}

            <div className="analysis-card">

              <h3>
                💡 Important Notes
              </h3>

              {analysis.importantNotes.length >
              0 ? (
                <ul>
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

      {/* Features */}

      <section
        className="features"
        id="features"
      >

        <h2>
          What FormBuddy AI can help with
        </h2>

        <div className="feature-container">

          <div className="feature-card">
            <div>💡</div>

            <h3>
              Simple Explanations
            </h3>

            <p>
              Understand what each form
              field means in simple language.
            </p>
          </div>

          <div className="feature-card">
            <div>📋</div>

            <h3>
              Document Checklist
            </h3>

            <p>
              Know which documents you need
              before submitting your form.
            </p>
          </div>

          <div className="feature-card">
            <div>✅</div>

            <h3>
              Error Checking
            </h3>

            <p>
              Find possible mistakes before
              submitting your application.
            </p>
          </div>

        </div>

      </section>

    </div>
  );
}

export default App;
