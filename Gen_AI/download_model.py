from transformers import AutoTokenizer, AutoModelForSequenceClassification

# MODEL_NAME = "facebook/roberta-hate-speech-dynabench-r4-target"
MODEL_NAME = "s-nlp/roberta_toxicity_classifier"

def download_model():
    print(f"Downloading model: {MODEL_NAME}...")
    tokenizer = AutoTokenizer.from_pretrained(MODEL_NAME)
    model = AutoModelForSequenceClassification.from_pretrained(MODEL_NAME)

    print("Saving model to ./model directory...")
    tokenizer.save_pretrained("model")
    model.save_pretrained("model")
    print("Done! Model saved to ./model")


if __name__ == "__main__":
    download_model()

    # Verification: Try to load and run the model locally
    try:
        print("\nVerifying model load...")
        tokenizer = AutoTokenizer.from_pretrained("model", local_files_only=True)#remove this line local_files_only=True if you want to download the model from huggingface
        model = AutoModelForSequenceClassification.from_pretrained(
            "model", local_files_only=True#remove this line local_files_only=True if you want to download the model from huggingface
        )

        batch = tokenizer.encode("You are amazing!", return_tensors="pt")
        output = model(batch)
        print("Verification successful: Model loaded and ran on test input.")
    except Exception as e:
        print(f"Verification failed: {e}")

