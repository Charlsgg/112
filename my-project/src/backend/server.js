const express = require("express");
const cors = require("cors");
const { spawn } = require("child_process");
const path = require("path");
const fs = require("fs");

const app = express();
app.use(cors());
app.use(express.json());

// Paths to your compilers
const CS_EXE = path.join(__dirname, '..', 'exe', 'cs.exe');
const CS2_EXE = path.join(__dirname, '..', 'exe', 'cs2.exe');

// Check if compilers exist
if (!fs.existsSync(CS_EXE)) {
  console.error("cs.exe not found at:", CS_EXE);
  process.exit(1);
}

if (!fs.existsSync(CS2_EXE)) {
  console.error("cs2.exe not found at:", CS2_EXE);
  process.exit(1);
}

// POST /compile - runs both compilers simultaneously
app.post("/compile", async (req, res) => {
  const { code } = req.body;

  if (!code || code.trim() === "") {
    return res.json({
      success: false,
      output: "// No code provided",
      assembly: "# No code provided",
      error: "Empty input",
    });
  }

  try {
    // Function to run a compiler
    const runCompiler = (exePath, compilerName) => {
      return new Promise((resolve) => {
        const child = spawn(exePath, [], {
          stdio: ["pipe", "pipe", "pipe"],
          shell: true,
        });

        let stdout = "";
        let stderr = "";

        // Send the code to the exe's stdin
        child.stdin.write(code);
        child.stdin.end();

        // Capture stdout
        child.stdout.on("data", (data) => {
          stdout += data.toString();
        });

        // Capture stderr
        child.stderr.on("data", (data) => {
          stderr += data.toString();
        });

        child.on("close", (exitCode) => {
          resolve({
            stdout: stdout || "",
            stderr: stderr || "",
            exitCode,
            compilerName
          });
        });

        child.on("error", (err) => {
          resolve({
            stdout: "",
            stderr: `Failed to execute ${compilerName}: ${err.message}`,
            exitCode: 1,
            compilerName
          });
        });
      });
    };

    // Run both compilers simultaneously
    const [csResult, cs2Result] = await Promise.all([
      runCompiler(CS_EXE, "cs.exe"),
      runCompiler(CS2_EXE, "cs2.exe")
    ]);

    // Combine results
    const allErrors = [];
    if (csResult.stderr) allErrors.push(`cs.exe: ${csResult.stderr}`);
    if (cs2Result.stderr) allErrors.push(`cs2.exe: ${cs2Result.stderr}`);

    res.json({
      success: csResult.exitCode === 0 && cs2Result.exitCode === 0,
      output: csResult.stdout || "No output from cs.exe",
      assembly: cs2Result.stdout || "No assembly output from cs2.exe",
      error: allErrors.join("\n") || null,
      exitCodes: {
        cs: csResult.exitCode,
        cs2: cs2Result.exitCode
      }
    });

  } catch (err) {
    res.json({
      success: false,
      output: "",
      assembly: "",
      error: err.message,
    });
  }
});

// Test endpoint - runs sample code through both compilers
app.get("/test", async (req, res) => {
  const sampleCode = `
    ilimbag "hello world";
`;

  try {
    // Run both compilers
    const runCompiler = (exePath, compilerName) => {
      return new Promise((resolve) => {
        const child = spawn(exePath, [], {
          stdio: ["pipe", "pipe", "pipe"],
          shell: true,
        });

        let stdout = "";
        let stderr = "";

        child.stdin.write(sampleCode);
        child.stdin.end();

        child.stdout.on("data", (data) => {
          stdout += data.toString();
        });

        child.stderr.on("data", (data) => {
          stderr += data.toString();
        });

        child.on("close", (exitCode) => {
          resolve({
            stdout,
            stderr,
            exitCode,
            compilerName
          });
        });

        child.on("error", (err) => {
          resolve({
            stdout: "",
            stderr: `Failed to execute ${compilerName}: ${err.message}`,
            exitCode: 1,
            compilerName
          });
        });
      });
    };

    const [csResult, cs2Result] = await Promise.all([
      runCompiler(CS_EXE, "cs.exe"),
      runCompiler(CS2_EXE, "cs2.exe")
    ]);

    res.json({
      success: true,
      sampleCode: sampleCode,
      output: csResult.stdout || "No output from cs.exe",
      assembly: cs2Result.stdout || "No assembly output from cs2.exe",
      errors: {
        cs: csResult.stderr || null,
        cs2: cs2Result.stderr || null
      },
      exitCodes: {
        cs: csResult.exitCode,
        cs2: cs2Result.exitCode
      }
    });

  } catch (err) {
    res.json({
      success: false,
      sampleCode: sampleCode,
      output: "",
      assembly: "",
      error: err.message,
    });
  }
});

