import { useRef, useState } from "react";

function App() {
  const [file, setFile] = useState(null);
  const [error, setError] = useState("");
  const [isUploading, setIsUploading] = useState(false);

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

    // File type validation
    if (!allowedTypes.includes(selectedFile.type)) {
      setError("Please upload a PDF, JPG, or PNG file.");
      event.target.value = "";
      return;
    }

    // 10 MB limit
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

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleUpload = () => {
    if (!file) {
      setError("Please select a form first.");
      return;
    }

    setIsUploading(true);

    // Backend integration will be added next
    setTimeout(() => {
      setIsUploading(false);
      alert("File selected successfully! Backend connection coming next.");
    }, 1000);
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
          <a href="#how-it-works">How it works</a>
          <a href="#features">Features</a>
        </div>
      </nav>

      {/* Hero Section */}
      <main className="hero">
        <div className="hero-content">
          <p className="badge">🤖 AI-Powered Form Assistant</p>

          <h1>
            Understand Any Form
            <br />
            <span>With Your AI Assistant</span>
          </h1>

          <p className="description">
            Upload a PDF or image of any complex form and FormBuddy AI
            will explain each field in simple language.
          </p>

          {/* Upload Section */}
          <div className="upload-box">
            {!file ? (
              <>
                <div className="upload-icon">📄</div>

                <h3>Upload your form</h3>

                <p>PDF, JPG or PNG • Maximum 10 MB</p>

                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf,.jpg,.jpeg,.png"
                  onChange={handleFileChange}
                  hidden
                />

                <button
                  className="upload-button"
                  onClick={() => fileInputRef.current.click()}
                >
                  Choose Form
                </button>
              </>
            ) : (
              <>
                <div className="file-icon">
                  {file.type === "application/pdf" ? "📕" : "🖼️"}
                </div>

                <h3>{file.name}</h3>

                <p>{formatFileSize(file.size)}</p>

                <div className="file-actions">
                  <button
                    className="upload-button"
                    onClick={handleUpload}
                    disabled={isUploading}
                  >
                    {isUploading ? "Uploading..." : "Analyze Form"}
                  </button>

                  <button
                    className="remove-button"
                    onClick={handleRemoveFile}
                    disabled={isUploading}
                  >
                    Remove
                  </button>
                </div>
              </>
            )}

            {error && <p className="error-message">{error}</p>}
          </div>

          <p className="privacy-text">
            🔒 Your documents are processed securely.
          </p>
        </div>
      </main>

      {/* Features */}
      <section className="features" id="features">
        <h2>What FormBuddy AI can help with</h2>

        <div className="feature-container">
          <div className="feature-card">
            <div>💡</div>
            <h3>Simple Explanations</h3>
            <p>
              Understand what each form field means in simple language.
            </p>
          </div>

          <div className="feature-card">
            <div>📋</div>
            <h3>Document Checklist</h3>
            <p>
              Know which documents you need before submitting your form.
            </p>
          </div>

          <div className="feature-card">
            <div>✅</div>
            <h3>Error Checking</h3>
            <p>
              Find possible mistakes before submitting your application.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}

export default App;
