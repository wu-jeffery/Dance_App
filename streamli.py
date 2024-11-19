import streamlit as st
from googleapiclient.discovery import build
import youtube_dl
import librosa
import ffmpeg
import os

# Configure YouTube API
YOUTUBE_API_KEY = "gabagoo"  # Replace with your API key
youtube = build('youtube', 'v3', developerKey=YOUTUBE_API_KEY)

# Helper function to download YouTube video and extract audio
def download_youtube_audio(video_url):
    ydl_opts = {
        'format': 'bestaudio/best',
        'outtmpl': '%(title)s.%(ext)s',
        'postprocessors': [{
            'key': 'FFmpegExtractAudio',
            'preferredcodec': 'mp3',
            'preferredquality': '192',
        }],
        'quiet': True,
    }
    with youtube_dl.YoutubeDL(ydl_opts) as ydl:
        info = ydl.extract_info(video_url, download=True)
        filename = ydl.prepare_filename(info).replace('.webm', '.mp3').replace('.m4a', '.mp3')
    return filename

# Calculate BPM from audio file
def calculate_bpm(audio_file):
    y, sr = librosa.load(audio_file)
    tempo, _ = librosa.beat.beat_track(y=y, sr=sr)
    return tempo

# # Function to fetch YouTube video details
# def fetch_video_details(video_url):
#     video_id = video_url.split("v=")[-1]
#     st.info(video_id)
#     request = youtube.videos().list(part="snippet", id=video_id)
#     response = request.execute()
#     return response['items'][0]['snippet']['title'], f"https://www.youtube.com/embed/{video_id}"
def fetch_video_details(video_url):
    # Extract video ID from URL (handles different YouTube URL formats)
    if "v=" in video_url:
        video_id = video_url.split("v=")[-1].split("&")[0]
    elif "youtu.be/" in video_url:
        video_id = video_url.split("youtu.be/")[-1].split("?")[0]
    else:
        st.error("Invalid YouTube URL format.")
        return None, None

    st.info("Fetching video details...")
    try:
        # Fetch video details using YouTube API
        request = youtube.videos().list(part="snippet", id=video_id)
        response = request.execute()

        if not response['items']:
            st.error("No video found with the provided URL.")
            return None, None

        title = response['items'][0]['snippet']['title']
        embed_url = f"https://www.youtube.com/embed/{video_id}"
        return title, embed_url

    except Exception as e:
        st.error(f"An error occurred: {e}")
        return None, None


# Streamlit UI
st.title("YouTube Dance Video Processor")        
st.info("Poof...")

# Input field for YouTube URL
video_url = st.text_input("Enter YouTube Video URL:")

if video_url:
    try:
        # Fetch video details
        video_title, embed_url = fetch_video_details(video_url)
        st.info("bhbhjbhjhj...")
        st.video(embed_url)
        st.success(f"Now playing: {video_title}")
        
        # Download audio and process BPM
        st.info("Processing audio for BPM...")
        audio_file = download_youtube_audio(video_url)
        bpm = calculate_bpm(audio_file)
        st.success(f"Calculated BPM: {bpm}")

        # Playback speed options
        playback_speed = st.select_slider("Adjust Playback Speed:", options=[0.25, 0.5, 0.75, 1.0], value=1.0)

        # Button for starting processing
        if st.button("Apply Effects"):
            st.info("Applying effects...")

            # Adjust playback speed
            output_file = f"processed_{audio_file}"
            ffmpeg.input(audio_file).filter("atempo", playback_speed).output(output_file).run(overwrite_output=True)

            # Flash red border based on BPM
            flash_interval = 60 / bpm
            st.markdown(
                f"<style>@keyframes flash {{0% {{border: 5px solid red;}} 100% {{border: none;}}}} .flash {{animation: flash {flash_interval}s infinite;}}</style>",
                unsafe_allow_html=True,
            )
            st.markdown('<div class="flash">Video Effects Applied!</div>', unsafe_allow_html=True)

        # Cleanup downloaded files
        if st.button("Cleanup Files"):
            os.remove(audio_file)
            if os.path.exists(output_file):
                os.remove(output_file)
            st.success("Temporary files cleaned up!")

    except Exception as e:
        st.error(f"An error occurred: {e}")
