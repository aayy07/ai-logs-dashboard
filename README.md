# AI Log Analytics Dashboard

## 🚀 Overview
A modern dashboard for monitoring and analyzing application logs with:

- **Filters:** Search, log level, source (NGINX, MySQL, App, k8s)
- **Live metrics:** Total logs, anomalies, system health, average response time
- **Charts:** Log volume over time, error type distribution
- **AI backend:** Detects anomalies and clusters errors using machine learning

## 🛠 Setup

### 1. Install Python Dependencies
```bash
pip install -r requirements.txt
```

### 2. Generate Sample Logs (for demo/testing)
```bash
python generate_logs.py
```
This creates `sampleData.json` with thousands of logs for the dashboard.

### 3. Start the AI Backend
```bash
python ai_log_analyzer.py
```
The backend runs at [http://localhost:5000](http://localhost:5000)

### 4. Start the Frontend
```bash
python -m http.server 8080
```
Open your browser at [http://localhost:8080](http://localhost:8080)

## 💻 Usage

- The dashboard loads logs from `sampleData.json`.
- All filters update logs, metrics, charts, and AI results instantly.
- The last 50 filtered logs are sent to the backend for anomaly detection and clustering.
