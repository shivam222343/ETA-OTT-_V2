import os
from fastapi import FastAPI, HTTPException, BackgroundTasks
from pydantic import BaseModel
from typing import List, Optional
import uvicorn
from dotenv import load_dotenv

from extractors.pdf_extractor import extract_pdf
from extractors.video_extractor import extract_video
from extractors.youtube_extractor import extract_youtube

load_dotenv()

app = FastAPI(title="Eta ML Service", description="AI-powered data extraction service")

class ExtractionRequest(BaseModel):
    file_url: str
    content_id: str
    content_type: str  # 'pdf', 'video', 'youtube', etc.

class ExtractionResponse(BaseModel):
    success: bool
    message: str
    data: Optional[dict] = None

@app.get("/")
async def root():
    return {"status": "online", "message": "Eta ML Service is running"}

@app.post("/extract", response_model=ExtractionResponse)
async def extract_data(request: ExtractionRequest):
    try:
        if request.content_type == 'pdf':
            result = await extract_pdf(request.file_url)
            return {"success": True, "message": "PDF extraction successful", "data": result}
        elif request.content_type == 'video':
            result = await extract_video(request.file_url)
            return {"success": True, "message": "Video extraction successful", "data": result}
        elif request.content_type == 'youtube':
            result = await extract_youtube(request.file_url)
            if result.get("success"):
                return {"success": True, "message": "YouTube extraction successful", "data": result}
            else:
                return {"success": False, "message": result.get("error", "YouTube extraction failed"), "data": None}
        else:
            raise HTTPException(status_code=400, detail=f"Unsupported content type: {request.content_type}")
            
    except Exception as e:
        print(f"Extraction error: {str(e)}")
        return {"success": False, "message": str(e), "data": None}

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)
