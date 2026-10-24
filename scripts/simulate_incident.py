#!/usr/bin/env python3
"""
Simulate an Operational Intelligence incident alert to verify autonomous Robusta self-healing,
Slack reporting, and BigQuery immutable audit logging.
Usage:
  python3 scripts/simulate_incident.py [failure_mode] [workload] [namespace]
"""

import sys
import json
import subprocess
import datetime

def main():
    failure_mode = sys.argv[1] if len(sys.argv) > 1 else "ConsumerTriageStalled"
    target_workload = sys.argv[2] if len(sys.argv) > 2 else "emailservice"
    target_namespace = sys.argv[3] if len(sys.argv) > 3 else "omnipulse-dev"

    print(f"==> Initiating Incident Simulation:")
    print(f"    Failure Mode: {failure_mode}")
    print(f"    Workload:     {target_workload}")
    print(f"    Namespace:    {target_namespace}")

    # 1. Fetch Robusta Runner Pod Name
    try:
        pod_cmd = [
            "kubectl", "get", "pods", "-n", "robusta",
            "-l", "app=robusta-runner",
            "-o", "jsonpath={.items[0].metadata.name}"
        ]
        robusta_pod = subprocess.check_output(pod_cmd, text=True).strip()
        if not robusta_pod:
            print("::error::Could not find robusta-runner pod in namespace 'robusta'.")
            return 1
        print(f"==> Target Robusta Runner Pod: {robusta_pod}")
    except Exception as e:
        print(f"::error::Failed to locate Robusta pod via kubectl: {e}")
        return 1

    # 2. Build Structured Alertmanager Payload (Robusta Schema Compliant)
    now_utc = datetime.datetime.now(datetime.timezone.utc).isoformat()
    payload = {
        "status": "firing",
        "receiver": "robusta",
        "alerts": [
            {
                "status": "firing",
                "labels": {
                    "alertname": failure_mode,
                    "severity": "critical",
                    "deployment": target_workload,
                    "namespace": target_namespace
                },
                "annotations": {
                    "summary": f"Proactive detection: {failure_mode} on {target_workload}",
                    "description": f"Streaming consumer deadlock watchdog detected hung worker thread. Autonomous self-healing triggered."
                },
                "startsAt": now_utc,
                "endsAt": "0001-01-01T00:00:00Z"
            }
        ]
    }

    # 3. Inject Webhook into Robusta In-Cluster Engine
    remote_code = f"""
import urllib.request, json
payload = {json.dumps(payload)}
req = urllib.request.Request(
    'http://127.0.0.1:5000/api/alerts',
    data=json.dumps(payload).encode('utf-8'),
    headers={{'Content-Type': 'application/json'}}
)
try:
    resp = urllib.request.urlopen(req)
    print(f'==> Alert Webhook Dispatched Successfully! (HTTP {{resp.status}})')
except urllib.error.HTTPError as e:
    err_body = e.read().decode('utf-8')
    print(f'::error::HTTP Error {{e.code}}: {{err_body}}')
    raise e
"""

    exec_cmd = ["kubectl", "exec", "-i", "-n", "robusta", robusta_pod, "--", "python3", "-"]
    proc = subprocess.run(exec_cmd, input=remote_code, text=True, capture_output=True)

    if proc.returncode != 0:
        print("::error::Alert injection failed:")
        print(proc.stderr)
        return proc.returncode

    print(proc.stdout.strip())
    print("\n✅ Incident successfully triggered!")
    print("1. Check Slack channel #operational-intelligence for:")
    print(f"   - Alert Notification: {failure_mode} on {target_workload}")
    print(f"   - Remediation Action: Deployment/{target_namespace}/{target_workload} restarted")
    print("2. Check BigQuery Audit Log:")
    print("   bq query --use_legacy_sql=false 'SELECT timestamp, incident_id, failure_mode, target_workload, action_executed, status FROM `festive-ally-443007-r4.ops_analytics_prod.operational_remediation_audit` ORDER BY timestamp DESC LIMIT 5;'")
    return 0

if __name__ == '__main__':
    sys.exit(main())
