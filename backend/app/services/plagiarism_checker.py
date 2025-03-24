import numpy as np
from sklearn.metrics.pairwise import cosine_similarity
from transformers import AutoTokenizer, AutoModel
import torch
import nltk
from nltk.util import ngrams
import hashlib
from fuzzywuzzy import fuzz
import re
import pandas as pd
from tqdm import tqdm
import requests
import json
import time
from bs4 import BeautifulSoup
import os
from scholarly import scholarly
import PyPDF2
import io
from serpapi import Client
from dotenv import load_dotenv
from typing import Dict, List, Optional, Tuple, Any, Union

# Ensure NLTK resources are downloaded
try:
    nltk.data.find('tokenizers/punkt')
except LookupError:
    nltk.download('punkt')

class PlagiarismChecker:
    def __init__(self, bert_model="bert-base-uncased"):
        # Initialize BERT model and tokenizer
        self.tokenizer = AutoTokenizer.from_pretrained(bert_model)
        self.model = AutoModel.from_pretrained(bert_model)
        self.device = torch.device('cuda' if torch.cuda.is_available() else 'cpu')
        self.model.to(self.device)
        
        # Vector database
        self.vector_database = None
        
        # Load API keys from .env
        load_dotenv()
        self.serpapi_key = os.getenv('SERPAPI_KEY')
        self.scopus_api_key = os.getenv('SCOPUS_API_KEY')
        self.core_api_key = os.getenv('CORE_API_KEY')
        self.ieee_api_key = os.getenv('IEEE_API_KEY')
    
    def preprocess_text(self, text: str) -> str:
        """Basic text preprocessing"""
        # Convert to lowercase, remove extra whitespace
        text = re.sub(r'\s+', ' ', text.lower().strip())
        return text
    
    def get_bert_embeddings(self, text: str, max_length: int = 510) -> np.ndarray:
        """Generate BERT embeddings for a piece of text"""
        # Tokenize and prepare for BERT
        inputs = self.tokenizer(text, return_tensors="pt", truncation=True, 
                                max_length=max_length, padding=True).to(self.device)
        
        # Get BERT embeddings with attention mask
        with torch.no_grad():
            outputs = self.model(**inputs, output_hidden_states=True, return_dict=True)
        
        # Get the last hidden state
        last_hidden_state = outputs.hidden_states[-1]
        
        # Use the [CLS] token embedding (first token) as the document embedding
        embeddings = last_hidden_state[:, 0, :].cpu().numpy()
        return embeddings
    
    def semantic_similarity(self, text1: str, text2: str) -> float:
        """Calculate semantic similarity using BERT and cosine similarity"""
        # Get embeddings
        embedding1 = self.get_bert_embeddings(text1)
        embedding2 = self.get_bert_embeddings(text2)
        
        # Calculate cosine similarity
        similarity = cosine_similarity(embedding1, embedding2)[0][0]
        return similarity
    
    def generate_ngrams(self, text: str, n: int) -> List[Tuple[str, ...]]:
        """Generate n-grams from text"""
        tokens = nltk.word_tokenize(text.lower())
        n_grams = list(ngrams(tokens, n))
        return n_grams
    
    def hash_ngrams(self, text: str, n: int = 5) -> List[str]:
        """Create hashed n-grams for document fingerprinting"""
        n_grams = self.generate_ngrams(text, n)
        
        # Hash each n-gram
        hashed_ngrams = []
        for gram in n_grams:
            gram_str = ' '.join(gram)
            hashed = hashlib.md5(gram_str.encode()).hexdigest()
            hashed_ngrams.append(hashed)
            
        return hashed_ngrams
    
    def ngram_similarity(self, text1: str, text2: str, n: int = 5) -> float:
        """Calculate similarity based on n-gram hashing"""
        hashes1 = set(self.hash_ngrams(text1, n))
        hashes2 = set(self.hash_ngrams(text2, n))
        
        # Jaccard similarity
        intersection = len(hashes1.intersection(hashes2))
        union = len(hashes1.union(hashes2))
        
        if union == 0:
            return 0
        
        return intersection / union
    
    def fuzzy_match_similarity(self, text1: str, text2: str) -> float:
        """Calculate fuzzy matching similarity"""
        # Using token sort ratio to handle word order differences
        return fuzz.token_sort_ratio(text1, text2) / 100
    
    def create_vector_database(self, documents: List[str], document_ids: Optional[List[str]] = None) -> pd.DataFrame:
        """Create a vector database from a list of documents"""
        # Create DataFrame
        if document_ids is None:
            document_ids = [f"doc_{i}" for i in range(len(documents))]
            
        df = pd.DataFrame({
            'document': documents,
            'document_id': document_ids
        })
        
        # Generate vectors for all documents
        vectors = []
        for doc in tqdm(documents, desc="Creating vectors"):
            # Preprocess text
            processed_doc = self.preprocess_text(doc)
            # Get embedding
            vector = self.get_bert_embeddings(processed_doc)
            vectors.append(vector)
        
        # Add vectors to DataFrame
        df["vector"] = vectors
        df["vector"] = df["vector"].apply(lambda x: x.reshape(1, -1))
        
        self.vector_database = df
        return df
    
    def query_vector_database(self, query_text: str, top_n: int = 5) -> pd.DataFrame:
        """Query the vector database for similar documents"""
        if self.vector_database is None:
            raise ValueError("Vector database not created. Call create_vector_database first.")
        
        # Process query text
        processed_query = self.preprocess_text(query_text)
        query_vector = self.get_bert_embeddings(processed_query)
        query_vector = query_vector.reshape(1, -1)
        
        # Calculate similarity with all documents
        self.vector_database["similarity"] = self.vector_database["vector"].apply(
            lambda x: cosine_similarity(query_vector, x)[0][0]
        )
        
        # Sort by similarity
        results = self.vector_database.sort_values(by="similarity", ascending=False).head(top_n)
        
        return results[["document", "document_id", "similarity"]]
    
    def check_plagiarism(self, suspect_text: str, reference_texts: List[str], 
                         thresholds: Optional[Dict[str, float]] = None, 
                         use_database: bool = False) -> List[Dict[str, Any]]:
        """Check plagiarism using multiple techniques"""
        if thresholds is None:
            thresholds = {
                'semantic': 0.85,  # Threshold for BERT semantic similarity
                'ngram': 0.4,      # Threshold for n-gram similarity
                'fuzzy': 0.7       # Threshold for fuzzy matching
            }
        
        # Preprocess suspect text
        processed_suspect = self.preprocess_text(suspect_text)
        
        if use_database and (self.vector_database is None):
            # Create vector database if it doesn't exist
            self.create_vector_database(reference_texts)
        
        results = []
        
        if use_database:
            # Use vector database approach for efficient similarity search
            db_results = self.query_vector_database(processed_suspect)
            
            for _, row in db_results.iterrows():
                ref_id = row['document_id']
                ref_text = row['document']
                semantic_sim = row['similarity']
                
                # Get index of reference text
                ref_index = reference_texts.index(ref_text) if ref_text in reference_texts else -1
                
                # Calculate other similarities
                processed_ref = self.preprocess_text(ref_text)
                ngram_sim = self.ngram_similarity(processed_suspect, processed_ref)
                fuzzy_sim = self.fuzzy_match_similarity(processed_suspect, processed_ref)
                
                # Determine if it's plagiarized based on thresholds
                is_plagiarized = (
                    semantic_sim >= thresholds['semantic'] or
                    ngram_sim >= thresholds['ngram'] or
                    fuzzy_sim >= thresholds['fuzzy']
                )
                
                # Calculate an overall plagiarism score (weighted average)
                overall_score = (
                    0.5 * semantic_sim +    # BERT semantic similarity (higher weight)
                    0.3 * ngram_sim +       # N-gram similarity
                    0.2 * fuzzy_sim         # Fuzzy matching
                )
                
                results.append({
                    'reference_id': ref_index if ref_index >= 0 else ref_id,
                    'is_plagiarized': is_plagiarized,
                    'overall_score': float(overall_score),  # Ensure it's JSON serializable
                    'semantic_similarity': float(semantic_sim),
                    'ngram_similarity': float(ngram_sim),
                    'fuzzy_similarity': float(fuzzy_sim),
                    'reference_text': ref_text
                })
        else:
            # Standard approach comparing with each reference text
            for i, ref_text in enumerate(reference_texts):
                # Preprocess text
                processed_ref = self.preprocess_text(ref_text)
                
                # Calculate similarities using different methods
                sem_sim = self.semantic_similarity(processed_suspect, processed_ref)
                ngram_sim = self.ngram_similarity(processed_suspect, processed_ref)
                fuzzy_sim = self.fuzzy_match_similarity(processed_suspect, processed_ref)
                
                # Determine if it's plagiarized based on thresholds
                is_plagiarized = (
                    sem_sim >= thresholds['semantic'] or
                    ngram_sim >= thresholds['ngram'] or
                    fuzzy_sim >= thresholds['fuzzy']
                )
                
                # Calculate an overall plagiarism score (weighted average)
                overall_score = (
                    0.5 * sem_sim +    # BERT semantic similarity (higher weight)
                    0.3 * ngram_sim +  # N-gram similarity
                    0.2 * fuzzy_sim    # Fuzzy matching
                )
                
                results.append({
                    'reference_id': i,
                    'is_plagiarized': is_plagiarized,
                    'overall_score': float(overall_score),
                    'semantic_similarity': float(sem_sim),
                    'ngram_similarity': float(ngram_sim),
                    'fuzzy_similarity': float(fuzzy_sim),
                    'reference_text': ref_text
                })
        
        # Sort results by overall plagiarism score (descending)
        results.sort(key=lambda x: x['overall_score'], reverse=True)
        
        return results
    
    # SCHOLARLY DATABASE SEARCH METHODS
    
    def extract_keywords(self, text: str, num_keywords: int = 5) -> List[str]:
        """Extract important keywords from text using NLTK"""
        from nltk.corpus import stopwords
        from nltk.tokenize import word_tokenize
        from collections import Counter
        
        # Download stopwords if not already
        try:
            nltk.data.find('corpora/stopwords')
        except LookupError:
            nltk.download('stopwords')
        
        # Tokenize and filter out stopwords
        stop_words = set(stopwords.words('english'))
        word_tokens = word_tokenize(text.lower())
        filtered_words = [w for w in word_tokens if w.isalnum() and w not in stop_words]
        
        # Count word frequency
        word_freq = Counter(filtered_words)
        
        # Get most common words
        keywords = [word for word, freq in word_freq.most_common(num_keywords)]
        return keywords
    
    def search_google_scholar(self, query: str, num_results: int = 5) -> List[Dict[str, str]]:
        """
        Search Google Scholar using scholarly or SerpAPI
        
        Args:
            query: Search query
            num_results: Number of results to return
            
        Returns:
            List of dictionaries with paper details
        """
        results = []
        
        # Try using SerpAPI if API key is available (more reliable)
        if self.serpapi_key:
            try:
                params = {
                    "api_key": self.serpapi_key,
                    "engine": "google_scholar",
                    "q": query,
                    "num": num_results
                }
                
                # Create Client instance and then call search
                client = Client(api_key=self.serpapi_key)
                response = client.search(params)
                
                if "organic_results" in response:
                    for paper in response["organic_results"][:num_results]:
                        paper_info = {
                            'title': paper.get('title', 'Unknown'),
                            'link': paper.get('link', ''),
                            'snippet': paper.get('snippet', ''),
                            'publication_info': paper.get('publication_info', {}).get('summary', ''),
                            'source': 'Google Scholar (SerpAPI)'
                        }
                        results.append(paper_info)
                
                return results
            except Exception as e:
                print(f"SerpAPI search failed: {str(e)}")
                # Fall back to scholarly if SerpAPI fails
        
        # Fall back to scholarly (less reliable but free)
        try:
            search_query = scholarly.search_pubs(query)
            
            for i in range(num_results):
                try:
                    publication = next(search_query)
                    
                    # Extract available information
                    paper_info = {
                        'title': publication.get('bib', {}).get('title', 'Unknown'),
                        'abstract': publication.get('bib', {}).get('abstract', ''),
                        'pub_year': publication.get('bib', {}).get('pub_year', ''),
                        'author': publication.get('bib', {}).get('author', 'Unknown'),
                        'venue': publication.get('bib', {}).get('venue', ''),
                        'link': publication.get('pub_url', ''),
                        'citations': publication.get('num_citations', 0),
                        'source': 'Google Scholar (scholarly)'
                    }
                    
                    results.append(paper_info)
                except StopIteration:
                    break
                except Exception as e:
                    print(f"Error retrieving publication: {str(e)}")
                    continue
                
            return results
        except Exception as e:
            print(f"Scholarly search failed: {str(e)}")
            return []
    
    def search_scopus(self, query: str, num_results: int = 5) -> List[Dict[str, str]]:
        """
        Search Scopus using their API
        
        Args:
            query: Search query
            num_results: Number of results to return
            
        Returns:
            List of dictionaries with paper details
        """
        if not self.scopus_api_key:
            print("Scopus API key not found in .env file. Set SCOPUS_API_KEY variable.")
            return []
        
        results = []
        
        try:
            # Format query for Scopus API
            formatted_query = query.replace(' ', '+')
            
            # Scopus API endpoint for search
            url = f"https://api.elsevier.com/content/search/scopus"
            
            # Headers with API key
            headers = {
                "X-ELS-APIKey": self.scopus_api_key,
                "Accept": "application/json"
            }
            
            # Parameters for the search
            params = {
                "query": formatted_query,
                "count": num_results,
                "view": "COMPLETE"
            }
            
            # Send request
            response = requests.get(url, headers=headers, params=params)
            
            if response.status_code == 200:
                data = response.json()
                
                if "search-results" in data and "entry" in data["search-results"]:
                    for paper in data["search-results"]["entry"]:
                        paper_info = {
                            'title': paper.get('dc:title', 'Unknown'),
                            'abstract': paper.get('dc:description', ''),
                            'author': paper.get('dc:creator', 'Unknown'),
                            'publication_year': paper.get('prism:coverDate', '')[:4] if 'prism:coverDate' in paper else '',
                            'link': paper.get('prism:url', ''),
                            'source': 'Scopus API'
                        }
                        results.append(paper_info)
            else:
                print(f"Scopus API error: {response.status_code}, {response.text}")
                
            return results
        except Exception as e:
            print(f"Scopus search failed: {str(e)}")
            return []
    
    def search_core(self, query: str, num_results: int = 5) -> List[Dict[str, str]]:
        """
        Search CORE (core.ac.uk) using their API
        
        Args:
            query: Search query
            num_results: Number of results to return
            
        Returns:
            List of dictionaries with paper details
        """
        if not self.core_api_key:
            print("CORE API key not found in .env file. Set CORE_API_KEY variable.")
            return []
        
        results = []
        
        try:
            # CORE API endpoint
            url = "https://api.core.ac.uk/v3/search/works"
            
            # Headers with API key
            headers = {
                "Authorization": f"Bearer {self.core_api_key}",
                "Content-Type": "application/json"
            }
            
            # Request body
            data = {
                "q": query,
                "limit": num_results,
                "scroll": True
            }
            
            # Send request
            response = requests.post(url, headers=headers, json=data)
            
            if response.status_code == 200:
                data = response.json()
                
                if "results" in data:
                    for paper in data["results"]:
                        authors = []
                        if "authors" in paper and paper["authors"]:
                            authors = [author.get("name", "") for author in paper["authors"] if "name" in author]
                        
                        paper_info = {
                            'title': paper.get('title', 'Unknown'),
                            'abstract': paper.get('abstract', ''),
                            'author': ", ".join(authors) if authors else 'Unknown',
                            'publication_year': str(paper.get('yearPublished', '')),
                            'link': paper.get('downloadUrl', '') or paper.get('doi', ''),
                            'source': 'CORE API'
                        }
                        results.append(paper_info)
            else:
                print(f"CORE API error: {response.status_code}, {response.text}")
                
            return results
        except Exception as e:
            print(f"CORE search failed: {str(e)}")
            return []
    
    def search_ieee(self, query: str, num_results: int = 5) -> List[Dict[str, str]]:
        """
        Search IEEE Xplore using their API
        
        Args:
            query: Search query
            num_results: Number of results to return
            
        Returns:
            List of dictionaries with paper details
        """
        if not self.ieee_api_key:
            print("IEEE API key not found in .env file. Set IEEE_API_KEY variable.")
            return []
        
        results = []
        
        try:
            # IEEE API endpoint
            url = "https://ieeexploreapi.ieee.org/api/v1/search/articles"
            
            # Parameters for the search
            params = {
                "apikey": self.ieee_api_key,
                "format": "json",
                "max_records": num_results,
                "querytext": query,
                "abstract": True
            }
            
            # Send request
            response = requests.get(url, params=params)
            
            if response.status_code == 200:
                data = response.json()
                
                if "articles" in data:
                    for paper in data["articles"]:
                        paper_info = {
                            'title': paper.get('title', 'Unknown'),
                            'abstract': paper.get('abstract', ''),
                            'author': paper.get('authors', {}).get('authors', [{}])[0].get('full_name', 'Unknown') 
                                      if 'authors' in paper and 'authors' in paper['authors'] and paper['authors']['authors'] else 'Unknown',
                            'publication_year': paper.get('publication_year', ''),
                            'link': f"https://doi.org/{paper.get('doi', '')}" if 'doi' in paper else '',
                            'source': 'IEEE Xplore API'
                        }
                        results.append(paper_info)
            else:
                print(f"IEEE API error: {response.status_code}, {response.text}")
                
            return results
        except Exception as e:
            print(f"IEEE search failed: {str(e)}")
            return []
    
    def fetch_paper_content(self, url: str) -> str:
        """
        Attempt to fetch and extract content from a paper URL
        
        Args:
            url: URL to the paper or abstract page
            
        Returns:
            String with the extracted content
        """
        if not url:
            return ""
        
        try:
            headers = {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
            }
            
            response = requests.get(url, headers=headers, timeout=10)
            
            if response.status_code != 200:
                return ""
            
            # Check if it's a PDF
            if url.lower().endswith('.pdf') or 'application/pdf' in response.headers.get('Content-Type', ''):
                try:
                    pdf_reader = PyPDF2.PdfReader(io.BytesIO(response.content))
                    text = ""
                    for page_num in range(len(pdf_reader.pages)):
                        text += pdf_reader.pages[page_num].extract_text()
                    return text
                except Exception as e:
                    print(f"PDF extraction error: {str(e)}")
                    return ""
            
            # Otherwise, try to extract text from HTML
            soup = BeautifulSoup(response.text, 'html.parser')
            
            # Remove script and style elements
            for script in soup(["script", "style", "nav", "footer", "header"]):
                script.extract()
            
            # Look for common paper content containers
            content = ""
            
            # Check for abstract sections
            abstract_sections = soup.find_all(['div', 'section', 'p'], 
                                              class_=lambda c: c and any(term in c.lower() for term in 
                                                                       ['abstract', 'summary', 'paper-content']))
            
            if abstract_sections:
                for section in abstract_sections:
                    content += section.get_text(strip=True) + "\n\n"
            else:
                # Fallback to main content
                main_content = soup.find('main') or soup.find('article') or soup.find('body')
                if main_content:
                    paragraphs = main_content.find_all('p')
                    for p in paragraphs:
                        content += p.get_text(strip=True) + "\n\n"
            
            return content.strip()
        except Exception as e:
            print(f"Error fetching paper content: {str(e)}")
            return ""
    
    def search_scholarly_databases(self, suspect_text: str, num_papers: int = 5) -> Tuple[List[str], List[Dict[str, str]]]:
        """
        Search scholarly databases for similar papers to the suspect text
        
        Args:
            suspect_text: Text to check for plagiarism
            num_papers: Number of papers to retrieve from each source
            
        Returns:
            List of retrieved papers with their content
        """
        # Extract keywords from the suspect text
        keywords = self.extract_keywords(suspect_text, num_keywords=7)
        query = " ".join(keywords)
        
        all_papers = []
        paper_contents = []
        paper_sources = []
        
        print(f"Searching for papers using keywords: {query}")
        
        # Search Google Scholar
        scholar_results = self.search_google_scholar(query, num_results=num_papers)
        all_papers.extend(scholar_results)
        
        # Search Scopus
        scopus_results = self.search_scopus(query, num_results=num_papers)
        all_papers.extend(scopus_results)
        
        # Search CORE
        core_results = self.search_core(query, num_results=num_papers)
        all_papers.extend(core_results)
        
        # Search IEEE
        ieee_results = self.search_ieee(query, num_results=num_papers)
        all_papers.extend(ieee_results)
        
        print(f"Found {len(all_papers)} papers. Fetching content...")
        
        # Fetch content for each paper
        for paper in tqdm(all_papers, desc="Fetching paper content"):
            # Try to get content from URL
            content = self.fetch_paper_content(paper.get('link', ''))
            
            # If no content from URL, use abstract or snippet if available
            if not content:
                content = paper.get('abstract', '') or paper.get('snippet', '')
            
            # Skip papers with insufficient content
            if len(content) < 100:
                continue
                
            paper_contents.append(content)
            paper_sources.append({
                'title': paper.get('title', 'Unknown'),
                'link': paper.get('link', ''),
                'source': paper.get('source', 'Unknown'),
                'author': paper.get('author', '') if 'author' in paper else paper.get('publication_info', '')
            })
        
        print(f"Successfully retrieved content for {len(paper_contents)} papers")
        return paper_contents, paper_sources
    
    def check_plagiarism_with_scholarly_search(self, suspect_text: str, num_papers: int = 5, 
                                              thresholds: Optional[Dict[str, float]] = None) -> List[Dict[str, Any]]:
        """
        Check plagiarism by searching scholarly databases for similar papers
        
        Args:
            suspect_text: Text to check for plagiarism
            num_papers: Number of papers to retrieve from each source
            thresholds: Dictionary with thresholds for each similarity method
            
        Returns:
            List of dictionaries with plagiarism results
        """
        paper_contents, paper_sources = self.search_scholarly_databases(suspect_text, num_papers)
        
        if not paper_contents:
            print("No papers found or failed to retrieve content.")
            return []
        
        # Check plagiarism against retrieved papers
        results = self.check_plagiarism(suspect_text, paper_contents, thresholds)
        
        # Add paper source information to the results
        for i, result in enumerate(results):
            ref_id = result['reference_id']
            if isinstance(ref_id, int) and ref_id < len(paper_sources):
                result['paper_info'] = paper_sources[ref_id]
            else:
                result['paper_info'] = {'title': 'Unknown', 'link': '', 'source': 'Unknown'}
        
        return results 