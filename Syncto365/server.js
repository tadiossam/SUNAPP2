import express from "express";
import cors from "cors";
import { spawn } from "child_process";

const app = express();
app.use(express.json());
app.use(cors());

// PowerShell helper
const runPowerShell = (args) => {
  return new Promise((resolve, reject) => {
    const ps = spawn("powershell.exe", [
      "-ExecutionPolicy",
      "Bypass",
      "-File",
      "./bc_fetch.ps1",
      ...args,
    ]);

    let output = "";
    let error = "";

    ps.stdout.on("data", (data) => (output += data.toString()));
    ps.stderr.on("data", (data) => (error += data.toString()));

    ps.on("close", (code) => {
      if (code !== 0 || error)
        return reject({ code, message: error || "PowerShell failed" });
      try {
        resolve(JSON.parse(output));
      } catch (e) {
        reject({ message: "Invalid JSON output", output });
      }
    });
  });
};

// ======================
// 🔹 Test Connection
// ======================
app.post("/testConnection", async (req, res) => {
  // Normalize casing
  const baseUrl = req.body.BaseUrl || req.body.baseUrl;
  const username = req.body.Username || req.body.username;
  const password = req.body.Password || req.body.password;

  if (!baseUrl || !username || !password) {
    return res
      .status(400)
      .json({ status: "error", message: "BaseUrl, Username, and Password required" });
  }

  try {
    const result = await runPowerShell([
      "-Mode",
      "test",
      "-BaseUrl",
      baseUrl,
      "-Username",
      username,
      "-Password",
      password,
    ]);
    res.json(result);
  } catch (err) {
    console.error("testConnection error:", err);
    res.status(500).json({
      status: "error",
      message: err.message || "PowerShell execution failed",
    });
  }
});

// ======================
// 🔹 Fetch Data (Companies / Items / FixedAssets)
// ======================
app.post("/fetchData", async (req, res) => {
  const baseUrl = req.body.BaseUrl || req.body.baseUrl;
  const username = req.body.Username || req.body.username;
  const password = req.body.Password || req.body.password;
  const companyName = req.body.CompanyName || req.body.companyName;
  const type = req.body.Type || req.body.type;
  const filterValue = req.body.FilterValue || req.body.filterValue;
  const skip = req.body.Skip ?? req.body.skip;
  const top = req.body.Top ?? req.body.top;

  if (!baseUrl || !username || !password) {
    return res
      .status(400)
      .json({ status: "error", message: "Missing required parameters" });
  }

  const args = [
    "-BaseUrl", baseUrl,
    "-Username", username,
    "-Password", password
  ];

  if (companyName) args.push("-CompanyName", companyName);
  if (type) args.push("-Type", type);
  if (filterValue) args.push("-FilterValue", filterValue);
  if (skip !== undefined) args.push("-Skip", skip);
  if (top !== undefined) args.push("-Top", top);

  try {
    const result = await runPowerShell(args);
    res.json(result);
  } catch (err) {
    console.error("fetchData error:", err);
    res.status(500).json({
      status: "error",
      message: err.message || "PowerShell error",
    });
  }
});

app.listen(4000, () =>
  console.log("✅ Server running on http://localhost:4000")
);
