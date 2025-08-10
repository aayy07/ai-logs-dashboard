#!/usr/bin/env python3
"""
Real AI-Powered Log Analytics Backend
"""
from flask import Flask, jsonify, request
from flask_cors import CORS
from datetime import datetime
from collections import defaultdict
import numpy as np
import re
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.cluster import DBSCAN
from pyod.models.iforest import IForest
from textblob import TextBlob

app = Flask(__name__)
CORS(app)

class RealTimeLogAnalyzer:
    def __init__(self):
        self.log_buffer = []
        self.analyzer = IForest(contamination=0.1)
        self.trained = False
        self.vectorizer = TfidfVectorizer(stop_words='english')
        self.clusterer = DBSCAN(eps=0.5, min_samples=2)

    def extract_features(self, logs):
        features = []
        for log in logs:
            ts = datetime.strptime(log['timestamp'], '%Y-%m-%d %H:%M:%S')
            hour, minute = ts.hour, ts.minute
            level_enc = {'INFO': 1, 'WARN': 2, 'ERROR': 3, 'CRITICAL': 4}.get(log['level'], 1)
            msg_len = len(log['message'])
            word_count = len(log['message'].split())
            resp_time = 0
            match = re.search(r'(\d+\.\d+)s', log['message'])
            if match:
                resp_time = float(match.group(1))
            features.append([hour, minute, level_enc, msg_len, word_count, resp_time])
        return np.array(features)

    def detect_anomalies(self, logs):
        if len(logs) < 10:
            return []
        features = self.extract_features(logs)
        if not self.trained and len(logs) > 50:
            self.analyzer.fit(features)
            self.trained = True
            return []
        if self.trained:
            preds = self.analyzer.predict(features)
            scores = self.analyzer.decision_function(features)
            result = []
            for idx, (pred, score) in enumerate(zip(preds, scores)):
                if pred == 1:
                    result.append({
                        'log': logs[idx],
                        'anomaly_score': float(score),
                        'reason': self.reason_for_anomaly(logs[idx], features[idx])
                    })
            return result
        return []

    def reason_for_anomaly(self, log, feat):
        reasons = []
        if log['level'] == 'ERROR':
            reasons.append("Error level log")
        if feat[5] > 2.0:
            reasons.append("High response time")
        if feat[3] > 200:
            reasons.append("Long message")
        return "; ".join(reasons) or "Statistical anomaly"

    def cluster_errors(self, logs):
        errors = [log for log in logs if log['level'] in ['ERROR', 'WARN']]
        if len(errors) < 3:
            return []
        messages = [log['message'] for log in errors]
        X = self.vectorizer.fit_transform(messages)
        clusters = self.clusterer.fit_predict(X.toarray())
        grouped = defaultdict(list)
        for idx, cid in enumerate(clusters):
            if cid != -1:
                grouped[cid].append(errors[idx])
        result = []
        for cid, clogs in grouped.items():
            result.append({
                'count': len(clogs),
                'sample_message': clogs[0]['message'],
                'sources': list(set(l['source'] for l in clogs))
            })
        return result

    def analyze_sentiment(self, logs):
        err_msgs = [log['message'] for log in logs if log['level'] == 'ERROR']
        if not err_msgs:
            return {'sentiment': 'neutral', 'score': 0}
        text = " ".join(err_msgs[-10:])
        blob = TextBlob(text)
        score = blob.sentiment.polarity
        sentiment = 'positive' if score > 0.3 else 'negative' if score < -0.3 else 'neutral'
        return {'sentiment': sentiment, 'score': score}

analyzer = RealTimeLogAnalyzer()

@app.route("/api/analyze", methods=["POST"])
def analyze():
    data = request.get_json()
    logs = data.get("logs", [])
    analyzer.log_buffer.extend(logs)
    analyzer.log_buffer = analyzer.log_buffer[-1000:]
    return jsonify({
        'anomalies': analyzer.detect_anomalies(analyzer.log_buffer),
        'clusters': analyzer.cluster_errors(analyzer.log_buffer),
        'sentiment': analyzer.analyze_sentiment(analyzer.log_buffer)
    })

if __name__ == "__main__":
    app.run(port=5000, debug=True)
