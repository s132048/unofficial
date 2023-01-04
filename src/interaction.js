import { isMobile } from "react-device-detect";

import * as THREE from 'three';
import { DRACOLoader } from "three/examples/jsm/loaders/DRACOLoader";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader";
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { RGBELoader } from "three/examples/jsm/loaders/RGBELoader";

import * as CANNON from 'cannon-es';
import CannonDebugger from 'cannon-es-debugger';

import * as dat from 'dat.gui';

import { ShapeType, threeToCannon } from "three-to-cannon";

import about from './about.glb';
import contact from './contact.glb';
import eye from './eye.glb';
import logo from './logo.glb';
// import logo1 from './logo1.glb';
// import logo2 from './logo2.glb';
// import logo3 from './logo4.glb';
import logo6 from './logo6.glb';
// import logo7 from './logo5.glb';
import logo8 from './logo8.glb';
import work from './work.glb';

import tvstudio from './tvstudio.hdr';

export const mainInteraction = () => {
    const canvas = document.querySelector('#three-canvas');
    // antialias 꼭 넣어야 하나?
    const renderer = new THREE.WebGLRenderer({canvas, alpha: true, antialias: true});
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(window.devicePixelRatio > 1 ? 2 : 1);
    renderer.shadowMap.enabled = true;

    // gui
    const gui = new dat.GUI();
    let parameters = {
        camera: isMobile ? 2 : 3,
        decay: isMobile ? 0.84 : 0.6,
        angularDecay: isMobile ? 0.6 : 0.8,
        force: isMobile ? 2000 : 400,
        torque: 10,

        // 조명
        ambientLight: 0.5,
        environmentLight: 1,
    }
    gui.add(parameters, 'camera').min(0).max(10).step(0.1);
    gui.add(parameters, 'decay').min(0).max(1).step(0.01);
    gui.add(parameters, 'angularDecay').min(0).max(1).step(0.01);
    gui.add(parameters, 'force').min(0).max(10000).step(1);
    gui.add(parameters, 'torque').min(0).max(100).step(1);

    gui.add(parameters, 'ambientLight').min(0).max(10).step(0.01);
    gui.add(parameters, 'environmentLight').min(0).max(10).step(0.01);

    // init
    const scene = new THREE.Scene();

    // 카메라
    const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 1000);
    // const camera = new THREE.OrthographicCamera(window.innerWidth / - 2, window.innerWidth / 2, window.innerHeight / 2, window.innerHeight / - 2);
    camera.position.y = parameters.camera;
    scene.add(camera);

    // 조명
    const ambientLight = new THREE.AmbientLight('white', parameters.ambientLight);
    // ambientLight.castShadow = true;
    scene.add(ambientLight);

    // 배경
    new RGBELoader().load(tvstudio, (texture) => {
        texture.mapping = THREE.EquirectangularReflectionMapping;
        scene.environment = texture;
    });
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = parameters.environmentLight;

    // 컨트롤
    const controls = new OrbitControls(camera, renderer.domElement);

    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();

    // 물리엔진
    const cannonWorld = new CANNON.World();
    const cannonDebugger = new CannonDebugger(scene, cannonWorld);

    const defaultMaterial = new CANNON.Material('default');
    // 이 값이 최선인가?
    const defaultContactMaterial = new CANNON.ContactMaterial(
        defaultMaterial, defaultMaterial,
        {friction: 0.5, restitution: 0.3}
    );
    cannonWorld.defaultContactMaterial = defaultContactMaterial;

    // objects 밑에 오브젝트들을 넣어준다
    let objects = {};

    const gltfLoader = new GLTFLoader();
    const dracoLoader = new DRACOLoader()
    dracoLoader.setDecoderConfig({ type: 'js' });
    dracoLoader.setDecoderPath('https://www.gstatic.com/draco/v1/decoders/');
    dracoLoader.preload();
    gltfLoader.setDRACOLoader(dracoLoader);

    // 메인 로고 넣기
    gltfLoader.load(logo, gltf => {
        // 로고 사이즈 정하기
        const logoScale = isMobile ? 24 : 32;
        gltf.scene.children[0].scale.set(logoScale, logoScale, logoScale);
        const sphereBody = new CANNON.Sphere(0.001);
        const body = new CANNON.Body({mass: 0, position: new CANNON.Vec3(0, 0,0 ), material: defaultMaterial});
        body.addShape(sphereBody);
        cannonWorld.addBody(body);

        objects.center = {};
        objects.center.mesh = gltf.scene.children[0];
        scene.add(gltf.scene.children[0]);
        objects.center.body = body;
        objects.center.offset = new CANNON.Vec3(0, 0,0);
    });

    const sequence = [
        // {menuName: 'eye', asset: eye, scale: 8, floating: true, mass: isMobile ? 200 : 40, forces: [new CANNON.Vec3(Math.random() - 0.5,Math.random() - 0.5,Math.random() - 0.5).scale(1000)]},
        // {menuName: 'eye2', asset: eye, scale: isMobile ? 12 : 16, floating: true, mass: isMobile ? 200 : 40, forces: [new CANNON.Vec3(Math.random() - 0.5,Math.random() - 0.5,Math.random() - 0.5).scale(1000)]},
        // {menuName: 'eye3', asset: eye, scale: isMobile ? 16 : 40, floating: true, mass: isMobile ? 200 : 40, forces: [new CANNON.Vec3(Math.random() - 0.5,Math.random() - 0.5,Math.random() - 0.5).scale(1000)]},
        // {menuName: 'floating1', asset: logo1, scale: isMobile ? 1.5 : 4, floating: true, mass: isMobile ? 200: 40, forces: [new CANNON.Vec3(2,2,-3).scale(200)]},
        // {menuName: 'floating2', asset: logo2, scale: isMobile ? 4 : 10, floating: true, mass: isMobile ? 200: 40, forces: [new CANNON.Vec3(-3,4,3).scale(160)]},
        // {menuName: 'floating3', asset: logo3, scale: isMobile ? 1.5 : 4, floating: true, mass: isMobile ? 200: 40, forces: [new CANNON.Vec3(-4,-2,-3).scale(150)]},
        // mass 최적인가?
        {menuName: 'logo1', asset: logo6, mass: 1, scale: isMobile ? 8 : 7, positionX: isMobile ? 0.1 : -1.4, positionY: -0.6, positionZ: isMobile ? -0.8 : -0.9},
        {menuName: 'logo2', asset: logo6, mass: 1, scale: isMobile ? 8 : 6, positionX: isMobile ? 0.1 : 1.6, positionY: -0.6, positionZ: isMobile ? -0.8 : -0.3},
        {menuName: 'logo3', asset: logo8, mass: 1, scale: isMobile ? 8 : 6, positionX: isMobile ? 0.1 : 0.1, positionY: -0.8, positionZ: isMobile ? -0.8 : 0.8},
        {menuName: 'work', asset: work, mass: 10, scale: isMobile ? 8 : 28, positionX: isMobile ? 0.1 : 0.3, positionY: 0.4, positionZ: isMobile ? -0.8 : -0.6},
        {menuName: 'about', asset: about, mass: 1, scale: isMobile ? 6 : 16, positionX: isMobile ? 0 : -1.4, positionY: 0, positionZ: isMobile ? 0.75 : 0.8},
        {menuName: 'contact', asset: contact, mass: 1, scale: isMobile ? 5 : 12, positionX: isMobile ? -0 : 1.5, positionY: 0, positionZ: isMobile ? 0 : 1},
    ];

    const clock = new THREE.Clock();

    const planeShape = new CANNON.Plane();
    const yCap = isMobile ? 0.2 : 1;
    var planeYmin = new CANNON.Body({mass: 0, material: defaultContactMaterial});
    planeYmin.addShape(planeShape);
    planeYmin.quaternion.setFromAxisAngle(new CANNON.Vec3(1,0,0),-Math.PI/2);
    planeYmin.position.set(0,-yCap,0);
    cannonWorld.addBody(planeYmin);
    var planeYmax = new CANNON.Body({mass: 0, material: defaultContactMaterial});
    planeYmax.addShape(planeShape);
    planeYmax.quaternion.setFromAxisAngle(new CANNON.Vec3(1,0,0),Math.PI/2);
    planeYmax.position.set(0,yCap,0);
    cannonWorld.addBody(planeYmax);

    let boundingBox = new THREE.Box3();
    let positionTemp = new THREE.Vector3();
    const cap = 1;
    const updatePhysics = (scene, objects) => {
        const decay = parameters.decay;
        const angularDecay = parameters.angularDecay;
        for (const [name, object] of Object.entries(objects)) {
            const {body, mesh, floating, force} = object;
            if (!mesh || !body) {
                continue;
            }
            mesh.position.copy(body.position);
            mesh.quaternion.copy(body.quaternion);

            if (floating) {
                boundingBox.setFromObject(mesh, true);
                positionTemp.subVectors(boundingBox.max, boundingBox.min);
                positionTemp.multiplyScalar(0.5);
                positionTemp.add(boundingBox.min);
                positionTemp.project(camera);

                if (positionTemp.x >= cap) {
                    object.body.velocity.x = -Math.abs(object.body.velocity.x);
                    if (force) object.force.x = -Math.abs(object.force.x);
                } else if (positionTemp.x <= -cap) {
                    object.body.velocity.x = Math.abs(object.body.velocity.x);
                    if (force) object.force.x = Math.abs(object.force.x);
                }
                if (positionTemp.y >= cap) {
                    object.body.velocity.z = Math.abs(object.body.velocity.z);
                    if (force) object.force.z = Math.abs(object.force.z);
                } else if (positionTemp.y <= -cap) {
                    object.body.velocity.z = -Math.abs(object.body.velocity.z);
                    if (force) object.force.z = -Math.abs(object.force.z);
                }
            }

            // floating일 때 스프링 붙이는 거 생략함
            // TODO: 힘 넣어주기
            if (object.body) {
                const randomTime = Math.random();
                if (object.floating && randomTime > 0.8 && clock.elapsedTime >= object.forceExpire) {
                    const currentTime = clock.elapsedTime + 3;
                    object.forceExpire = currentTime + 3;
                    object.force = new CANNON.Vec3(body.position.x, -body.position.y, body.position.z);
                    object.force.normalize();
                    // object.torque = new CANNON.Vec3(body.position.x, body.position.y, body.position.z);
                }
                if (object.forceExpire && clock.elapsedTime <= object.forceExpire) {
                    let force = object.force;
                    force = force.scale(parameters.force);
                    body.applyForce(force, new CANNON.Vec3(0, 0, 0));
                    let torque = body.angularVelocity;
                    torque.normalize();
                    torque = torque.scale(parameters.torque);
                    body.applyTorque(torque);
                }
                body.velocity.x *= decay;
                body.velocity.y *= decay;
                body.velocity.z *= decay;
                body.angularVelocity.x *= angularDecay;
                body.angularVelocity.y *= angularDecay;
                body.angularVelocity.z *= angularDecay;
            }
            if (object.forces && object.forces.length > 0) {
                const force = object.forces.pop();
                body.applyImpulse(force);
            }

            // if (name.includes('eye') && Math.random() > 0.5) {
            //     let impulse = new CANNON.Vec3(Math.random() - 0.5, Math.random() - 0.5, Math.random() - 0.5);
            //     impulse.scale(100);
            //     object.body.applyImpulse(impulse);
            // }

            if (['work', 'about', 'contact', 'logo1', 'logo2', 'logo3'].includes(name) && !object.constraint) {
                object.constraint = new CANNON.PointToPointConstraint(
                    body,
                    new CANNON.Vec3(0, 0, 0),
                    objects.center.body,
                    new CANNON.Vec3(object.positionX, object.positionY, object.positionZ)
                );
                cannonWorld.addConstraint(object.constraint);
            }
        }
    };

    const loadSequence = (sequence) => {
        const toLoad = sequence.pop();
        gltfLoader.load(toLoad.asset, gltf => {
            gltf.scene.children[0].scale.set(toLoad.scale, toLoad.scale, toLoad.scale);
            const { shape, offset, quaternion } = threeToCannon(gltf.scene.children[0], {type: ShapeType.BOX});
            const body = new CANNON.Body({
                mass: toLoad.mass,
                position: new CANNON.Vec3(-offset.x, -offset.y, -offset.z),
                material: defaultMaterial
            });
            body.addShape(shape, offset, quaternion);
            cannonWorld.addBody(body);

            objects[toLoad.menuName] = {};
            objects[toLoad.menuName].mesh = gltf.scene.children[0];
            objects[toLoad.menuName].mesh.castShadow = true;
            objects[toLoad.menuName].mesh.receiveShadow = true;
            scene.add(gltf.scene.children[0]);
            objects[toLoad.menuName].body = body;
            objects[toLoad.menuName].offset = offset;
            objects[toLoad.menuName].forceExpire = 0;

            if (toLoad.positionX) objects[toLoad.menuName].positionX = toLoad.positionX;
            if (toLoad.positionX) objects[toLoad.menuName].positionY = toLoad.positionY;
            if (toLoad.positionZ) objects[toLoad.menuName].positionZ = toLoad.positionZ;
            if (toLoad.floating) objects[toLoad.menuName].floating = toLoad.floating;
            if (toLoad.forces) objects[toLoad.menuName].forces = toLoad.forces;
        });
    };

    let clicked = false;

    const draw = () => {
        const delta = clock.getDelta();

        const cannonStepTime = delta < 0.01 ? 1 / 120 : 1 / 60;
        cannonWorld.step(cannonStepTime, delta, 3);

        updatePhysics(scene, objects);
        clicked && sequence.length > 0 && loadSequence(sequence);

        ambientLight.intensity = parameters.ambientLight;
        renderer.toneMappingExposure = parameters.environmentLight;
        camera.position.y = parameters.camera;

        cannonDebugger.update();
        renderer.render(scene, camera);
        renderer.setAnimationLoop(draw);
    }

    function setSize() {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
        renderer.render(scene, camera);
    }

    // 이벤트
    window.addEventListener('resize', setSize);
    canvas.addEventListener('click', (e) => {
        clicked = true;
    });

    draw();
}