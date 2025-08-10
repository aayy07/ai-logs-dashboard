import json
import random
from datetime import datetime, timedelta

# Settings
NUM_LOGS = 100000  # Total number of logs to generate
START_TIME = datetime(2025, 8, 10, 0, 0, 0)

sources = ["nginx", "mysql", "app", "k8s"]
levels = ["INFO", "WARN", "ERROR"]
messages = {
    "nginx": [
        "GET /api/users 200 0.045s",
        "POST /api/login 200 0.123s",
        "upstream server timeout: proxy_read_timeout",
        "502 Bad Gateway",
        "connection reset by peer"
    ],
    "mysql": [
        "Query executed successfully",
        "Slow query detected: SELECT * FROM logs WHERE created_at > '2025-08-10' - 2.3s",
        "Connection lost during query execution",
        "Index optimization completed",
        "Table lock wait detected"
    ],
    "app": [
        "User authentication successful for user_id: 12345",
        "Failed to connect to Redis: ECONNREFUSED 127.0.0.1:6379",
        "Unhandled exception in payment service",
        "Cache hit for key: user_session_XYZ",
        "Rate limit exceeded for IP: 192.168.1.15"
    ],
    "k8s": [
        "Pod log-processor started successfully",
        "Pod crashed and restarted: CrashLoopBackOff",
        "Node not ready: network issues",
        "Resource limits exceeded: CPU throttling",
        "PVC storage usage above 85%"
    ]
}

logs = []
current_time = START_TIME

for i in range(NUM_LOGS):
    source = random.choice(sources)
    level = random.choice(levels)
    msg = random.choice(messages[source])
    logs.append({
        "timestamp": current_time.strftime("%Y-%m-%d %H:%M:%S"),
        "source": source,
        "level": level,
        "message": msg
    })
    # increment time randomly between 1-5 seconds
    current_time += timedelta(seconds=random.randint(1, 5))

# Save to JSON
with open("sampleData.json", "w") as f:
    json.dump({"logs": logs}, f, indent=2)

print(f"Generated {NUM_LOGS} logs in sampleData.json")
