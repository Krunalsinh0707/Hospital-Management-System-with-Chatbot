"""
Legacy bridge for vector store: re-exports the canonical retrieval service from src.clinical_chat.vector_store
Ensures full backward compatibility for cbc_router and prediction_router.
"""
from src.clinical_chat.vector_store import VectorStoreManager, vector_store

__all__ = ["VectorStoreManager", "vector_store"]
