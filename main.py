from bpm import calculate_bpm 

def main():
    print("Starting!")
    path = "vid.mp3"
    my_bpm = calculate_bpm(path)
    print("bpm is ", my_bpm)
    

# This ensures the code below only runs if the file is executed directly
if __name__ == "__main__":
    main()
