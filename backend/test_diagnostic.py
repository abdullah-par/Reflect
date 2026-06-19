import os
import sys
import json

# Adjust path if needed
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from intelligence import run_diagnostic

entries = [
    "I'm feeling so overwhelmed today. My boss keeps piling on work and I can't say no. I just sit at my desk and freeze, then I get mad at myself for not being productive.",
    "Sarah flaked on me again. That's the third time this month. I always try to be supportive and accommodating, but it feels so transactional. Why do I keep investing in this?",
    "Had a great day! Finally finished that project. But now I'm worried about the next one. What if it's too hard? I should probably start working on it right now even though it's 10 PM."
]

def test():
    print("Testing run_diagnostic LLM JSON parsing stability...\n")
    for i, entry in enumerate(entries):
        print(f"--- Testing Entry {i+1} ---")
        print(f"Content: {entry}\n")
        
        # Call the actual diagnostic function (dummy user_id 1)
        # The function already handles LLM invocation and JSON parsing
        result = run_diagnostic(entry, 1)
        
        print("Parsed Result:")
        print(json.dumps(result, indent=2))
        print("\n" + "="*50 + "\n")

if __name__ == "__main__":
    test()
