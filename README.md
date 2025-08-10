AI Log Analytics Dashboard

🚀 Overview 
A modern dashboard for monitoring and analyzing application logs with: 
    -Filters: search, log level, source (NGINX, MySQL, App, k8s) 
    -Live metrics: total logs, anomalies, system health, avg response time 
    -Charts: log volume over time and error type distribution 
    -AI backend: detects anomalies and clusters errors using ML

🛠 Setup
Install Python Dependencies 
bash 
pip install -r requirements.txt
Generate Sample Logs (quick simulation for demo/testing) 
bash 
python generate_logs.py(This creates sampleData.json with thousands of logs for the dashboard)
Start the AI Backend bash python ai_log_analyzer.py
Runs at http://localhost:5000
Start the Frontend bash python -m http.server 8080 Open your browser at http://localhost:8080
💻 Usage Dashboard loads logs from sampleData.json

All filters update logs, metrics, charts, and AI results instantly

The last 50 filtered logs are sent to the backend for anomaly detection
