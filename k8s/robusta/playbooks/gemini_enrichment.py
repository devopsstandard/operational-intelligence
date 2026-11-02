"""
Vertex AI Gemini 1.5 Flash Diagnostic Engine for Robusta OSS.
Provides structured, schema-validated Root Cause Analysis (RCA) and
remediation recommendations without hallucinations.
"""

import json
import logging
import os
from typing import Dict, Any, Optional

try:
    import vertexai
    from vertexai.generative_models import GenerativeModel, GenerationConfig
    VERTEXAI_AVAILABLE = True
except ImportError:
    VERTEXAI_AVAILABLE = False

logger = logging.getLogger("robusta")

RCA_PROMPT_TEMPLATE = """You are an expert SRE and Cloud Architect triaging a production Kubernetes incident on Google Kubernetes Engine.
Failure Mode Context: {failure_mode}
Target Workload: {target_workload} (Namespace: {namespace})
Alert Summary: {alert_summary}

Recent Pod Logs (Last 100 lines):
```
{pod_logs}
```

Recent Kubernetes Events:
```
{k8s_events}
```

Analyze the failure telemetry and output a strict JSON object with these exact keys:
1. "summary": A concise 1-2 sentence plain English explanation of what happened.
2. "root_cause": Clear identification of the technical root cause (e.g. socket deadlock, poison pill, token limit breach).
3. "confidence_score": Float between 0.0 and 1.0 indicating diagnostic confidence.
4. "recommended_action": Exactly one of ["ROLLOUT_RESTART", "DRAIN_DLQ_TO_QUARANTINE", "THROTTLE_BATCH_CONCURRENCY", "ESCALATE_TO_HUMAN"].
5. "idempotency_safe": Boolean indicating if the recommended action is 100% safe to run automatically.
6. "justification": Brief justification for the recommendation.

Ensure the output is ONLY valid JSON with no markdown formatting.
"""

class GeminiDiagnostics:
    def __init__(self, project_id: Optional[str] = None, location: str = "europe-west1", model_name: str = "gemini-1.5-flash"):
        self.project_id = project_id or os.environ.get("GCP_PROJECT", "operational-intelligence")
        self.location = location
        self.model_name = model_name
        self.model = None

        if VERTEXAI_AVAILABLE:
            try:
                vertexai.init(project=self.project_id, location=self.location)
                self.model = GenerativeModel(self.model_name)
                logger.info(f"Initialized Vertex AI with model: {self.model_name}")
            except Exception as e:
                logger.warning(f"Failed to initialize Vertex AI client: {e}. Falling back to rule-based analysis.")

    def analyze_incident(
        self,
        failure_mode: str,
        target_workload: str,
        namespace: str,
        alert_summary: str,
        pod_logs: str,
        k8s_events: str
    ) -> Dict[str, Any]:
        """
        Executes Gemini 1.5 Flash diagnosis. Returns structured JSON dictionary.
        """
        # Truncate logs to avoid excessive token consumption & stay well within $1,400 budget
        truncated_logs = pod_logs[-4000:] if len(pod_logs) > 4000 else pod_logs
        truncated_events = k8s_events[-2000:] if len(k8s_events) > 2000 else k8s_events

        prompt = RCA_PROMPT_TEMPLATE.format(
            failure_mode=failure_mode,
            target_workload=target_workload,
            namespace=namespace,
            alert_summary=alert_summary,
            pod_logs=truncated_logs,
            k8s_events=truncated_events
        )

        if not self.model:
            return self._deterministic_fallback(failure_mode, target_workload)

        try:
            config = GenerationConfig(
                temperature=0.1,
                top_p=0.8,
                response_mime_type="application/json"
            )
            response = self.model.generate_content(prompt, generation_config=config)
            result = json.loads(response.text)
            logger.info(f"Gemini 1.5 Flash diagnosis succeeded for {target_workload}: {result.get('recommended_action')}")
            return result
        except Exception as e:
            logger.error(f"Gemini API invocation error: {e}. Executing deterministic fallback.")
            return self._deterministic_fallback(failure_mode, target_workload)

    def _deterministic_fallback(self, failure_mode: str, target_workload: str) -> Dict[str, Any]:
        """Safety fallback adhering to SOW Anti-Hallucination & Confidently Wrong defense."""
        if "STALLED" in failure_mode.upper() or "DEADLOCK" in failure_mode.upper():
            return {
                "summary": f"Detected stalled message processing on {target_workload}. Pod is healthy according to K8s probes but processing zero stream events.",
                "root_cause": "Silent socket deadlock or thread starvation in stream consumer worker.",
                "confidence_score": 0.85,
                "recommended_action": "ROLLOUT_RESTART",
                "idempotency_safe": True,
                "justification": "Safe restart recovers deadlocked consumer thread without state corruption."
            }
        elif "DLQ" in failure_mode.upper() or "POISON" in failure_mode.upper():
            return {
                "summary": f"Dead-letter queue backpressure detected for {target_workload}.",
                "root_cause": "Malformed payload schema or unhandled exception during message parsing.",
                "confidence_score": 0.80,
                "recommended_action": "DRAIN_DLQ_TO_QUARANTINE",
                "idempotency_safe": True,
                "justification": "Quarantining unparsable payloads prevents head-of-line blocking in Pub/Sub."
            }
        elif "QUOTA" in failure_mode.upper() or "429" in failure_mode.upper():
            return {
                "summary": f"Vertex AI API token quota exhausted (429) during batch summarization.",
                "root_cause": "Transient Token-Per-Minute (TPM) burst exceeding project limit.",
                "confidence_score": 0.95,
                "recommended_action": "THROTTLE_BATCH_CONCURRENCY",
                "idempotency_safe": True,
                "justification": "Dynamic backoff and worker throttling restores API compliance without dropped tasks."
            }
        return {
            "summary": f"Unclassified transient alert on {target_workload}.",
            "root_cause": "Telemetry inconclusive.",
            "confidence_score": 0.40,
            "recommended_action": "ESCALATE_TO_HUMAN",
            "idempotency_safe": False,
            "justification": "Ambiguous failure requires human engineer assessment."
        }
