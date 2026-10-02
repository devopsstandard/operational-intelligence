#!/usr/bin/env python3
import sys
import os
import datetime
import uuid

def main():
    git_sha = sys.argv[1] if len(sys.argv) > 1 else "unknown"
    env_name = sys.argv[2] if len(sys.argv) > 2 else "dev"
    target_workload = sys.argv[3] if len(sys.argv) > 3 else "emailservice"
    failure_mode = sys.argv[4] if len(sys.argv) > 4 else "GITOPS_PROACTIVE_REMEDIATION"

    try:
        from google.cloud import bigquery
    except ImportError:
        print("::warning::google-cloud-bigquery library not available in environment; skipping BigQuery audit record.")
        return 0

    proj_id = os.environ.get("GCP_PROJECT", "festive-ally-443007-r4")
    table_id = f"{proj_id}.ops_analytics_prod.operational_remediation_audit"

    row = {
        "timestamp": datetime.datetime.now(datetime.timezone.utc).isoformat(),
        "incident_id": f"sre-{str(uuid.uuid4())[:8]}",
        "failure_mode": failure_mode,
        "target_workload": target_workload,
        "diagnosis_summary": f"Automated SRE remediation applied via GitOps pipeline for environment '{env_name}'.",
        "action_executed": "ROLLOUT_RESTART",
        "execution_type": "AUTOMATED",
        "operator": "GITHUB_ACTIONS_GITOPS",
        "status": "SUCCESS",
        "raw_telemetry": f'{{"git_commit":"{git_sha}","env":"{env_name}","target":"{target_workload}"}}'
    }

    try:
        client = bigquery.Client(project=proj_id)
        errors = client.insert_rows_json(table_id, [row])
        if errors:
            print(f"::warning::BigQuery audit log insert had errors: {errors}")
            return 0
        print(f"==> Immutable BigQuery audit trail logged automatically: {row['incident_id']} ({failure_mode})")
        
        # Query and display the latest 5 audit records for immediate visibility in CI/CD logs
        try:
            query = f"""
            SELECT timestamp, incident_id, failure_mode, target_workload, action_executed, status, operator 
            FROM `{table_id}` 
            ORDER BY timestamp DESC LIMIT 5
            """
            query_job = client.query(query)
            rows = list(query_job.result())
            print("\n==================== LATEST BIGQUERY REMEDIATION AUDIT LOGS ====================")
            for r in rows:
                print(f"[{r.timestamp}] Incident: {r.incident_id:<12} | Mode: {r.failure_mode:<30} | Target: {r.target_workload:<14} | Action: {r.action_executed:<16} | Status: {r.status:<8} | Operator: {r.operator}")
            print("=================================================================================\n")
        except Exception as q_err:
            print(f"::warning::Could not query recent audit logs: {q_err}")

        return 0
    except Exception as e:
        print(f"::warning::Failed to write BigQuery audit log: {e}")
        return 0

if __name__ == '__main__':
    sys.exit(main())
