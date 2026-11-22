const express = require("express");
const cors = require("cors");
const multer = require("multer");
const dotenv = require("dotenv");
const fs = require("fs");
const path = require("path");
const { GoogleGenAI } = require("@google/genai");

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

if (!process.env.GEMINI_API_KEY) {
  console.error("GEMINI_API_KEY missing in server/.env");
  process.exit(1);
}

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
});

app.use(cors());
app.use(express.json());

const uploadFolder = path.join(__dirname, "uploads");

if (!fs.existsSync(uploadFolder)) {
  fs.mkdirSync(uploadFolder, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadFolder);
  },

  filename: (req, file, cb) => {
    const uniqueName =
      Date.now() +
      "-" +
      Math.round(Math.random() * 1e9) +
      path.extname(file.originalname);

    cb(null, uniqueName);
  },
});

const upload = multer({
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024,
  },

  fileFilter: (req, file, cb) => {
    const allowedTypes = [
      "application/pdf",
      "image/jpeg",
      "image/png",
    ];

    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("Only PDF, JPG and PNG files are allowed."));
    }
  },
});

function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function analyzeWithGemini(geminiFile, prompt) {
  const model = "gemini-3.6-flash";
  const maxAttempts = 3;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      console.log(`Gemini attempt ${attempt}`);

      const interaction = await ai.interactions.create({
        model,

        input: [
          {
            type: "document",
            uri: geminiFile.uri,
            mime_type: geminiFile.mimeType,
          },
          {
            type: "text",
            text: prompt,
          },
        ],

        response_format: {
          type: "text",
          mime_type: "application/json",

          schema: {
            type: "object",

            properties: {
              formPurpose: { type: "string" },
              formPurposeHinglish: { type: "string" },
              whoNeedsIt: { type: "string" },
              whoNeedsItHinglish: { type: "string" },

              fields: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    fieldName: { type: "string" },
                    explanation: { type: "string" },
                    whatToEnter: { type: "string" },
                    hinglishExplanation: { type: "string" },
                    hinglishWhatToEnter: { type: "string" },
                  },
                  required: [
                    "fieldName",
                    "explanation",
                    "whatToEnter",
                    "hinglishExplanation",
                    "hinglishWhatToEnter",
                  ],
                },
              },

              documents: {
                type: "array",
                items: { type: "string" },
              },

              documentsHinglish: {
                type: "array",
                items: { type: "string" },
              },

              mistakes: {
                type: "array",
                items: { type: "string" },
              },

              mistakesHinglish: {
                type: "array",
                items: { type: "string" },
              },

              importantNotes: {
                type: "array",
                items: { type: "string" },
              },

              importantNotesHinglish: {
                type: "array",
                items: { type: "string" },
              },
            },

            required: [
              "formPurpose",
              "formPurposeHinglish",
              "whoNeedsIt",
              "whoNeedsItHinglish",
              "fields",
              "documents",
              "documentsHinglish",
              "mistakes",
              "mistakesHinglish",
              "importantNotes",
              "importantNotesHinglish",
            ],
          },
        },

        store: false,
      });

      return interaction;
    } catch (error) {
      const message = error?.message || "";
      const code = error?.code || error?.status || "";
      const lowerMessage = message.toLowerCase();

      console.error("Gemini error:", message);

      const is429 =
        code === 429 ||
        message.includes("429") ||
        lowerMessage.includes("quota exceeded") ||
        lowerMessage.includes("rate limit exceeded") ||
        lowerMessage.includes("requests per day") ||
        lowerMessage.includes("free tier");

      if (is429) {
        const quotaError = new Error("DAILY_QUOTA_EXCEEDED");
        quotaError.originalMessage = message;
        throw quotaError;
      }

      const is503 =
        code === 503 ||
        message.includes("503") ||
        lowerMessage.includes("high demand") ||
        lowerMessage.includes("service unavailable");

      if (is503 && attempt < maxAttempts) {
        await wait(attempt === 1 ? 2000 : 5000);
        continue;
      }

      if (is503) {
        const temporaryError = new Error(
          "GEMINI_TEMPORARILY_UNAVAILABLE"
        );
        temporaryError.originalMessage = message;
        throw temporaryError;
      }

      throw error;
    }
  }
}

