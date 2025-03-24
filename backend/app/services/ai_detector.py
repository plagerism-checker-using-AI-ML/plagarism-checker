import torch
from transformers import AutoTokenizer, AutoModelForSequenceClassification
import numpy as np
from typing import Dict, List, Any, Union

class AIDetector:
    def __init__(self, model_name="roberta-base-openai-detector"):
        """
        Initialize the AI detector with a pre-trained model.
        
        Args:
            model_name (str): HuggingFace model name or path to use for detection
        """
        self.tokenizer = AutoTokenizer.from_pretrained(model_name)
        self.model = AutoModelForSequenceClassification.from_pretrained(model_name)
        self.model.eval()
        
    def detect(self, text: str, threshold: float = 0.7) -> Dict[str, Any]:
        """
        Detect if the given text was likely AI-generated.
        
        Args:
            text (str): The text to analyze
            threshold (float): Confidence threshold for classification
            
        Returns:
            dict: Results containing prediction, confidence scores and classification
        """
        # Handle empty text or text that's too short
        if not text or len(text) < 10:
            return {
                "human_probability": 1.0,
                "ai_probability": 0.0,
                "is_ai_generated": False,
                "confidence": 1.0
            }
            
        inputs = self.tokenizer(text, return_tensors="pt", truncation=True, max_length=512)
        
        with torch.no_grad():
            outputs = self.model(**inputs)
            logits = outputs.logits
            
        probabilities = torch.softmax(logits, dim=1).squeeze().tolist()
        
        # Make sure probabilities is a list even if there's only one element
        if not isinstance(probabilities, list):
            probabilities = [probabilities]
        
        result = {
            "human_probability": float(probabilities[0]),
            "ai_probability": float(probabilities[1]),
            "is_ai_generated": float(probabilities[1]) > threshold,
            "confidence": float(max(probabilities))
        }
        
        return result
    
    def batch_detect(self, texts: List[str], threshold: float = 0.7) -> List[Dict[str, Any]]:
        """
        Run detection on a batch of texts.
        
        Args:
            texts (list): List of text strings to analyze
            threshold (float): Confidence threshold for classification
            
        Returns:
            list: List of detection results for each text
        """
        results = []
        for text in texts:
            results.append(self.detect(text, threshold))
        return results
    
    def analyze_sections(self, sections: Dict[str, str], threshold: float = 0.7) -> Dict[str, Any]:
        """
        Analyze different sections of a document for AI-generated content.
        
        Args:
            sections (dict): Dictionary mapping section names to their content
            threshold (float): Confidence threshold for classification
            
        Returns:
            dict: Results containing overall assessment and per-section results
        """
        section_results = {}
        overall_ai_probability = 0.0
        total_words = 0
        
        for section_name, section_text in sections.items():
            # Skip empty sections or too short sections
            if not section_text or len(section_text.split()) < 10:
                continue
                
            # Get word count
            word_count = len(section_text.split())
            total_words += word_count
            
            # Detect AI for this section
            result = self.detect(section_text, threshold)
            
            # Calculate weighted contribution to overall probability
            overall_ai_probability += result["ai_probability"] * word_count
            
            # Store section result
            section_results[section_name] = {
                "ai_probability": result["ai_probability"],
                "human_probability": result["human_probability"],
                "is_ai_generated": result["is_ai_generated"],
                "confidence": result["confidence"],
                "word_count": word_count
            }
        
        # Calculate overall AI probability weighted by section length
        if total_words > 0:
            overall_ai_probability /= total_words
        else:
            overall_ai_probability = 0.0
        
        return {
            "overall_ai_probability": overall_ai_probability,
            "overall_human_probability": 1.0 - overall_ai_probability,
            "overall_is_ai_generated": overall_ai_probability > threshold,
            "section_results": section_results
        } 