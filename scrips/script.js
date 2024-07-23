const elVideo = document.getElementById("video");

navigator.getMedia =
  navigator.getUserMedia ||
  navigator.webkitGetUserMedia ||
  navigator.mozGetUserMedia;

const cargarCamara = () => {
  navigator.getMedia(
    {
      video: true,
      audio: false,
    },
    stream => {
      elVideo.srcObject = stream;
      elVideo.onloadedmetadata = () => {
        elVideo.play();
      };
    },
    error => console.error("Error al cargar la cámara:", error)
  );
};

Promise.all([
  faceapi.nets.ssdMobilenetv1.loadFromUri("./models"), 
  faceapi.nets.ageGenderNet.loadFromUri("./models"),
  faceapi.nets.faceExpressionNet.loadFromUri("./models"),
  faceapi.nets.faceLandmark68Net.loadFromUri("./models"),
  faceapi.nets.faceLandmark68TinyNet.loadFromUri("./models"),
  faceapi.nets.faceRecognitionNet.loadFromUri("./models"),
  faceapi.nets.tinyFaceDetector.loadFromUri("./models"),
]).then(() => {
  console.log("Modelos cargados");
  cargarCamara();
});

const emotionEmoticons = {
  neutral: "😐",
  happy: "😃",
  sad: "😢",
  angry: "😡",
  fearful: "😨",
  disgusted: "🤢",
  surprised: "😮"
};

elVideo.addEventListener("play", async () => {
  console.log("Video está reproduciéndose");
  const canvas = faceapi.createCanvasFromMedia(elVideo);
  document.body.append(canvas);

  const displaySize = { width: elVideo.videoWidth, height: elVideo.videoHeight };
  faceapi.matchDimensions(canvas, displaySize);

  setInterval(async () => {
    const detections = await faceapi.detectAllFaces(elVideo)
      .withFaceLandmarks()
      .withFaceExpressions()
      .withAgeAndGender();

    const emoticonsDiv = document.getElementById("emoticons");
    emoticonsDiv.innerHTML = '';

    if (detections.length > 0) {
      console.log("Cara detectada:", detections);
      const emotions = detections[0].expressions;
      const maxEmotion = Object.keys(emotions).reduce((a, b) => emotions[a] > emotions[b] ? a : b);
      const emoticon = emotionEmoticons[maxEmotion];

      const emoticonElement = document.createElement('div');
      emoticonElement.className = 'emoticon';
      emoticonElement.textContent = emoticon;
      emoticonsDiv.appendChild(emoticonElement);
    } else {
      console.log("No se detecta ninguna cara");
    }

    const resizedDetections = faceapi.resizeResults(detections, displaySize);
    canvas.getContext('2d').clearRect(0, 0, canvas.width, canvas.height);
    // faceapi.draw.drawDetections(canvas, resizedDetections); // Comento esto para no dibujar en el canvas
    // faceapi.draw.drawFaceLandmarks(canvas, resizedDetections); // Comento esto para no dibujar en el canvas
    // faceapi.draw.drawFaceExpressions(canvas, resizedDetections); // Comento esto para no dibujar en el canvas
  }, 100);
});
