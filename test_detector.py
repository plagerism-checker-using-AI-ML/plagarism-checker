from backend.app.services.ai_detector import AIDetector

def main():
    print("Initializing AI Detector...")
    detector = AIDetector()
    
    # Test with a simple human-written text
    human_text = "Hello, this is a simple test message written by a human."
    
    print("\nTesting with human-written text:")
    print("Text:", human_text)
    result = detector.detect(human_text)
    
    # Test with a longer text
    longer_text = """
    This is a longer piece of text that should be clearly human-written.
    It contains natural variations in language and structure.
    The writing style is conversational and includes some imperfections
    that are typical of human writing.
    """
    
    print("\nTesting with longer human-written text:")
    print("Text:", longer_text[:100] + "...")
    result = detector.detect(longer_text)

if __name__ == "__main__":
    main() 