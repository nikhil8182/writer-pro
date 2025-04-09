# Writer Pro Backend

This directory contains the FastAPI backend for the Writer Pro application.
It handles communication with the OpenAI API, keeping API keys secure on the server side.

## Setup

1.  **Create a virtual environment:**
    ```bash
    python -m venv venv
    source venv/bin/activate  # On Windows use `venv\Scripts\activate`
    ```

2.  **Install dependencies:**
    ```bash
    pip install -r requirements.txt
    ```

3.  **Configure environment variables:**
    - Copy the `.env.example` file to `.env`:
      ```bash
      cp .env.example .env
      ```
    - Edit the `.env` file and add your OpenAI API key:
      ```
      OPENAI_API_KEY="sk-xxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
      ```

## Running the Backend

Use uvicorn to run the development server:

```bash
uvicorn main:app --reload --port 8000
```

The backend will be available at `http://localhost:8000`.

## Endpoints

-   `GET /`: Health check endpoint.
-   `POST /generate-outline`: Accepts content description and type, returns an AI-generated outline.
-   `POST /optimize-content`: Accepts existing content and platform, returns AI-optimized content. 