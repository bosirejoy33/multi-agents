
# NaiWatches 90s Multi-Agent Movie Guide

## Use Case & Rationale
**Chosen Use Case**: Entertainment Recommendation & Curation.
**Rationale**: In a single-agent setup, an LLM often hallucinations movie ratings. NaiWatches uses a collaborative grid of 5 specialized agents to ensure research-grounded, peer-reviewed movie plans.

## Agent Team (The Grid)
1. **Boss Brain 9000 (Supervisor)**: Orchestrates the flow.
2. **Vibe Analyzer (Profiler)**: Extracts metadata from your chat.
3. **Web Scout (Researcher)**: Uses tools to find real ratings.
4. **Mix Master (Curator)**: Selects the final hits.
5. **Hype Checker (Critic)**: QA reviews the plan.

## How to Run (Direct Copy-Paste)
### 1. Web App
- Run `npm install` and `npm run dev`.
- Ensure `process.env.API_KEY` is set.

### 2. Python Demo (Jupyter Alternative)
- Install requirements: `pip install google-generativeai`
- Run the demo script: `python demo.py`
- *Note: This replicates the logic of the React app in a CLI format.*

## Key Challenges & Solutions
- **Hallucinations**: Solved by the **Hype Checker** agent rejecting any titles not found in the **Web Scout's** research data.
- **Coordination**: The **Boss Brain** ensures a linear state transition so the Curator never acts before the Profiler.
