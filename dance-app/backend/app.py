from flask import Flask, request, jsonify
from werkzeug.utils import secure_filename
from flask_cors import CORS  # Import CORS
import os
import ffmpeg
import librosa
import numpy as np

app = Flask(__name__)
CORS(app)  # Enable CORS for all routes

app = Flask(__name__)
UPLOAD_FOLDER = './uploads'
os.makedirs(UPLOAD_FOLDER, exist_ok=True)
app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER

@app.route('/api/analyze-beats', methods=['POST'])
def analyze_beats():
    if 'video' not in request.files:
        return jsonify({'error': 'No video file uploaded'}), 400

    # Save the uploaded video
    video_file = request.files['video']
    filename = secure_filename(video_file.filename)
    video_path = os.path.join(app.config['UPLOAD_FOLDER'], filename)
    video_file.save(video_path)

    # Extract audio from video
    audio_path = os.path.splitext(video_path)[0] + '.wav'
    try:
        ffmpeg.input(video_path).output(audio_path).run(overwrite_output=True)
    except ffmpeg.Error as e:
        return jsonify({'error': f'Failed to extract audio: {str(e)}'}), 500

    # Analyze the audio with librosa
    try:
        y, sr = librosa.load(audio_path, sr=None)  # Load audio
        tempo, beat_frames = librosa.beat.beat_track(y=y, sr=sr)  # Detect tempo and beats
        beat_times = librosa.frames_to_time(beat_frames, sr=sr)  # Convert frames to timestamps

        return jsonify({
            'tempo': tempo,
            'beats': beat_times.tolist()  # Convert numpy array to list for JSON serialization
        })
    except Exception as e:
        return jsonify({'error': f'Failed to analyze audio: {str(e)}'}), 500

if __name__ == '__main__':
    app.run(debug=True)