import os
import cv2
import json
import time
import numpy as np

import mediapipe as mp
from mediapipe.tasks import python
from mediapipe.tasks.python import vision

# --------- SETTINGS ----------
MODEL_PATH = os.path.join("models", "hand_landmarker.task")
DATA_DIR = "data"
MAX_HANDS = 1
# ----------------------------

def ensure_dir(path):
    os.makedirs(path, exist_ok=True)

def create_landmarker():
    base_options = python.BaseOptions(model_asset_path=MODEL_PATH)
    options = vision.HandLandmarkerOptions(
        base_options=base_options,
        running_mode=vision.RunningMode.VIDEO,
        num_hands=MAX_HANDS,
    )
    return vision.HandLandmarker.create_from_options(options)

def extract_features(hand_landmarks):
    """
    hand_landmarks is a list of 21 normalized landmarks (x,y,z)
    return a flat vector [x1,y1,z1, x2,y2,z2, ...]
    """
    pts = []
    for lm in hand_landmarks:
        pts.extend([lm.x, lm.y, lm.z])
    return np.array(pts, dtype=np.float32)

def main():
    if not os.path.exists(MODEL_PATH):
        raise FileNotFoundError(f"Model not found: {MODEL_PATH}")

    ensure_dir(DATA_DIR)

    landmarker = create_landmarker()

    cap = cv2.VideoCapture(0)
    if not cap.isOpened():
        raise RuntimeError("Could not open webcam")

    print("Collecting mode:")
    print("- Show ONE hand in camera")
    print("- Press a letter key A-Z to save a sample")
    print("- Press ESC to quit")

    frame_index = 0
    last_saved = None

    while True:
        ok, frame = cap.read()
        if not ok:
            break

        frame = cv2.flip(frame, 1)  # mirror
        h, w = frame.shape[:2]

        rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)

        mp_image = mp.Image(image_format=mp.ImageFormat.SRGB, data=rgb)

        timestamp_ms = int(time.time() * 1000)
        result = landmarker.detect_for_video(mp_image, timestamp_ms)

        # draw status
        cv2.putText(frame, "Press A-Z to save sample, ESC to exit",
                    (10, 30), cv2.FONT_HERSHEY_SIMPLEX, 0.7, (20, 255, 20), 2)

        if last_saved:
            cv2.putText(frame, f"Saved: {last_saved}",
                        (10, 65), cv2.FONT_HERSHEY_SIMPLEX, 0.7, (0, 200, 255), 2)

        # if hand detected, show marker
        hand_ok = result.hand_landmarks and len(result.hand_landmarks) > 0
        if hand_ok:
            cv2.putText(frame, "Hand detected", (10, 100),
                        cv2.FONT_HERSHEY_SIMPLEX, 0.7, (255, 200, 0), 2)
        else:
            cv2.putText(frame, "No hand", (10, 100),
                        cv2.FONT_HERSHEY_SIMPLEX, 0.7, (0, 0, 255), 2)

        cv2.imshow("Collect Letters", frame)

        key = cv2.waitKey(1) & 0xFF
        if key == 27:  # ESC
            break

        # Only save if key is A-Z and we detected a hand
        if ord('a') <= key <= ord('z'):
            letter = chr(key).upper()

            if not hand_ok:
                last_saved = f"{letter} (NO HAND, NOT SAVED)"
                continue

            # take first hand only
            hand_landmarks = result.hand_landmarks[0]
            features = extract_features(hand_landmarks)

            letter_dir = os.path.join(DATA_DIR, letter)
            ensure_dir(letter_dir)

            filename = os.path.join(letter_dir, f"{int(time.time()*1000)}.npy")
            np.save(filename, features)

            last_saved = f"{letter} -> {os.path.basename(filename)}"

    cap.release()
    cv2.destroyAllWindows()

if __name__ == "__main__":
    main()
