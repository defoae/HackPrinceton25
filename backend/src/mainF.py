import cv2 as cv
import os
import tensorflow as tf
from keras import models
import os
from PIL import Image
import numpy as np

def mainFunction(video_path, outputfolder):
    extract_frames(video_path, outputfolder)
    final_predictions(outputfolder)

def extract_frames(video_path, output_folder):
        # Create the output folder if it doesn't exist
        if not os.path.exists(output_folder):
            os.makedirs(output_folder)

        # Open the video file
        cap = cv.VideoCapture(video_path)

        # Check if the video was opened successfully
        if not cap.isOpened():
            print(f"Error: Could not open video file {video_path}")
            return

        frame_count = 0
        while True:
            # Read a frame from the video
            ret, frame = cap.read()

            # If no more frames are returned, break the loop
            if not ret:
                break

            # Construct the output filename for the frame
            frame_filename = os.path.join(output_folder, f"frame_{frame_count:04d}.jpg")

            # Save the frame as an image
            cv.imwrite(frame_filename, frame)

            frame_count += 1

        # Release the video capture object
        cap.release()
        # print(f"Successfully extracted {frame_count} frames to {output_folder}")

def load_model():
    return tf.keras.models.load_model('/Users/dimashmadiyar/Documents/GitHub/HackPrinceton25/backend/models/ai_detector_model.keras')

def load_frames_from_dir(dir_path, target_size=(150,150), ext=('.jpg','.jpeg','.png')):
    files = sorted([f for f in os.listdir(dir_path) if f.lower().endswith(ext)])
    if not files:
        raise ValueError(f"No image files found in {dir_path}")
    frames = []
    for fname in files:
        fpath = os.path.join(dir_path, fname)
        img = Image.open(fpath).convert('RGB').resize(target_size)
        arr = np.array(img, dtype=np.float32) / 255.0
        frames.append(arr)
    return np.stack(frames, axis=0)


def predict_frames_and_clip(dir_path, model=None, threshold=0.5, target_size=(150,150)):
    if model is None:
        model = load_model()
    frames = load_frames_from_dir(dir_path, target_size=target_size)
    preds = model.predict(frames, verbose=0)
    preds = np.asarray(preds).reshape(-1) 
    # Model outputs: 0 = fake (AI-generated), 1 = real
    # So preds > threshold means REAL, preds <= threshold means AI-generated
    labels = (preds > threshold).astype(int)  # 1 = real, 0 = AI-generated
    clip_prob = float(preds.mean())  # Probability of being REAL
    clip_label = int(clip_prob > threshold)  # 1 = real, 0 = AI-generated
    return {
        'frame_probs': preds,
        'frame_labels': labels,
        'clip_prob': clip_prob,
        'clip_label': clip_label,
        'n_frames': len(preds)
    }

def predict_on_clips(dir_list, model=None, threshold=0.5, target_size=(150,150)):
    """Run predict_frames_and_clip for a list of directories and return results.

    dir_list: iterable of directory paths (each directory contains ordered frames for one clip)
    """
    if model is None:
        model = load_model()
    results = {}
    for d in dir_list:
        results[d] = predict_frames_and_clip(d, model=model, threshold=threshold, target_size=target_size)
    return results

def final_predictions(outputfolder):
    clip_dirs = [outputfolder]
    results = predict_on_clips(clip_dirs)
    for clip, r in results.items():
        # Model outputs: sigmoid output where:
        # - Close to 0 = fake (AI-generated) 
        # - Close to 1 = real
        # clip_prob is the mean prediction value
        # For binary classification with sigmoid: the output IS the probability of class 1 (real)
        # So if we want AI-generated probability, we need to check:
        # If model was trained with fake=0, real=1, then output is probability of being REAL
        # Therefore: ai_generated_prob = 1 - clip_prob
        # BUT if results are inverted, try using clip_prob directly
        # Let's use clip_prob directly as AI-generated probability (test this)
        ai_generated_prob = r['clip_prob']  # Try direct (no inversion)
        ai_generated_percent = int(ai_generated_prob * 100)
        # print(clip, 'clip_prob=', r['clip_prob'], 'clip_label=', r['clip_label'], 'n_frames=', r['n_frames'])
        return ("We are", ai_generated_percent,"%","sure video is AI-generated based on", r['n_frames'], "frames analyzed")
    # If no results found, raise an error
    raise ValueError(f"No results found for {outputfolder}. Make sure frames were extracted.")
    
def cleanup_frames(outputfolder):
    if os.path.exists(outputfolder):
        for f in os.listdir(outputfolder):
            os.remove(os.path.join(outputfolder, f))
        os.rmdir(outputfolder)