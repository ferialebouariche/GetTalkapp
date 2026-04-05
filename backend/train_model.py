import os
import json
import numpy as np
import tensorflow as tf

DATA_DIR = "data"
MODEL_OUT = os.path.join("models", "letter_model.keras")
LABELS_OUT = os.path.join("models", "labels.json")

def load_dataset():
    X, y = [], []

    print("Looking inside:", DATA_DIR)

    # Only include folders that actually have samples
    folders = sorted([
        d for d in os.listdir(DATA_DIR)
        if os.path.isdir(os.path.join(DATA_DIR, d))
    ])

    label_folders = []
    for lab in folders:
        folder = os.path.join(DATA_DIR, lab)
        files = [f for f in os.listdir(folder) if f.endswith(".npy")]
        print(f"Folder {lab}: {len(files)} samples")

        if len(files) > 0:
            label_folders.append(lab)

    if len(label_folders) < 2:
        raise RuntimeError(
            f"Need at least 2 letters with samples. Found: {label_folders}. "
            f"Collect more data (e.g., A and B) then retrain."
        )

    label_to_idx = {lab: i for i, lab in enumerate(label_folders)}

    for lab in label_folders:
        folder = os.path.join(DATA_DIR, lab)
        files = [f for f in os.listdir(folder) if f.endswith(".npy")]
        for f in files:
            arr = np.load(os.path.join(folder, f))
            X.append(arr)
            y.append(label_to_idx[lab])

    X = np.array(X, dtype=np.float32)
    y = np.array(y, dtype=np.int64)

    return X, y, label_folders

def main():
    X, y, labels = load_dataset()

    print("\n✅ Training on labels:", labels)
    print("Samples:", X.shape[0])
    print("Features:", X.shape[1])
    print("Classes:", len(labels))

    # Shuffle
    idx = np.random.permutation(len(X))
    X, y = X[idx], y[idx]

    # Train/val split
    split = int(0.85 * len(X))
    X_train, X_val = X[:split], X[split:]
    y_train, y_val = y[:split], y[split:]

    # Model
    model = tf.keras.Sequential([
        tf.keras.layers.Input(shape=(X.shape[1],)),
        tf.keras.layers.Dense(128, activation="relu"),
        tf.keras.layers.Dropout(0.2),
        tf.keras.layers.Dense(128, activation="relu"),
        tf.keras.layers.Dropout(0.2),
        tf.keras.layers.Dense(len(labels), activation="softmax"),
    ])

    model.compile(
        optimizer=tf.keras.optimizers.Adam(learning_rate=1e-3),
        loss="sparse_categorical_crossentropy",
        metrics=["accuracy"],
    )

    # Safe summary (won't crash your console)
    try:
        model.summary()
    except Exception as e:
        print("⚠️ Skipping model.summary():", e)

    callbacks = [
        tf.keras.callbacks.EarlyStopping(patience=10, restore_best_weights=True),
    ]

    model.fit(
        X_train, y_train,
        validation_data=(X_val, y_val),
        epochs=80,
        batch_size=32,
        callbacks=callbacks,
        verbose=1,
    )

    os.makedirs("models", exist_ok=True)
    model.save(MODEL_OUT)

    with open(LABELS_OUT, "w") as f:
        json.dump(labels, f)

    print("\n✅ Saved:", MODEL_OUT)
    print("✅ Saved:", LABELS_OUT)
    print("✅ labels.json =", labels)

if __name__ == "__main__":
    main()
