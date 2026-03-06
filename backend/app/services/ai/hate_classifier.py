import torch
from transformers import AutoTokenizer, AutoModelForSequenceClassification
from dataclasses import dataclass


MODEL_NAME = "s-nlp/roberta_toxicity_classifier"


@dataclass
class LocalPrediction:
    is_hate: bool
    probability: float
    label: str


class HateSpeechClassifier:
    def __init__(self, model_path: str = None):
        target_model = model_path if model_path else MODEL_NAME
        print(f"Loading model: {target_model}")
        
        # Load params based on whether it's a local path or repo name
        load_args = {"local_files_only": True} if model_path else {}
        if model_path:
             load_args["use_safetensors"] = True

        self.tokenizer = AutoTokenizer.from_pretrained(target_model, **load_args)
        self.model = AutoModelForSequenceClassification.from_pretrained(target_model, **load_args)
        
        self.device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
        self.model.to(self.device)
        self.model.eval()
        print(f"Model loaded on: {self.device}")

    def predict(self, text: str) -> LocalPrediction:
        """
        Run the model on input text.
        """
        inputs = self.tokenizer(
            text, return_tensors="pt", truncation=True, max_length=512
        )
        inputs = {k: v.to(self.device) for k, v in inputs.items()}

        with torch.no_grad():
            outputs = self.model(**inputs)

        logits = outputs.logits
        probs = torch.softmax(logits, dim=-1)[0]

        # Index 1 = Toxic, Index 0 = Neutral
        hate_prob = float(probs[1])
        is_hate = hate_prob >= 0.5

        return LocalPrediction(
            is_hate=is_hate, probability=hate_prob, label="toxic" if is_hate else "neutral"
        )
