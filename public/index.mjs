import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { XRButton } from 'three/addons/webxr/XRButton.js';
import { XRControllerModelFactory } from 'three/addons/webxr/XRControllerModelFactory.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { FontLoader } from 'three/addons/loaders/FontLoader.js';
import { TextGeometry } from 'three/addons/geometries/TextGeometry.js';

import { fetchData } from "./common.mjs"

let container;
let camera, scene, renderer;
let controller1, controller2;
let controllerGrip1, controllerGrip2;

let raycaster;
let temperature = '--', oxysaturation = '--', bpm = '--';
let uTemperature = false, uOxysaturation = false, uBpm = false, dtStatus = false, uHuman = false;
let temperatureMesh, oxysaturationMesh, bpmMesh, humanMesh;

const intersected = [];
const tempMatrix = new THREE.Matrix4();
const fontLoader = new FontLoader();

let controls, group;

const snellenConfig = {
    textureSizePx: 512,
    widthPx: 646,
    heightPx: 353,

    x: 0,
    y: 1.5,
    z: - 1.1,
    widthMeters: .573, // 320px image * (142mm/160px scale factor)
    heightMeters: .313 // 450px image * (142mm/160px scale factor)
};

snellenConfig.cropX = snellenConfig.widthPx / snellenConfig.textureSizePx;
snellenConfig.cropY = snellenConfig.heightPx / snellenConfig.textureSizePx;

snellenConfig.quadWidth = .5 * snellenConfig.widthMeters / snellenConfig.cropX;
snellenConfig.quadHeight = .5 * snellenConfig.heightMeters / snellenConfig.cropY;


init();
animate();

