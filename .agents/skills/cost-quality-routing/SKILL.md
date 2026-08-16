---
name: cost-quality-routing
description: Choose models/providers and reasoning effort to minimize cost or subscription quota while maintaining required coding quality. Use for provider failover, model cascades, cheap vision/retrieval, subagents, or reasoning-budget decisions.
---

Route by capability and measured quality, not price alone.

1. Classify the work: mechanical/read-only, retrieval/summarization, visual transcription, normal coding, hard debugging/architecture, or final verification.
2. Use cheaper/already-paid/local models for bounded mechanical work only when they pass the required capability tests.
3. Escalate to a stronger model when verification fails, uncertainty is high, the task spans architecture/security, or prior attempts regress tests.
4. Preserve session affinity unless a quota/rate-limit failure makes a switch necessary; never switch after response bytes have been relayed.
5. Prefer free/already-paid quota before metered API routes only when quality constraints are still met.
6. For images, cache deterministic image evidence by content hash and use the cheapest proven vision engine; allow a local VLM when explicitly configured.
7. Track task success, retries, input/output tokens, cache hits, latency, and effective cost. Optimize the total successful task cost, not price per token.