// Simple HTML test page
app.get("/", (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html>
    <head>
        <title>CS Compiler Test</title>
        <style>
            body { font-family: Arial, sans-serif; padding: 20px; }
            textarea { width: 100%; height: 150px; margin: 10px 0; }
            button { padding: 10px 20px; background: #007bff; color: white; border: none; cursor: pointer; }
            .output-container { margin-top: 20px; }
            .tab { display: inline-block; padding: 10px 20px; cursor: pointer; background: #e9ecef; border: 1px solid #ddd; margin-right: 5px; }
            .tab.active { background: #007bff; color: white; }
            .tab-content { padding: 10px; background: #f5f5f5; border: 1px solid #ddd; white-space: pre-wrap; min-height: 100px; }
        </style>
    </head>
    <body>
        <h1>CS Compiler Test</h1>
        
        <h3>Test 1: Direct Test</h3>
        <button onclick="testSample()">Run Sample Code (ilimbag "hello world")</button>
        
        <h3>Test 2: Custom Code</h3>
        <textarea id="codeInput">// Enter your C-like code here
int main() {
    ilimbag "hello world";
    return 0;
}</textarea>
        <button onclick="compileCustom()">Compile Custom Code</button>
        
        <h3>Output:</h3>
        <div class="output-container">
            <div>
                <span class="tab active" onclick="showTab('output')">Output (cs.exe)</span>
                <span class="tab" onclick="showTab('assembly')">Assembly (cs2.exe)</span>
                <span class="tab" onclick="showTab('errors')">Errors</span>
            </div>
            <div id="outputTab" class="tab-content"></div>
            <div id="assemblyTab" class="tab-content" style="display:none;"></div>
            <div id="errorsTab" class="tab-content" style="display:none;"></div>
        </div>
        
        <script>
            let currentTab = 'output';
            
            function showTab(tabName) {
                currentTab = tabName;
                document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
                document.querySelectorAll('.tab-content').forEach(c => c.style.display = 'none');
                
                document.querySelectorAll('.tab')[tabName === 'output' ? 0 : tabName === 'assembly' ? 1 : 2].classList.add('active');
                document.getElementById(tabName + 'Tab').style.display = 'block';
            }
            
            async function testSample() {
                document.getElementById('outputTab').textContent = "Testing sample code...";
                
                try {
                    const response = await fetch('/test');
                    const result = await response.json();
                    
                    document.getElementById('outputTab').textContent = result.output;
                    document.getElementById('assemblyTab').textContent = result.assembly;
                    
                    let errors = [];
                    if (result.errors.cs) errors.push("cs.exe: " + result.errors.cs);
                    if (result.errors.cs2) errors.push("cs2.exe: " + result.errors.cs2);
                    document.getElementById('errorsTab').textContent = errors.join("\\n");
                    
                } catch (error) {
                    document.getElementById('outputTab').textContent = "Error: " + error.message;
                }
            }
            
            async function compileCustom() {
                const code = document.getElementById('codeInput').value;
                document.getElementById('outputTab').textContent = "Compiling...";
                
                try {
                    const response = await fetch('/compile', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ code: code })
                    });
                    
                    const result = await response.json();
                    
                    if (result.success) {
                        document.getElementById('outputTab').textContent = result.output;
                        document.getElementById('assemblyTab').textContent = result.assembly;
                        document.getElementById('errorsTab').textContent = result.error || "No errors";
                    } else {
                        document.getElementById('outputTab').textContent = "Error: " + result.error;
                    }
                } catch (error) {
                    document.getElementById('outputTab').textContent = "Network error: " + error.message;
                }
            }
            
            // Auto-run sample test on page load
            window.onload = testSample;
        </script>
    </body>
    </html>
  `);
});

const PORT = 3001;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
  console.log(`Test the compilers at: http://localhost:${PORT}/`);
  console.log(`Running both cs.exe and cs2.exe simultaneously`);
});