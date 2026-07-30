import { Router } from "express";
import multer from "multer";
const pdfParse = require("pdf-parse");
import OpenAI from "openai";
import { createClient } from "@supabase/supabase-js";

const router = Router();
const upload = multer({ storage: multer.memoryStorage() });

// Optional: Supabase client for tracking usage
const supabaseUrl = process.env.SUPABASE_URL || "";
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";
const supabase = supabaseUrl && supabaseKey ? createClient(supabaseUrl, supabaseKey) : null;

// Initialize OpenAI client for GLM via NVIDIA API
const openai = new OpenAI({
  apiKey: process.env.NVIDIA_API_KEY || process.env.GLM_API_KEY || "dummy",
  baseURL: "https://integrate.api.nvidia.com/v1",
});

router.post("/", upload.single("file"), async (req, res) => {
  try {
    const { org_id, entity_name } = req.body;
    const file = req.file;

    if (!file) {
      return res.status(400).json({ error: "No file uploaded" });
    }
    if (!org_id) {
      return res.status(400).json({ error: "Missing org_id" });
    }

    // 1. Check Limits in Supabase
    if (supabase) {
      const { data: org, error: orgError } = await supabase
        .from("organizations")
        .select("ai_imports_count, ai_imports_reset_date")
        .eq("id", org_id)
        .single();
      
      if (orgError) {
        console.error("Error fetching org:", orgError);
      } else if (org) {
        const now = new Date();
        const resetDate = org.ai_imports_reset_date ? new Date(org.ai_imports_reset_date) : new Date(0);
        
        let currentCount = org.ai_imports_count || 0;
        
        // Reset if it's a new month
        if (now.getMonth() !== resetDate.getMonth() || now.getFullYear() !== resetDate.getFullYear()) {
          currentCount = 0;
        }

        if (currentCount >= 10) {
          return res.status(429).json({ error: "Monthly AI Import limit (10) reached." });
        }
      }
    }

    // 2. Parse file content
    let textContent = "";
    if (file.mimetype === "application/pdf") {
      const pdfData = await pdfParse(file.buffer);
      textContent = pdfData.text;
    } else if (file.mimetype.startsWith("text/")) {
      textContent = file.buffer.toString("utf-8");
    } else {
      return res.status(400).json({ error: "Unsupported file type for AI import. Please upload a PDF or Text file." });
    }

    if (!textContent.trim()) {
      return res.json({ data: [] });
    }

    // 3. Call GLM API
    const systemPrompt = `You are a helpful AI assistant that extracts data from ${entity_name || "documents"} into structured JSON.
You must return ONLY a JSON object that strictly matches the import format.
Do NOT include markdown formatting like \`\`\`json or \`\`\`. Just raw JSON.
The expected JSON structure should be an array of objects. Example:
[
  {
    "invoice_number": "INV-001",
    "client_name": "Acme Corp",
    "total": 500
  }
]
Extract as much relevant information as possible from the provided text.`;

    const completion = await openai.chat.completions.create({
      model: "z-ai/glm-5.2",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: `Please extract data from this text:\n\n${textContent}` }
      ],
      temperature: 0.1,
      top_p: 1,
      max_tokens: 4096,
      stream: false
    });

    let rawJson = completion.choices[0].message.content || "[]";
    // Clean up markdown if the model ignored the system prompt
    rawJson = rawJson.replace(/```json/g, "").replace(/```/g, "").trim();
    
    let parsedData = [];
    try {
      parsedData = JSON.parse(rawJson);
    } catch (e) {
      console.error("Failed to parse JSON from AI:", rawJson);
      return res.status(500).json({ error: "Failed to parse structured data from AI response." });
    }

    // 4. Increment usage
    if (supabase) {
      const { data: org } = await supabase.from("organizations").select("ai_imports_count, ai_imports_reset_date").eq("id", org_id).single();
      if (org) {
        const now = new Date();
        const resetDate = org.ai_imports_reset_date ? new Date(org.ai_imports_reset_date) : new Date(0);
        let currentCount = org.ai_imports_count || 0;
        
        if (now.getMonth() !== resetDate.getMonth() || now.getFullYear() !== resetDate.getFullYear()) {
          currentCount = 0;
        }

        await supabase.from("organizations").update({
          ai_imports_count: currentCount + 1,
          ai_imports_reset_date: now.toISOString(),
        }).eq("id", org_id);
      }
    }

    res.json({ success: true, data: parsedData });

  } catch (error: any) {
    console.error("AI Import Error:", error);
    res.status(500).json({ error: error.message || "Internal Server Error" });
  }
});

export default router;
