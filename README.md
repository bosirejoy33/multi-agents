# NaiWatches 90s Multi-Agent Movie Guide

## Use Case & Rationale
**Chosen Use Case**: Entertainment Recommendation & Curation.
**Rationale**: In a single-agent setup, an LLM often hallucinates movie ratings or provides generic "best of" lists. By splitting this into a multi-agent team (NaiWatches), we separate the "vibe" analysis from the "fact-checking" (Web Research) and the "critique." This leads to more accurate, grounded, and personalized suggestions.

## Agent Team Diagram (Flow)
1. **[User Input]** -> **Boss Brain 9000 (Supervisor)**: Orchestrates the sequence.
2. **Supervisor** -> **Vibe Analyzer (Profiler)**: Distills raw text into a metadata profile.
3. **Profiler** -> **Web Scout (Researcher)**: Uses Google Search tool to find real-world ratings.
4. **Researcher** -> **Mix Master (Curator)**: Drafts a structured JSON list of 3-5 items.
5. **Curator** -> **Hype Checker (Critic)**: Evaluates match quality.
6. **Critic** -> **Human (HITL)**: Pauses for final user approval via the NaiWatches UI.

## How to Run
1. Ensure you have an environment variable `API_KEY` configured.
2. Install dependencies: `npm install @google/genai react react-dom lucide-react`.
3. Start the dev server.
4. Access the UI and enter your query in the NaiWatches command line.

## Key Challenges & Solutions
- **Coordination**: Ensuring the Researcher's data passed cleanly to the Curator. *Solution*: Used a strict JSON schema for the Curator's output.
- **Hallucinations**: Agents inventing movies. *Solution*: Integrated Google Search grounding in the Researcher agent.
- **Loops**: Critic rejecting everything. *Solution*: Added a "Human-in-the-loop" override to break cycles.
