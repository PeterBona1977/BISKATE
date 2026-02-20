# Gemini API Diagnostics & Fix

## Diagnosis: API Key Leaked
Our diagnostics have confirmed that the Gemini API connection is failing because **the provided API keys has been flagged as leaked by Google**.

When attempting to list available models or generate content, the Google API returns a `403 Permission Denied` error with the specific message:
> "Your API key was reported as leaked. Please use another API key."

This means Google has automatically blocked these keys to prevent abuse. This often happens if an API key (or a file containing it, like `.env` or `.env.local`) was accidentally committed to a public repository or exposed online.

## What You Need To Do

1.  **Generate a New API Key**:
    - Go to [Google AI Studio](https://aistudio.google.com/app/apikey).
    - Create a new API key.

2.  **Update Your Environment Variables**:
    - Open the `.env.local` file in your project root.
    - Replace the value of `GEMINI_API_KEY` (and `GOOGLE_GENERATIVE_AI_API_KEY` if present) with your **new** API key.
    - **Important**: Ensure you do not commit this file to GitHub or any public repository.

3.  **Restart Your Server**:
    - If your local server is running, stop it and restart it (`npm run dev`) to load the new environment variables.

4.  **Verify**:
    - Try the action again. The application should now be able to connect to Gemini.

## Technical Details (for reference)
- **Key Prefix**: `AIzaSyC...` (All 3 keys found in `.env.local` are blocked)
- **Error Code**: 403 Permission Denied
- **Error Message**: `Your API key was reported as leaked. Please use another API key.`
- **Affected Endpoints**: `ListModels`, `generateContent`

I have also updated the `gemini-rest-client.ts` utility to provide better error messages in the future if this happens again, prioritizing "Key blocked" errors over generic "Not Found" errors.
