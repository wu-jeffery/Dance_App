from flask import Flask, request, jsonify
from werkzeug.utils import secure_filename
from flask_cors import CORS  # Import CORS
import os
import ffmpeg
import librosa
import numpy as np
import traceback

app = Flask(__name__)
CORS(app)  # Enable CORS for all routes

UPLOAD_FOLDER = './uploads'
os.makedirs(UPLOAD_FOLDER, exist_ok=True)
app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER

@app.route('/api/analyze-beats', methods=['POST'])
def analyze_beats():
    app.logger.info("Received a request to analyze beats.")

    # Check if the video file is in the request
    if 'video' not in request.files:
        app.logger.error("No video file uploaded in the request.")
        return jsonify({'error': 'No video file uploaded'}), 400

    # Save the uploaded video
    video_file = request.files['video']
    filename = secure_filename(video_file.filename)
    video_path = os.path.join(app.config['UPLOAD_FOLDER'], filename)
    try:
        app.logger.info(f"Saving uploaded video file as: {video_path}")
        video_file.save(video_path)
    except Exception as e:
        app.logger.error(f"Failed to save video file: {traceback.format_exc()}")
        return jsonify({'error': f'Failed to save video file: {str(e)}'}), 500

    # Extract audio from video
    audio_path = os.path.splitext(video_path)[0] + '.wav'
    try:
        if not os.path.exists(video_path):
            raise FileNotFoundError(f"Video file not found at {video_path}")
        
        app.logger.info(f"Attempting to extract audio using FFmpeg from: {video_path}")
        
        # Check if ffmpeg is installed
        ffmpeg_installed = os.system("ffmpeg -version")
        if ffmpeg_installed != 0:
            app.logger.error("FFmpeg is not installed or not in the system PATH.")
            raise EnvironmentError("FFmpeg is not installed or not in the system PATH.")
        
        # Run ffmpeg to extract audio
        ffmpeg.input(video_path).output(audio_path).run(overwrite_output=True)
        
        app.logger.info(f"Audio successfully extracted to: {audio_path}")
        
        if not os.path.exists(audio_path):
            raise FileNotFoundError(f"Audio extraction failed; file not found at {audio_path}")
    except ffmpeg.Error as e:
        app.logger.error(f"FFmpeg error: {e.stderr.decode()}")
        return jsonify({'error': f'Failed to extract audio with FFmpeg: {e.stderr.decode()}'}), 500
    except Exception as e:
        app.logger.error(f"General error during audio extraction: {traceback.format_exc()}")
        return jsonify({'error': f'Failed to extract audio: {str(e)}'}), 500

    # Analyze the audio with librosa
    try:
        # Librosa analysis
        y, sr = librosa.load(audio_path, sr=None)  # Load audio
        tempo, beat_frames = librosa.beat.beat_track(y=y, sr=sr)  # Detect tempo and beats
        beat_times = librosa.frames_to_time(beat_frames, sr=sr)  # Convert frames to timestamps

        beat_times_list = list(beat_times)
        print(type(beat_times_list))
        print(type(tempo))
        print(tempo)
        # Convert NumPy array to list for JSON serialization
        return jsonify({
            'tempo': tempo[0],
            'beats': beat_times_list  # Convert ndarray to list
        })
    except Exception as e:
        app.logger.error(f"Librosa analysis error: {traceback.format_exc()}")
        return jsonify({'error': f'Failed to analyze audio: {str(e)}'}), 500

if __name__ == '__main__':
    app.run(debug=False)
