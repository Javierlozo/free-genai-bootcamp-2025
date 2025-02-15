from flask import request, jsonify, g
from flask_cors import cross_origin
from datetime import datetime
import math
import unittest
from unittest.mock import MagicMock
import sqlite3
import json
from flask import Flask

def load(app):
  # Add POST route for creating study sessions
  @app.route('/api/study-sessions', methods=['POST'])
  @cross_origin()
  def create_study_session():
    """
    Creates a new study session.
    Expects a JSON payload with 'group_id' and 'activity_id'.
    Returns the ID of the newly created study session.
    """
    try:
      # Get JSON data from the request
      data = request.get_json()

      # Validate the data
      if not data or 'group_id' not in data or 'activity_id' not in data:
        return jsonify({"error": "Missing group_id or activity_id"}), 400

      # Validate data types
      try:
        group_id = int(data['group_id'])
        activity_id = int(data['activity_id'])
      except (ValueError, TypeError):
        return jsonify({"error": "group_id and activity_id must be integers"}), 400

      # Insert data into the database
      cursor = app.db.cursor()
      cursor.execute('''
          INSERT INTO study_sessions (group_id, study_activity_id, created_at)
          VALUES (?, ?, ?)
      ''', (group_id, activity_id, datetime.now()))
      app.db.commit()

      # Get the ID of the newly created study session
      study_session_id = cursor.lastrowid

      # Return success response
      return jsonify({"message": "Study session created", "id": study_session_id}), 201

    except Exception as e:
      # Handle errors
      return jsonify({"error": str(e)}), 500

  @app.route('/api/study-sessions', methods=['GET'])
  @cross_origin()
  def get_study_sessions():
    try:
      cursor = app.db.cursor()
      
      # Get pagination parameters
      page = request.args.get('page', 1, type=int)
      per_page = request.args.get('per_page', 10, type=int)
      offset = (page - 1) * per_page

      # Get total count
      cursor.execute('''
        SELECT COUNT(*) as count 
        FROM study_sessions ss
        JOIN groups g ON g.id = ss.group_id
        JOIN study_activities sa ON sa.id = ss.study_activity_id
      ''')
      total_count = cursor.fetchone()['count']

      # Get paginated sessions
      cursor.execute('''
        SELECT 
          ss.id,
          ss.group_id,
          g.name as group_name,
          sa.id as activity_id,
          sa.name as activity_name,
          ss.created_at,
          COUNT(wri.id) as review_items_count
        FROM study_sessions ss
        JOIN groups g ON g.id = ss.group_id
        JOIN study_activities sa ON sa.id = ss.study_activity_id
        LEFT JOIN word_review_items wri ON wri.study_session_id = ss.id
        GROUP BY ss.id
        ORDER BY ss.created_at DESC
        LIMIT ? OFFSET ?
      ''', (per_page, offset))
      sessions = cursor.fetchall()

      return jsonify({
        'items': [{
          'id': session['id'],
          'group_id': session['group_id'],
          'group_name': session['group_name'],
          'activity_id': session['activity_id'],
          'activity_name': session['activity_name'],
          'start_time': session['created_at'],
          'end_time': session['created_at'],  # For now, just use the same time since we don't track end time
          'review_items_count': session['review_items_count']
        } for session in sessions],
        'total': total_count,
        'page': page,
        'per_page': per_page,
        'total_pages': math.ceil(total_count / per_page)
      })
    except Exception as e:
      return jsonify({"error": str(e)}), 500

  @app.route('/api/study-sessions/<id>', methods=['GET'])
  @cross_origin()
  def get_study_session(id):
    try:
      cursor = app.db.cursor()
      
      # Get session details
      cursor.execute('''
        SELECT 
          ss.id,
          ss.group_id,
          g.name as group_name,
          sa.id as activity_id,
          sa.name as activity_name,
          ss.created_at,
          COUNT(wri.id) as review_items_count
        FROM study_sessions ss
        JOIN groups g ON g.id = ss.group_id
        JOIN study_activities sa ON sa.id = ss.study_activity_id
        LEFT JOIN word_review_items wri ON wri.study_session_id = ss.id
        WHERE ss.id = ?
        GROUP BY ss.id
      ''', (id,))
      
      session = cursor.fetchone()
      if not session:
        return jsonify({"error": "Study session not found"}), 404

      # Get pagination parameters
      page = request.args.get('page', 1, type=int)
      per_page = request.args.get('per_page', 10, type=int)
      offset = (page - 1) * per_page

      # Get the words reviewed in this session with their review status
      cursor.execute('''
        SELECT 
          w.*,
          COALESCE(SUM(CASE WHEN wri.correct = 1 THEN 1 ELSE 0 END), 0) as session_correct_count,
          COALESCE(SUM(CASE WHEN wri.correct = 0 THEN 1 ELSE 0 END), 0) as session_wrong_count
        FROM words w
        JOIN word_review_items wri ON wri.word_id = w.id
        WHERE wri.study_session_id = ?
        GROUP BY w.id
        ORDER BY w.kanji
        LIMIT ? OFFSET ?
      ''', (id, per_page, offset))
      
      words = cursor.fetchall()

      # Get total count of words
      cursor.execute('''
        SELECT COUNT(DISTINCT w.id) as count
        FROM words w
        JOIN word_review_items wri ON wri.word_id = w.id
        WHERE wri.study_session_id = ?
      ''', (id,))
      
      total_count = cursor.fetchone()['count']

      return jsonify({
        'session': {
          'id': session['id'],
          'group_id': session['group_id'],
          'group_name': session['group_name'],
          'activity_id': session['activity_id'],
          'activity_name': session['activity_name'],
          'start_time': session['created_at'],
          'end_time': session['created_at'],  # For now, just use the same time
          'review_items_count': session['review_items_count']
        },
        'words': [{
          'id': word['id'],
          'kanji': word['kanji'],
          'romaji': word['romaji'],
          'english': word['english'],
          'correct_count': word['session_correct_count'],
          'wrong_count': word['session_wrong_count']
        } for word in words],
        'total': total_count,
        'page': page,
        'per_page': per_page,
        'total_pages': math.ceil(total_count / per_page)
      })
    except Exception as e:
      return jsonify({"error": str(e)}), 500

  @app.route('/api/study-sessions/<id>/review', methods=['POST'])
  @cross_origin()
  def create_study_session_review(id):
    """
    Records a word review result for a specific study session.
    
    Parameters:
        id (int): The ID of the study session

    Request Body:
        {
            "word_id": integer,  # ID of the word being reviewed
            "correct": boolean   # Whether the review was correct
        }
    
    Returns:
        201: Review created successfully
        {
            "id": integer,           # ID of the created review
            "study_session_id": integer,
            "word_id": integer,
            "correct": boolean,
            "created_at": string     # ISO format timestamp
        }
    
    Error Responses:
        400: Invalid request
            - Missing required fields (word_id or correct)
            - Invalid data types
        404: Study session not found
        500: Server error
            - Database errors
            - Other internal errors
    
    Example:
        POST /api/study-sessions/123/review
        {
            "word_id": 456,
            "correct": true
        }
        
        Response:
        {
            "id": 789,
            "study_session_id": 123,
            "word_id": 456,
            "correct": true,
            "created_at": "2024-03-21T10:00:00Z"
        }
    """
    try:
      # Get JSON data from request
      data = request.get_json()
      
      # Validate required fields
      if not data or 'word_id' not in data or 'correct' not in data:
        return jsonify({"error": "Missing required fields: word_id and correct"}), 400
      
      # Validate data types
      try:
        word_id = int(data['word_id'])
        correct = bool(data['correct'])
      except (ValueError, TypeError):
        return jsonify({"error": "Invalid data types: word_id must be integer, correct must be boolean"}), 400
      
      # Check if study session exists
      cursor = app.db.cursor()
      cursor.execute('SELECT id FROM study_sessions WHERE id = ?', (id,))
      session = cursor.fetchone()
      
      if not session:
        return jsonify({"error": "Study session not found"}), 404

      # Insert the review data
      current_time = datetime.now()
      cursor.execute('''
        INSERT INTO word_review_items (study_session_id, word_id, correct, created_at)
        VALUES (?, ?, ?, ?)
      ''', (id, word_id, 1 if correct else 0, current_time))
      
      # Get the ID of the newly created review
      review_id = cursor.lastrowid
      
      # Commit the transaction
      app.db.commit()
      
      # Return the created review item
      return jsonify({
        "id": review_id,
        "study_session_id": id,
        "word_id": word_id,
        "correct": correct,
        "created_at": current_time.isoformat()
      }), 201
      
    except sqlite3.Error as e:
      app.db.rollback()
      return jsonify({"error": f"Database error: {str(e)}"}), 500
    except Exception as e:
      return jsonify({"error": str(e)}), 500

  @app.route('/api/study-sessions/reset', methods=['POST'])
  @cross_origin()
  def reset_study_sessions():
    try:
      cursor = app.db.cursor()
      
      # First delete all word review items since they have foreign key constraints
      cursor.execute('DELETE FROM word_review_items')
      
      # Then delete all study sessions
      cursor.execute('DELETE FROM study_sessions')
      
      app.db.commit()
      
      return jsonify({"message": "Study history cleared successfully"}), 200
    except Exception as e:
      return jsonify({"error": str(e)}), 500

