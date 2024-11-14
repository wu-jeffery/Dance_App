from flask import Flask, request, jsonify
import os
from werkzeug.utils import secure_filename
from tempfile import NamedTemporaryFile
import librosa

app = Flask(__name__)

# Define allowed file extensions for the uploaded file
ALLOWED_EXTENSIONS = {'mp3'}

# Function to check if the file is allowed
def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

# BPM calculation function
def calculate_bpm(video_path):
    # Load the audio from the video (assuming you have a way to extract audio)
    y, sr = librosa.load(video_path)
    # Calculate tempo
    tempo, _ = librosa.beat.beat_track(y=y, sr=sr)
    return tempo

# Endpoint for receiving and processing the audio file
@app.route('/upload', methods=['POST'])
def upload_file():
    if 'file' not in request.files:
        return jsonify({"error": "No file part"}), 400
    file = request.files['file']
    if file and allowed_file(file.filename):
        # Save the file temporarily
        #below part is gpt'd
        filename = secure_filename(file.filename)
        with NamedTemporaryFile(delete=False, suffix=".mp3") as temp_file:
            file.save(temp_file.name)
            # Calculate BPM
            bpm = calculate_bpm(temp_file.name)
            # Remove temporary file after processing
            os.remove(temp_file.name)
            return jsonify({"bpm": bpm})
    else:
        return jsonify({"error": "Invalid file format. Only MP3 are allowed."}), 400

if __name__ == '__main__':
    app.run(debug=True)
