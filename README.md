# DeweyCam

[Check it out here](https://dewey.lkellar.org)

Barebones webcam running on a raspberry pi:
- only runs when there's an active connection, idle when no viewers
- no livestream video, just a jpeg sent over websockets once a second

Uses the beta picamera2 library, but I haven't had any issues with it. Service has been running without any issues for about 90 days