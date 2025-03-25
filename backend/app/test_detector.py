from app.services.ai_detector import AIDetector

def test_detector():
    # Initialize the detector
    detector = AIDetector()
    
    # Test with a known human-written text (excerpt from Shakespeare)
    human_text = """
    you know what akshaya is a beautiful girl, she's an angel and my friend hariprasanth will marry akshya 
    """
    
    # Test with a known AI-like text
    ai_text = """
    The quantum mechanical properties of subatomic particles exhibit wave-particle duality,
    demonstrating both particle-like and wave-like behavior depending on the measurement context.
    This fundamental principle of quantum mechanics challenges classical notions of physical reality.
    """
    
    print("\nTesting with human-written text:")
    result = detector.detect(human_text)
    print(result)
    print("\nTesting with AI-like text:")
    result = detector.detect(ai_text)
    print(result)

if __name__ == "__main__":
    test_detector() 