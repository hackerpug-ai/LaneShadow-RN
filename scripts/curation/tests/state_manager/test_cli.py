"""Tests for cli.py — argparse parsing, subcommand dispatch."""

from __future__ import annotations

import pytest

from scripts.curation.pipeline.state_manager.cli import build_parser


class TestParserStructure:
    def test_parser_builds_without_error(self):
        parser = build_parser()
        assert parser is not None

    def test_status_subcommand(self):
        parser = build_parser()
        args = parser.parse_args(["status"])
        assert args.command == "status"

    def test_ingest_default_source(self):
        parser = build_parser()
        args = parser.parse_args(["ingest"])
        assert args.command == "ingest"
        assert args.source == "all"

    def test_ingest_specific_source(self):
        parser = build_parser()
        for src in ["motorcycleroads", "bestbikingroads", "fhwa"]:
            args = parser.parse_args(["ingest", "--source", src])
            assert args.source == src

    def test_ingest_invalid_source_fails(self):
        parser = build_parser()
        with pytest.raises(SystemExit):
            parser.parse_args(["ingest", "--source", "badvalue"])

    def test_extract_no_args(self):
        parser = build_parser()
        args = parser.parse_args(["extract"])
        assert args.command == "extract"
        assert args.limit is None
        assert args.retry_errors is False
        assert args.dry_run is False

    def test_extract_with_limit(self):
        parser = build_parser()
        args = parser.parse_args(["extract", "--limit", "50"])
        assert args.limit == 50

    def test_extract_dry_run(self):
        parser = build_parser()
        args = parser.parse_args(["extract", "--dry-run"])
        assert args.dry_run is True

    def test_extract_retry_errors(self):
        parser = build_parser()
        args = parser.parse_args(["extract", "--retry-errors"])
        assert args.retry_errors is True

    def test_push_no_args(self):
        parser = build_parser()
        args = parser.parse_args(["push"])
        assert args.command == "push"
        assert args.limit is None

    def test_push_with_limit(self):
        parser = build_parser()
        args = parser.parse_args(["push", "--limit", "100"])
        assert args.limit == 100

    def test_embed_no_args(self):
        parser = build_parser()
        args = parser.parse_args(["embed"])
        assert args.command == "embed"

    def test_quality_report(self):
        parser = build_parser()
        args = parser.parse_args(["quality-report"])
        assert args.command == "quality-report"

    def test_wipe_test_seeds(self):
        parser = build_parser()
        args = parser.parse_args(["wipe-test-seeds"])
        assert args.command == "wipe-test-seeds"

    def test_reset_with_stage(self):
        parser = build_parser()
        args = parser.parse_args(["reset", "--stage", "extract"])
        assert args.command == "reset"
        assert args.stage == "extract"
        assert args.source is None

    def test_reset_with_source(self):
        parser = build_parser()
        args = parser.parse_args(["reset", "--stage", "push", "--source", "fhwa"])
        assert args.stage == "push"
        assert args.source == "fhwa"

    def test_reset_requires_stage(self):
        parser = build_parser()
        with pytest.raises(SystemExit):
            parser.parse_args(["reset"])

    def test_reset_invalid_stage_fails(self):
        parser = build_parser()
        with pytest.raises(SystemExit):
            parser.parse_args(["reset", "--stage", "bogus"])

    def test_verbose_flag(self):
        parser = build_parser()
        args = parser.parse_args(["--verbose", "status"])
        assert args.verbose is True

    def test_no_command_fails(self):
        parser = build_parser()
        with pytest.raises(SystemExit):
            parser.parse_args([])
