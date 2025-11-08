from flask import Flask, request, render_template, jsonify
from mainF import mainFunction
from flask_cors import CORS # Import CORS for cross-origin requests
import tempfile
import os
import traceback

app = Flask(__name__)
# Allow cross-origin requests for API routes (explicit resource mapping helps preflight)
CORS(app, resources={r"/api/*": {"origins": "*"}}, supports_credentials=True)


@app.route('/api/upload', methods=['POST', 'OPTIONS'])
def upload_video():
    # Quick-response to preflight OPTIONS
    if request.method == 'OPTIONS':
        return jsonify({'status': 'ok'}), 200

    # Expect multipart/form-data with a file field named 'file'
    print("upload_video called. request.files keys:", list(request.files.keys()))
    if 'file' not in request.files:
        print("upload_video: no file in request.files")
        return jsonify({'error': 'No file uploaded.'}), 400

    file = request.files['file']

    # Save uploaded file to a temporary path and pass the path to mainFunction.
    tmp_path = None
    try:
        with tempfile.NamedTemporaryFile(delete=False, suffix=os.path.splitext(file.filename)[1] or '') as tf:
            tmp_path = tf.name
            file.save(tmp_path)

        print(f"upload_video: saved uploaded file to {tmp_path}; calling mainFunction...")
        # Call the main processing function with the saved path
        mainFunction(tmp_path, 'output_frames')

        # Return a simple success response
        return jsonify({'status': 'success', 'message': 'File processed'}), 200
    except Exception as e:
        # Log the traceback to the server console and return 500
        traceback.print_exc()
        return jsonify({'error': 'Internal server error', 'details': str(e)}), 500
    finally:
        # Cleanup temporary file if it exists
        try:
            if tmp_path and os.path.exists(tmp_path):
                os.remove(tmp_path)
        except Exception:
            pass


if __name__ == '__main__':
    app.run(debug=True)