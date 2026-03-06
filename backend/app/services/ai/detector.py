import logging
from app.config.settings import get_settings

logger = logging.getLogger(__name__)
settings = get_settings()

try:
    # Ensure Gen_AI is in path for imports
    import sys
    if str(settings.GENAI_PATH) not in sys.path:
        sys.path.append(str(settings.GENAI_PATH))
    from app.services.ai.hate_classifier import HateSpeechClassifier, LocalPrediction
except ImportError:
    logger.warning("Could not import HateSpeechClassifier locally.")
    HateSpeechClassifier = None
    LocalPrediction = None

class HateSpeechDetector:
    _instance = None
    _warned_fallback = False

    def __new__(cls):
        if cls._instance is None:
            cls._instance = super(HateSpeechDetector, cls).__new__(cls)
            cls._instance.model = None
            if HateSpeechClassifier:
                try:
                    logger.info("Loading s-nlp RoBERTa toxicity model...")
                    cls._instance.model = HateSpeechClassifier(
                        model_path=str(settings.MODEL_PATH)
                    )
                except Exception as e:
                    logger.error(f"Error loading HateSpeechClassifier: {e}")
        return cls._instance

    async def predict(self, text: str):
        if not self.model:
            # Fallback mock for unrelated dev or if model missing
            if not self._warned_fallback:
                print(
                    "Warning: HateSpeechDetector running in fallback mode (no model loaded)."
                )
                self._warned_fallback = True
            # Return a LocalPrediction object
            if LocalPrediction:
                return LocalPrediction(is_hate=False, probability=0.0, label="safe")
            else:
                # Fallback if LocalPrediction not available
                return type(
                    "obj",
                    (object,),
                    {"is_hate": False, "probability": 0.0, "label": "safe"},
                )()

        # Model returns LocalPrediction dataclass
        result = self.model.predict(text)

        # Return the LocalPrediction object directly
        return result
