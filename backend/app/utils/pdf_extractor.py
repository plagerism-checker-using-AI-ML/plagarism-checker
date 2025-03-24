import PyPDF2
import re
import io
import requests
import nltk
from nltk.tokenize import sent_tokenize
from typing import Dict, List, Tuple

class PDFExtractor:
    def __init__(self):
        # Ensure NLTK resources are downloaded
        try:
            nltk.data.find('tokenizers/punkt')
        except LookupError:
            nltk.download('punkt')
        
        # Define section patterns
        self.section_patterns = {
            "title": r"(?i)^(?!abstract|introduction|methodology|methods|results|discussion|conclusion|references|acknowledgements).*$",
            "abstract": r"(?i)^abstract",
            "introduction": r"(?i)^(?:1\.\s*)?introduction",
            "methodology": r"(?i)^(?:2\.\s*)?(?:methodology|methods|materials and methods|experimental setup)",
            "results": r"(?i)^(?:3\.\s*)?results",
            "discussion": r"(?i)^(?:4\.\s*)?discussion",
            "conclusion": r"(?i)^(?:5\.\s*)?(?:conclusion|conclusions)",
            "acknowledgements": r"(?i)^(?:6\.\s*)?(?:acknowledgements|acknowledgments|acknowledgement)",
            "references": r"(?i)^(?:7\.\s*)?(?:references|bibliography|works cited|literature cited)"
        }
    
    async def download_pdf(self, url: str) -> bytes:
        """
        Download PDF file from URL
        
        Args:
            url: URL to the PDF file
            
        Returns:
            PDF content as bytes
        """
        try:
            headers = {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
            }
            
            response = requests.get(url, headers=headers, timeout=30)
            response.raise_for_status()  # Raise exception for bad status codes
            
            return response.content
        except Exception as e:
            raise Exception(f"Failed to download PDF: {str(e)}")
    
    def extract_text_from_pdf(self, pdf_content: bytes) -> str:
        """
        Extract text from a PDF file
        
        Args:
            pdf_content: PDF content as bytes
            
        Returns:
            Extracted text as string
        """
        try:
            pdf_reader = PyPDF2.PdfReader(io.BytesIO(pdf_content))
            text = ""
            
            for page_num in range(len(pdf_reader.pages)):
                page = pdf_reader.pages[page_num]
                text += page.extract_text() + "\n"
                
            return text
        except Exception as e:
            raise Exception(f"Failed to extract text from PDF: {str(e)}")
    
    def preprocess_text(self, text: str) -> str:
        """
        Clean and preprocess extracted text
        
        Args:
            text: Raw text from PDF
            
        Returns:
            Preprocessed text
        """
        # Replace multiple newlines with a single newline
        text = re.sub(r'\n+', '\n', text)
        
        # Replace multiple spaces with a single space
        text = re.sub(r'\s+', ' ', text)
        
        # Remove page numbers
        text = re.sub(r'\b\d+\s*\|\s*P a g e\b', '', text, flags=re.IGNORECASE)
        text = re.sub(r'\bpage\s*\d+\s*of\s*\d+\b', '', text, flags=re.IGNORECASE)
        
        # Remove headers and footers (common patterns)
        text = re.sub(r'\b(?:confidential|draft|internal use only)\b', '', text, flags=re.IGNORECASE)
        
        return text.strip()
    
    def identify_section_boundaries(self, text: str) -> List[Tuple[str, int, int]]:
        """
        Identify the start and end positions of each section
        
        Args:
            text: Preprocessed text
            
        Returns:
            List of tuples containing (section_name, start_position, end_position)
        """
        # Split text into lines
        lines = text.split('\n')
        
        # Identify section headings and their positions
        section_boundaries = []
        for i, line in enumerate(lines):
            line = line.strip()
            if not line:
                continue
                
            for section, pattern in self.section_patterns.items():
                if re.search(pattern, line, re.IGNORECASE):
                    # Found a section heading
                    section_boundaries.append((section, i))
                    break
        
        # Convert line positions to actual positions in the text
        char_positions = []
        char_pos = 0
        for i, line in enumerate(lines):
            for section, line_pos in section_boundaries:
                if i == line_pos:
                    char_positions.append((section, char_pos))
            char_pos += len(line) + 1  # +1 for the newline
        
        # Create section ranges (start and end positions)
        sections = []
        for i, (section, start_pos) in enumerate(char_positions):
            end_pos = char_positions[i+1][1] if i < len(char_positions)-1 else len(text)
            sections.append((section, start_pos, end_pos))
            
        return sections
    
    def extract_sections(self, text: str) -> Dict[str, str]:
        """
        Extract different sections from the text
        
        Args:
            text: Preprocessed text
            
        Returns:
            Dictionary mapping section names to their content
        """
        # Get section boundaries
        section_boundaries = self.identify_section_boundaries(text)
        
        # Extract each section's content
        sections = {}
        for section, start_pos, end_pos in section_boundaries:
            section_content = text[start_pos:end_pos].strip()
            sections[section] = section_content
        
        # If no sections were found, treat the entire text as one section
        if not sections:
            sections["unknown"] = text
            
        return sections
    
    def extract_and_process(self, pdf_content: bytes) -> Dict[str, str]:
        """
        Extract text from PDF and separate into sections
        
        Args:
            pdf_content: PDF content as bytes
            
        Returns:
            Dictionary with extracted sections
        """
        # Extract text from PDF
        raw_text = self.extract_text_from_pdf(pdf_content)
        
        # Preprocess text
        preprocessed_text = self.preprocess_text(raw_text)
        
        # Extract sections
        sections = self.extract_sections(preprocessed_text)
        
        return sections 