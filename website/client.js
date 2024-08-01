const SECURE_SOCKET_URL = 'wss://dewey.lkellar.org/api/'
const LOCAL_SOCKET_URL = 'ws://10.0.0.4:5678/'

const SOCKET_URL = new URL(window.location.href).protocol === 'https:' ? SECURE_SOCKET_URL : LOCAL_SOCKET_URL;

let timeout_id;

// https://stackoverflow.com/a/18650249/
async function blobToBase64(blob) {
  return new Promise((resolve, _) => {
    const reader = new FileReader();
    reader.onloadend = () => {
        const result = reader.result;
        resolve(result.substr(result.indexOf(',')+1));
    };
    reader.readAsDataURL(blob);
  });
}

function getTimeString() {
  const now = new Date();
  return `Updated at ${now.toDateString()}, ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}`;
}

function alertOfTimeout() {
  document.getElementById("main").replaceChildren(ele);
}

function displayError(message) {
  const p = document.getElementById('paragraph');
  if (p) {
      p.innerText = message;
  } else {
      const p = document.createElement("p");
      p.innerText = message;
      p.id = 'paragraph';
      document.getElementById("main").replaceChildren(p);
  }
}

async function updateImage(rawBits) {
    const translation = await blobToBase64(rawBits);
    const dataString = `data:image/jpeg;base64,${translation}`;
    let ele = document.getElementById("image");
    const p = document.getElementById('paragraph');
    if (ele && p) {
        ele.src = dataString;
        p.innerText = getTimeString();
    } else {
        const ele = document.createElement("img");
        ele.src = dataString;
        ele.id = 'image';
        const p = document.createElement("p");
        p.innerText = getTimeString();
        p.id = 'paragraph';
        document.getElementById("main").replaceChildren(p, ele);
    }
}

async function main() {
    let socket = new WebSocket(SOCKET_URL);
    
    timeout_id = setTimeout(() => {
      displayError("Unable to connect to server :(");
    }, 5000);
    
    socket.onmessage = function(event) {
      clearTimeout(timeout_id);
        if (event.data instanceof Blob) {
            updateImage(event.data);
        } else {
            console.log(`[message] Got something else: ${event.data}`)
        }
      timeout_id = setTimeout(() => {
        displayError("Seemed to have lost connection with the server. Maybe try refreshing?");
      }, 5000);
    };
    
    socket.onclose = function(event) {
      if (event.wasClean) {
        console.log(`[close] Connection closed cleanly, code=${event.code} reason=${event.reason}`);
      } else {
        // e.g. server process killed or network down
        // event.code is usually 1006 in this case
        console.log('[close] Connection died');
      }
    };
    
    socket.onerror = function(error) {
      console.log(`[error]`);
    };
}

main();