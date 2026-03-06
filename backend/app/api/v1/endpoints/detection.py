import logging
from fastapi import APIRouter, Depends

logger = logging.getLogger(__name__)
try:
    from app.services.ai.setfit_detector import SetFitDetector
except ImportError:
    logger.warning("Could not import SetFitDetector. Check module path.")
    SetFitDetector = None

from app.services.ai.detector import HateSpeechDetector
from pydantic import BaseModel
from fastapi.concurrency import run_in_threadpool
from app.services.ai.openai_moderator import moderate

router = APIRouter()
detector = HateSpeechDetector()

# Initialize SetFitDetector
soft_detector = None
if SetFitDetector:
    try:
        soft_detector = SetFitDetector()
    except Exception as e:
        logger.error(f"Error initializing SetFitDetector: {e}")


class AnalyzeRequest(BaseModel):
    text: str
    check_soft_harassment: bool = False


class AnalyzeResponse(BaseModel):
    text: str
    is_toxic: bool
    score: float
    label: str
    confidence: float
    source: str


# Thresholds
FALLBACK_THRESHOLD = 0.70


@router.post("/analyze", response_model=AnalyzeResponse)
async def analyze_text(request: AnalyzeRequest):
    # DEBUG: Print exact incoming request
    # print(f"\n[DEBUG REQUEST] {request.model_dump()}")

    # Trace execution path
    trace = ["Local"]
    
    local = await detector.predict(request.text)

    # Double-check with OpenAI if the local model isn't sure
    if local.probability < FALLBACK_THRESHOLD:
        trace.append("OpenAI")
        try:
            openai_result = await run_in_threadpool(moderate, request.text)
            result = {**openai_result, "source": "OPENAI"}
        except Exception:
            # OpenAI failed, just use what we have
            result = {
                "is_toxic": local.is_hate,
                "score": local.probability,
                "confidence": local.probability,
                "label": local.label,
                "source": "LOCAL_FALLBACK",
            }
    else:
        result = {
            "is_toxic": local.is_hate,
            "score": local.probability,
            "confidence": local.probability,
            "label": local.label,
            "source": "LOCAL_MODEL",
        }

    # TIER 3: Soft Harassment Check (SetFit)
    # Only run if:
    # 1. User enabled it (check_soft_harassment=True)
    # 2. Previous tiers said SAFE (don't override if already TOXIC)
    if request.check_soft_harassment and not result["is_toxic"] and soft_detector:
        trace.append("SetFit")
        is_harassment = soft_detector.predict(request.text)
        if is_harassment:
            result["is_toxic"] = True
            result["label"] = "harassment"
            result["source"] = "SETFIT (Soft Harassment)"
            result["score"] = 0.8
        else:
            # Optional: Indicate that SetFit checked it but found it safe
            result["source"] = "SETFIT (Safe)"
            
    status = "TOXIC" if result["is_toxic"] else "SAFE"
    mode = "PREMIUM" if request.check_soft_harassment else "FREE_MODE"
    pipeline_str = "->".join(trace)
    
    # Smart Log Format
    # Example: [ANALYSIS] Mode: PREMIUM | Pipeline: Local->OpenAI->SetFit | Result: SAFE ...
    logger.info(f"Mode: {mode:<9} | Pipeline: {pipeline_str:<25} | Result: {status:<5} | Score: {result['score']:.2f} | Src: {result['source']} | \"{request.text[:50]}\"")

    return AnalyzeResponse(
        text=request.text,
        is_toxic=result["is_toxic"],
        score=result["score"],
        confidence=result["confidence"],
        label=result["label"],
        source=result["source"],
    )
