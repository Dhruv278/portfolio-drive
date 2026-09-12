# How MedChron works

MedChron is the medical-records product inside Omnis AI's practice platform for US personal-injury law firms. A case arrives as thousands of pages from many providers: emergency room notes, orthopedic visits, therapy logs, imaging, pharmacy records and bills.

The pipeline runs in stages on background workers. Files are deduplicated first, so the same scanned document sent by two providers is processed once. Pages are read by OCR. Gemini extracts facts stage by stage: visits, diagnoses, medications, procedures, bills. Deterministic merge guards run ahead of the model's own deduplication, so one visit recorded by three providers comes back as one event. Every extracted fact carries the page it came from, and a resolver checks each citation against the record and drops any it cannot verify.

Chi is the assistant inside the product. It answers questions about one patient using only that patient's file, cites the pages it used, and exports the answer as a PDF the case team can share. Bills are reconciled against the record, and injury codes are validated against ICD-10 body parts so the diagnoses and the numbers line up. MedChron syncs with the CasePro legal CRM through a retrying outbox, embeds by matter, and exports combined PDFs. Clients share records through a hardened portal.

Prompts live in an append-only registry with versions and restore. Patient identifiers are scrubbed before text reaches a model. Tenant scoping and rate limits hold on every route. Before a prompt change ships it is replayed against known records and compared with the previous version.

I am the product lead and a senior engineer on MedChron: I own the roadmap, write the specifications, set priorities with leadership and build the core features with a distributed team.
