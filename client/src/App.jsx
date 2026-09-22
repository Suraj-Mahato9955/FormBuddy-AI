function App() {
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

          {/* Upload Box */}
          <div className="upload-box">
            <div className="upload-icon">📄</div>

            <h3>Upload your form</h3>

            <p>
              Upload a PDF, JPG or PNG file
            </p>

            <button className="upload-button">
              Upload Form
            </button>
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
              Understand what each form field means.
            </p>
          </div>

          <div className="feature-card">
            <div>📋</div>
            <h3>Document Checklist</h3>
            <p>
              Know which documents you need before applying.
            </p>
          </div>

          <div className="feature-card">
            <div>✅</div>
            <h3>Error Checking</h3>
            <p>
              Find possible mistakes before submitting your form.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}

export default App;
