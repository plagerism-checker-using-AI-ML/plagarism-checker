# Plagiarism Detection API

A FastAPI-based backend service for detecting plagiarism and AI-generated content in academic papers.

## Features

- PDF text extraction and section separation
- Plagiarism detection using multiple techniques:
  - Semantic similarity (BERT)
  - N-gram similarity
  - Fuzzy matching
- AI-generated content detection
- Scholarly database search for comparison (optional)
- Section-by-section analysis

## Installation and Setup

```bash
cd backend
pip install -r requirements.txt
python run.py
```

## API Documentation

Interactive API documentation is available at:
- Swagger UI: http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc

## API Endpoints

### Check Plagiarism

```
POST /api/check-plagiarism
```

Request body:
```json
{
  "pdf_url": "https://example.com/paper.pdf",
  "check_online_sources": true,
  "num_papers": 3,
  "thresholds": {
    "semantic": 0.85,
    "ngram": 0.4,
    "fuzzy": 0.7
  }
}
```

Response:
```json
{
  "success": true,
  "message": "Plagiarism detection completed successfully.",
  "sections": {
    "title": "...",
    "abstract": "...",
    "introduction": "..."
  },
  "plagiarism_results": [
    {
      "reference_id": 0,
      "is_plagiarized": true,
      "overall_score": 0.92,
      "semantic_similarity": 0.95,
      "ngram_similarity": 0.88,
      "fuzzy_similarity": 0.93,
      "reference_text": "...",
      "paper_info": {
        "title": "Paper Title",
        "link": "https://example.com/paper",
        "source": "Google Scholar",
        "author": "Author Name"
      }
    }
  ],
  "ai_detection_results": {
    "overall_ai_probability": 0.78,
    "overall_human_probability": 0.22,
    "overall_is_ai_generated": true,
    "section_results": {
      "abstract": {
        "ai_probability": 0.82,
        "human_probability": 0.18,
        "is_ai_generated": true,
        "confidence": 0.82,
        "word_count": 120
      }
    }
  },
  "total_word_count": 1250,
  "plagiarism_overall_score": 0.92,
  "highest_match": {
    "reference_id": 0,
    "is_plagiarized": true,
    "overall_score": 0.92,
    "semantic_similarity": 0.95,
    "ngram_similarity": 0.88,
    "fuzzy_similarity": 0.93,
    "reference_text": "...",
    "paper_info": {
      "title": "Paper Title",
      "link": "https://example.com/paper",
      "source": "Google Scholar",
      "author": "Author Name"
    }
  },
  "timestamp": "2023-07-25T14:30:15.123456"
}
```

