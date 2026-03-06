from fastapi import APIRouter, Request, HTTPException
from app.config.settings import get_settings
from app.services.ai.detector import HateSpeechDetector
from app.websocket.manager import manager
import hmac
import hashlib

router = APIRouter()
settings = get_settings()
detector = HateSpeechDetector()

@router.get("/instagram")
async def verify_webhook(
    hub_mode: str = None,
    hub_verify_token: str = None,
    hub_challenge: str = None
):
    """Vérification webhook Meta"""
    if hub_mode == "subscribe" and hub_verify_token == settings.META_VERIFY_TOKEN:
        return int(hub_challenge)
    raise HTTPException(403, "Verification failed")

@router.post("/instagram")
async def receive_webhook(request: Request):
    """Recevoir événements Instagram"""
    body = await request.body()
    
    # Vérifier signature
    signature = request.headers.get("X-Hub-Signature-256", "")
    expected = "sha256=" + hmac.new(
        settings.META_APP_SECRET.encode(),
        body,
        hashlib.sha256
    ).hexdigest()
    
    # Allow bypass in debug/dev if signature empty or mismatch
    if settings.DEBUG and not signature:
        pass # Skip check
    elif not hmac.compare_digest(signature, expected):
        raise HTTPException(403, "Invalid signature")
    
    data = await request.json()
    
    # Traiter événements
    for entry in data.get("entry", []):
        for change in entry.get("changes", []):
            if change.get("field") == "comments":
                await process_comment(change["value"])
    
    return {"status": "ok"}

async def process_comment(comment_data: dict):
    """Analyser commentaire et notifier si toxique"""
    text = comment_data.get("text", "")
    
    result = await detector.predict(text)
    
    if result.is_hate:
        # Notifier via WebSocket
        payload = {
            "type": "NEW_DETECTION",
            "payload": {
                "content": text,
                "confidence": result.probability,
                "platform": "instagram",
                "label": result.label,
                "timestamp": None # Add timestamp if needed
            }
        }
        await manager.broadcast(payload) 
