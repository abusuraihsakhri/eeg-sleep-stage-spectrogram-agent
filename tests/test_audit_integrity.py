import sys
from pathlib import Path

import pytest

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
from agents.base import AuditTrail, SecurityException


def test_hmac_detects_modified_signed_fields():
    for field in ("audit_id", "timestamp", "actor", "event_type", "payload_hash"):
        trail = AuditTrail("persistent-test-secret")
        trail.log("system", "supervisor", "CHECK", {"status": "OK"})
        assert trail.verify_integrity()
        trail.logs[0][field] = "TAMPERED"
        assert not trail.verify_integrity(), field


def test_hmac_detects_modified_chain_links():
    trail = AuditTrail("persistent-test-secret")
    trail.log("system", "supervisor", "CHECK", {"status": "OK"})
    trail.log("system", "supervisor", "CHECK", {"status": "OK"})
    trail.logs[0]["current_hash"] = "0" * 64
    assert not trail.verify_integrity()


def test_audit_log_reader_cannot_modify_internal_chain():
    trail = AuditTrail("persistent-test-secret")
    trail.log("system", "supervisor", "CHECK", {"status": "OK"})
    trail.get_trail()[0]["actor"] = "changed"
    assert trail.verify_integrity()
    assert trail.get_trail()[0]["actor"] == "system"


def test_phi_is_rejected_in_actor_metadata():
    trail = AuditTrail("persistent-test-secret")
    with pytest.raises(SecurityException):
        trail.log("Patient John Doe", "supervisor", "CHECK", {"status": "OK"})
