import { PREDICT_URL } from "./api";

export async function sendPredictionRequest(imageBase64) {
  const res = await fetch(PREDICT_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ imageBase64 }),
  });

  const data = await res.json();

  return { res, data };
}