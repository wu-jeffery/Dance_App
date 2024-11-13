import cv2

# Load the video
video_path = 'v1_application_vid.mp4'
cap = cv2.VideoCapture(video_path)

# Check if the video opened successfully
if not cap.isOpened():
    print("Error: Could not open video.")
    exit()

while True:
    ret, frame = cap.read()
    if not ret:
        break
    cv2.imshow('Video Playback', frame)

    if cv2.waitKey(25) & 0xFF ==ord('q'):
        break

cap.release()
cv2.destroyAllWindows()