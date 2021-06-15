const {
    desktopCapturer,
    ipcRenderer,
    shell,
    remote,
} = require('electron');

const {screen} = remote;

const { writeFile } = require('fs');
const Str = require('@supercharge/strings');

const CloseButton = document.querySelector('.close-button');
const ScreenShotButton = document.querySelector('.screenshot-button');
const VideoButton = document.querySelector('.video-record-button');
const VideoStopButton = document.querySelector('.video-stop-button');

const VideoChunks = [];
let Recorder = null;

CloseButton.addEventListener('click', close);
ScreenShotButton.addEventListener('click', takeScreenshot);
VideoButton.addEventListener('click', recordVideo);
VideoStopButton.addEventListener('click', stopRecording)

function takeScreenshot() {
    toggleLoader('.screenshot-button');
    desktopCapturer.getSources({ types: ['screen'], thumbnailSize: getScreenDimensions() })
        .then(sources => {
            const screenShotDataUrl = sources[0].thumbnail.toDataURL();
            const base64Code = screenShotDataUrl.replace(/^data:image\/png;base64,/, "");
            const name = `${Str.random(5)}.jpeg`;
            saveFile(name, 'screenshots', base64Code, 'base64');
            toggleLoader('.screenshot-button', false);
        })
        .catch(e => {
            alert(e);
        });
}

function recordVideo() {
    toggleLoader('.video-button');
    desktopCapturer.getSources({ types: ['screen', 'window'] }).then(async sources => {
        navigator.mediaDevices.getUserMedia({
            audio: { mandatory: { chromeMediaSource: 'desktop' } },
            video: { mandatory: { chromeMediaSource: 'desktop' } },
        }).then(stream => handleStream(stream))
        .catch(e => {
            alert(e);
            toggleLoader('.video-button', false);
        });
    });
}

function stopRecording() {
    return Recorder ? Recorder.stop() : null;
}

function handleStream (stream) {
    const options = { mimeType: 'video/webm; codecs=vp9' };
    Recorder = new MediaRecorder(stream, options);
    Recorder.ondataavailable = (event) => VideoChunks.push(event.data);
    Recorder.onstop = createVideoFile;
    Recorder.start();
    toggleLoader('.video-button', false);
    toggleVideoRecorderButton(false);
}

function toggleVideoRecorderButton(show = true) {
    if (!show) {
        VideoButton.style.display = 'none';
        return VideoStopButton.style.display = 'flex';
    }
    VideoButton.style.display = 'flex';
    return VideoStopButton.style.display = 'none';
}

function close() {
    ipcRenderer.sendSync('window-all-closed');
}

function toggleLoader(className, toggle = true) {
    const iconClass = `${className}-icon`;
    const loaderClass = `${className}-loader`;
    if (toggle) {
        document.querySelector(iconClass).style.display = 'none';
        return document.querySelector(loaderClass).style.display = 'flex';
    }
    document.querySelector(iconClass).style.display = 'flex';
    return document.querySelector(loaderClass).style.display = 'none';
}

function getScreenDimensions() {
    const { width, height } = screen.getPrimaryDisplay().workAreaSize;
    return { width, height };
}

async function saveFile(name, folder, data, option = null) {
    const path = `${__dirname}/captures/${folder}`;
    const filePath = `${path}/${name}`;
    await writeFile(filePath, data, option, (error) => {
        if (error) {
            return alert('Failed to save');
        } else {
            shell.openPath(path);
        }
    });
}

async function createVideoFile() {
    toggleVideoRecorderButton();
    const blob = new Blob(VideoChunks, {
        type: 'video/webm; codecs=vp9'
    });
    const buffer = Buffer.from(await blob.arrayBuffer());
    const name = `${Str.random(5)}.webm`;
    saveFile(name, 'videos', buffer);
    VideoChunks.splice(0, VideoChunks.length);
    Recorder = null;
}
