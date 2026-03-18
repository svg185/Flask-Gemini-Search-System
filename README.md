# AI Search Engine Project

This Vite + React app combines **Google Programmable Search** with **Gemini** to create a lightweight research assistant:

- Google Custom Search fetches the top live web results.
- Gemini summarizes the result set into a concise answer.
- The UI shows source links, source domains, and follow-up search ideas.
- Signed-in users keep a short local search history in the browser.

## Setup

1. Install dependencies:
   ```bash
   npm install
   ```
2. Create a `.env.local` file with your keys:
   ```bash
   VITE_GEMINI_API_KEY=your_gemini_key
   VITE_GOOGLE_API_KEY=your_google_api_key
   VITE_GOOGLE_SEARCH_ENGINE_ID=your_search_engine_id
   ```
3. Start the development server:
   ```bash
   npm run dev
   ```

## Notes

- This project is designed for client-side prototyping with Vite.
- For production, move API calls behind a server so keys are not exposed in the browser.
