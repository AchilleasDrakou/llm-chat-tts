import os
import time
import uuid
import json
import asyncio
import tempfile
from typing import List, Optional, Dict, Any, Union
from pathlib import Path

import numpy as np
import torchaudio
from fastapi import FastAPI, HTTPException, Depends, Request, BackgroundTasks, Response, status, File, UploadFile, Form
from fastapi.responses import StreamingResponse, FileResponse, JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from fastapi.openapi.utils import get_openapi
from pydantic import BaseModel, Field, validator
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.responses import JSONResponse
from loguru import logger
from dotenv import load_dotenv
from openai import AsyncOpenAI, OpenAIError
from tenacity import retry, stop_after_attempt, wait_exponential, retry_if_exception_type
import aiofiles
import torch
import cachetools

# Import Chatterbox TTS
try:
    from chatterbox.tts import ChatterboxTTS
except ImportError:
    logger.error("Chatterbox TTS not found. Please install it with 'pip install chatterbox-tts'")
    raise

# Load environment variables
load_dotenv()

# Configure logger
logger.add("logs/app.log", rotation="10 MB", level="INFO", serialize=True)

# Constants
CACHE_DIR = Path("cache")
CACHE_DIR.mkdir(exist_ok=True)
AUDIO_CACHE = cachetools.LRUCache(maxsize=100)  # Cache for recent TTS generations
DEFAULT_VOICE = "default"
AVAILABLE_VOICES = ["default", "male", "female", "robot"]

# Initialize FastAPI app
app = FastAPI(
    title="LLM Chat TTS API",
    description="API for chat with LLM and text-to-speech using Chatterbox",
    version="1.0.0",
)

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, restrict this to your frontend domain
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Models for request/response validation
class TTSRequest(BaseModel):
    text: str = Field(..., min_length=1, max_length=5000, description="Text to convert to speech")
    voice: str = Field(DEFAULT_VOICE, description="Voice to use for TTS")
    exaggeration: float = Field(0.5, ge=0.0, le=1.0, description="Exaggeration factor for the voice")
    cfg_weight: float = Field(0.5, ge=0.0, le=1.0, description="CFG weight for voice generation")
    
    @validator('voice')
    def validate_voice(cls, v):
        if v not in AVAILABLE_VOICES:
            raise ValueError(f"Voice must be one of {AVAILABLE_VOICES}")
        return v

class ChatMessage(BaseModel):
    role: str = Field(..., description="Role of the message sender (system, user, assistant)")
    content: str = Field(..., description="Content of the message")

class ChatRequest(BaseModel):
    messages: List[ChatMessage] = Field(..., min_items=1, description="List of chat messages")
    model: str = Field("gpt-3.5-turbo", description="OpenAI model to use")
    temperature: float = Field(0.7, ge=0.0, le=2.0, description="Temperature for response generation")
    max_tokens: Optional[int] = Field(None, ge=1, le=4096, description="Maximum tokens in the response")
    stream: bool = Field(False, description="Whether to stream the response")
    enable_tts: bool = Field(True, description="Whether to generate TTS for the response")
    tts_voice: str = Field(DEFAULT_VOICE, description="Voice to use for TTS")
    tts_exaggeration: float = Field(0.5, ge=0.0, le=1.0, description="Exaggeration factor for the voice")
    tts_cfg_weight: float = Field(0.5, ge=0.0, le=1.0, description="CFG weight for voice generation")
    
    @validator('tts_voice')
    def validate_voice(cls, v):
        if v not in AVAILABLE_VOICES:
            raise ValueError(f"Voice must be one of {AVAILABLE_VOICES}")
        return v

class ChatResponse(BaseModel):
    message: ChatMessage
    audio_url: Optional[str] = None

class ErrorResponse(BaseModel):
    error: str
    detail: Optional[str] = None
    status_code: int

# Global variables
openai_client = AsyncOpenAI(api_key=os.getenv("OPENAI_API_KEY"))
tts_model = None
device = os.getenv("TTS_DEVICE", "cpu")

# Middleware for error handling
class ErrorHandlerMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        try:
            return await call_next(request)
        except OpenAIError as e:
            logger.error(f"OpenAI API error: {str(e)}")
            return JSONResponse(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                content={"error": "OpenAI API error", "detail": str(e), "status_code": 503}
            )
        except Exception as e:
            logger.exception(f"Unexpected error: {str(e)}")
            return JSONResponse(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                content={"error": "Internal server error", "detail": str(e), "status_code": 500}
            )

app.add_middleware(ErrorHandlerMiddleware)

