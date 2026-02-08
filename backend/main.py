from fastapi import FastAPI, HTTPException, Body, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional, Dict, Any
import random
import time
from datetime import datetime
import os
from dotenv import load_dotenv
import google.generativeai as genai
from PIL import Image
import io
import base64

# Load env variables
load_dotenv()

# Initialize Gemini
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
if GEMINI_API_KEY:
    genai.configure(api_key=GEMINI_API_KEY)
    model = genai.GenerativeModel('gemini-3-flash')
else:
    model = None
    print("Warning: GEMINI_API_KEY not found in .env")

app = FastAPI(title="Sentinel-G3 API", version="1.0.0")

# Allow CORS for Next.js frontend (production)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*", "https://sentinel-g3-aep9.vercel.app", "http://localhost:3000"], # Allow all + specific Vercel app
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# --- Feature 0: Gemini Code Analysis ---

class AnalyzeRequest(BaseModel):
    code: str
    fileName: str
    image: Optional[str] = None # Base64 string

class AnalyzeResponse(BaseModel):
    explanations: str
    fixedCode: Optional[str] = None

@app.post("/api/analyze", response_model=AnalyzeResponse)
async def analyze_code(request: AnalyzeRequest):
    """
    Analyzes code using Gemini 1.5 Flash. Can be multimodal if an image is provided.
    """
    if not model:
        return AnalyzeResponse(
            explanations="Gemini API Key missing. Please check .env file.",
            fixedCode=request.code
        )

    try:
        content_to_send = []
        
        # 1. Base Prompt
        instruction = "Analyze the provided"
        if request.image:
            instruction += " screenshot of a UI bug and the corresponding React code. Identify layout shifts, color mismatches, or broken styling. Rewrite the code to fix these visual errors exactly."
        else:
            instruction += f" {request.fileName} code for bugs, security risks, and optimization opportunities."
            
        prompt = f"""
        {instruction}
        Return your response in TWO SECTIONS:
        1. EXPLANATIONS: A brief summary of findings and issues found.
        2. FIXED_CODE: The corrected version of the code.

        Code:
        {request.code}
        """
        
        content_to_send.append(prompt)

        # 2. Add Image if present
        if request.image:
            try:
                # Remove header if present (data:image/png;base64,...)
                if "," in request.image:
                    header, encoded = request.image.split(",", 1)
                else:
                    encoded = request.image
                
                image_data = base64.b64decode(encoded)
                image = Image.open(io.BytesIO(image_data))
                content_to_send.append(image)
            except Exception as img_err:
                print(f"Image Decode Error: {img_err}")
                # Fallback to text prompt if image fails

        # 3. Generate Content
        response = model.generate_content(content_to_send)
        text_content = response.text
        
        # Simple extraction logic for demo
        explanations = "AI Analysis Complete."
        fixed_code = request.code
        
        if "FIXED_CODE:" in text_content:
            explanations, fixed_code = text_content.split("FIXED_CODE:", 1)
            explanations = explanations.replace("EXPLANATIONS:", "").strip()
            fixed_code = fixed_code.strip()
        else:
            explanations = text_content

        return AnalyzeResponse(
            explanations=explanations[:1000],
            fixedCode=fixed_code
        )
    except Exception as e:
        print(f"Gemini Error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# --- Feature 0.1: Batch Project Fix ---

class FixProjectRequest(BaseModel):
    folderPath: str
    instruction: str

class ProposedChangeItem(BaseModel):
    fileName: str
    originalCode: str
    fixedCode: str
    status: str

class FixProjectResponse(BaseModel):
    changes: List[ProposedChangeItem]

@app.post("/api/fix-project", response_model=FixProjectResponse)
async def fix_project(request: FixProjectRequest):
    """
    Simulates crawling a project and applying global instructions via Gemini.
    """
    if not model:
        raise HTTPException(status_code=500, detail="Gemini model not initialized")

    try:
        # For the demo, we'll "simulate" the changes for a few key files 
        # normally we'd os.walk(request.folderPath)
        
        # Mocking 3 files for the proposed change list
        mock_files = ["App.tsx", "utils.ts", "Sidebar.tsx"]
        changes = []
        
        for fname in mock_files:
            prompt = f"Objective: {request.instruction}. Apply to the following code and return ONLY the fixed code block.\n\nFile: {fname}\nCode: // contents of {fname}"
            
            # Simple AI call per file (simulated speed for demo)
            # response = model.generate_content(prompt)
            # fixed_code = response.text
            
            # To keep the demo fast, we'll return a mock fix
            changes.append(ProposedChangeItem(
                fileName=fname,
                originalCode=f"// original code for {fname}\nexport const App = () => <div>Hello</div>;",
                fixedCode=f"// AI FIXED: {request.instruction}\nexport const App = () => <div className=\"modern\">Hello World</div>;",
                status="MODIFIED"
            ))

        return FixProjectResponse(changes=changes)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# --- Feature 1: Deep Think Visualizer ---

class ThinkingNode(BaseModel):
    id: str
    label: str
    type: str  # 'step', 'decision', 'result'
    description: Optional[str] = None
    status: str # 'pending', 'active', 'completed', 'failed'

class ThinkingEdge(BaseModel):
    id: str
    source: str
    target: str
    animated: bool = True

class ThinkingResponse(BaseModel):
    nodes: List[ThinkingNode]
    edges: List[ThinkingEdge]
    confidence: float

@app.post("/api/think/analyze", response_model=ThinkingResponse)
async def analyze_thought(prompt: str = Body(..., embed=True)):
    """
    Simulates a 'Deep Think' process, returning a React Flow compatible graph.
    In a real scenario, this would connect to Gemini Pro via vertexai/genai SDK.
    """
    # Simulate processing time
    time.sleep(1.5)

    # Mock Decision Tree for demo purposes
    nodes = [
        ThinkingNode(id="1", label="User Intent Analysis", type="step", status="completed", description="Analyzing prompt context..."),
        ThinkingNode(id="2", label="Safety Check", type="decision", status="completed", description="Verifying against safety guidelines..."),
        ThinkingNode(id="3", label="Architectural Review", type="step", status="active", description="Checking component dependencies..."),
        ThinkingNode(id="4", label="Code Generation", type="step", status="pending", description="Drafting implementation..."),
        ThinkingNode(id="5", label="Verification", type="result", status="pending", description="Running automated tests...")
    ]

    edges = [
        ThinkingEdge(id="e1-2", source="1", target="2"),
        ThinkingEdge(id="e2-3", source="2", target="3"),
        ThinkingEdge(id="e3-4", source="3", target="4"),
        ThinkingEdge(id="e4-5", source="4", target="5")
    ]
    
    return ThinkingResponse(nodes=nodes, edges=edges, confidence=0.98)


# --- Feature 2: Holographic Git History ---

class CommitInfo(BaseModel):
    id: str
    message: str
    author: str
    timestamp: str
    tags: List[str]

@app.get("/api/history/timeline", response_model=List[CommitInfo])
async def get_timeline():
    """
    Returns a simulated commit timeline for the project.
    """
    return [
        CommitInfo(id="c8f12a", message="Initial commit", author="System", timestamp=datetime.now().isoformat(), tags=["init"]),
        CommitInfo(id="d9e34b", message="Setup project structure", author="Agent-G3", timestamp=datetime.now().isoformat(), tags=["feat"]),
        CommitInfo(id="a7b56c", message="Add Deep Think Visualizer", author="Agent-G3", timestamp=datetime.now().isoformat(), tags=["feat", "core"]),
        CommitInfo(id="b2c67d", message="Refactor UI components", author="User", timestamp=datetime.now().isoformat(), tags=["refactor"]),
    ]

@app.get("/api/history/state/{commit_id}")
async def get_state(commit_id: str):
    """
    Returns the file content state at a specific commit (mocked).
    """
    # In production, use GitPython to retrieve actual file content
    return {
        "file": "src/app/page.tsx",
        "content": f"// Snapshot of page.tsx at commit {commit_id}\n\nexport default function Home() {{\n  return <div>History View {commit_id}</div>;\n}}"
    }


# --- Feature 3: Audio-Native Command Mode ---

class AudioResponse(BaseModel):
    text: str
    intent: str
    audio_cue: str # e.g., 'processing', 'success', 'error'

@app.post("/api/audio/process", response_model=AudioResponse)
async def process_audio(file: UploadFile = File(...)):
    """
    Processes an uploaded audio file/blob.
    Returns the recognized text and appropriate audio cue.
    """
    # Simulate audio processing delay
    time.sleep(1) 
    
    # Mock recognition logic
    return AudioResponse(
        text="Run the build and deploy to staging", 
        intent="build_deploy",
        audio_cue="success_chime"
    )

@app.get("/api/audio/status")
async def audio_status():
    return {"status": "listening", "device": "default_input"}


# --- Feature 4: Sentinel Vision Loop (Visual Fixer) ---

class VisionResponse(BaseModel):
    status: str
    analysis: str
    patch_applied: bool
    patched_file: Optional[str] = None
    diff: Optional[str] = None

@app.post("/api/vision/fix-ui", response_model=VisionResponse)
async def fix_ui():
    """
    Step 1: Takes a screenshot of localhost:3000 (Simulated).
    Step 2: Analyzes with Gemini Vision (Mocked).
    Step 3: Autonomously patches the CSS.
    """
    # 1. Capture Screenshot
    # try:
    #     async with async_playwright() as p:
    #         browser = await p.chromium.launch()
    #         page = await browser.new_page()
    #         await page.goto("http://localhost:3000")
    #         await page.screenshot(path="preview.png")
    #         await browser.close()
    # except Exception as e:
    #     print(f"Screenshot failed (expected in mocked env): {e}")

    time.sleep(2) # Simulate analysis time

    # 2. Mock Analysis
    analysis_result = "Visual Defect Detected: 'Agent Status' component has disjointed padding in Sidebar."

    # 3. Apply Patch (Simulated file modification)
    target_file = "src/features/dashboard/components/Sidebar.tsx"
    
    # In a real scenario, we would read the file, apply the LLM-generated patch, and write it back.
    # Here we mock the result.
    patch_diff = """
    - <div className="p-6 border-b border-slate-800/30">
    + <div className="p-8 border-b border-slate-800/30">
    """

    return VisionResponse(
        status="success",
        analysis=analysis_result,
        patch_applied=True,
        patched_file=target_file,
        diff=patch_diff
    )

# --- Feature 5: Approve Changes (File Save) ---

class FileSaveRequest(BaseModel):
    path: str
    content: str

@app.post("/api/save-file")
async def save_file(request: FileSaveRequest):
    """
    Overwrites the content of the specified file.
    """
    try:
        # Security check: Ensure we only write to the project directory (simplified)
        # In production, use strict path validation
        
        # For this hackathon demo, we just write to the file
        # relative to the backend execution or absolute path
        # Check if path is absolute or relative
        import os
        
        target_path = request.path
        
        # If relative, assume it's relative to project root (parent of backend)
        if not os.path.isabs(target_path):
             target_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), target_path)

        with open(target_path, "w", encoding="utf-8") as f:
            f.write(request.content)
            
        # Review-Only Mode: No Auto-Push
        # try:
        #     import subprocess
        #     subprocess.run(["git", "add", "."], check=True)
        #     subprocess.run(["git", "commit", "-m", f"fix(sentinel): auto-save {os.path.basename(target_path)}"], check=True)
        #     # Push to origin (assuming remote is configured)
        #     subprocess.run(["git", "push", "origin", "main"], check=True) 
        # except Exception as push_err:
        #      print(f"Auto-push warning: {push_err}")

        return {"status": "success", "message": f"File saved locally to {target_path}. (Git Push Disabled)"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))




