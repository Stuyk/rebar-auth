import * as alt from 'alt-client';
import * as native from 'natives';
import { AuthEvents } from '../shared/authEvents.js';

const CamPos = { x: -867.1437377929688, y: -172.6201934814453, z: 100 };

let camera: number;
let interval: number;

function rotateCamera() {
    const camRot = native.getCamRot(camera, 2);
    native.setCamRot(camera, camRot.x, camRot.y, camRot.z + 0.1, 2);
}

function createCamera() {
    if (typeof camera !== 'undefined') {
        return;
    }

    interval = alt.setInterval(rotateCamera, 0);
    camera = native.createCamWithParams(
        'DEFAULT_SCRIPTED_CAMERA',
        CamPos.x,
        CamPos.y,
        CamPos.z + 0.2,
        0,
        0,
        0,
        55,
        false,
        1
    );

    native.setCamFov(camera, 80);
    native.setCamActive(camera, true);
    native.renderScriptCams(true, true, 1000, false, false, 0);
    native.displayRadar(false);
    alt.toggleGameControls(false);
}

function destroyCamera() {
    if (typeof camera === 'undefined') {
        return;
    }

    native.destroyAllCams(true);
    native.setCamActive(camera, false);
    native.renderScriptCams(false, false, 0, false, false, 0);
    native.displayRadar(true);
    alt.toggleGameControls(true);
    alt.clearInterval(interval);
    interval = undefined;
}

alt.onServer(AuthEvents.toClient.cameraCreate, createCamera);
alt.onServer(AuthEvents.toClient.cameraDestroy, destroyCamera);
