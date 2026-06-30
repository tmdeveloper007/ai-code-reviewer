"""
Extra language detection tests for text_splitter._detect_language.
Tests: (a) C/C++ variants not covered in test_make_splitter.py, (b) unknown extensions.
"""
import pytest
from text_splitter import _detect_language


class TestDetectLanguageExtraCCppVariants:
    """C and C++ header/file variants supported by _code_extensions."""

    def test_c_file(self):
        assert _detect_language("main.c") == "cpp"

    def test_c_header(self):
        assert _detect_language("types.h") == "cpp"

    def test_cpp_header_hpp(self):
        assert _detect_language("widget.hpp") == "cpp"

    def test_c_deep_path(self):
        assert _detect_language("src/main.c") == "cpp"

    def test_c_header_deep_path(self):
        assert _detect_language("include/types.h") == "cpp"


class TestDetectLanguageUnknownExtensions:
    """Unknown extensions return the 'default' language (generic splitter)."""

    def test_ruby_unknown(self):
        assert _detect_language("script.rb") == "default"

    def test_swift_unknown(self):
        assert _detect_language("main.swift") == "default"

    def test_kotlin_unknown(self):
        assert _detect_language("Main.kt") == "default"

    def test_php_unknown(self):
        assert _detect_language("index.php") == "default"

    def test_csharp_unknown(self):
        assert _detect_language("Program.cs") == "default"

    def test_go_known(self):
        assert _detect_language("main.go") == "go"

    def test_rust_known(self):
        assert _detect_language("main.rs") == "rust"

    def test_r_unknown(self):
        assert _detect_language("analysis.R") == "default"

    def test_matlab_unknown(self):
        assert _detect_language("script.m") == "default"

    def test_lua_unknown(self):
        assert _detect_language("config.lua") == "default"

    def test_haskell_unknown(self):
        assert _detect_language("Main.hs") == "default"

    def test_yaml_unknown(self):
        assert _detect_language("config.yaml") == "default"

    def test_json_unknown(self):
        assert _detect_language("data.json") == "default"

    def test_css_unknown(self):
        assert _detect_language("style.css") == "default"

    def test_html_unknown(self):
        assert _detect_language("index.html") == "default"

    def test_sql_unknown(self):
        assert _detect_language("schema.sql") == "default"

    def test_shell_unknown(self):
        assert _detect_language("build.sh") == "default"

    def test_makefile_unknown(self):
        assert _detect_language("Makefile") == "default"

    def test_dockerfile_unknown(self):
        assert _detect_language("Dockerfile") == "default"

    def test_no_extension(self):
        assert _detect_language("script") == "default"

    def test_csv_unknown(self):
        assert _detect_language("data.csv") == "default"

    def test_xml_unknown(self):
        assert _detect_language("config.xml") == "default"

    def test_md_unknown(self):
        assert _detect_language("README.md") == "default"

    def test_terraform_unknown(self):
        assert _detect_language("main.tf") == "default"

    def test_dart_unknown(self):
        assert _detect_language("main.dart") == "default"

    def test_scala_unknown(self):
        assert _detect_language("Hello.scala") == "default"

    def test_elm_unknown(self):
        assert _detect_language("Main.elm") == "default"

    def test_perl_unknown(self):
        assert _detect_language("script.pl") == "default"

    def test_erlang_unknown(self):
        assert _detect_language("server.erl") == "default"

    def test_elixir_unknown(self):
        assert _detect_language("mix.exs") == "default"

    def test_zig_unknown(self):
        assert _detect_language("main.zig") == "default"

    def test_coffeescript_unknown(self):
        assert _detect_language("script.coffee") == "default"

    def test_graphql_unknown(self):
        assert _detect_language("schema.graphql") == "default"

    def test_ocaml_unknown(self):
        assert _detect_language("main.ml") == "default"

    def test_powershell_unknown(self):
        assert _detect_language("setup.ps1") == "default"

    def test_terraform_vars_unknown(self):
        assert _detect_language("vars.tf") == "default"

    def test_toml_unknown(self):
        assert _detect_language("config.toml") == "default"

    def test_julia_unknown(self):
        assert _detect_language("script.jl") == "default"

    def test_clojure_unknown(self):
        assert _detect_language("core.clj") == "default"

    def test_fsharp_unknown(self):
        assert _detect_language("Program.fs") == "default"

    def test_vbnet_unknown(self):
        assert _detect_language("Module1.vb") == "default"

    def test_pascal_unknown(self):
        assert _detect_language("program.pas") == "default"

    def test_scss_unknown(self):
        assert _detect_language("style.scss") == "default"

    def test_sass_unknown(self):
        assert _detect_language("style.sass") == "default"

    def test_less_unknown(self):
        assert _detect_language("style.less") == "default"

    def test_terraform_deep_path(self):
        assert _detect_language("terraform/main.tf") == "default"

    def test_erlang_header_unknown(self):
        assert _detect_language("server.hrl") == "default"

    def test_protobuf_unknown(self):
        assert _detect_language("message.proto") == "default"


class TestDetectLanguageCaseInsensitivity:
    """Extension detection is case-insensitive (lowercased internally)."""

    def test_uppercase_py(self):
        assert _detect_language("main.PY") == "python"

    def test_uppercase_js(self):
        assert _detect_language("app.JS") == "javascript"

    def test_uppercase_tsx(self):
        assert _detect_language("component.TSX") == "typescript"

    def test_uppercase_rs(self):
        assert _detect_language("main.RS") == "rust"

    def test_uppercase_c(self):
        assert _detect_language("main.C") == "cpp"

    def test_uppercase_hpp(self):
        assert _detect_language("widget.HPP") == "cpp"

    def test_mixed_case_go(self):
        assert _detect_language("main.Go") == "go"

    def test_java_uppercase(self):
        assert _detect_language("Main.JAVA") == "java"
