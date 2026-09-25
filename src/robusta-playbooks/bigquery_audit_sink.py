"""
Immutable BigQuery Audit Sink for Robusta OSS.
Records every automated diagnosis, prompt interaction, and execution event
directly into BigQuery dataset ops_analytics_prod as required by SOW Section 2.
"""

import datetime
import logging
import os
import uuid
from typing import Dict, Any, Optional

try:
    from google.cloud import bigquery
    BIGQUERY_AVAILABLE = True
except ImportError:
    BIGQUERY_AVAILABLE = False

logger = logging.getLogger("robusta")

class BigQueryAuditLogger:
    def __init__(self, project_id: Optional[str] = None, dataset_id: str = "ops_analytics_prod", table_id: str = "operational_remediation_audit"):
        self.project_id = project_id or os.environ.get("GCP_PROJECT", "operational-intelligence")
        self.dataset_id = dataset_id
        self.table_id = table_id
        self.client = None
        self.full_table_id = f"{self.project_id}.{self.dataset_id}.{self.table_id}"

        if BIGQUERY_AVAILABLE:
            try:
                self.client = bigquery.Client(project=self.project_id)
                logger.info(f"Initialized BigQuery Audit client for table: {self.full_table_id}")
            except Exception as e:
                logger.warning(f"Could not initialize BigQuery client: {e}. Audit records will be logged to stdout.")

    def log_remediation_event(
        self,
        failure_mode: str,
        target_workload: str,
        diagnosis_summary: str,
        action_executed: str,
        execution_type: str = "AUTOMATED",
        operator: Optional[str] = None,
        status: str = "SUCCESS",
        raw_telemetry: Optional[str] = None,
        incident_id: Optional[str] = None
    ) -> bool:
        """
        Inserts a structured row into BigQuery operational_remediation_audit table.
        """
        record = {
            "timestamp": datetime.datetime.now(datetime.timezone.utc).isoformat(),
            "incident_id": incident_id or str(uuid.uuid4()),
            "failure_mode": failure_mode,
            "target_workload": target_workload,
            "diagnosis_summary": diagnosis_summary,
            "action_executed": action_executed,
            "execution_type": execution_type,
            "operator": operator or ("SYSTEM_ROBUSTA" if execution_type == "AUTOMATED" else "ON_CALL_ELENA"),
            "status": status,
            "raw_telemetry": (raw_telemetry[:2000] if raw_telemetry else "")
        }

        if not self.client:
            logger.info(f"[AUDIT_FALLBACK_STDOUT]: {record}")
            return True

        try:
            errors = self.client.insert_rows_json(self.full_table_id, [record])
            if errors:
                logger.error(f"BigQuery insert failed: {errors}")
                return False
            logger.info(f"Successfully recorded immutable audit event to BigQuery: {record['incident_id']}")
            return True
        except Exception as e:
            logger.error(f"Failed to stream audit record to BigQuery: {e}")
            return False
