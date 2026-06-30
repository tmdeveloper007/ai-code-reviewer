"""
Unit tests for embeddings.is_fallback_active() and embeddings.get_cache_stats().

conftest.py stubs sentence_transformers and sets _fallback_active = True,
so these tests run in the fallback (deterministic) embedding mode.
"""
import pytest


class TestIsFallbackActive:
    """Tests for the is_fallback_active() function."""

    def test_is_fallback_active_returns_bool(self):
        from embeddings import is_fallback_active
        result = is_fallback_active()
        assert isinstance(result, bool)

    def test_is_fallback_active_is_true_when_stubbed(self):
        """When conftest stubs sentence_transformers, fallback should be active."""
        from embeddings import is_fallback_active
        assert is_fallback_active() is True

    def test_is_fallback_active_does_not_raise(self):
        """Calling the function should not raise any exception."""
        from embeddings import is_fallback_active
        # Multiple calls should all succeed
        for _ in range(3):
            result = is_fallback_active()
            assert isinstance(result, bool)


class TestGetCacheStats:
    """Tests for the get_cache_stats() function."""

    def test_get_cache_stats_returns_dict(self):
        from embeddings import get_cache_stats
        stats = get_cache_stats()
        assert isinstance(stats, dict)

    def test_get_cache_stats_has_enabled_field(self):
        from embeddings import get_cache_stats
        stats = get_cache_stats()
        assert "enabled" in stats
        assert isinstance(stats["enabled"], bool)

    def test_get_cache_stats_has_size_field(self):
        from embeddings import get_cache_stats
        stats = get_cache_stats()
        assert "size" in stats
        assert isinstance(stats["size"], int)
        assert stats["size"] >= 0

    def test_get_cache_stats_has_max_size_field(self):
        from embeddings import get_cache_stats
        stats = get_cache_stats()
        assert "max_size" in stats
        assert isinstance(stats["max_size"], int)
        assert stats["max_size"] > 0

    def test_get_cache_stats_has_keys_field(self):
        from embeddings import get_cache_stats
        stats = get_cache_stats()
        assert "keys" in stats
        assert isinstance(stats["keys"], list)

    def test_get_cache_stats_keys_is_list_of_strings(self):
        from embeddings import get_cache_stats
        stats = get_cache_stats()
        for key in stats["keys"]:
            assert isinstance(key, str)

    def test_get_cache_stats_keys_length_matches_size(self):
        from embeddings import get_cache_stats
        stats = get_cache_stats()
        assert len(stats["keys"]) == stats["size"]

    def test_get_cache_stats_size_is_zero_on_fresh_cache(self):
        from embeddings import clear_embedding_cache, get_cache_stats
        clear_embedding_cache()
        stats = get_cache_stats()
        assert stats["size"] == 0
        assert stats["keys"] == []

    def test_get_cache_stats_max_size_matches_config(self):
        import os
        from embeddings import get_cache_stats
        expected = int(os.getenv("MAX_EMBEDDING_CACHE_SIZE", "10000"))
        stats = get_cache_stats()
        assert stats["max_size"] == expected

    def test_get_cache_stats_keys_reflects_cache_contents(self):
        import embeddings as emb
        from embeddings import get_cache_stats, embed_text, clear_embedding_cache
        clear_embedding_cache()
        # Manually populate the cache
        with emb._cache_lock:
            emb._embedding_cache["file1.py"] = "hash1"
            emb._embedding_cache["file2.py"] = "hash2"
        stats = get_cache_stats()
        assert stats["size"] == 2
        assert "file1.py" in stats["keys"]
        assert "file2.py" in stats["keys"]
        clear_embedding_cache()

    def test_get_cache_stats_consistent_across_multiple_calls(self):
        from embeddings import get_cache_stats
        stats1 = get_cache_stats()
        stats2 = get_cache_stats()
        assert stats1 == stats2

    def test_get_cache_stats_max_size_is_integer(self):
        from embeddings import get_cache_stats
        stats = get_cache_stats()
        assert isinstance(stats["max_size"], int)

    def test_get_cache_stats_size_reflects_deletions(self):
        import embeddings as emb
        from embeddings import get_cache_stats, invalidate_cache_for_file, clear_embedding_cache
        clear_embedding_cache()
        with emb._cache_lock:
            emb._embedding_cache["file1.py"] = "hash1"
            emb._embedding_cache["file2.py"] = "hash2"
        stats = get_cache_stats()
        assert stats["size"] == 2
        invalidate_cache_for_file("file1.py")
        stats = get_cache_stats()
        assert stats["size"] == 1
        assert "file1.py" not in stats["keys"]
        assert "file2.py" in stats["keys"]
        clear_embedding_cache()

    def test_get_cache_stats_size_reflects_clear(self):
        import embeddings as emb
        from embeddings import get_cache_stats, clear_embedding_cache
        clear_embedding_cache()
        with emb._cache_lock:
            emb._embedding_cache["a.py"] = "h1"
            emb._embedding_cache["b.py"] = "h2"
            emb._embedding_cache["c.py"] = "h3"
        stats = get_cache_stats()
        assert stats["size"] == 3
        clear_embedding_cache()
        stats = get_cache_stats()
        assert stats["size"] == 0
        assert stats["keys"] == []
