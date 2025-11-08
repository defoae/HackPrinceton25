from flask import Flask, request, render_template
from load_predict import load_model, predict

app = Flask(__name__)
model = load_model()

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/predict', methods=['POST'])
def upload_video():
    if 'file' not in request.files:
        return 'No file uploaded.', 400

    file = request.files['file']

    prediction = predict(file)
    return str(prediction[0])

if __name__ == '__main__':
    app.run(debug=True)