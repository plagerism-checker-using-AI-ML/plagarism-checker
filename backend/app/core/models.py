from pydantic import BaseModel, Field, HttpUrl
from typing import Dict, List, Optional, Any, Union

class PlagiarismRequest(BaseModel):
    """
    Request model for plagiarism detection
    """
    pdf_url: HttpUrl = Field(..., description="URL to the PDF file to analyze")
    check_online_sources: bool = Field(
        default=False, 
        description="Whether to check for plagiarism against online scholarly sources"
    )
    num_papers: int = Field(
        default=3, 
        description="Number of papers to retrieve from each scholarly source for comparison"
    )
    thresholds: Optional[Dict[str, float]] = Field(
        default=None,
        description="Custom thresholds for plagiarism detection methods"
    )
    
class PaperInfo(BaseModel):
    """
    Information about a paper
    """
    title: str
    link: str
    source: str
    author: str
    
class PlagiarismResult(BaseModel):
    """
    Result of plagiarism comparison with one reference
    """
    reference_id: Union[int, str]
    is_plagiarized: bool
    overall_score: float
    semantic_similarity: float
    ngram_similarity: float
    fuzzy_similarity: float
    reference_text: str
    paper_info: Optional[PaperInfo] = None
    
class SectionAIResult(BaseModel):
    """
    AI detection result for a specific section
    """
    ai_probability: float
    human_probability: float
    is_ai_generated: bool
    confidence: float
    word_count: int
    
class AIDetectionResult(BaseModel):
    """
    Overall AI detection result
    """
    overall_ai_probability: float
    overall_human_probability: float
    overall_is_ai_generated: bool
    section_results: Dict[str, SectionAIResult]
    
class PlagiarismResponse(BaseModel):
    """
    Response model for plagiarism detection
    """
    success: bool = True
    message: str = "Plagiarism detection completed successfully."
    sections: Dict[str, str]
    plagiarism_results: List[PlagiarismResult]
    ai_detection_results: AIDetectionResult
    total_word_count: int
    plagiarism_overall_score: float
    highest_match: Optional[PlagiarismResult] = None
    timestamp: str 