# Dependency for TTS model
async def get_tts_model():
    global tts_model
    if tts_model is None:
        logger.info(f"Initializing Chatterbox TTS model on {device}")
        try:
            # For CPU device, we need to force all CUDA operations to map to CPU
            if device == "cpu":
                # Set environment to disable CUDA visibility
                os.environ["CUDA_VISIBLE_DEVICES"] = ""
                
                # Monkey patch torch.cuda.is_available to return False
                original_is_available = torch.cuda.is_available
                torch.cuda.is_available = lambda: False
                
                # Patch torch.load to always use CPU mapping
                original_torch_load = torch.load
                def cpu_torch_load(*args, **kwargs):
                    kwargs['map_location'] = 'cpu'
                    return original_torch_load(*args, **kwargs)
                torch.load = cpu_torch_load
                
                try:
                    tts_model = ChatterboxTTS.from_pretrained(device=device)
                    logger.info("Chatterbox TTS model initialized successfully on CPU")
                finally:
                    # Restore original functions
                    torch.cuda.is_available = original_is_available
                    torch.load = original_torch_load
            else:
                tts_model = ChatterboxTTS.from_pretrained(device=device)
                logger.info("Chatterbox TTS model initialized successfully")
                
        except Exception as e:
            logger.exception(f"Failed to initialize Chatterbox TTS model: {str(e)}")
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail="Failed to initialize TTS model"
            )
    return tts_model

# Helper functions
def get_cache_path(text: str, voice: str, exaggeration: float, cfg_weight: float) -> Path:
    """Generate a deterministic path for caching TTS audio."""
    cache_key = f"{text}_{voice}_{exaggeration}_{cfg_weight}"
    filename = f"{uuid.uuid5(uuid.NAMESPACE_URL, cache_key)}.wav"
    return CACHE_DIR / filename

@retry(
    stop=stop_after_attempt(3),
    wait=wait_exponential(multiplier=1, min=1, max=10),
    retry=retry_if_exception_type(Exception)
)
async def generate_speech(
    text: str, 
    voice: str = DEFAULT_VOICE, 
    exaggeration: float = 0.5,
    cfg_weight: float = 0.5,
    tts_model = None
) -> Path:
    """Generate speech from text using Chatterbox TTS."""
    if not tts_model:
        raise ValueError("TTS model not initialized")
    
    # Check cache first
    cache_path = get_cache_path(text, voice, exaggeration, cfg_weight)
    if cache_path.exists():
        logger.info(f"Using cached audio for: {text[:30]}...")
        return cache_path
    
    logger.info(f"Generating speech for: {text[:30]}...")
    
    try:
        # Generate audio with Chatterbox
        audio_prompt_path = None  # Could be customized based on voice selection
        
        # Apply voice-specific settings if needed
        if voice != "default":
            # This would be replaced with actual voice selection logic
            # For now, we're just using the exaggeration parameter
            pass
        
        # Generate audio
        wav = tts_model.generate(
            text,
            audio_prompt_path=audio_prompt_path,
            exaggeration=exaggeration,
            cfg_weight=cfg_weight
        )
        
        # Save to cache
        torchaudio.save(str(cache_path), wav, tts_model.sr)
        logger.info(f"Speech generated and saved to {cache_path}")
        
        return cache_path
    except Exception as e:
        logger.exception(f"Error generating speech: {str(e)}")
        raise

# API Routes
@app.get("/health")
async def health_check():
    """Health check endpoint."""
    return {"status": "healthy", "timestamp": time.time()}

@app.post("/api/tts", response_model=Dict[str, str])
async def text_to_speech(
    request: TTSRequest,
    background_tasks: BackgroundTasks,
    tts_model = Depends(get_tts_model)
):
    """Convert text to speech using Chatterbox TTS."""
    try:
        audio_path = await generate_speech(
            request.text,
            request.voice,
            request.exaggeration,
            request.cfg_weight,
            tts_model
        )
        
        # Return audio file
        return FileResponse(
            path=audio_path,
            media_type="audio/wav",
            filename=f"speech_{uuid.uuid4()}.wav"
        )
    except Exception as e:
        logger.exception(f"TTS error: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"TTS generation failed: {str(e)}"
        )

