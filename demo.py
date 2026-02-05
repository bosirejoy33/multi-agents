
import os
import time
import google.generativeai as genai

# --- CONFIGURATION ---
# Set your API Key here or as an environment variable
API_KEY = os.environ.get("API_KEY", "YOUR_API_KEY_HERE")
genai.configure(api_key=API_KEY)
model = genai.GenerativeModel('gemini-1.5-flash')

class NaiWatchesGrid:
    """
    Simulates the NaiWatches Multi-Agent Grid in a standalone Python environment.
    This replicates the logic found in the React application's GeminiService.
    """
    def __init__(self):
        self.state = {
            "query": "",
            "profile": "",
            "research": "",
            "draft": "",
            "critique": "",
            "approved": False
        }

    def profiler(self):
        print("\n📟 [Vibe Analyzer]: Deconstructing user intent...")
        prompt = f"Analyze this request and extract a movie-lover profile (genres, era, mood): '{self.state['query']}'"
        response = model.generate_content(prompt)
        self.state['profile'] = response.text
        time.sleep(1) # Simulate processing
        print(f"Status: Profile Locked.")

    def researcher(self):
        print("\n📡 [Web Scout]: Scouring the digital grid for high-rated hits...")
        prompt = f"Search simulation: Find 5 critically acclaimed titles matching this profile: {self.state['profile']}. List titles and ratings."
        response = model.generate_content(prompt)
        self.state['research'] = response.text
        time.sleep(1)
        print("Status: Database Sync Complete.")

    def curator(self):
        print("\n🎚️ [Mix Master]: Compiling the ultimate watch-list...")
        prompt = f"Based on this research: {self.state['research']}, pick the top 3 best matches. Write a 1-sentence 'Hype Rationale' for each."
        response = model.generate_content(prompt)
        self.state['draft'] = response.text
        time.sleep(1)
        print("Status: Draft Compiled.")

    def critic(self):
        print("\n🧐 [Hype Checker]: Performing quality assurance...")
        prompt = f"Review this draft: {self.state['draft']} against the user profile: {self.state['profile']}. Is this a perfect match? Answer 'YES' or 'NO' followed by reasoning."
        response = model.generate_content(prompt)
        self.state['critique'] = response.text
        if "YES" in response.text.upper():
            self.state['approved'] = True
        print(f"Critic Feedback: {self.state['critique'][:150]}...")

    def run(self, user_query):
        self.state['query'] = user_query
        print(f"====================================================")
        print(f"   NAIWATCHES AGENT GRID - INITIALIZING SEQUENCE    ")
        print(f"====================================================")
        print(f"INPUT_SIGNAL: {user_query}")
        
        # Start Sequence
        self.profiler()
        self.researcher()
        self.curator()
        self.critic()

        print(f"\n====================================================")
        print(f"   SEQUENCE COMPLETE - FINAL OUTPUT DELIVERY       ")
        print(f"====================================================")
        if self.state['approved']:
            print("\n✅ SYSTEM APPROVED. FINAL RECOMMENDATIONS:\n")
            print(self.state['draft'])
        else:
            print("\n❌ SYSTEM REJECTED. RE-MIXING REQUIRED.")
            print("The Hype Checker found inconsistencies. Manual override recommended.")

if __name__ == "__main__":
    # Example Usage
    grid = NaiWatchesGrid()
    grid.run("I want dark 90s sci-fi movies like Blade Runner with neon aesthetics.")
