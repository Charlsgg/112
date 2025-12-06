const express = require("express");
const cors = require("cors");
const { spawn } = require("child_process");
const path = require("path");
const fs = require("fs");

const app = express();
app.use(cors());
app.use(express.json());

// Path to your cs.exe
// const COMPILER_EXE = "C:\\Users\\AdminPC\\Desktop\\SmallPrject\\112\\my-project\\src\\exe\\cs.exe";

const COMPILER_EXE = path.join(__dirname, '..', 'exe', 'cs.exe');

if (!fs.existsSync(COMPILER_EXE)) {
  console.error("cs.exe not found at:", COMPILER_EXE);
  process.exit(1);
}

// POST /compile
app.post("/compile", (req, res) => {
  const { code } = req.body;

  if (!code || code.trim() === "") {
    return res.json({
      success: false,
      output: "// No code provided",
      error: "Empty input",
    });
  }

  try {
    const child = spawn(COMPILER_EXE, [], {
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

    child.on("close", (code) => {
      res.json({
        success: true,
        output: stdout || "No output",
        error: stderr || null,
        exitCode: code,
      });
    });

    child.on("error", (err) => {
      res.json({
        success: false,
        output: "",
        error: "Failed to execute compiler: " + err.message,
      });
    });
  } catch (err) {
    res.json({
      success: false,
      output: "",
      error: err.message,
    });
  }
});

// ADDED: A GET route to test the compiler with sample input
app.get("/test", (req, res) => {
  // Sample input with ilimbag "hello world"
  const sampleCode = `
    ilimbag "hello world";
`;

  try {
    const child = spawn(COMPILER_EXE, [], {
      stdio: ["pipe", "pipe", "pipe"],
      shell: true,
    });

    let stdout = "";
    let stderr = "";

    // Send the sample code to the exe's stdin
    child.stdin.write(sampleCode);
    child.stdin.end();

    // Capture stdout
    child.stdout.on("data", (data) => {
      stdout += data.toString();
    });

    // Capture stderr
    child.stderr.on("data", (data) => {
      stderr += data.toString();
    });

    child.on("close", (code) => {
      res.json({
        success: true,
        sampleCode: sampleCode,
        output: stdout || "No output",
        error: stderr || null,
        exitCode: code,
      });
    });

    child.on("error", (err) => {
      res.json({
        success: false,
        sampleCode: sampleCode,
        output: "",
        error: "Failed to execute compiler: " + err.message,
      });
    });
  } catch (err) {
    res.json({
      success: false,
      sampleCode: sampleCode,
      output: "",
      error: err.message,
    });
  }
});

// ADDED: A simple HTML page to test from browser
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
            #output { margin-top: 20px; padding: 10px; background: #f5f5f5; border: 1px solid #ddd; white-space: pre-wrap; }
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
        <div id="output">Click a button to see output...</div>
        
        <script>
            async function testSample() {
                const output = document.getElementById('output');
                output.textContent = "Testing sample code...";
                
                try {
                    const response = await fetch('/test');
                    const result = await response.json();
                    
                    output.innerHTML = 
                        "<strong>Sample Code:</strong><br>" + 
                        result.sampleCode.replace(/\\n/g, "<br>").replace(/ /g, "&nbsp;") +
                        "<br><br><strong>Output:</strong><br>" + 
                        result.output +
                        (result.error ? "<br><br><strong>Error:</strong><br>" + result.error : "");
                } catch (error) {
                    output.textContent = "Error: " + error.message;
                }
            }
            
            async function compileCustom() {
                const code = document.getElementById('codeInput').value;
                const output = document.getElementById('output');
                output.textContent = "Compiling...";
                
                try {
                    const response = await fetch('/compile', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ code: code })
                    });
                    
                    const result = await response.json();
                    
                    if (result.success) {
                        output.textContent = result.output;
                        if (result.error) {
                            output.textContent += "\\n\\nError/Warning: " + result.error;
                        }
                    } else {
                        output.textContent = "Error: " + result.error;
                    }
                } catch (error) {
                    output.textContent = "Network error: " + error.message;
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
  console.log(`Test the compiler at: http://localhost:${PORT}/`);
  console.log(`Sample code with "ilimbag "hello world"" is ready to test!`);
});