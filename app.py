import asyncio
import websockets
from datetime import datetime
from io import BytesIO
from picamera2 import Picamera2
import time

# in seconds
CAPTURE_INTERVAL = 1
WEBSOCKET_PORT = 5678

CAPTURE_TIMEOUT = 3

class CameraTimeout(Exception):
    pass

connections = set()
background_tasks = set()

def now():
    return datetime.now().isoformat()

async def register(socket):
    print("registering socket")
    connections.add(socket)
    try:
        if len(background_tasks) == 0:
            task = asyncio.create_task(broadcast_pictures())
            background_tasks.add(task)
            task.add_done_callback(background_tasks.discard)
            print(f"enabled broadcast - {now()}", flush=True)
        else:
            print(f"broadcast already going tbh - {now()}", flush=True)
        await socket.wait_closed()
    finally:
        connections.remove(socket)
        
async def capture_with_timeout(camera): 
    stream = BytesIO()
    start = time.time()
    done = []
    job = camera.capture_file(stream, format='jpeg', wait=False, signal_function=lambda _: done.append(1))
    while time.time() - start < CAPTURE_TIMEOUT:
        if len(done) != 0:
            return stream
        await asyncio.sleep(0.1)
        
    raise CameraTimeout()
    

async def broadcast_pictures():
    with Picamera2() as camera:
        config = camera.create_still_configuration({"size": (1280, 720)})
        camera.align_configuration(config)
        camera.configure(config)
        camera.start()
        while len(connections) != 0:
            try:
                stream = await capture_with_timeout(camera)
            except CameraTimeout:
                print(f"camera broken, returning - {now()}", flush=True)
                return
            websockets.broadcast(connections, stream.getvalue())
            await asyncio.sleep(CAPTURE_INTERVAL)
            
    print(f"okay we're done here - {now()}", flush=True)

async def main():
    async with websockets.serve(register, '0.0.0.0', WEBSOCKET_PORT):
        print(f'running on port {WEBSOCKET_PORT} - {now()}', flush=True)
        await asyncio.Future()

if __name__ == '__main__':
    asyncio.run(main())