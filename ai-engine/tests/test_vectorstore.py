import os
import json
import tempfile
import shutil
import pytest
import sys

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

import vectorstore


class TestComputeContentHash:
    def test_returns_sha256_hex(self):
        result = vectorstore._compute_content_hash("hello")
        assert len(result) == 64
        assert all(c in "0123456789abcdef" for c in result)

    def test_deterministic(self):
        h1 = vectorstore._compute_content_hash("hello")
        h2 = vectorstore._compute_content_hash("hello")
        assert h1 == h2

    def test_different_inputs_different_hashes(self):
        h1 = vectorstore._compute_content_hash("hello")
        h2 = vectorstore._compute_content_hash("world")
        assert h1 != h2

    def test_empty_string(self):
        result = vectorstore._compute_content_hash("")
        assert len(result) == 64

    def test_unicode_string(self):
        result = vectorstore._compute_content_hash("hello")
        assert len(result) == 64


class TestAddVector:
    @pytest.fixture(autouse=True)
    def setup_temp_data_dir(self, tmp_path):
        test_data = tmp_path / "test_data"
        test_data.mkdir()
        old_data_dir = vectorstore.DATA_DIR
        old_vectors_file = vectorstore.VECTORS_FILE
        vectorstore.DATA_DIR = str(test_data)
        vectorstore.VECTORS_FILE = str(test_data / "vectors.json")
        yield
        vectorstore.DATA_DIR = old_data_dir
        vectorstore.VECTORS_FILE = old_vectors_file

    def test_add_vector_creates_entry(self):
        entry = vectorstore.add_vector("src/main.py", "print('hello')", [0.1, 0.2], 0)
        assert entry["file_path"] == "src/main.py"
        assert entry["content_hash"] is not None
        assert entry["chunk_index"] == 0
        assert entry["embedding"] == [0.1, 0.2]

    def test_add_vector_deduplication(self):
        e1 = vectorstore.add_vector("src/main.py", "print('hello')", [0.1], 0)
        e2 = vectorstore.add_vector("src/main.py", "print('hello')", [0.2], 0)
        all_vecs = vectorstore.get_all_vectors()
        assert len(all_vecs) == 2

    def test_add_vector_returns_entry(self):
        entry = vectorstore.add_vector("src/app.py", "def main(): pass", [0.5, 0.6], 1)
        assert isinstance(entry, dict)
        assert "file_path" in entry
        assert "content_hash" in entry


class TestDeleteVectorsForFile:
    @pytest.fixture(autouse=True)
    def setup_temp_data_dir(self, tmp_path):
        test_data = tmp_path / "test_data"
        test_data.mkdir()
        old_data_dir = vectorstore.DATA_DIR
        old_vectors_file = vectorstore.VECTORS_FILE
        vectorstore.DATA_DIR = str(test_data)
        vectorstore.VECTORS_FILE = str(test_data / "vectors.json")
        yield
        vectorstore.DATA_DIR = old_data_dir
        vectorstore.VECTORS_FILE = old_vectors_file

    def test_delete_vectors_for_file_removes_entries(self):
        vectorstore.add_vector("src/main.py", "print('a')", [0.1], 0)
        vectorstore.add_vector("src/main.py", "print('b')", [0.2], 1)
        vectorstore.add_vector("src/other.py", "print('c')", [0.3], 0)
        removed = vectorstore.delete_vectors_for_file("src/main.py")
        assert removed == 2
        remaining = vectorstore.get_all_vectors()
        assert len(remaining) == 1
        assert remaining[0]["file_path"] == "src/other.py"

    def test_delete_nonexistent_file_returns_zero(self):
        removed = vectorstore.delete_vectors_for_file("nonexistent.py")
        assert removed == 0


class TestGetVectorsForFile:
    @pytest.fixture(autouse=True)
    def setup_temp_data_dir(self, tmp_path):
        test_data = tmp_path / "test_data"
        test_data.mkdir()
        old_data_dir = vectorstore.DATA_DIR
        old_vectors_file = vectorstore.VECTORS_FILE
        vectorstore.DATA_DIR = str(test_data)
        vectorstore.VECTORS_FILE = str(test_data / "vectors.json")
        yield
        vectorstore.DATA_DIR = old_data_dir
        vectorstore.VECTORS_FILE = old_vectors_file

    def test_get_vectors_for_file(self):
        vectorstore.add_vector("src/main.py", "print('hello')", [0.1, 0.2], 0)
        vectorstore.add_vector("src/main.py", "print('world')", [0.3, 0.4], 1)
        vectorstore.add_vector("src/other.py", "print('other')", [0.5], 0)
        result = vectorstore.get_vectors_for_file("src/main.py")
        assert len(result) == 2
        for v in result:
            assert v["file_path"] == "src/main.py"

    def test_get_vectors_for_nonexistent_file(self):
        result = vectorstore.get_vectors_for_file("nonexistent.py")
        assert result == []


class TestGetAllVectors:
    @pytest.fixture(autouse=True)
    def setup_temp_data_dir(self, tmp_path):
        test_data = tmp_path / "test_data"
        test_data.mkdir()
        old_data_dir = vectorstore.DATA_DIR
        old_vectors_file = vectorstore.VECTORS_FILE
        vectorstore.DATA_DIR = str(test_data)
        vectorstore.VECTORS_FILE = str(test_data / "vectors.json")
        yield
        vectorstore.DATA_DIR = old_data_dir
        vectorstore.VECTORS_FILE = old_vectors_file

    def test_get_all_vectors_returns_list(self):
        result = vectorstore.get_all_vectors()
        assert isinstance(result, list)

    def test_get_all_vectors_after_add(self):
        vectorstore.add_vector("src/main.py", "code", [0.1], 0)
        result = vectorstore.get_all_vectors()
        assert len(result) == 1


class TestClearAllVectors:
    @pytest.fixture(autouse=True)
    def setup_temp_data_dir(self, tmp_path):
        test_data = tmp_path / "test_data"
        test_data.mkdir()
        old_data_dir = vectorstore.DATA_DIR
        old_vectors_file = vectorstore.VECTORS_FILE
        vectorstore.DATA_DIR = str(test_data)
        vectorstore.VECTORS_FILE = str(test_data / "vectors.json")
        yield
        vectorstore.DATA_DIR = old_data_dir
        vectorstore.VECTORS_FILE = old_vectors_file

    def test_clear_all_vectors_returns_count_and_empties(self):
        vectorstore.add_vector("src/a.py", "code a", [0.1], 0)
        vectorstore.add_vector("src/b.py", "code b", [0.2], 0)
        cleared = vectorstore.clear_all_vectors()
        assert cleared == 2
        assert len(vectorstore.get_all_vectors()) == 0

    def test_clear_empty_store_returns_zero(self):
        cleared = vectorstore.clear_all_vectors()
        assert cleared == 0
