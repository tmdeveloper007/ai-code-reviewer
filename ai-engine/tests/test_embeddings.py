import pytest
from unittest.mock import patch, MagicMock


class TestEmbeddings:
    """Unit tests for embeddings.py using mocked SentenceTransformer."""

    def test_get_embedding_dimension_returns_dimension(self):
        with patch("embeddings.SentenceTransformer") as mock_model_class:
            mock_model = MagicMock()
            mock_model.get_sentence_embedding_dimension.return_value = 384
            mock_model_class.return_value = mock_model

            # Reset the global model cache so our mock is used
            import embeddings
            embeddings._model = None

            dim = embeddings.get_embedding_dimension()
            assert dim == 384
            mock_model.get_sentence_embedding_dimension.assert_called_once()

    def test_embed_text_calls_model_encode_with_normalize(self):
        with patch("embeddings.SentenceTransformer") as mock_model_class:
            mock_model = MagicMock()
            mock_vec = MagicMock()
            mock_vec.tolist.return_value = [0.1, 0.2, 0.3]
            mock_model.encode.return_value = mock_vec
            mock_model_class.return_value = mock_model

            import embeddings
            embeddings._model = None

            result = embeddings.embed_text("hello world")

            mock_model.encode.assert_called_once_with("hello world", normalize_embeddings=True)
            assert result == [0.1, 0.2, 0.3]

    def test_embed_text_returns_list_of_floats(self):
        with patch("embeddings.SentenceTransformer") as mock_model_class:
            mock_model = MagicMock()
            mock_vec = MagicMock()
            mock_vec.tolist.return_value = [0.5, -0.5]
            mock_model.encode.return_value = mock_vec
            mock_model_class.return_value = mock_model

            import embeddings
            embeddings._model = None

            result = embeddings.embed_text("test string")
            assert isinstance(result, list)
            assert all(isinstance(v, float) for v in result)

    def test_embed_texts_encodes_multiple_texts(self):
        with patch("embeddings.SentenceTransformer") as mock_model_class:
            mock_model = MagicMock()
            mock_vecs = [MagicMock(tolist=lambda: [0.1, 0.2]), MagicMock(tolist=lambda: [0.3, 0.4])]
            mock_model.encode.return_value = mock_vecs
            mock_model_class.return_value = mock_model

            import embeddings
            embeddings._model = None

            result = embeddings.embed_texts(["hello", "world"])

            mock_model.encode.assert_called_once_with(["hello", "world"], normalize_embeddings=True)
            assert len(result) == 2
            assert result[0] == [0.1, 0.2]
            assert result[1] == [0.3, 0.4]

    def test_embed_texts_returns_list_of_lists(self):
        with patch("embeddings.SentenceTransformer") as mock_model_class:
            mock_model = MagicMock()
            mock_vecs = [MagicMock(tolist=lambda: [0.1, 0.2])]
            mock_model.encode.return_value = mock_vecs
            mock_model_class.return_value = mock_model

            import embeddings
            embeddings._model = None

            result = embeddings.embed_texts(["single text"])
            assert isinstance(result, list)
            assert isinstance(result[0], list)

    def test_model_is_cached_after_first_call(self):
        with patch("embeddings.SentenceTransformer") as mock_model_class:
            mock_model = MagicMock()
            mock_model.get_sentence_embedding_dimension.return_value = 768
            mock_model_class.return_value = mock_model

            import embeddings
            embeddings._model = None

            embeddings.get_embedding_dimension()
            embeddings.get_embedding_dimension()

            # Model should only be instantiated once due to caching
            assert mock_model_class.call_count == 1
