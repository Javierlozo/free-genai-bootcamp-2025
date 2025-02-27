# Setup and Installation for listening-comp

## Initial Setup

1. Create a virtual environment:

   ```bash
   python -m venv venv
   ```

2. Activate the virtual environment:

   - On Windows with Git Bash:
     ```bash
     source venv/Scripts/activate
     ```
   - On Windows with Command Prompt:
     ```cmd
     .\venv\Scripts\activate
     ```
   - On macOS/Linux:
     ```bash
     source venv/bin/activate
     ```

3. Install dependencies:

   ```bash
   # If you encounter any dependency conflicts, first upgrade pip:
   pip install --upgrade pip

   # Then install requirements:
   pip install -r backend/requirements.txt
   ```

## Running the Application

### Frontend

```bash
streamlit run frontend/main.py
```

### Backend

```bash
python backend/structured_data.py
```

## Deactivating the Virtual Environment

When you're done working on the project, you can deactivate the virtual environment:

```bash
deactivate
```