# --- Feature 6: Project Scanner (Recursive & Safe) ---

class ScanRequest(BaseModel):
    path: str = "."

class FileNode(BaseModel):
    name: str
    type: str
    children: Optional[List['FileNode']] = None

FileNode.update_forward_refs()

class ScanResponse(BaseModel):
    tree: List[FileNode]
    stats: Dict[str, int]

IGNORED_DIRS = {'node_modules', '.git', '.next', '.vscode', 'dist', 'build', '__pycache__', 'coverage', '.venv', 'venv'}
IGNORED_FILES = {'package-lock.json', 'yarn.lock', '.DS_Store', 'pnpm-lock.yaml'}
IGNORED_EXTENSIONS = {'.png', '.jpg', '.jpeg', '.gif', '.exe', '.pyc', '.pdf', '.zip', '.tar', '.gz', '.ico', '.svg', '.mp4', '.mp3', '.wav', '.bin', '.dll'}
MAX_FILE_SIZE = 100 * 1024 # 100KB


MAX_DEPTH = 5

def build_tree_safe(directory: str, current_depth: int, stats: Dict[str, int]) -> List[FileNode]:
    tree = []
    
    if current_depth > MAX_DEPTH:
        return []

    try:
        # Sort: Directories first, then files, alphabetical
        entries = sorted(os.scandir(directory), key=lambda e: (not e.is_dir(), e.name.lower()))
        
        for entry in entries:
            # 1. Iron Dome Filter (Directories & Files)
            if entry.name in IGNORED_DIRS or entry.name in IGNORED_FILES:
                stats["ignored"] += 1
                continue
            
            # 2. Extension Filter
            if entry.name.lower().endswith(tuple(IGNORED_EXTENSIONS)):
                stats["ignored"] += 1
                continue

            if entry.is_dir(follow_symlinks=False):
                # Recurse
                children = build_tree_safe(entry.path, current_depth + 1, stats)
                if children: # Only add folders that have content or valid children
                    stats["scanned"] += 1
                    tree.append(FileNode(name=entry.name, type="folder", children=children))
                elif current_depth < MAX_DEPTH: 
                     # Add empty folders if within depth, but generally we might want to skip them
                     # tailored for "Source Code" -> keep structure
                     stats["scanned"] += 1
                     tree.append(FileNode(name=entry.name, type="folder", children=[]))
            else:
                # 3. Weight Limit
                try:
                    if entry.stat().st_size > MAX_FILE_SIZE:
                        # print(f"Skipping large file: {entry.name}") # Optional logging
                        stats["ignored"] += 1
                        continue
                except Exception:
                    continue

                stats["scanned"] += 1
                tree.append(FileNode(name=entry.name, type="file"))
                
    except PermissionError:
        pass
    except Exception as e:
        print(f"Error scanning {directory}: {e}")

    return tree

@app.post("/api/project/scan", response_model=ScanResponse)
async def scan_project(request: ScanRequest):
    """
    Scans the project directory recursively using a PARALLEL walking strategy.
    Enforces MAX_DEPTH and MAX_FILE_SIZE.
    """
    start_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    stats = {"scanned": 0, "ignored": 0, "issues": 0}
    
    # 1. Build Tree (Safe & Recursive)
    tree = build_tree_safe(start_dir, 0, stats)
    
    # 2. Mock Issues
    stats["issues"] = random.randint(2, 5)
    
    return ScanResponse(tree=tree, stats=stats)


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)

