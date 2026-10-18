# Chat benchmark: current RAG (A) vs full context (B), Oct 17, 2026 ~3:10 PM ET

Repo: /workspace/portfolio-v3 at 372e23d. No tracked files were changed. Scripts: `bench.ts` (imports the repo's own `retrieveRelevantChunks`, `rerankChunks`, `buildSystemPrompt`, `buildRetrievalQuery` and the CHAT_* constants) and `analyze.py`. Raw data: `latency.json`, `tokens.json`.
- Key: Cohere trial key, sourced into env per command, then unset. It isn't in any file here or in the repo (checked).
- API calls: 57 in total (5 tokenize + 52 embed/rerank/chat). 1 embed and 1 rerank per A run, 1 chat per run.
- Settings, same as route.ts: model `command-a-plus-05-2026`, temperature 0.2, maxTokens 12000, thinking enabled with a 5000-token budget. B-nothink: same, with `thinking: disabled`. No history. Follow-up chips are not included (they add 1 call per message in both designs).
- The box is in a datacenter, not Vercel, so absolute latency differs from production. The comparison between configs is what counts.

## 1. Exact prompt tokens (Cohere tokenize, model command-a-plus-05-2026)
| prompt | chars | tokens |
|---|---|---|
| System rules + highlights, no CONTEXT | 9,048 | 2,080 |
| (a) As built today, 10 reranked chunks (from usage.tokens.inputTokens, incl. the question) | ~13-16K | 2,969 to 3,811, median 3,499 |
| (b) Rules + all unique chunk texts from embeddings-cache.json (208 chunks, 0 duplicates) | 118,013 | 28,937 (usage: 28,970-28,978) |
| (c) Rules + the 41 corpus docs exactly as corpus.ts renders them (content/*.md + site.ts facts) | 109,088 | 26,414 |

The model's context window is 128K, so (b) and (c) fit with plenty of room.

## 2. Latency (A=11 runs, B=11, B-nothink=8; 3 questions repeated for A and B)
| metric | A median / p90 | B median / p90 | B-nothink median / p90 |
|---|---|---|---|
| embed+retrieve | 105 / 115 ms | n/a | n/a |
| rerank | 112 / 126 ms | n/a | n/a |
| first stream event | 207 / 230 ms | 441 / 1,097 ms | 359 / 1,118 ms |
| first thinking token | 207 / 231 ms | 441 / 1,097 ms | n/a |
| first visible token (chat only) | 1,378 / 7,020 ms | 3,204 / 25,369 ms | 359 / 1,118 ms |
| first visible token (end to end) | 1,593 / 7,363 ms | 3,204 / 25,369 ms | 359 / 1,118 ms |
| chat total | 2,734 / 8,878 ms | 6,060 / 26,864 ms | 4,235 / 27,612 ms |
| total end to end | 3,003 / 9,220 ms | 6,060 / 26,864 ms | 4,235 / 27,612 ms |
| inputTokens | tokens 3,499 (p90 3,656); billed 3,469 | tokens 28,973 (p90 28,976); billed 28,943 | tokens 28,975 (p90 28,977); billed 28,944 |
| outputTokens | tokens 338 (p90 1,174); billed 334 | tokens 605 (p90 5,182); billed 601 | tokens 522 (p90 4,265); billed 518 |

cachedTokens seen: [('A', 0), ('A', 2064), ('A', 2080), ('A', 3520), ('B', 0), ('B', 2080), ('B', 28928), ('B-nothink', 0), ('B-nothink', 28928), ('B-nothink', 28944)]
n runs: A=11, B=11, B-nothink=8

| question | cfg | rep | first visible e2e ms | total e2e ms | in tok | out tok |
|---|---|---|---|---|---|---|
| What are Nathan's strongest projects? | A | 0 | 7,363 | 9,220 | 3169 | 1230 |
| What are Nathan's strongest projects? | B | 0 | 1,995 | 6,060 | 28973 | 524 |
| What are Nathan's strongest projects? | B-nothink | 0 | 1,110 | 9,018 | 28974 | 950 |
| What are Nathan's strongest projects? | A | 1 | 8,171 | 9,788 | 3169 | 1174 |
| What are Nathan's strongest projects? | B | 1 | 2,006 | 6,022 | 28973 | 529 |
| Who is Nathan, and when does he graduate? | A | 0 | 1,279 | 1,657 | 2969 | 146 |
| Who is Nathan, and when does he graduate? | B | 0 | 3,204 | 3,734 | 28976 | 290 |
| Who is Nathan, and when does he graduate? | B-nothink | 0 | 362 | 4,408 | 28977 | 448 |
| What was Nathan's role at 3D Western? | A | 0 | 1,765 | 2,708 | 3811 | 249 |
| What was Nathan's role at 3D Western? | B | 0 | 6,713 | 7,370 | 28977 | 785 |
| What was Nathan's role at 3D Western? | B-nothink | 0 | 356 | 1,532 | 28978 | 132 |
| How does Campus work? | A | 0 | 2,380 | 4,428 | 3555 | 419 |
| How does Campus work? | B | 0 | 2,783 | 5,035 | 28971 | 605 |
| How does Campus work? | B-nothink | 0 | 1,129 | 6,231 | 28972 | 597 |
| How does Campus work? | A | 1 | 1,593 | 3,388 | 3555 | 403 |
| How does Campus work? | B | 1 | 6,035 | 9,372 | 28971 | 1075 |
| What did Nathan build at TeraGo? | A | 0 | 1,511 | 2,643 | 3499 | 313 |
| What did Nathan build at TeraGo? | B | 0 | 1,502 | 2,981 | 28975 | 265 |
| What did Nathan build at TeraGo? | B-nothink | 0 | 1,113 | 3,706 | 28976 | 253 |
| What did Nathan build at TeraGo? | A | 1 | 1,391 | 2,696 | 3499 | 271 |
| What did Nathan build at TeraGo? | B | 1 | 25,369 | 26,864 | 28975 | 5182 |
| Which hackathon projects did Nathan build solo? | A | 0 | 5,173 | 5,807 | 3185 | 554 |
| Which hackathon projects did Nathan build solo? | B | 0 | 27,559 | 63,369 | 28975 | 12000 |
| Which hackathon projects did Nathan build solo? | B-nothink | 0 | 346 | 70,997 | 28976 | 12000 |
| What is ferret? | A | 0 | 1,100 | 2,705 | 3656 | 328 |
| What is ferret? | B | 0 | 6,216 | 7,755 | 28970 | 966 |
| What is ferret? | B-nothink | 0 | 311 | 3,432 | 28971 | 371 |
| What is AWARE? | A | 0 | 1,401 | 3,003 | 3322 | 338 |
| What is AWARE? | B | 0 | 1,450 | 2,257 | 28971 | 375 |
| What is AWARE? | B-nothink | 0 | 353 | 4,063 | 28972 | 855 |


Notes:
- "first visible token (end to end)" for A includes embed+retrieve (~105 ms) and rerank (~112 ms).
- B-nothink's "first visible token" is misleading. With thinking disabled, this model writes its reasoning as visible text ("We need to answer: ... Use CONTEXT and RESUME HIGHLIGHTS ..."), so the first visible token is the start of leaked chain-of-thought. B-nothink is not usable as is.
- Outliers that drive the p90:
  - **Solo hacks question in full context**: B hit the 12,000-token cap at 63 s, and B-nothink at 71 s. Both looped ("- \"Street Cleaner\": not solo." repeated hundreds of times; "- Lumen: team." likewise). With 10 chunks, A answered correctly in 5.8 s.
  - **B, TeraGo repeat**: used the full 5,000-token reasoning budget, so the first visible token came at 25.4 s (the first run took 1.5 s).
  - **A, strongest projects**: about 1,000 reasoning tokens per run (8 s to the first visible token, both runs). The thin CONTEXT makes it think longer.
- Variance (A / B, rep 1 vs rep 2, end-to-end total): strongest 9.2/9.8 s vs 6.1/6.0 s; Campus 4.4/3.4 s vs 5.0/9.4 s; TeraGo 2.6/2.7 s vs 3.0/26.9 s.

## 3. Quality spot check (against settled facts and content)
**Strongest projects**
- A (both runs) still hallucinates. This confirms hallucination-rca.md cause 1, because retrieval returns no project or role chunks:
  - TeraGo: "contributed to production tools and data pipelines".
  - 3D Western: "led the data team, built ML workflows and delivered measurable improvements to their image-labeling pipeline". Invented, and it says "led" where he co-led.
  - Campus: "handling coursework, notes and scheduling". Invented.
  - Run 2 is vaguer, with no new inventions.
- B (both runs) is grounded:
  - Campus: Brightspace, hybrid retrieval, 20 tools, notes and due dates, 308 tests.
  - Homelab: 27 containers, 472 sessions, 58,000 tool calls.
  - AWARE: $80 UNO Q, 500 ms, Telegram, no cloud inference.
  - CareBridge: team, Spark 2026 3rd.
  - TeraGo: parser on Ollama.
  - 3D Western: co-led, 4,620, 84.2% agreement.
  - It doesn't say "3D Western platform", "production-grade" or "CareBridge not documented".
  - Small slips: "These projects combine real-world deployment" (the parser isn't deployed), and 84.2% without the filename and 76.9% caveat (rule 26 ignored).
- B-nothink: leaked reasoning, then a correct answer.

**Other questions**
- **Grad date (Who is):** A and B are both correct (May 2028, Summer 2027).
- **3D Western role:** both correct. B gives 84.2% without the filename caveat. A mentions no number.
- **Campus:** A and B are both accurate and close to equal. B adds the PWA detail; A adds the endpoint-agnostic detail.
- **TeraGo:** both correct ("works end to end, not deployed yet", 760 test cases).
- **Solo hacks:** A is correct (Animarker, AWARE). B and B-nothink degenerate into repetition loops up to the token cap. This is the biggest quality risk of full context: enumeration questions over 200+ chunks.
- **ferret:** both accurate. B says "built in Oct 2026", which matches the "Oct 2026 (approx.)" card. Both say it works offline, which is correct per Nathan.
- **AWARE:** both accurate. A's raw text has one em dash; production strips it with the route's dash filter, and the bench bypasses that filter.

## 4. Prompt caching
- Cohere caches automatically; there's no parameter to set. `usage.cachedTokens` (v2 `Usage.cachedTokens`, "prompt tokens that hit the inference cache", in cohere-ai SDK `api/types/Usage.d.ts`) came back non-zero on 22 of 30 runs:
  - A: 2,064-3,520, which is the shared system-prefix.
  - B: up to 28,928 of 28,943, which is the whole corpus prefix.
- **Billing didn't change:** `billedUnits.inputTokens` was identical with and without cache hits (B: 28,943 either way). So on this key, caching gives no visible discount. Cohere's public docs and pricing list no cache-read price (genai-prices notes "no Cohere model has cache_read_mtok pricing").
- Cache hits didn't clearly lower B's time to first token either. B runs with 28,928 cached tokens still had 0.4-1.1 s to the first event, vs about 0.2 s for A.

## 5. Cost per message
- **Official price not found.** https://cohere.com/pricing (fetched today) lists only legacy models (e.g. Command R+ 08-2024: $2.50 in / $10.00 out per 1M) and Model Vault. It has no price for command-a-plus-05-2026.
- **Third-party listings:**
  - $2.50 in / $10.00 out per 1M (models.dev: http://models.opencode.ai/providers/cohere/ ; allaimodel: https://allaimodel.com/models/cohere/command-a-plus-05-2026).
  - LiteLLM (https://models.litellm.ai/models/command-a-plus) lists it as $0 on Cohere as of Oct 17, 2026.
  - Treat $2.50 / $10 as the working assumption and confirm in the Cohere dashboard.
- Billed output appears to include reasoning tokens (e.g. 1,226 billed for 1,230 output, of which 999 were reasoning).

| | A (RAG) | B (full context) |
|---|---|---|
| Billed input, median | 3,469 | 28,943 |
| Billed output, median / p90 | 334 / ~1,170 | 601 / ~5,180 |
| Chat cost, median | $0.0087 + $0.0033 = **$0.012** | $0.0724 + $0.0060 = **$0.078** |
| Chat cost, p90-ish | ~$0.020 | ~$0.124 |
| Runaway (12K output cap) | ~$0.129 | **$0.192** (seen 2 of 19 B runs) |
| Embed + rerank | 1 embed (~10 tokens, negligible) + 1 rerank search unit (price not on the current pricing page) | none |
| API calls per message (trial quota) | 3 + 1 chip call | 1 + 1 chip call |

On these numbers B costs about **6.5x more per message** (median). The trial key is free, but its calls are rate-limited and Cohere's FAQ says trial keys "are not permitted to be used for production or commercial purposes" (cohere.com/pricing). That matters if the live site runs on this key.

## Recommendation
- **Keep RAG, and fix what it retrieves; don't switch to full context.**
- Full context fixes the strongest-projects hallucination, which confirms the root cause is missing context, not the model. But it costs about 6.5x per message, roughly doubles median time to first visible token (3.2 s vs 1.6 s), shows no billed caching discount, and degenerated into 12K-token repetition loops on an enumeration question (2 of 19 B runs hit the cap).
- Do this instead (cheap, keeps A's latency):
  1. **hallucination-rca 1a:** add `Summary:` from site.ts covers/summary to each doc's facts chunk. This is the corpus fix.
  2. **hallucination-rca 1b:** for broad questions, always include a small pinned overview (chunk 1 of terago, 3d-western and the 4 home projects). That's about 1.5-2.5K tokens, so roughly 5-6K input total, about $0.016/message. It's the slice of B that made B's answer correct, without the other 25K tokens.
  3. **Cap generation:** route.ts uses `CHAT_MAX_TOKENS = 12000` with a 5000-token reasoning budget (cohere.ts:12, 17). Lower them to about 2000 and 1500 to bound runaway cost and latency in both designs, and stop the stream when the same line repeats more than 3 times.
  4. **Keep thinking enabled.** With thinking disabled, this model leaks its reasoning into the answer.
- **Re-run:** after 1a and 1b, re-run `bench.ts latency` for the strongest-projects and solo-hacks questions (about 10 calls) to confirm.
