# 🤖 AI-Powered Video Proctoring System

A modern, full-stack web application designed to monitor candidates during online interviews. It uses client-side machine learning to detect suspicious activities in real-time, log events, and generate a comprehensive integrity report.
## For backend repo go to https://github.com/devanshraii/Proctoring_backend
---

## ✨ Core Features

* **Real-time Focus Tracking**: Detects if the candidate is looking away from the screen for an extended period.
* **Presence Detection**: Flags if no face is detected or if multiple faces appear in the frame.
* **Suspicious Item Detection**: Identifies unauthorized items like mobile phones and books using object detection.
* **Drowsiness Detection**: A bonus feature that monitors eye-closure to detect potential drowsiness.
* **Automated Event Logging**: All flagged events are automatically logged to a MongoDB database with timestamps.
* **Dynamic Integrity Report**: Generates a final report with an integrity score, interview duration, and a full event log.
* **Fair Scoring System**: The scoring logic includes caps on deductions for each event type to prevent overly harsh penalties.
* **Downloadable Reports**: The final proctoring report can be downloaded as a CSV file for record-keeping.

---

## 🛠️ Technology Stack

This project is built with a modern MERN-like stack, with the AI/ML models running directly in the browser for efficiency and scalability.

* **Frontend**:
    * [Vite](https://vitejs.dev/) (v5.x)
    * [React](https://react.dev/) (v18.x)
    * [Tailwind CSS](https://tailwindcss.com/) (v3.x)
* **Backend**:
    * [Node.js](https://nodejs.org/)
    * [Express](https://expressjs.com/)
    * [MongoDB](https://www.mongodb.com/) with [Mongoose](https://mongoosejs.com/)
* **AI / Machine Learning (Client-Side)**:
    * [TensorFlow.js](https://www.tensorflow.org/js) with the **COCO-SSD** model for object detection.
    * [MediaPipe Face Mesh](https://google.github.io/mediapipe/solutions/face_mesh.html) for face landmark detection, focus tracking, and drowsiness detection.

---

## 🚀 Getting Started

Follow these instructions to get a copy of the project up and running on your local machine for development and testing purposes.

### **Prerequisites**

Make sure you have the following software installed on your system:

* **Node.js**: Version 18.x or later.
* **npm**: (Comes bundled with Node.js).
* **MongoDB**: You can either install it locally or use a cloud service like [MongoDB Atlas](https://www.mongodb.com/cloud/atlas) for a free database cluster.

### **Installation & Setup**

1.  **Clone the repository:**
    ```sh
    git clone [https://github.com/your-username/proctoring-app.git](https://github.com/your-username/proctoring-app.git)
    cd proctoring-app
    ```

2.  **Backend Setup:**
    * Navigate to the backend directory:
        ```sh
        cd backend
        ```
    * Install the required dependencies:
        ```sh
        npm install
        ```
    * Create a `.env` file in the `backend` directory. Copy the contents of `.env.example` (if provided) or use the template below:
        ```env
        # Your MongoDB connection string
        MONGODB_URI=mongodb+srv://<user>:<password>@<cluster-url>/proctoringDB?retryWrites=true&w=majority

        # The port for the backend server
        PORT=5001
        ```
    * Replace the `MONGODB_URI` with your actual MongoDB connection string.
    * Start the backend server:
        ```sh
        npm start
        ```
    * The server should now be running on `http://localhost:5001`.

3.  **Frontend Setup:**
    * Open a new terminal and navigate to the frontend directory:
        ```sh
        cd frontend
        ```
    * Install the required dependencies:
        ```sh
        npm install
        ```
    * Start the frontend development server:
        ```sh
        npm run dev
        ```
    * The application should now be running and accessible at `http://localhost:5173` (or whatever port Vite assigns). Open this URL in your browser to use the application.

---

## ⚙️ How It Works

The application's intelligence lies in the frontend, where it processes the user's video feed in real-time.

1.  **Face Landmark Detection**: **MediaPipe Face Mesh** is used to map 478 landmarks on the candidate's face.
    * **Focus Detection** is achieved by calculating the ratio of distances between the nose and the sides of the face. A significant deviation indicates the head is turned.
    * **Drowsiness Detection** is implemented by calculating the **Eye Aspect Ratio (EAR)**. A low EAR for a sustained period indicates closed eyes.
2.  **Object Detection**: **TensorFlow.js** loads the pre-trained **COCO-SSD** model, which can identify 90 common objects. The application continuously scans the video feed for specified suspicious items like 'cell phone' and 'book'.
3.  **Event Logging**: When any of the above conditions are met (e.g., looking away for >5 seconds), a `logEvent` function is triggered. This function sends a request to the backend Express API, which then stores the event details in the MongoDB database.
4.  **Reporting**: The report page fetches all logs for a given candidate from the backend. It then calculates the final integrity score based on a weighted deduction system with built-in caps to ensure fairness.

---

## ☁️ Deployment

To deploy this application, you will need to host the frontend and backend separately.

### **Backend (e.g., on Render)**

1.  Push your code to a GitHub repository.
2.  On a service like [Render](https://render.com/), create a new "Web Service" and connect your repository.
3.  Set the **Root Directory** to `backend`.
4.  Set the **Build Command** to `npm install`.
5.  Set the **Start Command** to `npm start`.
6.  Add your `MONGODB_URI` as an environment variable in the Render dashboard.
7.  Deploy the service. Render will provide you with a public URL for your backend (e.g., `https://proctoring-backend-xyz.onrender.com`).

### **Frontend (e.g., on Vercel)**

1.  On a service like [Vercel](https://vercel.com/) or Netlify, import your GitHub repository.
2.  Vercel will likely auto-detect that it is a Vite project. Set the **Root Directory** to `frontend`.
3.  **Crucially**, you must update the API endpoint in the frontend code. In `frontend/src/components/Proctoring.jsx` and `frontend/src/components/Report.jsx`, change the `API_URL` variable to your deployed backend URL:
    ```javascript
    const API_URL = '[https://proctoring-backend-xyz.onrender.com/api/logs](https://proctoring-backend-xyz.onrender.com/api/logs)';
    ```
4.  Deploy. You will get a public URL for your live application.

---

## 📜 License

This project is licensed under the MIT License. See the `LICENSE` file for details.
