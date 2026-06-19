import pytest
from unittest.mock import patch, MagicMock


class TestRagFunctions:
    """Unit tests for rag.py functions using mocked ChromaDB and embeddings."""

    def test_ingest_chunks_calls_embeddings_and_collection_add(self):
        with patch("rag.chromadb") as mock_chromadb, \
             patch("rag.embed_texts") as mock_embed:

            mock_collection = MagicMock()
            mock_client = MagicMock()
            mock_client.get_collection.return_value = mock_collection
            mock_chromadb.HttpClient.return_value = mock_client

            mock_embed.return_value = [[0.1, 0.2]]

            import rag
            rag._client = None
            rag._collection = None
            rag._CHROMA_HOST = "fake-host"
            rag._CHROMA_PORT = 8000

            result = rag.ingest_chunks(
                chunks=["hello world"],
                metadatas=[{"file_path": "test.py"}],
                ids=["chunk-1"]
            )

            mock_embed.assert_called_once_with(["hello world"])
            mock_collection.add.assert_called_once_with(
                embeddings=[[0.1, 0.2]],
                documents=["hello world"],
                metadatas=[{"file_path": "test.py"}],
                ids=["chunk-1"]
            )
            assert result == 1

    def test_query_chunks_returns_correct_chunk_structure(self):
        with patch("rag.chromadb") as mock_chromadb, \
             patch("rag.embed_texts") as mock_embed:

            mock_collection = MagicMock()
            mock_client = MagicMock()
            mock_client.get_collection.return_value = mock_collection
            mock_chromadb.HttpClient.return_value = mock_client

            # Simulate ChromaDB query result shape
            mock_collection.query.return_value = {
                "metadatas": [[{"file_path": "app.py"}]],
                "documents": [["def main(): pass"]],
                "distances": [[0.05]],
                "ids": [["chunk-abc"]]
            }
            mock_embed.return_value = [[0.1, 0.2]]

            import rag
            rag._client = None
            rag._collection = None
            rag._CHROMA_HOST = "fake-host"
            rag._CHROMA_PORT = 8000

            chunks = rag.query_chunks("what does main do?", n_results=1)

            assert len(chunks) == 1
            assert chunks[0]["content"] == "def main(): pass"
            assert chunks[0]["metadata"] == {"file_path": "app.py"}
            assert chunks[0]["similarity_score"] == 0.95  # 1.0 - 0.05
            assert chunks[0]["chunk_id"] == "chunk-abc"

    def test_query_chunks_handles_missing_fields_gracefully(self):
        with patch("rag.chromadb") as mock_chromadb, \
             patch("rag.embed_texts") as mock_embed:

            mock_collection = MagicMock()
            mock_client = MagicMock()
            mock_client.get_collection.return_value = mock_collection
            mock_chromadb.HttpClient.return_value = mock_client

            # ChromaDB may return empty lists for missing fields
            mock_collection.query.return_value = {
                "metadatas": [[]],
                "documents": [[]],
                "distances": [[]],
                "ids": [[]]
            }
            mock_embed.return_value = [[0.1]]

            import rag
            rag._client = None
            rag._collection = None
            rag._CHROMA_HOST = "fake-host"
            rag._CHROMA_PORT = 8000

            chunks = rag.query_chunks("empty query", n_results=5)
            assert isinstance(chunks, list)
            assert len(chunks) == 0

    def test_get_collection_stats_returns_expected_fields(self):
        with patch("rag.chromadb") as mock_chromadb, \
             patch("rag.get_embedding_dimension") as mock_dim:

            mock_collection = MagicMock()
            mock_collection.count.return_value = 42
            mock_client = MagicMock()
            mock_client.get_collection.return_value = mock_collection
            mock_chromadb.HttpClient.return_value = mock_client

            mock_dim.return_value = 384

            import rag
            rag._client = None
            rag._collection = None
            rag._CHROMA_HOST = "fake-host"
            rag._CHROMA_PORT = 8000

            stats = rag.get_collection_stats()

            assert stats["collection"] == "reposage_code_chunks"
            assert stats["chunk_count"] == 42
            assert stats["embedding_dimension"] == 384

    def test_ingest_chunks_returns_chunk_count(self):
        with patch("rag.chromadb") as mock_chromadb, \
             patch("rag.embed_texts") as mock_embed:

            mock_collection = MagicMock()
            mock_client = MagicMock()
            mock_client.get_collection.return_value = mock_collection
            mock_chromadb.HttpClient.return_value = mock_client
            mock_embed.return_value = [[0.1], [0.2], [0.3]]

            import rag
            rag._client = None
            rag._collection = None
            rag._CHROMA_HOST = "fake-host"
            rag._CHROMA_PORT = 8000

            result = rag.ingest_chunks(
                chunks=["a", "b", "c"],
                metadatas=[{}, {}, {}],
                ids=["id1", "id2", "id3"]
            )

            assert result == 3
