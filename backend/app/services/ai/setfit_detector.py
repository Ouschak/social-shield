from setfit import SetFitModel
import logging
from pathlib import Path
from transformers import logging as transformers_logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Suppress HuggingFace/Transformers noise
transformers_logging.set_verbosity_error()

class SetFitDetector:
    def __init__(self, model_path: str = None):
        """
        Initialize the SetFitDetector with a saved model.
        """
        if model_path is None:
            # Default to 'setfit_model' in Gen_AI directory
            model_path = str(Path(__file__).resolve().parents[4] / "Gen_AI" / "setfit_model")
            
        logger.info(f"Loading SetFit model from {model_path}...")
        try:
            self.model = SetFitModel.from_pretrained(model_path)
            logger.info("SetFit model loaded successfully.")
        except Exception as e:
            logger.error(f"Failed to load SetFit model: {e}")
            self.model = None

    def predict(self, text: str, threshold: float = 0.75) -> bool:
        """
        Analyze text for harassment content.
        """
        if not self.model:
            logger.warning("SetFit model is not loaded. Skipping detection.")
            return False

        try:
            # Based on debug output: Index 0 = Safe, Index 1 = Harassment
            probs = self.model.predict_proba([text], show_progress_bar=False)[0]
            harassment_prob = probs[1]
            
            return float(harassment_prob) >= threshold
            
        except Exception as e:
            logger.error(f"Error during prediction: {e}")
            return False
