import React, { useRef, useEffect, useState, useCallback } from 'react';
import axios from 'axios';
import * as tf from '@tensorflow/tfjs';
import * as cocoSsd from '@tensorflow-models/coco-ssd';

const API_URL = 'https://proctoring-backend-2f1w.onrender.com/api/logs';

function Proctoring({ candidateName, onShowReport }) {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);

  const noFaceTimer = useRef(null);
  const lookingAwayTimer = useRef(null);
  const drowsinessTimer = useRef(null);

  const logEvent = useCallback(async (event) => {
    const newAlert = { event, timestamp: new Date().toLocaleTimeString() };
    setAlerts(prev => [newAlert, ...prev].slice(0, 5));
    try {
      await axios.post(API_URL, { candidateName, event });
    } catch (error) {
      console.error('Failed to log event:', error);
    }
  }, [candidateName]);

  useEffect(() => {
    const loadModelsAndStart = async () => {
      await tf.setBackend('webgl');
      await tf.ready();

      const objectModel = await cocoSsd.load();

      // ✅ Use global FaceMesh (from CDN)
      const faceMesh = new window.FaceMesh({
        locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/${file}`,
      });

      faceMesh.setOptions({
        maxNumFaces: 2,
        refineLandmarks: true,
        minDetectionConfidence: 0.5,
        minTrackingConfidence: 0.5,
      });

      setLoading(false);

      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        videoRef.current.srcObject = stream;

        // ✅ Use global Camera (from CDN)
        const camera = new window.Camera(videoRef.current, {
          onFrame: async () => {
            if (videoRef.current && canvasRef.current) {
              await faceMesh.send({ image: videoRef.current });
              detectObjects(objectModel);
            }
          },
          width: 640,
          height: 480,
        });
        camera.start();
      }

      faceMesh.onResults(onResults);
    };

    const calculateEAR = (eye) => {
      const p1_p5 = Math.hypot(eye[1].x - eye[4].x, eye[1].y - eye[4].y);
      const p2_p4 = Math.hypot(eye[2].x - eye[3].x, eye[2].y - eye[3].y);
      const p0_p3 = Math.hypot(eye[0].x - eye[5].x, eye[0].y - eye[5].y);
      return (p1_p5 + p2_p4) / (2 * p0_p3);
    };

    const detectObjects = async (model) => {
      if (videoRef.current && videoRef.current.readyState === 4) {
        const predictions = await model.detect(videoRef.current);
        const suspiciousObjects = ['cell phone', 'book', 'laptop'];
        for (const prediction of predictions) {
          if (suspiciousObjects.includes(prediction.class) && prediction.score > 0.6) {
            logEvent(`Suspicious Item Detected: ${prediction.class}`);
          }
        }
      }
    };

    const onResults = (results) => {
      if (!results.multiFaceLandmarks || results.multiFaceLandmarks.length === 0) {
        if (!noFaceTimer.current) {
          noFaceTimer.current = setTimeout(() => logEvent('No Face Detected'), 10000);
        }
        return;
      }

      clearTimeout(noFaceTimer.current);
      noFaceTimer.current = null;

      if (results.multiFaceLandmarks.length > 1) {
        logEvent('Multiple Faces Detected');
      }

      const face = results.multiFaceLandmarks[0];
      const landmarks = face;
      const noseTip = landmarks[1];
      const leftSide = landmarks[234];
      const rightSide = landmarks[454];

      const headTurnRatio = Math.abs(noseTip.x - leftSide.x) / Math.abs(rightSide.x - leftSide.x);

      if (headTurnRatio < 0.3 || headTurnRatio > 0.7) {
        if (!lookingAwayTimer.current) {
          lookingAwayTimer.current = setTimeout(() => logEvent('User Looking Away'), 5000);
        }
      } else {
        clearTimeout(lookingAwayTimer.current);
        lookingAwayTimer.current = null;
      }

      const leftEyeIndices = [33, 160, 158, 133, 153, 144];
      const rightEyeIndices = [362, 385, 387, 263, 373, 380];
      const leftEye = leftEyeIndices.map(i => landmarks[i]);
      const rightEye = rightEyeIndices.map(i => landmarks[i]);
      const leftEAR = calculateEAR(leftEye);
      const rightEAR = calculateEAR(rightEye);
      const avgEAR = (leftEAR + rightEAR) / 2;

      if (avgEAR < 0.2) {
        if (!drowsinessTimer.current) {
          drowsinessTimer.current = setTimeout(() => logEvent('Drowsiness Detected'), 3000);
        }
      } else {
        clearTimeout(drowsinessTimer.current);
        drowsinessTimer.current = null;
      }
    };

    loadModelsAndStart();

  }, [logEvent, candidateName]);

  return (
    <div className="min-h-screen bg-gray-900 flex flex-col items-center justify-center p-4">
      <h1 className="text-3xl font-bold mb-4">Interview in Progress</h1>
      <p className="text-lg text-gray-400 mb-6">
        Candidate: <span className="font-semibold text-white">{candidateName}</span>
      </p>

      {loading && <div className="text-xl">Loading AI Models... Please Wait.</div>}

      <div className="relative w-full max-w-2xl mx-auto">
        <video ref={videoRef} autoPlay playsInline muted className="w-full h-auto rounded-lg shadow-lg"></video>
        <canvas ref={canvasRef} className="absolute top-0 left-0 w-full h-full"></canvas>
      </div>

      <div className="w-full max-w-2xl mt-6">
        <div className="bg-gray-800 p-4 rounded-lg shadow-inner">
          <h2 className="text-xl font-semibold mb-2 text-red-400">🚨 Live Alerts</h2>
          <ul className="text-gray-300">
            {alerts.length > 0 ? alerts.map((alert, index) => (
              <li key={index} className="border-b border-gray-700 py-1">
                {`[${alert.timestamp}] ${alert.event}`}
              </li>
            )) : <p>No alerts yet. System is monitoring.</p>}
          </ul>
        </div>
      </div>

      <button
        onClick={onShowReport}
        className="mt-8 bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-6 rounded-md transition-colors"
      >
        Finish Interview & View Report
      </button>
    </div>
  );
}

export default Proctoring;
