# EEG Sleep Stage Spectrogram Agent

> **Domain:** Clinical Decision Support & Biomedical Computing  
> **Reference Guidelines & Standards:** `Standard Clinical Formulations & ISO/IEC Quality Frameworks`

<div align="center">

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
![Python](https://img.shields.io/badge/Python-3.10%20%7C%203.11%20%7C%203.12-3776AB.svg?logo=python&logoColor=white)
![FastAPI](https://img.shields.io/badge/FastAPI-0.111-009688.svg?logo=fastapi&logoColor=white)
![Audit Trail](https://img.shields.io/badge/Audit-HMAC--SHA256_Tamper--Evident-brightgreen.svg)
![Zero-PHI Guard](https://img.shields.io/badge/Guard-Zero--PHI_Outbound-blue.svg)
![Docker](https://img.shields.io/badge/Docker-Ready-2496ED.svg?logo=docker&logoColor=white)

</div>

---

## 📖 What It Does

EEG Sleep Stage Spectrogram Agent is an enterprise-grade analytical platform for clinical and biomedical AI workloads. It processes task payloads through specialized worker agents that evaluate metrics against reference thresholds, detect protocol conformance anomalies, and enforce zero-PHI (Protected Health Information) outbound guardrails. All evaluations are logged to a cryptographically tamper-evident HMAC-SHA256 audit trail.

The system provides two coordinated agent frameworks:

1. **`agents/` module** — Primary multi-worker evaluation engine with PHI guarding and audit logging.
2. **`sleep_stage_ai/` module** — AASM Polysomnography Hypnogram multi-lead agent for sleep medicine scoring per AASM Manual for Scoring Sleep v2.6.

---

## ⚙️ Key Capabilities & Algorithmic Modules

- **Deterministic Calculation Engine**: Strict compliance with standard reference formulations and thresholds.
- **Risk & Urgency Classification**: Multi-tier categorization (ROUTINE, ELEVATED_RISK, CRITICAL_STAT_PANIC) with automated clinical/operational action recommendations.
- **Validation & Guardrails**: Rigorous input bounds checking, finite-value enforcement (rejects NaN/Inf), and anomaly detection.
- **Zero-PHI Outbound Interceptor**: Active regex inspection blocking SSNs, MRNs, phone numbers, emails, and patient identifiers from audit logs.
- **Tamper-Evident HMAC-SHA256 Audit Trail**: Chained, cryptographically signed logs for every evaluation and state transition.
- **FastAPI REST API**: Exposes OpenAPI 3.1 REST endpoints for programmatic integration.
- **Prometheus Telemetry**: Operational metrics exporter for monitoring.
- **Batch Processing**: CSV-based bulk evaluation with per-row error resilience.
- **Docker Deployment**: Ready-to-run containerized deployment with health checks.

---

## 💻 Installation

```bash
# Clone the repository
git clone https://github.com/abusuraihsakhri/eeg-sleep-stage-spectrogram-agent.git
cd eeg-sleep-stage-spectrogram-agent

# Install dependencies
pip install fastapi uvicorn pydantic pytest

# Optional: Set audit secret key for persistent audit integrity
export AUDIT_SECRET_KEY="your-secure-random-key-here"
```

---

## 💻 CLI Quickstart & Usage

### 1. Run Single Task Evaluation
```bash
python cli.py audit --task-id TASK-001 --target TARGET-01 --primary 28.5 --secondary 14.2 --critical --status DISCORDANT
```

### 2. Interactive Supervisor Chat
```bash
python cli.py chat "What is the system status?"
```

### 3. Batch Process CSV Records
```bash
python cli.py batch -i sample.csv -o results.csv
```

### 4. Verify Audit Trail Integrity
```bash
python cli.py verify-audit
```

### 5. Launch FastAPI REST Server
```bash
python cli.py serve --host 127.0.0.1 --port 8000
```

### Parameter Reference
| Flag | Description | Default |
|:-----|:------------|:--------|
| `--task-id` | Unique task / case identifier | `TASK-2026-001` |
| `--target` | Entity or target identifier | `KEY-TARGET-01` |
| `--primary` | Primary domain measurement (float) | `28.5` |
| `--secondary` | Secondary kinetic/confidence score (float) | `14.2` |
| `--critical` | Emergency escalation flag | `False` |
| `--status` | Status code or phenotype descriptor | `DISCORDANT` |

### Input Data Schema (CSV Batch)

| Field | Description | Requirement |
|:------|:------------|:------------|
| `task_id` | Unique task identifier | Required |
| `target_identifier` | Entity/target identifier | Required |
| `primary_metric` | Primary measurement (finite float) | Required |
| `secondary_metric` | Secondary score (finite float) | Optional (default: 5.0) |
| `is_critical_flag` | Critical escalation (true/false) | Optional (default: false) |
| `status_descriptor` | Status code descriptor | Optional (default: NOMINAL) |

---

## 🛡️ Security & Enterprise Architecture

* **Zero-PHI Outbound Interceptor:** Active regex inspection blocking SSNs, MRNs, phone numbers, emails, DOB, and patient identifiers from audit logs.
* **Tamper-Evident HMAC-SHA256 Audit Trail:** Chained, cryptographically signed logs for every evaluation and state transition.
* **Input Validation:** All metric values validated as finite (NaN/Inf rejected) at the schema level.
* **Secure Key Generation:** If `AUDIT_SECRET_KEY` is not set, a cryptographically secure random key is generated per session (with a warning).
* **Batch Error Resilience:** Per-row error handling in batch mode — failing rows are logged and skipped without aborting the entire batch.

### Environment Variables
| Variable | Description | Required |
|:---------|:------------|:---------|
| `AUDIT_SECRET_KEY` | Secret key for HMAC-SHA256 audit signing | No (random key generated if unset) |
| `MODEL_PROVIDER` | LLM provider selection (`mock`, `ollama`, `claude`, `openai`) | No (default: mock) |

---

## 🧪 Testing & Verification

Run the automated test suite:

```bash
pytest -v
```

Execute high-throughput batch simulation benchmarks:

```bash
python simulator.py 1000
```

---

## 🐳 Container Deployment

```bash
docker build -t eeg-sleep-stage-spectrogram-agent .
docker run -p 8000:8000 -e AUDIT_SECRET_KEY=your-secure-key eeg-sleep-stage-spectrogram-agent
```

Or using Docker Compose:

```bash
AUDIT_SECRET_KEY=your-secure-key docker-compose up
```

---

## 📁 Project Structure

```
eeg-sleep-stage-spectrogram-agent/
├── agents/                  # Primary multi-worker evaluation engine
│   ├── __init__.py
│   ├── api.py               # FastAPI REST endpoints
│   ├── base.py              # PHI guard, HMAC audit trail, security
│   ├── learning.py          # Bayesian calibration engine
│   ├── llm_factory.py       # LLM provider abstraction
│   ├── metrics.py           # Prometheus metrics collector
│   ├── models.py            # Pydantic schemas with validation
│   ├── streamer.py          # WebSocket telemetry broadcaster
│   ├── supervisor.py        # Master orchestrator
│   └── workers.py           # Specialized evaluation workers
├── sleep_stage_ai/          # AASM Polysomnography Hypnogram agent
│   ├── __init__.py
│   ├── agents.py            # Sub-agents and coordinator
│   ├── cli.py               # Sleep-stage-specific CLI
│   ├── engine.py            # Core algorithmic engine
│   ├── models.py            # Dataclass schemas with validation
│   └── server.py            # FastAPI server factory
├── tests/                   # Pytest test suite
│   ├── test_eeg_sleep_stage_spectrogram_agent.py
│   ├── test_enrichment.py
│   └── test_sleep_stage_ai.py
├── web/                     # Operations console (HTML/JS)
│   └── index.html
├── cli.py                   # Primary CLI entry point
├── simulator.py             # High-throughput stress simulator
├── enrichment.py            # Domain-specific enrichment agents
├── sample.csv               # Sample batch input data
├── sample_payload.json      # Sample API payload
├── benchmark_dataset.json   # Golden benchmark test cases
├── openapi_spec.json        # OpenAPI 3.1 specification
├── Dockerfile               # Container build definition
├── docker-compose.yml       # Multi-service orchestration
├── pyproject.toml           # Python project metadata
└── LICENSE                  # MIT License
```

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
