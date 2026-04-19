from flask import Flask, request, jsonify
from flask_cors import CORS
import os

os.environ["MEDIAPIPE_DISABLE_GPU"] = "1"
os.environ["LIBGL_ALWAYS_SOFTWARE"] = "1"

import json
import base64
import numpy as np
import cv2

import mediapipe as mp
from mediapipe.tasks import python
from mediapipe.tasks.python import vision

import tensorflow as tf

# -------------------
# App init
# -------------------
app = Flask(__name__)
CORS(app)

# -------------------
# Paths
# -------------------
MODEL_TASK = os.path.join("models", "hand_landmarker.task")
LETTER_MODEL = os.path.join("models", "letter_model.keras")
LABELS_PATH = os.path.join("models", "labels.json")

# -------------------
# Load model + labels
# -------------------
if not os.path.exists(LETTER_MODEL):
    raise RuntimeError("letter_model.keras not found.")

if not os.path.exists(LABELS_PATH):
    raise RuntimeError("labels.json not found.")

tf_model = tf.keras.models.load_model(LETTER_MODEL)

with open(LABELS_PATH, "r") as f:
    labels = json.load(f)

# -------------------
# MediaPipe setup
# -------------------
if not os.path.exists(MODEL_TASK):
    raise RuntimeError("hand_landmarker.task not found.")

base_options = python.BaseOptions(model_asset_path=MODEL_TASK)
options = vision.HandLandmarkerOptions(
    base_options=base_options,
    running_mode=vision.RunningMode.IMAGE,
    num_hands=1
)
landmarker = vision.HandLandmarker.create_from_options(options)

# -------------------
# Helpers
# -------------------
def extract_features(hand_landmarks):
    pts = []
    for lm in hand_landmarks:
        pts.extend([lm.x, lm.y, lm.z])
    return np.array(pts, dtype=np.float32)

# -------------------
# Thresholds
# -------------------
BRIGHTNESS_MIN = 60.0
CONF_MIN = 0.90

# -------------------
# Health check
# -------------------
@app.route("/", methods=["GET"])
def home():
    return jsonify({
        "status": "OK",
        "message": "Backend running"
    })

# -------------------
# Prediction route
# -------------------
@app.route("/predict", methods=["POST"])
def predict():
    data = request.get_json(silent=True) or {}
    b64 = data.get("imageBase64")

    if not b64:
        return jsonify({"error": "Missing imageBase64"}), 400

    try:
        # Decode image
        img_bytes = base64.b64decode(b64)
        nparr = np.frombuffer(img_bytes, np.uint8)
        frame = cv2.imdecode(nparr, cv2.IMREAD_COLOR)

        if frame is None:
            return jsonify({"error": "Invalid image"}), 400

        # Lighting check
        gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
        brightness = float(np.mean(gray))
        lighting_ok = brightness >= BRIGHTNESS_MIN

        # MediaPipe detection
        rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
        mp_image = mp.Image(image_format=mp.ImageFormat.SRGB, data=rgb)
        result = landmarker.detect(mp_image)

        if not result.hand_landmarks:
            return jsonify({
                "text": "No hand",
                "confidence": 0.0,
                "lighting_ok": lighting_ok,
                "brightness": round(brightness, 1),
            })

        # Extract features
        hand_landmarks = result.hand_landmarks[0]
        features = extract_features(hand_landmarks)

        # Predict
        probs = tf_model.predict(features.reshape(1, -1), verbose=0)[0]
        idx = int(np.argmax(probs))
        conf = float(probs[idx])
        predicted = labels[idx]

        # Confidence check
        if conf < CONF_MIN:
            return jsonify({
                "text": "Try again",
                "confidence": round(conf, 4),
                "lighting_ok": lighting_ok,
                "brightness": round(brightness, 1),
            })

        return jsonify({
            "text": predicted,
            "confidence": round(conf, 4),
            "lighting_ok": lighting_ok,
            "brightness": round(brightness, 1),
        })

    except Exception as e:
        return jsonify({"error": str(e)}), 500

# -------------------
# Run app (IMPORTANT for deployment)
# -------------------
if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5000))
    app.run(host="0.0.0.0", port=port)