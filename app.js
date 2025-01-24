// Get query parameters (e.g., ?room=12345)
const urlParams = new URLSearchParams(window.location.search);
const roomId = urlParams.get('room');

if (!roomId) {
  alert('Please provide a room ID in the URL (e.g., ?room=12345)');
  throw new Error('Room ID not provided');
}

// HTML elements
const localVideo = document.getElementById('localVideo');
const remoteVideo = document.getElementById('remoteVideo');

// Set up a signaling server connection
const signalingServer = new WebSocket('wss://your-signaling-server-url'); // Replace with a WebSocket server URL

let localStream;
let peer;

// Get user media (camera and microphone)
async function getLocalStream() {
  localStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
  localVideo.srcObject = localStream;
}

// Handle signaling server messages
signalingServer.onmessage = async (event) => {
  const data = JSON.parse(event.data);

  if (data.room === roomId) {
    if (data.type === 'offer') {
      peer.signal(data.offer);
    } else if (data.type === 'answer') {
      peer.signal(data.answer);
    } else if (data.type === 'candidate') {
      peer.signal(data.candidate);
    }
  }
};

// Create or join the meeting
async function startMeeting() {
  await getLocalStream();

  peer = new SimplePeer({
    initiator: window.location.search.includes('host'), // Host initiates the connection
    stream: localStream,
  });

  // When peer sends a signal, send it to the signaling server
  peer.on('signal', (signalData) => {
    signalingServer.send(JSON.stringify({ room: roomId, ...signalData }));
  });

  // Display remote video
  peer.on('stream', (stream) => {
    remoteVideo.srcObject = stream;
  });
}

// Start the meeting
startMeeting();
