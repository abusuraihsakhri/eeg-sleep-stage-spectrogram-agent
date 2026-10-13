# EEG Sleep Stage Spectrogram Agent

A research-oriented repository with a **local, browser-based EEG spectrogram**, a deterministic metric-audit demonstration, and two existing Python threshold-evaluation interfaces.

## Browser application

Open `index.html` from a static web server, or the `web/index.html` entry point. The repository includes a root entry point for GitHub Pages, when Pages is configured to publish the root of `master`.

The browser tool:
- Imports a single-channel EEG CSV with one amplitude column (µV), or `time,amplitude`; the first row may contain column names.
- Computes a Hann-windowed FFT and one-sided power spectral density (µV²/Hz) with 50% overlap, with a configurable 1-, 2-, or 4-second window.
- Displays a time-frequency heatmap to 30 Hz, mean band powers, and a synthetic sample recording.
- Exports the heatmap as PNG and window-level band-power values as CSV.
- Retains the original Python workers' **illustrative** threshold rules (primary >25, secondary >12, descriptor flags, critical flag) in a local-only audit widget.

**Important limitations:** The spectral analyzer is exploratory. It does not apply artefact rejection or diagnose sleep disorders, detect spindles/K-complexes, or assign AASM W/N1/N2/N3/REM stages. The Python `agents/` and `sleep_stage_ai/` modules also operate on generic metric thresholds, **not raw EEG**; their AASM/clinical descriptors do not establish conformity or validation. Do not use these outputs for patient-care decisions.

### Privacy and formats

All CSV/signal analysis in the browser is performed locally; no file is uploaded or stored. No external CDN, API, or telemetry service is used by the browser application. File limits are 5 MB and 250,000 samples; sampling frequencies from 32–1024 Hz are accepted. Set the sampling rate explicitly, because optional timestamps are not used to infer it. Uploaded values are assumed to be in µV; other units must be converted in advance. Do not use identifiable patient information in the example audit or API.

The optional Python REST API is a **separate** service and does not run on GitHub Pages. Its PHI regexes are partial heuristics, not a complete de-identification method.

## Development and tests

Python 3.10–3.12 is exercised in CI; runtime metadata supports Python 3.9+.

```bash
git clone https://github.com/abusuraihsakhri/eeg-sleep-stage-spectrogram-agent.git
cd eeg-sleep-stage-spectrogram-agent
python -m pip install -e ".[api,dev]"
pytest -q
node --test tests/test_spectrogram.cjs
python -m http.server 8080
```

Visit `http://localhost:8080/`. JavaScript tests need Node 22 or later; the static application needs a modern browser with Canvas, file APIs and JavaScript enabled.

## Python command-line / API

```bash
python cli.py audit --task-id TASK-001 --target TARGET-01 --primary 28.5 --secondary 14.2 --critical --status DISCORDANT
python cli.py batch -i sample.csv -o results.csv
python cli.py chat "system status"
python cli.py verify-audit
python cli.py serve --host 127.0.0.1 --port 8000
```

The Python API exposes `GET /health`, `GET /metrics`, `POST /api/audit`, `POST /api/chat`, and `GET /api/audit/logs`; generated API documentation is at `/docs` when the server is running. The independent `sleep_stage_ai` CLI remains accessible through `python sleep_stage_ai_app.py --help`.

The audit trail HMAC now verifies every signed entry and predecessor link, but it is **in-memory only** and uses a transient key unless `AUDIT_SECRET_KEY` is set. The system does not provide persistent, regulatory-grade audit records. The mock provider returns canned text and does not perform LLM inference.

### Container

```bash
docker build -t eeg-sleep-stage-spectrogram-agent .
docker run --rm -p 127.0.0.1:8000:8000 -e AUDIT_SECRET_KEY=replace-with-secure-key eeg-sleep-stage-spectrogram-agent
```

The API has no user authentication; do not expose it directly to an untrusted network or send patient data. Add access control, TLS and external audit-log persistence before any sensitive deployment.

## Implementation

- Browser: dependency-free HTML, CSS and JavaScript, FFT power estimation and Canvas.
- Backend: Python, Pydantic 2, optional FastAPI/Uvicorn, CSV batch processing.
- Testing: pytest and Node's built-in test runner, checked by GitHub Actions.
- License: [MIT](LICENSE).
