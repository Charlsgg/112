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

// --- TRANSPILER FUNCTION ---
// 1. Converts types (numero -> int, sulat -> char)
// 2. Removes ilimbag statements completely
// 3. Adds semicolons
function translateToC(customCode) {
    let cCode = ""; 
    const lines = customCode.split('\n');

    lines.forEach(line => {
        let trimmed = line.trim();
        
        // Skip empty lines
        if (!trimmed) {
            cCode += "\n";
            return;
        }
        
        // Keep comments
        if (trimmed.startsWith('//')) {
            cCode += line + "\n";
            return;
        }

        // --- REMOVE 'ilimbag' ---
        // If the line starts with ilimbag, skip it entirely
        if (trimmed.startsWith('ilimbag')) {
            return; 
        }

        // --- TRANSLATE EXPRESSIONS ---
        
        // 1. Translate Types
        // 'numero' -> 'int'
        let converted = trimmed.replace(/\bnumero\b/g, 'int');

        // 'sulat' handling
        // If assigning a string literal ("..."), use 'char *'. Else (single char), use 'char'
        if (converted.match(/\bsulat\b\s+\w+\s*=\s*"/)) {
            converted = converted.replace(/\bsulat\b/g, 'char *');
        } else {
            converted = converted.replace(/\bsulat\b/g, 'char');
        }

        // 2. Ensure Semicolons
        if (!converted.endsWith(';') && !converted.endsWith('{') && !converted.endsWith('}') && !converted.startsWith('#')) {
            converted += ';';
        }

        cCode += converted + "\n";
    });

    return cCode;
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
    const runCompiler = (exePath, compilerName, inputCode) => {
      return new Promise((resolve) => {
        const child = spawn(exePath, [], {
          stdio: ["pipe", "pipe", "pipe"],
          shell: true,
        });

        let stdout = "";
        let stderr = "";

        // Send the SPECIFIC code to the exe's stdin
        child.stdin.write(inputCode);
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

    // --- TRANSLATION STEP ---
    // Translate custom code to C (expressions only, ilimbag REMOVED)
    const cVersion = translateToC(code);
    
    // Run both compilers simultaneously
    // cs.exe gets original custom code
    // cs2.exe gets translated code
    const [csResult, cs2Result] = await Promise.all([
      runCompiler(CS_EXE, "cs.exe", code),
      runCompiler(CS2_EXE, "cs2.exe", cVersion)
    ]);

    // Combine results
    const allErrors = [];
    if (csResult.stderr) allErrors.push(`cs.exe: ${csResult.stderr}`);
    if (cs2Result.stderr) allErrors.push(`cs2.exe: ${cs2Result.stderr}`);

    res.json({
      success: csResult.exitCode === 0 && cs2Result.exitCode === 0,
      output: csResult.stdout || "No output from cs.exe",
      // Showing the Transpiled Code + Output for debugging clarity
      assembly: `--- Transpiled Code (cs2 input) ---\n${cVersion}\n\n--- cs2 Output ---\n${cs2Result.stdout || "No output"}`, 
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

// Test endpoint
app.get("/test", async (req, res) => {
  res.json({ message: "Use the UI to test." });
});

// Front-end UI
app.get("/", (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html>
    <head>
        <title>CS Compiler Test</title>
        <style>
            body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; padding: 20px; background-color: #f4f4f9; }
            h1 { color: #333; }
            textarea { width: 100%; height: 250px; margin: 10px 0; font-family: 'Consolas', monospace; padding: 10px; border: 1px solid #ccc; border-radius: 4px; }
            button { padding: 10px 20px; background: #28a745; color: white; border: none; cursor: pointer; border-radius: 4px; font-size: 16px; }
            button:hover { background: #218838; }
            .output-container { margin-top: 20px; background: white; padding: 15px; border-radius: 4px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
            .tab { display: inline-block; padding: 10px 20px; cursor: pointer; background: #e9ecef; border: 1px solid #ddd; margin-right: 5px; border-radius: 4px 4px 0 0; }
            .tab.active { background: #007bff; color: white; border-color: #007bff; }
            .tab-content { padding: 15px; background: #f8f9fa; border: 1px solid #ddd; white-space: pre-wrap; min-height: 100px; font-family: 'Consolas', monospace; }
        </style>
    </head>
    <body>
        <h1>CS Custom Language Compiler</h1>
        
        <textarea id="codeInput" placeholder="Enter custom code here...">numero a = 10
numero b = 5

ilimbag "Testing:"

a += 3
ilimbag "a += 3: ", a

b *= 2
ilimbag "b *= 2: ", b

++a
ilimbag "++a: ", a

b--
ilimbag "b--: ", b

numero c = a + b * 2
ilimbag "c = a + b * 2 = ", c

sulat pangalan = "Tagalog"
ilimbag "Ang wika ay: %s", pangalan

a + b * 3

ilimbag a</textarea>
        <button onclick="compileCustom()">Run Compile</button>
        
        <div class="output-container">
            <div>
                <span class="tab active" onclick="showTab('output')">cs.exe Output</span>
                <span class="tab" onclick="showTab('assembly')">cs2.exe (Stripped Input)</span>
                <span class="tab" onclick="showTab('errors')">Errors</span>
            </div>
            <div id="outputTab" class="tab-content">Waiting for input...</div>
            <div id="assemblyTab" class="tab-content" style="display:none;">Waiting for input...</div>
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
            
            async function compileCustom() {
                const code = document.getElementById('codeInput').value;
                document.getElementById('outputTab').textContent = "Compiling...";
                document.getElementById('assemblyTab').textContent = "Compiling...";
                document.getElementById('errorsTab').textContent = "";
                
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
                        document.getElementById('outputTab').textContent = "Build Failed";
                        document.getElementById('assemblyTab').textContent = "Build Failed";
                        document.getElementById('errorsTab').textContent = result.error || "Unknown Error";
                        showTab('errors');
                    }
                } catch (error) {
                    document.getElementById('outputTab').textContent = "Network error: " + error.message;
                }
            }
        </script>
    </body>
    </html>
  `);
});

const PORT = 3001;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});