function init() {
    // calls digital twin
    const bpmURL = "https://p2shmwa7wi.execute-api.us-east-1.amazonaws.com/test/LastBPM",
        temperatureURL = "https://p2shmwa7wi.execute-api.us-east-1.amazonaws.com/test/LastTemperature",
        oxysaturationURL = "https://p2shmwa7wi.execute-api.us-east-1.amazonaws.com/test/LastOxysaturation",
        sampleURL = "https://jsonplaceholder.typicode.com/posts/1";

    setInterval(async () => {
        try {
            // bpm
            const bpmData = await fetchData(bpmURL);
            bpm = parseInt(JSON.parse(bpmData["body"])[0]["measure_value::double"]);
            uBpm = true;
            console.log('BPM:', bpm);
            // temperature
            const temperatureData = await fetchData(temperatureURL);
            temperature = parseInt(JSON.parse(temperatureData["body"])[0]["measure_value::double"]);
            uTemperature = true;
            console.log('Temperature:', temperature);
            // temperature
            const oxysaturationData = await fetchData(oxysaturationURL);
            oxysaturation = parseInt(JSON.parse(oxysaturationData["body"])[0]["measure_value::double"]);
            uOxysaturation = true;
            console.log('Oxygen saturation:', oxysaturation);

            if (!dtStatus) {
                dtStatus = true;
                uHuman = true;
            }
        } catch (error) {
            dtStatus = false;
            uHuman = true;
            console.error('Skipping Digital Twin synchronization');
        }
    }, 5000);

    container = document.createElement('div');
    document.body.appendChild(container);

    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x808080);

    camera = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 0.1, 10);
    camera.position.set(0, 1.6, 3);

    controls = new OrbitControls(camera, container);
    controls.target.set(0, 1.6, 0);
    controls.update();

    const floorGeometry = new THREE.PlaneGeometry(6, 6);
    const floorMaterial = new THREE.ShadowMaterial({ opacity: 0.25, blending: THREE.CustomBlending, transparent: false });
    const floor = new THREE.Mesh(floorGeometry, floorMaterial);
    floor.rotation.x = - Math.PI / 2;
    floor.receiveShadow = true;
    scene.add(floor);

    scene.add(new THREE.HemisphereLight(0xbcbcbc, 0xa5a5a5, 3));

    const light = new THREE.DirectionalLight(0xffffff, 3);
    light.position.set(0, 6, 0);
    light.castShadow = true;
    light.shadow.camera.top = 3;
    light.shadow.camera.bottom = - 3;
    light.shadow.camera.right = 3;
    light.shadow.camera.left = - 3;
    light.shadow.mapSize.set(4096, 4096);
    scene.add(light);

    group = new THREE.Group();
    scene.add(group);

    const geometries = [
        new THREE.BoxGeometry(0.2, 0.2, 0.2),
        new THREE.ConeGeometry(0.2, 0.2, 64),
        new THREE.CylinderGeometry(0.2, 0.2, 0.2, 64),
        new THREE.IcosahedronGeometry(0.2, 8),
        new THREE.TorusGeometry(0.2, 0.04, 64, 32)
    ];


    const material = new THREE.MeshStandardMaterial({
        color: Math.random() * 0xffffff,
        roughness: 0.7,
        metalness: 0.0
    });

    // 3d object
    const object = new THREE.Mesh(geometries[Math.floor(0.3 * geometries.length)], material);
    object.position.set(0.8 - 0.03752328924916626, 1.6 - 0.016624447219640848, -0.8896507431678539);
    object.scale.setScalar(1.2);
    object.castShadow = true;
    object.receiveShadow = true;
    group.add(object);

    // snellen
    const snellenTexture = new THREE.TextureLoader().load('textures/graph.jpg');
    snellenTexture.repeat.x = snellenConfig.cropX;
    snellenTexture.repeat.y = snellenConfig.cropY;
    snellenTexture.generateMipmaps = false;
    snellenTexture.minFilter = THREE.LinearFilter;

    const snellenMaterial = new THREE.MeshBasicMaterial({ map: snellenTexture });
    const snellenGeometry = new THREE.PlaneGeometry(snellenConfig.widthMeters, snellenConfig.heightMeters);
    const snellenMesh = new THREE.Mesh(snellenGeometry, snellenMaterial);
    snellenMesh.position.set(0.6 - 0.03752328924916626, 1.2 - 0.016624447219640848, -0.8896507431678539);
    snellenMesh.rotation.set(0, -0.6, 0);
    snellenMesh.scale.setScalar(1.2);

    snellenMesh.castShadow = true;
    snellenMesh.receiveShadow = true;
    snellenMesh.distanceToCamera = 0;
    group.add(snellenMesh)


    // human
    const loader = new GLTFLoader();
    loader.load('textures/humano.glb', function (gltf) {
        gltf.scene.traverse(function (child) {
            if (child.isMesh) {
                // Create a new mesh using the geometry of the loaded model
                humanMesh = new THREE.Mesh(child.geometry, new THREE.MeshStandardMaterial({ color: 0xffffff }));
                humanMesh.position.set(-0.1 - 0.0887804821277855, 1.2 - 0.19877379499445158, -0.9650485075357644);
                humanMesh.scale.set(0.005, 0.005, 0.005);
                // Add the new mesh to the group
                group.add(humanMesh);
            }
        });
    });

    // Digital Twin data
    const textMaterial = new THREE.MeshBasicMaterial({ color: 0xffffff });
    // Temperature
    fontLoader.load("./dep/three/examples/fonts/helvetiker_regular.typeface.json", function (font) {
        const temperatureText = new TextGeometry(`Temperature: -- °C`, {
            font: font,
            size: 0.07,
            height: 0.1
        });
        temperatureMesh = new THREE.Mesh(temperatureText, textMaterial);
        temperatureMesh.position.set(-0.5 - 0.0887804821277855, 1.9 - 0.19877379499445158, -0.9650485075357644);
        group.add(temperatureMesh);
    });

    // BPM
    fontLoader.load("./dep/three/examples/fonts/helvetiker_regular.typeface.json", function (font) {
        const bpmText = new TextGeometry(`BPM: --`, {
            font: font,
            size: 0.07,
            height: 0.1
        });
        bpmMesh = new THREE.Mesh(bpmText, textMaterial);
        bpmMesh.position.set(-0.2 - 0.0887804821277855, 1.8 - 0.19877379499445158, -0.9650485075357644);
        group.add(bpmMesh);
    });

    // Oxysaturation
    fontLoader.load("./dep/three/examples/fonts/helvetiker_regular.typeface.json", function (font) {
        const oxysaturationText = new TextGeometry(`Oxygen saturation: --`, {
            font: font,
            size: 0.07,
            height: 0.1
        });
        oxysaturationMesh = new THREE.Mesh(oxysaturationText, textMaterial);
        oxysaturationMesh.position.set(-0.55 - 0.0887804821277855, 1.7 - 0.19877379499445158, -0.9650485075357644);
        group.add(oxysaturationMesh);
    });


    //

    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.shadowMap.enabled = true;
    renderer.xr.enabled = true;
    container.appendChild(renderer.domElement);

    document.body.appendChild(XRButton.createButton(renderer));

    // controllers

    controller1 = renderer.xr.getController(0);
    controller1.addEventListener('selectstart', onSelectStart);
    controller1.addEventListener('selectend', onSelectEnd);
    scene.add(controller1);

    controller2 = renderer.xr.getController(1);
    controller2.addEventListener('selectstart', onSelectStart);
    controller2.addEventListener('selectend', onSelectEnd);
    scene.add(controller2);

    const controllerModelFactory = new XRControllerModelFactory();

    controllerGrip1 = renderer.xr.getControllerGrip(0);
    controllerGrip1.add(controllerModelFactory.createControllerModel(controllerGrip1));
    scene.add(controllerGrip1);

    controllerGrip2 = renderer.xr.getControllerGrip(1);
    controllerGrip2.add(controllerModelFactory.createControllerModel(controllerGrip2));
    scene.add(controllerGrip2);

    //

    const geometry = new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(0, 0, 0), new THREE.Vector3(0, 0, - 1)]);

    const line = new THREE.Line(geometry);
    line.name = 'line';
    line.scale.z = 5;

    controller1.add(line.clone());
    controller2.add(line.clone());

    raycaster = new THREE.Raycaster();

    window.addEventListener('resize', onWindowResize);
}

