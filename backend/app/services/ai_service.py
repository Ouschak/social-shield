import logging
from app.config.settings import get_settings

logger = logging.getLogger(__name__)
settings = get_settings()

try:
    import sys
    sys.path.append(str(settings.GENAI_PATH))
    from ml.hate_classifier import HateSpeechClassifier
except ImportError:
    logger.warning(f"Could not import HateSpeechClassifier from {settings.GENAI_PATH}")
    HateSpeechClassifier = None

class AIService:
    def __init__(self):
        self.classifier = None
        if HateSpeechClassifier:
            try:
                self.classifier = HateSpeechClassifier(model_path=str(settings.MODEL_PATH))
            except Exception as e:
                logger.error(f"Error loading HateSpeechClassifier: {e}")

    async def analyze_text(self, text: str):
        if not self.classifier:
            return {"error": "AI Model not available", "score": 0.0, "label": "unknown"}

        # specific logic depends on HateClassifier implementation
        # Assuming it has a predict method
        try:
            # result = {"hate": bool, "confidence": float}
            result = self.classifier.predict(text)

            is_toxic = result.get("hate", False)
            confidence = result.get("confidence", 0.0)

            return {
                "is_toxic": is_toxic,
                "score": confidence,
                "confidence": confidence,
                "label": "toxic" if is_toxic else "safe",
            }
        except Exception as e:
            return {"error": str(e)}


ai_service = AIService()
