import express from "express";
import cors from "cors";
import helmet from "helmet";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors());
app.use(helmet());
app.use(express.json());

app.get("/health", (req, res) => {
  res.json({ status: "ok", message: "Satah Invoices Backend is running" });
});

app.get("/api/gst/:gstNumber", async (req, res) => {
  const { gstNumber } = req.params;
  try {
    const response = await fetch(`https://gst-insights-api.p.rapidapi.com/getGSTDetailsUsingGST/${gstNumber}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "x-rapidapi-host": "gst-insights-api.p.rapidapi.com",
        "x-rapidapi-key": process.env.RAPID_API_KEY || "a18ee74f13mshed05735e8b633f7p1a806cjsn2c61aa4d915f"
      }
    });

    if (!response.ok) {
      return res.status(response.status).json({ error: "Failed to fetch from GST API" });
    }

    const data = await response.json();
    res.json(data);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
