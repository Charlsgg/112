const express = require("express");
const cors = require("cors");
const { spawn } = require("child_process");
const path = require("path");
const fs = require("fs");

const app = express();

app.use(cors({ origin: "*", methods: ["GET", "POST"] }));
app.use(express.json());

// Paths
const CS_EXE = path.join(__dirname, '..', 'exe', 'com.exe'); 
const CS2_EXE = path.join(__dirname, '..', 'exe', 'cs2.exe');

if (!fs.existsSync(CS_EXE)) console.error("cs.exe not found");
if (!fs.existsSync(CS2_EXE)) console.error("cs2.exe not found");

// --- TRANSPILER FOR CS2.EXE ONLY ---
// cs2.exe is strict. It needs 'int', semicolons, and NO strings/floats.
// We DO NOT use this function for cs.exe.
function prepareForAssembly(code) {const cleanRaw = code.replace(/\u00A0/g, ' ');

    return cleanRaw.split('\n').map(line => {
        const commentIdx = line.indexOf('//');
        let content = commentIdx !== -1 ? line.substring(0, commentIdx) : line;
        let comment = commentIdx !== -1 ? line.substring(commentIdx) : "";
        let trimmed = content.trim();

        if (!trimmed) return comment;

        // 2. STRICT FILTER: Remove types cs2.exe can't handle
        // REMOVED 'letra' from this list so it is allowed through
        if (trimmed.startsWith('ilimbag') || 
            trimmed.startsWith('desimal') || 
            trimmed.startsWith('sulat')) { 
            return ""; 
        }

        // 3. CONTENT FILTER: Remove strings/floats
        // REMOVED trimmed.includes("'") so single quotes (like 'A') are allowed
        if (trimmed.includes('"') || trimmed.includes('.')) {
            return "";
        }

        // 4. TRANSLATE: 
        // - numero -> int
        // - letra -> char
        let translated = trimmed
            .replace(/\bnumero\b/g, 'int')
            .replace(/\bletra\b/g, 'char');

        // 5. ADD SEMICOLON (Required for C syntax)
        if (!translated.endsWith(';') && !translated.endsWith('{') && !translated.endsWith('}')) {
            translated += ';';
        }
        return translated + (comment ? " " + comment : "");
    }).join('\n');
}

// --- GENERIC RUNNER ---
const runCompiler = (exePath, name, input) => {
    return new Promise((resolve) => {
        if (!fs.existsSync(exePath)) return resolve({ exitCode: 1, stderr: `${name} missing` });

        const child = spawn(exePath, [], { stdio: ["pipe", "pipe", "pipe"], shell: true });
        let stdout = "", stderr = "";

        try {
            child.stdin.write(input);
            child.stdin.end();
        } catch (e) { stderr += "Write Error"; }

        child.stdout.on("data", d => stdout += d.toString());
        child.stderr.on("data", d => stderr += d.toString());
        child.on("close", code => resolve({ stdout, stderr, exitCode: code }));
    });
};

// --- API ---
app.post("/compile", async (req, res) => {
    const { code } = req.body;
    if (!code) return res.json({ success: false, error: "Empty input" });

    try {
        // PATH 1: RAW INPUT -> CS.EXE
        // We pass 'code' directly. No regex, no splitting, no semicolons added.
        const csPromise = runCompiler(CS_EXE, "cs.exe", code);

        // PATH 2: TRANSLATED INPUT -> CS2.EXE
        // We must translate/filter for Assembly generation
        const codeForCS2 = prepareForAssembly(code);
        const cs2Promise = runCompiler(CS2_EXE, "cs2.exe", codeForCS2);

        // Run in parallel
        const [csResult, cs2Result] = await Promise.all([csPromise, cs2Promise]);

        // Gather Logs
        let errorLog = "";
        if (csResult.exitCode !== 0 || csResult.stderr) errorLog += `[cs.exe Error]:\n${csResult.stderr}\n\n`;
        if (cs2Result.exitCode !== 0 || cs2Result.stderr) errorLog += `[cs2.exe Error]:\n${cs2Result.stderr}`;

        res.json({
            success: csResult.exitCode === 0 && cs2Result.exitCode === 0,
            output: csResult.stdout,    // Output from cs.exe (Interpreter)
            assembly: cs2Result.stdout, // Output from cs2.exe (Assembly)
            error: errorLog.trim() || "Compilation Successful"
        });

    } catch (err) {
        res.json({ success: false, error: err.message });
    }
});

// --- UI ---
app.get("/", (req, res) => {
    res.send(`
    <!DOCTYPE html>
    <html>
    <head>
        <title>Compiler Interface</title>
        <style>
            body { font-family: monospace; padding: 20px; background: #222; color: #fff; }
            textarea { width: 100%; height: 250px; background: #333; color: #fff; border: 1px solid #555; padding: 10px; }
            button { padding: 10px 20px; background: #28a745; color: white; border: none; cursor: pointer; margin-top: 10px; }
            .tabs { margin-top: 20px; }
            .tab { display: inline-block; padding: 10px; cursor: pointer; background: #444; margin-right: 5px; }
            .tab.active { background: #007bff; }
            .content { padding: 15px; background: #333; border: 1px solid #555; display: none; white-space: pre-wrap; }
        </style>
    </head>
    <body>
        <h2>System Architecture</h2>
        <ul>
            <li><b>cs.exe:</b> Receives RAW input (Exactly what you type).</li>
            <li><b>cs2.exe:</b> Receives Translated C (int only, semi-colons added).</li>
        </ul>
        <textarea id="code" spellcheck="false">
numero a = 10;
numero b = 20;

// Math (Runs on both)
a += 5;
b = b * 2;
numero c = (a + b) * 2;

// Strings/Floats (Runs on cs.exe ONLY)
sulat name = "Test";
desimal pi = 3.14;
ilimbag "Values:", c, pi;
</textarea>
        <br><button onclick="run()">Compile</button>

        <div class="tabs">
            <span class="tab active" onclick="tab('out')">Interpreter Output (cs.exe)</span>
            <span class="tab" onclick="tab('asm')">Assembly (cs2.exe)</span>
            <span class="tab" onclick="tab('err')">Logs</span>
        </div>
        <div id="out" class="content" style="display:block"></div>
        <div id="asm" class="content"></div>
        <div id="err" class="content" style="color:#ff6b6b"></div>

        <script>
            function tab(id) {
                document.querySelectorAll('.content').forEach(d => d.style.display = 'none');
                document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
                document.getElementById(id).style.display = 'block';
                event.target.classList.add('active');
            }
            async function run() {
                const out = document.getElementById('out');
                const asm = document.getElementById('asm');
                const err = document.getElementById('err');
                out.textContent = "Processing...";
                
                try {
                    const res = await fetch('/compile', {
                        method: 'POST',
                        headers: {'Content-Type': 'application/json'},
                        body: JSON.stringify({ code: document.getElementById('code').value })
                    });
                    const data = await res.json();
                    
                    if(data.success) {
                        out.textContent = data.output;
                        asm.textContent = data.assembly;
                        err.textContent = "Success";
                        err.style.color = "#51cf66";
                        tab('out');
                    } else {
                        out.textContent = data.output || "See Logs";
                        asm.textContent = data.assembly || "See Logs";
                        err.textContent = data.error;
                        err.style.color = "#ff6b6b";
                        tab('err');
                    }
                } catch (e) { err.textContent = e.message; }
            }
        </script>
    </body>
    </html>
    `);
});

const PORT = 3001;
app.listen(PORT, () => console.log("Server running on http://localhost:3001"));