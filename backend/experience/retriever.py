import re
from typing import List, Dict, Any
from sqlalchemy.orm import Session
from backend.storage.models import ExperienceModel

# Simple English stop words to filter out before keyword matching
STOP_WORDS = {
    "a", "about", "above", "after", "again", "against", "all", "am", "an", "and",
    "any", "are", "aren't", "as", "at", "be", "because", "been", "before", "being",
    "below", "between", "both", "but", "by", "can't", "cannot", "could", "couldn't",
    "did", "didn't", "do", "does", "doesn't", "doing", "don't", "down", "during",
    "each", "few", "for", "from", "further", "had", "hadn't", "has", "hasn't",
    "have", "haven't", "having", "he", "he'd", "he'll", "he's", "her", "here",
    "here's", "hers", "herself", "him", "himself", "his", "how", "how's", "i",
    "i'd", "i'll", "i'm", "i've", "if", "in", "into", "is", "isn't", "it", "it's",
    "its", "itself", "let's", "me", "more", "most", "mustn't", "my", "myself",
    "no", "nor", "not", "of", "off", "on", "once", "only", "or", "other", "ought",
    "our", "ours", "ourselves", "out", "over", "own", "same", "shan't", "she",
    "she'd", "she'll", "she's", "should", "shouldn't", "so", "some", "such",
    "than", "that", "that's", "the", "their", "theirs", "them", "themselves",
    "then", "there", "there's", "these", "they", "they'd", "they'll", "they're",
    "they've", "this", "those", "through", "to", "too", "under", "until", "up",
    "very", "was", "wasn't", "we", "we'd", "we'll", "we're", "we've", "were",
    "weren't", "what", "what's", "when", "when's", "where", "where's", "which",
    "while", "who", "who's", "whom", "why", "why's", "with", "won't", "would",
    "wouldn't", "you", "you'd", "you'll", "you're", "you've", "your", "yours",
    "yourself", "yourselves"
}

def extract_keywords(text: str) -> List[str]:
    """
    Cleans text and extracts unique lowercase alphanumeric words, filtering out stop words.
    """
    words = re.findall(r"\b\w+\b", text.lower())
    return [w for w in words if w not in STOP_WORDS and len(w) > 2]

def retrieve_relevant_experiences(
    db: Session,
    description: str,
    constraints: List[str],
    tags: List[str],
    limit: int = 3
) -> List[ExperienceModel]:
    """
    Queries the database for experiences, scores relevance using tag overlap
    and keyword similarity, and returns the top matches.
    """
    experiences = db.query(ExperienceModel).all()
    if not experiences:
        return []

    # Extract keywords from new task specs
    task_keywords = set(extract_keywords(description))
    for c in constraints:
        task_keywords.update(extract_keywords(c))

    task_tags = set(t.lower() for t in (tags or []))
    scored_matches = []

    for exp in experiences:
        score = 0.0
        exp_tags = set(t.lower() for t in (exp.tags or []))
        
        # 1. Exact Tag Matches (weight: 2.0 per overlap)
        tag_overlap = task_tags.intersection(exp_tags)
        score += len(tag_overlap) * 2.0

        # 2. Description/Trigger Keyword Overlaps (weight: 0.5 per overlap)
        exp_words = set(extract_keywords(exp.trigger))
        exp_words.update(extract_keywords(exp.failure_pattern))
        exp_words.update(extract_keywords(exp.principle))
        
        keyword_overlap = task_keywords.intersection(exp_words)
        score += len(keyword_overlap) * 0.5

        # 3. Add to matches if score > 0
        if score > 0:
            scored_matches.append((score, exp))

    # Sort descending by score, select top ones
    scored_matches.sort(key=lambda x: x[0], reverse=True)
    top_matches = [exp for _, exp in scored_matches[:limit]]
    
    # Increment reuse counter for selected experiences
    for exp in top_matches:
        exp.reuse_count += 1
    db.commit()

    return top_matches
