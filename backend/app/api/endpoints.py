from fastapi import APIRouter, HTTPException, Depends, BackgroundTasks
from typing import Dict, List, Any
import datetime
import asyncio
from app.core.models import PlagiarismRequest, PlagiarismResponse, PlagiarismResult, AIDetectionResult
from app.services.plagiarism_checker import PlagiarismChecker
from app.services.ai_detector import AIDetector
from app.utils.pdf_extractor import PDFExtractor
import logging

# Configure logging
logging.basicConfig(level=logging.INFO, 
                   format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# Create router
router = APIRouter()

# Initialize services
pdf_extractor = PDFExtractor()
plagiarism_checker = PlagiarismChecker()
ai_detector = AIDetector()

@router.post("/check-plagiarism", response_model=PlagiarismResponse)
async def check_plagiarism(request: PlagiarismRequest):
    """
    Checks a PDF document for plagiarism and AI-generated content
    """
    try:
        # Log request
        logger.info(f"Received plagiarism check request for URL: {request.pdf_url}")

        # Download PDF
        pdf_content = await pdf_extractor.download_pdf(str(request.pdf_url))
        
        # Extract and process PDF into sections
        sections = pdf_extractor.extract_and_process(pdf_content)
        
        # Combine all sections for plagiarism check
        full_text = " ".join(sections.values())
        
        # Get total word count
        total_word_count = len(full_text.split())
        
        # Check for plagiarism
        if request.check_online_sources:
            # Check plagiarism against online scholarly sources
            plagiarism_results = plagiarism_checker.check_plagiarism_with_scholarly_search(
                full_text, 
                num_papers=request.num_papers, 
                thresholds=request.thresholds
            )
        else:
            # Use default reference texts (empty in this case - would need to be populated)
            reference_texts = []
            plagiarism_results = plagiarism_checker.check_plagiarism(
                full_text, 
                reference_texts, 
                thresholds=request.thresholds
            )
        
        # Get AI detection results
        ai_detection_results = ai_detector.analyze_sections(sections)
        
        # Calculate overall plagiarism score
        plagiarism_overall_score = 0.0
        if plagiarism_results:
            # Average of top 3 scores or all scores if less than 3
            top_scores = [result['overall_score'] for result in plagiarism_results[:min(3, len(plagiarism_results))]]
            plagiarism_overall_score = sum(top_scores) / len(top_scores) if top_scores else 0.0
        
        # Find highest match
        highest_match = plagiarism_results[0] if plagiarism_results else None
        
        # Create response
        response = PlagiarismResponse(
            success=True,
            message="Plagiarism and AI detection completed successfully",
            sections=sections,
            plagiarism_results=plagiarism_results,
            ai_detection_results=ai_detection_results,
            total_word_count=total_word_count,
            plagiarism_overall_score=plagiarism_overall_score,
            highest_match=highest_match,
            timestamp=datetime.datetime.now().isoformat()
        )
        
        return response
        
    except Exception as e:
        logger.error(f"Error processing request: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error processing request: {str(e)}") 