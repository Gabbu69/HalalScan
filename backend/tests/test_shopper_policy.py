import json
from pathlib import Path

import pytest

from backend.analysis import analyze_payload
from backend.verdict import decide_verdict
from backend.rapidapi_client import _normalize_status
from backend.tests.test_app import _client

FIXTURES = json.loads((Path(__file__).parents[2] / 'tests' / 'fixtures' / 'verdicts.json').read_text(encoding='utf-8'))


@pytest.mark.parametrize('fixture', FIXTURES, ids=[f['name'] for f in FIXTURES])
def test_shared_verdict_policy(fixture, tmp_path, monkeypatch):
    _client(tmp_path, monkeypatch)
    if 'rows' in fixture:
        assert decide_verdict(fixture['ingredients'], fixture['rows']) == fixture['expected']
    else:
        result = analyze_payload({'ingredients': fixture['ingredients'], 'certifyingBody': 'JAKIM'})
        assert result['final_verdict'] == fixture['expected']


def test_source_conflicts_and_provider_unknowns(tmp_path, monkeypatch):
    _client(tmp_path, monkeypatch)
    monkeypatch.setattr('backend.analysis.classify_ingredient', lambda _: {'status': 'HARAM', 'source': 'test-fixture'})
    assert analyze_payload({'ingredients': 'sugar'})['final_verdict'] == 'NON-COMPLIANT'
    assert _normalize_status('not halal') == 'HARAM'
    assert _normalize_status('probably halal') == 'UNKNOWN'
    assert _normalize_status('halal status unavailable') == 'UNKNOWN'


def test_unknown_barcode_requires_review(tmp_path, monkeypatch):
    _client(tmp_path, monkeypatch)
    monkeypatch.setattr('backend.analysis.fetch_product_by_barcode', lambda _: None)
    assert analyze_payload({'barcode': '0000000000000'})['final_verdict'] == 'REQUIRES REVIEW'


def test_history_retains_but_never_exposes_existing_server_rows(tmp_path, monkeypatch):
    client = _client(tmp_path, monkeypatch)
    from backend.database import save_scan, list_history
    save_scan({'id':'old','created_at':'2026-01-01','final_verdict':'HALAL COMPLIANT','product':{'name':'Private old scan'}})
    client.post('/api/analyze', json={'ingredients':'rice, salt'})
    assert client.get('/api/history').get_json()['history'] == []
    assert len(list_history()) == 1


@pytest.mark.parametrize('payload', [{'ingredients': ['sugar']}, {'ingredients':'x'*10001}, ['sugar']])
def test_malformed_input_is_rejected(payload, tmp_path, monkeypatch):
    client = _client(tmp_path, monkeypatch)
    assert client.post('/api/analyze', json=payload).status_code == 400
