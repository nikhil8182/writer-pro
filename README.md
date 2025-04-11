# Writer Pro

Writer Pro is a comprehensive content creation assistant that helps generate, optimize and manage content.

## Project Structure

The project consists of two main components:

- **Frontend**: A React application (`writer-pro/`) that provides the user interface
- **Backend**: A FastAPI application (`writer-pro-backend/`) that handles API requests and interactions with OpenAI

## Getting Started

### Backend Setup

1. **Create a virtual environment:**
   ```bash
   cd writer-pro-backend
   python -m venv venv
   source venv/bin/activate  # On Windows use `venv\Scripts\activate`
   ```

2. **Install dependencies:**
   ```bash
   pip install -r requirements.txt
   ```

3. **Configure environment variables:**
   - Copy the `.env.example` file to `.env`:
     ```bash
     cp .env.example .env
     ```
   - Edit the `.env` file and add your OpenAI API key:
     ```
     OPENAI_API_KEY="sk-xxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
     ```

4. **Run the backend server:**
   ```bash
   uvicorn main:app --reload --port 8000
   ```

### Frontend Setup

1. **Install dependencies:**
   ```bash
   cd writer-pro
   npm install
   ```

2. **Run the development server:**
   ```bash
   npm start
   ```

## Git Workflow

Both frontend and backend code are now managed in a single repository. Follow these steps to properly commit and push changes:

1. **Always make changes from the root directory:**
   ```bash
   cd /path/to/writer-pro  # Navigate to root directory
   ```

2. **Add changes from both components:**
   ```bash
   # Add specific files
   git add writer-pro/src/components/YourComponent.js
   git add writer-pro-backend/routes/your_route.py
   
   # Or add all changes in a directory
   git add writer-pro/
   git add writer-pro-backend/
   ```

3. **Commit with structured, descriptive messages:**
   
   Use the following format for better clarity:
   ```bash
   git commit -m "[AREA] Short description of changes
   
   - Detailed bullet point 1
   - Detailed bullet point 2"
   ```
   
   Examples:
   ```bash
   # Frontend-only change
   git commit -m "[FRONTEND] Add dark mode toggle to editor
   
   - Add ThemeContext provider
   - Implement toggle button in navbar
   - Update CSS for dark theme"
   
   # Backend-only change
   git commit -m "[BACKEND] Fix content generation API timeout
   
   - Increase OpenAI API timeout to 60s
   - Add error handling for timeouts
   - Log detailed errors to console"
   
   # Full-stack change
   git commit -m "[FULL] Implement content optimization feature
   
   - Add optimization endpoint to backend
   - Create UI component in frontend
   - Connect frontend and backend with fetch API"
   ```

4. **Push to the repository:**
   ```bash
   git push origin main
   ```

5. **Important: Never push separate repositories:**
   - Both frontend and backend should always be pushed together to maintain synchronization
   - If you need to make changes to only one component, still push from the root repository

## Features

- Content outline generation
- Content optimization for different platforms
- Markdown editor with formatting options
- Theme switching (light/dark mode)
- Configuration options for AI parameters

## Development

Both the frontend and backend are now maintained in a single repository for easier development and deployment.

- Backend API endpoints are documented in `writer-pro-backend/README.md`
- Frontend components are organized in the `writer-pro/src/components` directory

## License

MIT 