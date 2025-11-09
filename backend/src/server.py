from flask import Flask, request, render_template, jsonify
from mainF import extract_frames, final_predictions, cleanup_frames
from flask_cors import CORS # Import CORS for cross-origin requests
import tempfile
import os
import traceback
from openai import OpenAI

app = Flask(__name__)
# Set maximum file size to 100 MB
app.config['MAX_CONTENT_LENGTH'] = 100 * 1024 * 1024
# Allow cross-origin requests for API routes (explicit resource mapping helps preflight)
CORS(app, resources={r"/api/*": {"origins": "*"}}, supports_credentials=True)

# Initialize OpenAI client (optional - will gracefully handle if key is missing)
OPENAI_API_KEY = os.environ.get('OPENAI_API_KEY')
openai_client = None
if OPENAI_API_KEY:
    try:
        openai_client = OpenAI(api_key=OPENAI_API_KEY)
        print("OpenAI client initialized successfully")
    except Exception as e:
        print(f"Warning: Could not initialize OpenAI client: {e}")
else:
    print("Warning: OPENAI_API_KEY not set. Reasoning feature will be disabled.")


@app.route('/api/upload', methods=['POST', 'OPTIONS'])
def upload_video():
    cleanup_frames('output_frames')  # Clean up previous frames
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

        print(f"upload_video: saved uploaded file to {tmp_path}; calling extract_frames...")
        # Call the main processing function with the saved path
        extract_frames(tmp_path, 'output_frames')

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

def generate_reasoning(is_ai_generated, confidence, n_frames):
    """Generate reasoning for the prediction using OpenAI API"""
    if not openai_client:
        return None
    
    try:
        prediction_type = "AI-generated" if is_ai_generated else "real"
        prompt = f"""You are an expert in video analysis and AI detection. A machine learning model has analyzed {n_frames} frames from a video and determined it is {confidence}% likely to be {prediction_type}.

        Provide a brief, informative explanation (2-3 sentences) about what visual features or characteristics might indicate this video is {prediction_type}. Be specific but accessible. Focus on common telltale signs like:
        - For AI-generated: artifacts, inconsistencies, unnatural movements, texture issues, lighting anomalies
        - For real videos: natural motion, consistent lighting, realistic textures, authentic details

        Keep it concise and educational."""

        response = openai_client.chat.completions.create(
            model="gpt-4o-mini",  # Using cheaper model
            messages=[
                {"role": "system", "content": "You are a helpful assistant that explains video analysis results in a clear, educational way."},
                {"role": "user", "content": prompt}
            ],
            max_tokens=150,
            temperature=0.7
        )
        
        return response.choices[0].message.content.strip()
    except Exception as e:
        print(f"Error generating reasoning: {e}")
        return None

@app.route('/api/results', methods=['GET'])
def get_results():
    try:
        result = final_predictions('output_frames')
        # final_predictions returns a tuple, convert to dict for JSON response
        if isinstance(result, tuple):
            # Format: ("We are", percentage, "%", "sure video is AI-generated based on", n_frames, "frames analyzed")
            ai_generated_percent = result[1]
            is_ai_generated = ai_generated_percent > 50
            n_frames = result[4]
            
            # Generate reasoning (optional, will be None if OpenAI not configured)
            reasoning = generate_reasoning(is_ai_generated, ai_generated_percent, n_frames)
            
            response_data = {
                'confidence': ai_generated_percent,
                'is_ai_generated': is_ai_generated,
                'n_frames': n_frames,
                'message': f"We are {ai_generated_percent}% sure video is AI-generated based on {n_frames} frames analyzed"
            }
            
            if reasoning:
                response_data['reasoning'] = reasoning
            
            return jsonify(response_data), 200
        else:
            return jsonify({'error': 'Unexpected result format'}), 500
    except Exception as e:
        traceback.print_exc()
        return jsonify({'error': 'Internal server error', 'details': str(e)}), 500


if __name__ == '__main__':
    app.run(debug=True)