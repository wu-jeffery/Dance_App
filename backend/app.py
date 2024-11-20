from flask import Flask

app = Flask(__name__)

@app.route('/')
def home():
<<<<<<< HEAD
    return "FUCK FUCK FUCK!"
=======
    return "FUCK FUCK FUCK"
>>>>>>> 6a2d125490efd10732c7ad592ef917c0a2c1fc96

if __name__ == '__main__':
    app.run(debug=True)