app.get("/", (req, res) => {
  res.status(200).json({
    success: true,
    message: "FormBuddy AI server is running!",
  });
});

app.get("/api/health", (req, res) => {
  res.json({
    success: true,
    message: "Backend connection successful",
  });
});

app.post("/api/analyze", (req, res, next) => {
  upload.single("form")(req, res, (error) => {
    if (error) {
      return res.status(400).json({
        success: false,
        message: error.message,
      });
    }

    next();
  });
}, async (req, res) => {
  let uploadedFilePath = null;

  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "Please upload a form.",
      });
    }

    uploadedFilePath = req.file.path;

    console.log("Received file:", req.file.originalname);

    const geminiFile = await ai.files.upload({
      file: uploadedFilePath,
    });

    console.log("File uploaded to Gemini");

    const prompt = `
You are FormBuddy AI.

Analyze the uploaded form carefully.

Return ONLY valid JSON.

Do not invent information.
Use simple English and natural Indian Hinglish.
Explain the purpose of the form.
Explain who needs the form.
Explain every important field and what the user should enter.
Identify required documents, common mistakes and important notes.
If information is not specified, clearly mention that.

Return exactly this JSON structure:

{
  "formPurpose": "Simple English explanation",
  "formPurposeHinglish": "Simple Hinglish explanation",
  "whoNeedsIt": "Simple English explanation",
  "whoNeedsItHinglish": "Simple Hinglish explanation",
  "fields": [
    {
      "fieldName": "Field name",
      "explanation": "Simple English explanation",
      "whatToEnter": "What the user should enter",
      "hinglishExplanation": "Simple Hinglish explanation",
      "hinglishWhatToEnter": "What the user should enter in Hinglish"
    }
  ],
  "documents": ["Required document"],
  "documentsHinglish": ["Required document in Hinglish"],
  "mistakes": ["Possible mistake"],
  "mistakesHinglish": ["Possible mistake in Hinglish"],
  "importantNotes": ["Important note"],
  "importantNotesHinglish": ["Important note in Hinglish"]
}
`;

    const interaction = await analyzeWithGemini(
      geminiFile,
      prompt
    );

    const analysisText = interaction.output_text;

    if (!analysisText) {
      throw new Error("Gemini returned an empty response.");
    }

    const analysis = JSON.parse(analysisText);

    console.log("Form analysis completed successfully");

    return res.json({
      success: true,
      analysis,
    });
  } catch (error) {
    console.error("Analysis error:", error);

    if (error.message === "DAILY_QUOTA_EXCEEDED") {
      return res.status(429).json({
        success: false,
        message: "Gemini daily API quota exceeded. Please try again later.",
      });
    }

    if (error.message === "GEMINI_TEMPORARILY_UNAVAILABLE") {
      return res.status(503).json({
        success: false,
        message: "Gemini is temporarily busy. Please try again later.",
      });
    }

    return res.status(500).json({
      success: false,
      message: error.message || "Form analysis failed.",
    });
  } finally {
    if (
      uploadedFilePath &&
      fs.existsSync(uploadedFilePath)
    ) {
      try {
        fs.unlinkSync(uploadedFilePath);
      } catch (error) {
        console.error("File cleanup error:", error);
      }
    }
  }
});

// Unknown route handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Route not found: ${req.method} ${req.originalUrl}`,
  });
});

app.use((error, req, res, next) => {
  console.error("Server error:", error);

  if (res.headersSent) {
    return next(error);
  }

  res.status(500).json({
    success: false,
    message: error.message || "Internal server error",
  });
});

app.listen(PORT, () => {
  console.log("--------------------------------");
  console.log(`FormBuddy AI running on port ${PORT}`);
  console.log(`http://localhost:${PORT}`);
  console.log("--------------------------------");
});