class StudySessionTestCase(unittest.TestCase):
    def setUp(self):
        # Create a test app and configure it
        self.app = Flask(__name__)
        self.app.config['TESTING'] = True
        self.app.config['DEBUG'] = False
        # Use an in-memory SQLite database for testing
        self.app.config['DATABASE'] = 'test.db'  
        self.db = sqlite3.connect(self.app.config['DATABASE'])
        self.app.db = self.db  # Attach the database connection to the app
        
        # Load the routes
        load(self.app)
        
        # Create a test client
        self.client = self.app.test_client()

        # Create the study_sessions table
        cursor = self.db.cursor()
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS study_sessions (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                group_id INTEGER NOT NULL,
                study_activity_id INTEGER NOT NULL,
                created_at DATETIME
            )
        ''')
        self.db.commit()
        cursor.close()

        # Create the word_review_items table
        cursor = self.db.cursor()
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS word_review_items (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                study_session_id INTEGER NOT NULL,
                word_id INTEGER NOT NULL,
                correct INTEGER NOT NULL,
                created_at DATETIME,
                FOREIGN KEY (study_session_id) REFERENCES study_sessions(id)
            )
        ''')
        self.db.commit()
        cursor.close()

    def tearDown(self):
        # Clean up resources after each test
        self.db.close()

    def test_create_study_session_success(self):
        # Send a POST request to create a study session
        response = self.client.post('/api/study-sessions', json={
            'group_id': 1,
            'activity_id': 1
        })

        # Assert that the response is successful
        self.assertEqual(response.status_code, 201)
        data = json.loads(response.get_data(as_text=True))
        self.assertEqual(data['message'], 'Study session created')
        self.assertIn('id', data)

    def test_create_study_session_missing_data(self):
        # Send a POST request with missing data
        response = self.client.post('/api/study-sessions', json={})

        # Assert that the response has a 400 status code
        self.assertEqual(response.status_code, 400)
        data = json.loads(response.get_data(as_text=True))
        self.assertEqual(data['error'], 'Missing group_id or activity_id')

    def test_create_study_session_invalid_data(self):
        # Send a POST request with invalid data
        response = self.client.post('/api/study-sessions', json={
            'group_id': 'invalid',
            'activity_id': 'invalid'
        })

        # Assert that the response has a 400 status code
        self.assertEqual(response.status_code, 400)
        data = json.loads(response.get_data(as_text=True))
        self.assertEqual(data['error'], 'group_id and activity_id must be integers')

    def test_create_review_success(self):
        # First create a study session
        response = self.client.post('/api/study-sessions', json={
            'group_id': 1,
            'activity_id': 1
        })
        session_data = json.loads(response.get_data(as_text=True))
        session_id = session_data['id']

        # Then create a review
        review_data = {
            'word_id': 1,
            'correct': True
        }
        response = self.client.post(f'/api/study-sessions/{session_id}/review', json=review_data)
        
        # Assert response
        self.assertEqual(response.status_code, 201)
        data = json.loads(response.get_data(as_text=True))
        self.assertEqual(data['study_session_id'], session_id)
        self.assertEqual(data['word_id'], review_data['word_id'])
        self.assertEqual(data['correct'], review_data['correct'])
        self.assertIn('id', data)
        self.assertIn('created_at', data)

    def test_create_review_invalid_session(self):
        response = self.client.post('/api/study-sessions/999/review', json={
            'word_id': 1,
            'correct': True
        })
        
        self.assertEqual(response.status_code, 404)
        data = json.loads(response.get_data(as_text=True))
        self.assertEqual(data['error'], 'Study session not found')

    def test_create_review_missing_fields(self):
        # Create session first
        response = self.client.post('/api/study-sessions', json={
            'group_id': 1,
            'activity_id': 1
        })
        session_id = json.loads(response.get_data(as_text=True))['id']

        # Test missing word_id
        response = self.client.post(f'/api/study-sessions/{session_id}/review', json={
            'correct': True
        })
        self.assertEqual(response.status_code, 400)
        
        # Test missing correct flag
        response = self.client.post(f'/api/study-sessions/{session_id}/review', json={
            'word_id': 1
        })
        self.assertEqual(response.status_code, 400)

    def test_create_review_invalid_types(self):
        # Create session first
        response = self.client.post('/api/study-sessions', json={
            'group_id': 1,
            'activity_id': 1
        })
        session_id = json.loads(response.get_data(as_text=True))['id']

        # Test invalid word_id type
        response = self.client.post(f'/api/study-sessions/{session_id}/review', json={
            'word_id': "not a number",
            'correct': True
        })
        self.assertEqual(response.status_code, 400)
        
        # Test invalid correct type
        response = self.client.post(f'/api/study-sessions/{session_id}/review', json={
            'word_id': 1,
            'correct': "not a boolean"
        })
        self.assertEqual(response.status_code, 400)

if __name__ == '__main__':
    unittest.main()