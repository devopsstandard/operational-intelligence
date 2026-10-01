#!/usr/bin/env python3
import sys
import json
import urllib.request
import urllib.error
from datetime import datetime, timezone

def main():
    alert_name = sys.argv[1] if len(sys.argv) > 1 else "ConsumerTriageStalled"
    severity = sys.argv[2] if len(sys.argv) > 2 else "critical"
    now_iso = datetime.now(timezone.utc).strftime('%Y-%m-%dT%H:%M:%SZ')

    payload = {
        "version": "4",
        "groupKey": f"{{}}:{{alertname=\"{alert_name}\"}}",
        "truncatedAlerts": 0,
        "status": "firing",
        "receiver": "robusta-webhook",
        "groupLabels": {
            "alertname": alert_name,
            "namespace": "omnipulse-dev"
        },
        "commonLabels": {
            "alertname": alert_name,
            "severity": severity,
            "namespace": "omnipulse-dev"
        },
        "commonAnnotations": {
            "summary": f"Simulated SRE Incident: {alert_name}",
            "description": "Live operational intelligence test dispatched via CI/CD pipeline."
        },
        "externalURL": "http://alertmanager-operated.monitoring.svc.cluster.local:9093",
        "alerts": [
            {
                "status": "firing",
                "labels": {
                    "alertname": alert_name,
                    "severity": severity,
                    "namespace": "omnipulse-dev",
                    "pod": "frontend-simulated",
                    "target_workload": "frontend"
                },
                "annotations": {
                    "summary": f"Simulated SRE Incident: {alert_name}",
                    "description": "Live operational intelligence test dispatched via CI/CD pipeline. Validating Prometheus Alertmanager webhook routing, Gemini 1.5 Flash RCA, and Slack ChatOps dispatch."
                },
                "startsAt": now_iso,
                "endsAt": "0001-01-01T00:00:00Z",
                "generatorURL": "http://prometheus-operated.monitoring.svc.cluster.local:9090",
                "fingerprint": "1234567890abcdef"
            }
        ]
    }

    data = json.dumps(payload).encode('utf-8')
    req = urllib.request.Request(
        'http://127.0.0.1:5000/api/alerts',
        data=data,
        headers={'Content-Type': 'application/json'}
    )

    print(f"==> Dispatching Alertmanager v4 payload to Robusta runner at http://127.0.0.1:5000/api/alerts...")
    try:
        with urllib.request.urlopen(req, timeout=30) as resp:
            print(f"==> Robusta Webhook Response: {resp.status} {resp.reason}")
            body = resp.read().decode('utf-8', errors='replace')
            if body:
                print(f"==> Response details: {body}")
            return 0
    except urllib.error.HTTPError as e:
        print(f"::error::Robusta Webhook returned HTTP {e.code}: {e.reason}", file=sys.stderr)
        try:
            err_body = e.read().decode('utf-8', errors='replace')
            print(f"==> Error details: {err_body}", file=sys.stderr)
        except Exception:
            pass
        return 1
    except Exception as e:
        print(f"::error::Unexpected exception: {e}", file=sys.stderr)
        return 1

if __name__ == '__main__':
    sys.exit(main())
