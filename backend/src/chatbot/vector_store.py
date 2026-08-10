import os
from typing import List, Dict, Any

class VectorStoreManager:
    def __init__(self, persist_directory: str = "chroma_db"):
        self.persist_directory = persist_directory
        self._client = None
        self._collection_cache = {}

    def _get_client(self):
        if self._client is None:
            try:
                import chromadb
                # Disable telemetry to prevent network delays
                os.environ["ANONYMIZED_TELEMETRY"] = "False"
                self._client = chromadb.PersistentClient(path=self.persist_directory)
            except Exception as e:
                print(f"[WARNING] ChromaDB initialization failed: {e}")
                self._client = None
        return self._client

    def _get_user_collection(self, user_id: int):
        client = self._get_client()
        if not client:
            return None
        collection_name = f"user_{user_id}_clinical_docs"
        if collection_name not in self._collection_cache:
            try:
                self._collection_cache[collection_name] = client.get_or_create_collection(name=collection_name)
            except Exception as e:
                print(f"[WARNING] ChromaDB collection error: {e}")
                return None
        return self._collection_cache[collection_name]

    def add_document_chunks(self, user_id: int, doc_id: str, chunks: List[str], metadata: Dict[str, Any] = None):
        """
        Indexes text passages from uploaded PDFs or reports into ChromaDB.
        """
        if not chunks:
            return
        collection = self._get_user_collection(user_id)
        if not collection:
            return

        ids = [f"{doc_id}_chunk_{i}" for i in range(len(chunks))]
        metadatas = [metadata or {"doc_id": doc_id} for _ in chunks]

        try:
            collection.upsert(
                ids=ids,
                documents=chunks,
                metadatas=metadatas
            )
            print(f"[OK] Indexed {len(chunks)} chunks into ChromaDB for user {user_id}")
        except Exception as e:
            print(f"[ERROR] Failed to index chunks in ChromaDB: {e}")

    def query_relevant_chunks(self, user_id: int, query_text: str, n_results: int = 3) -> List[str]:
        """
        Retrieves top-k relevant text chunks for a query from user's ChromaDB collection.
        Returns empty list safely if ChromaDB is unavailable or loading.
        """
        try:
            collection = self._get_user_collection(user_id)
            if not collection or collection.count() == 0:
                return []

            results = collection.query(
                query_texts=[query_text],
                n_results=min(n_results, collection.count())
            )
            documents = results.get("documents", [[]])[0]
            return documents
        except Exception as e:
            print(f"[WARNING] ChromaDB query fallback triggered: {e}")
            return []

# Singleton instance
vector_store = VectorStoreManager()