@app.post("/api/chat", response_model=ChatResponse)
async def chat(
    request: ChatRequest,
    background_tasks: BackgroundTasks,
    tts_model = Depends(get_tts_model)
):
    """Chat with OpenAI model and optionally generate TTS for the response."""
    try:
        # Validate OpenAI API key
        if not os.getenv("OPENAI_API_KEY"):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="OpenAI API key not provided"
            )
        
        # Convert messages to OpenAI format
        messages = [{"role": msg.role, "content": msg.content} for msg in request.messages]
        
        # Get response from OpenAI
        response = await openai_client.chat.completions.create(
            model=request.model,
            messages=messages,
            temperature=request.temperature,
            max_tokens=request.max_tokens,
            stream=False
        )
        
        # Extract assistant message
        assistant_message = response.choices[0].message.content
        
        # Create response object
        chat_response = ChatResponse(
            message=ChatMessage(role="assistant", content=assistant_message),
            audio_url=None
        )
        
        # Generate TTS if enabled
        if request.enable_tts:
            try:
                audio_path = await generate_speech(
                    assistant_message,
                    request.tts_voice,
                    request.tts_exaggeration,
                    request.tts_cfg_weight,
                    tts_model
                )
                
                # Set audio URL
                filename = audio_path.name
                chat_response.audio_url = f"/api/audio/{filename}"
            except Exception as e:
                logger.error(f"TTS generation failed: {str(e)}")
                # Continue without TTS if it fails
        
        return chat_response
    except OpenAIError as e:
        logger.error(f"OpenAI API error: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=f"OpenAI API error: {str(e)}"
        )
    except Exception as e:
        logger.exception(f"Chat error: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Chat failed: {str(e)}"
        )

@app.post("/api/chat/stream")
async def chat_stream(
    request: ChatRequest,
    background_tasks: BackgroundTasks
):
    """Stream chat responses from OpenAI model."""
    if not request.stream:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="This endpoint requires stream=true"
        )
    
    try:
        # Validate OpenAI API key
        if not os.getenv("OPENAI_API_KEY"):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="OpenAI API key not provided"
            )
        
        # Convert messages to OpenAI format
        messages = [{"role": msg.role, "content": msg.content} for msg in request.messages]
        
        async def generate():
            try:
                # Stream response from OpenAI
                stream = await openai_client.chat.completions.create(
                    model=request.model,
                    messages=messages,
                    temperature=request.temperature,
                    max_tokens=request.max_tokens,
                    stream=True
                )
                
                # Yield each chunk
                async for chunk in stream:
                    if chunk.choices and chunk.choices[0].delta.content:
                        content = chunk.choices[0].delta.content
                        yield f"data: {json.dumps({'content': content})}\n\n"
                
                # Signal end of stream
                yield f"data: {json.dumps({'done': True})}\n\n"
            except Exception as e:
                logger.exception(f"Streaming error: {str(e)}")
                yield f"data: {json.dumps({'error': str(e)})}\n\n"
        
        return StreamingResponse(
            generate(),
            media_type="text/event-stream"
        )
    except Exception as e:
        logger.exception(f"Chat stream error: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Chat stream failed: {str(e)}"
        )

@app.get("/api/audio/{filename}")
async def get_audio(filename: str):
    """Serve cached audio files."""
    file_path = CACHE_DIR / filename
    if not file_path.exists():
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Audio file not found"
        )
    
    return FileResponse(
        path=file_path,
        media_type="audio/wav",
        filename=f"speech_{uuid.uuid4()}.wav"
    )

@app.post("/api/voices")
async def list_voices():
    """List available TTS voices."""
    return {"voices": AVAILABLE_VOICES}

# Custom OpenAPI schema
def custom_openapi():
    if app.openapi_schema:
        return app.openapi_schema
    
    openapi_schema = get_openapi(
        title=app.title,
        version=app.version,
        description=app.description,
        routes=app.routes,
    )
    
    # Add custom documentation
    openapi_schema["info"]["x-logo"] = {
        "url": "https://fastapi.tiangolo.com/img/logo-margin/logo-teal.png"
    }
    
    app.openapi_schema = openapi_schema
    return app.openapi_schema

app.openapi = custom_openapi

# Startup event
@app.on_event("startup")
async def startup_event():
    logger.info("Starting LLM Chat TTS API")
    
    # Validate environment variables
    if not os.getenv("OPENAI_API_KEY"):
        logger.warning("OPENAI_API_KEY not set. Chat functionality will be limited.")
    
    # Create cache directory
    CACHE_DIR.mkdir(exist_ok=True)
    
    # Preload TTS model in background
    asyncio.create_task(get_tts_model())

# Shutdown event
@app.on_event("shutdown")
async def shutdown_event():
    logger.info("Shutting down LLM Chat TTS API")
    # Cleanup resources if needed

# Run the application
if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
        log_level="info"
    )
