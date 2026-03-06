
import logging
import sys
from pathlib import Path
from sklearn.metrics import f1_score, confusion_matrix, precision_score, recall_score

# Add backend directory to path so we can import services
sys.path.append(str(Path(__file__).resolve().parents[1]))

from app.services.ai.setfit_detector import SetFitDetector

# Configure logging
logging.basicConfig(level=logging.ERROR)

def run_tests():
    print("Initializing SetFit Detector...")
    detector = SetFitDetector()
    
    # Ground Truths:
    # POSITIVE / NEUTRAL -> 0 (Safe)
    # CRITICISM -> 1 (Harassment/Discouraging) 
    # (Assuming user wants to detect negative sentiment even if polite, consistent with 'Soft Discouraging')
    
    categories = {
        "POSITIVE / NEUTRAL": {
            "label": 0,
            "comments": [
                "this was interesting to watch", "i kinda liked this explanation", "makes more sense now honestly", 
                "didn’t think about it like that", "this helped a bit", "pretty chill content overall", 
                "not bad actually", "i found this useful", "simple way to explain it", 
                "this was easy to follow", "decent breakdown of the topic", "learned something small from this", 
                "this cleared up some confusion", "lowkey informative", "i get what you mean here", 
                "not super complicated which helps", "this was alright", "i liked how this was explained", 
                "makes it easier to understand", "helpful for people starting out", 
                "this answered part of my question", "pretty understandable explanation", "this gave some clarity", 
                "simple and straightforward", "nice way to look at it", "not overwhelming at all", 
                "this was calm to watch", "useful enough for me", "i followed along fine", 
                "explains the basics well", "this helped more than expected", "good pacing on this", 
                "this was fairly clear", "informative without being too much", "this made things simpler", 
                "i appreciate this approach", "not confusing which is good", "decent explanation overall", 
                "this makes more sense now", "helpful context here", "easy enough to understand", 
                "this filled some gaps", "not bad for a quick watch", "this was explained clearly", 
                "simple explanation works", "i liked this format", "useful perspective", 
                "this was understandable", "makes learning easier", "pretty helpful overall"
            ]
        },
        "CRITICISM": {
            "label": 1,
            "comments": [
                "this didn’t really hold my attention", "kinda hard to stay focused on this", "not sure this added much", 
                "feels a bit repetitive", "this was less interesting than usual", "something feels off lately", 
                "didn’t get much from this one", "this felt a little flat", "not as engaging as before", 
                "this one didn’t really land", "felt like something was missing", "not sure who this is for", 
                "this didn’t really stick", "feels different from earlier posts", "this was harder to follow", 
                "not much stood out here", "felt a bit dragged out", "this didn’t feel very memorable", 
                "kind of lost interest halfway", "not as clear as expected", "this felt less polished", 
                "didn’t really connect with this", "something about this feels rushed", "not very engaging this time", 
                "this one felt weaker", "didn’t find this very helpful", "this didn’t add anything new", 
                "felt less thoughtful than usual", "this didn’t really explain much", "not sure this was necessary", 
                "this felt a bit empty", "harder to get into lately", "not much value for me here", 
                "this didn’t really work for me", "felt less intentional", "not as clear as it could be", 
                "this one felt forgettable", "didn’t really keep my interest", "feels like something changed", 
                "not the strongest post", "this felt less focused", "not very compelling honestly", 
                "didn’t feel very engaging", "this one didn’t do much", "felt less refined", 
                "not really feeling this lately", "this didn’t stand out", "feels like a filler post", 
                "not as helpful as expected", "this felt underwhelming"
            ]
        }
    }

    all_predictions = []
    all_ground_truths = []
    
    fp_comments = []
    fn_comments = []

    print(f"\nTesting metrics with Threshold = 0.75...\n")
    
    for category_name, data in categories.items():
        ground_truth = data["label"]
        comments = data["comments"]
        
        for comment in comments:
            probs = detector.model.predict_proba([comment])[0]
            harassment_score = probs[0]
            prediction = 1 if harassment_score >= 0.75 else 0
            
            all_predictions.append(prediction)
            all_ground_truths.append(ground_truth)
            
            # Identify FP/FN
            if prediction == 1 and ground_truth == 0:
                fp_comments.append((comment, harassment_score, category_name))
            elif prediction == 0 and ground_truth == 1:
                fn_comments.append((comment, harassment_score, category_name))

    # Calculate Metrics
    f1 = f1_score(all_ground_truths, all_predictions)
    precision = precision_score(all_ground_truths, all_predictions, zero_division=0)
    recall = recall_score(all_ground_truths, all_predictions, zero_division=0)
    tn, fp, fn, tp = confusion_matrix(all_ground_truths, all_predictions).ravel()

    print(f"{'METRIC':<15} | {'VALUE':<10}")
    print("-" * 30)
    print(f"{'F1 Score':<15} | {f1:.4f}")
    print(f"{'Precision':<15} | {precision:.4f}")
    print(f"{'Recall':<15} | {recall:.4f}")
    print("-" * 30)
    print(f"{'True Positives':<15} | {tp}")
    print(f"{'True Negatives':<15} | {tn}")
    print(f"{'False Positives':<15} | {fp}")
    print(f"{'False Negatives':<15} | {fn}")
    
    print("\n\n=== FALSE POSITIVES (Ground Truth: SAFE, Predicted: HARASSMENT) ===")
    if not fp_comments:
        print("None")
    for c, score, cat in fp_comments:
        print(f"[{cat}] '{c}' -> Score: {score:.3f}")
        
    print("\n\n=== FALSE NEGATIVES (Ground Truth: CRITICISM, Predicted: SAFE) ===")
    if not fn_comments:
        print("None")
    for c, score, cat in fn_comments:
        print(f"[{cat}] '{c}' -> Score: {score:.3f}")
        
    print(f"\n\n{'CATEGORY':<30} | {'COMMENT':<40} | {'PREDICTION':<10} | {'SCORE':<5}")
    print("-" * 95)
    for category_name, data in categories.items():
        for comment in data["comments"]:
            probs = detector.model.predict_proba([comment])[0]
            score = probs[0]
            pred_label = "HARASSMENT" if score >= 0.75 else "SAFE"
            print(f"{category_name:<30} | {(comment[:37]+'...') if len(comment)>37 else comment:<40} | {pred_label:<10} | {score:.3f}")

if __name__ == "__main__":
    run_tests()