function onWindowResize() {

    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();

    renderer.setSize(window.innerWidth, window.innerHeight);

}

function onSelectStart(event) {

    const controller = event.target;

    const intersections = getIntersections(controller);

    if (intersections.length > 0) {

        const intersection = intersections[0];

        const object = intersection.object;
        // object.material.emissive.b = 1;
        object.color
        controller.attach(object);

        controller.userData.selected = object;

    }

    controller.userData.targetRayMode = event.data.targetRayMode;

}

function onSelectEnd(event) {

    const controller = event.target;

    if (controller.userData.selected !== undefined) {

        const object = controller.userData.selected;
        console.log("New Object Rotation: " + object.rotation.x + "," + object.rotation.y + "," + object.rotation.z);
        // object.material.emissive.b = 0;
        group.attach(object);

        // get distance to camera
        const lookingAt = new THREE.Vector3();
        camera.getWorldDirection(lookingAt);
        const objectPosition = new THREE.Vector3();
        object.getWorldPosition(objectPosition);
        object.distanceToCamera = lookingAt.distanceTo(objectPosition);
        console.log('New Distance to Camera:', object.distanceToCamera);

        controller.userData.selected = undefined;

    }

}

function getIntersections(controller) {

    controller.updateMatrixWorld();

    tempMatrix.identity().extractRotation(controller.matrixWorld);

    raycaster.ray.origin.setFromMatrixPosition(controller.matrixWorld);
    raycaster.ray.direction.set(0, 0, - 1).applyMatrix4(tempMatrix);

    return raycaster.intersectObjects(group.children, false);

}

function intersectObjects(controller) {

    // Do not highlight in mobile-ar

    if (controller.userData.targetRayMode === 'screen') return;

    // Do not highlight when already selected

    if (controller.userData.selected !== undefined) return;

    const line = controller.getObjectByName('line');
    const intersections = getIntersections(controller);

    if (intersections.length > 0) {

        const intersection = intersections[0];

        const object = intersection.object;
        // object.material.emissive.r = 1;
        intersected.push(object);

        line.scale.z = intersection.distance;

    } else {

        line.scale.z = 5;

    }

}

function cleanIntersected() {

    while (intersected.length) {

        const object = intersected.pop();
        // object.material.emissive.r = 0;

    }

}

//

function animate() {

    renderer.setAnimationLoop(render);

}



function render(t, frame) {

    cleanIntersected();

    intersectObjects(controller1);
    intersectObjects(controller2);

    frame = renderer.xr.getFrame();

    if (frame != null) {
        const lookingAt = new THREE.Vector3();
        camera.getWorldDirection(lookingAt);
        // const rotation = renderer.xr.getCamera(camera).rotation;
        group.position.x = lookingAt.x;
        group.position.y = lookingAt.y;
        group.rotation.y = camera.rotation.y;

        // group.children.forEach(object => {
        // 	console.log('Distance to Camera:', object.distanceToCamera);
        // });
    }


    if (uBpm) {
        fontLoader.load("./dep/three/examples/fonts/helvetiker_regular.typeface.json", function (font) {
            const bpmText = new TextGeometry(`BPM: ${bpm}`, {
                font: font,
                size: 0.07,
                height: 0.1
            });
            bpmMesh.geometry.dispose();
            bpmMesh.geometry = bpmText;
        });
        uBpm = false;
    }

    if (uTemperature) {
        fontLoader.load("./dep/three/examples/fonts/helvetiker_regular.typeface.json", function (font) {
            const temperatureText = new TextGeometry(`Temperature: ${temperature} °C`, {
                font: font,
                size: 0.07,
                height: 0.1
            });
            temperatureMesh.geometry.dispose();
            temperatureMesh.geometry = temperatureText;
        });
        uTemperature = false;
    }

    if (uOxysaturation) {
        fontLoader.load("./dep/three/examples/fonts/helvetiker_regular.typeface.json", function (font) {
            const oxysaturationText = new TextGeometry(`Oxygen saturation: ${oxysaturation}`, {
                font: font,
                size: 0.07,
                height: 0.1
            });
            oxysaturationMesh.geometry.dispose();
            oxysaturationMesh.geometry = oxysaturationText;
        });
        uOxysaturation = false;
    }

    if (uHuman) {
        if (dtStatus) {
            humanMesh.material.color.set("#55D908");
        } else {
            humanMesh.material.color.set("#D93608 ");
        }
    }

    renderer.render(scene, camera);

}