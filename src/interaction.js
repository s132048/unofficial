import {isMobile} from "react-device-detect";

import * as THREE from 'three';
import {DRACOLoader} from "three/examples/jsm/loaders/DRACOLoader";
import {GLTFLoader} from "three/examples/jsm/loaders/GLTFLoader";
import {OrbitControls} from 'three/examples/jsm/controls/OrbitControls';
import {RGBELoader} from "three/examples/jsm/loaders/RGBELoader";

import * as CANNON from 'cannon-es';
import CannonDebugger from 'cannon-es-debugger';

import * as dat from 'dat.gui';

import {ShapeType, threeToCannon} from "three-to-cannon";

import about from './about.glb';
import contact from './contact.glb';
import eye from './eye.glb';
import logo from './logo.glb';
import logo1 from './logo1.glb';
import logo2 from './logo2.glb';
import logo3 from './logo3.glb';
import work from './work.glb';
import gummybear from './gummybear.glb';
import rainbow from './rainbow.glb';
import swoosh from './swoosh.glb';

import tvstudio from './tvstudio.hdr';

export const mainInteraction = () => {
    const canvas = document.querySelector('#three-canvas');
    // antialias 꼭 넣어야 하나?
    const renderer = new THREE.WebGLRenderer({canvas, alpha: true});
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(window.devicePixelRatio > 1 ? 2 : 1);
    renderer.shadowMap.enabled = true;

    // gui
    // const gui = new dat.GUI();
    let parameters = {
        camera: isMobile ? 2 : 3.2,
        decay: isMobile ? 0.84 : 0.7,
        angularDecay: isMobile ? 0. : 0.7,
        force: isMobile ? 1800 : 1300,
        torque: 10,

        // 조명
        ambientLight: 0.5,
        environmentLight: 1,
        massAbout: 1000,
        massContact: 300,
        massWork: 300,
    }
    // gui.add(parameters, 'massAbout').min(10).max(1000).step(1);
    // gui.add(parameters, 'massContact').min(10).max(1000).step(1);
    // gui.add(parameters, 'massWork').min(10).max(1000).step(1);

    // init
    const scene = new THREE.Scene();

    // 카메라
    const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.y = parameters.camera;
    scene.add(camera);

    // 조명
    const ambientLight = new THREE.AmbientLight('white', parameters.ambientLight);
    scene.add(ambientLight);

    // 배경
    let sceneLoaded = false;
    new RGBELoader().load(tvstudio, (texture) => {
        texture.mapping = THREE.EquirectangularReflectionMapping;
        scene.environment = texture;
        sceneLoaded = true;
    });
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = parameters.environmentLight;

    // 컨트롤
    const controls = new OrbitControls(camera, renderer.domElement);

    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();

    // 물리엔진
    const cannonWorld = new CANNON.World();

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

    // 메인 로고 넣기
    gltfLoader.load(logo, gltf => {
        // 로고 사이즈 정하기
        const logoScale = isMobile ? 24 : 32;
        gltf.scene.children[0].scale.set(logoScale, logoScale, logoScale);
        const sphereBody = new CANNON.Sphere(0.00001);
        const body = new CANNON.Body({mass: 0, position: new CANNON.Vec3(0, 0, 0), material: defaultMaterial});
        body.addShape(sphereBody);
        cannonWorld.addBody(body);

        objects.center = {};
        objects.center.mesh = gltf.scene.children[0];
        scene.add(gltf.scene.children[0]);
        objects.center.body = body;
        objects.center.offset = new CANNON.Vec3(0, 0, 0);
    });

    const mobileExclude = ['logo3', 'eye7'];

    const models = [
        {name: 'contact', asset: contact},
        {name: 'about', asset: about},
        {name: 'work', asset: work},
        {name: 'logo3', asset: logo3},
        {name: 'logo2', asset: logo2},
        {name: 'logo1', asset: logo1},
        {name: 'gummybear', asset: gummybear},
        {name: 'swoosh', asset: swoosh},
        {name: 'rainbow', asset: rainbow},
    ]
    const modelLoaded = {};
    models.forEach(model => {
        if (isMobile && mobileExclude.includes(model.name)) return;
        gltfLoader.load(model.asset, gltf => {
            if (model.name !== 'swoosh') {
                modelLoaded[model.name] = gltf.scene.children[0];
            } else {
                modelLoaded[model.name] = gltf.scene;
            }
        });
    })
    gltfLoader.load(eye, gltf => {
        modelLoaded['eye'] = gltf.scene.children[0];
    });

    const sequence = [
        {
            menuName: 'swoosh', scale: isMobile ? 1.5 : 3, floating: true, mass: isMobile ? 200 : 40,
            forces: [new CANNON.Vec3(Math.random() - 0.5,Math.random() - 0.5,Math.random() - 0.5).scale(1000)],
        },
        {
            menuName: 'eye2', scale: isMobile ? 11 : 18, floating: true, mass: isMobile ? 200 : 40,
            forces: [new CANNON.Vec3(Math.random() - 0.5,Math.random() - 0.5,Math.random() - 0.5).scale(1000)]
        },
        {
            menuName: 'gummybear', scale: isMobile ? 0.022 : 0.04, floating: true, mass: isMobile ? 200 : 40,
            forces: [new CANNON.Vec3(Math.random() - 0.5,Math.random() - 0.5,Math.random() - 0.5).scale(1000)]
        },
        {
            menuName: 'rainbow', scale: isMobile ? 0.008 : 0.02, floating: true, mass: isMobile ? 200 : 40,
            forces: [new CANNON.Vec3(Math.random() - 0.5,Math.random() - 0.5,Math.random() - 0.5).scale(1000)]
        },
        {
            menuName: 'eye5', scale: isMobile ? 9 : 24, floating: true, mass: isMobile ? 200 : 40,
            forces: [new CANNON.Vec3(Math.random() - 0.5,Math.random() - 0.5,Math.random() - 0.5).scale(1000)]
        },
        {
            menuName: 'eye7', scale: isMobile ? 7 : 40, floating: true, mass: isMobile ? 200 : 40,
            forces: [new CANNON.Vec3(Math.random() - 0.5,Math.random() - 0.5,Math.random() - 0.5).scale(1000)]
        },
        {
            menuName: 'logo1', mass: 100, scale: isMobile ? 9.5 : 26, positionX: isMobile ? 0.1 : -2,
            positionY: isMobile ? -0.25 : -0.6, positionZ: isMobile ? 0.5 : -0.9,
            rotation: isMobile ? {axis: new CANNON.Vec3(0, 1, 0), angle: -Math.PI / 7} : null
        },
        {
            menuName: 'logo2', mass: 100, scale: isMobile ? 5 : 8, positionX: isMobile ? 0 : 1.6,
            positionY: isMobile ? -0.45 : -0.6, positionZ: isMobile ? -0.1 : -0.3,
            rotation: isMobile ? {axis: new CANNON.Vec3(0, 1, 0), angle: -Math.PI / 3} : null
        },
        {
            menuName: 'logo3', mass: 100, scale: isMobile ? 6 : 8, positionX: isMobile ? -0.1 : 0,
            positionY: isMobile ? -0.5 : -0.6, positionZ: isMobile ? 1 : 1
        },
        {
            menuName: 'work', mass: parameters.massWork, scale: isMobile ? 9 : 28,
            positionX: isMobile ? 0.05 : 0.3, positionY: isMobile ? 0.2 : 0.4, positionZ: isMobile ? 0 : -0.5,
            rotation: isMobile ? {axis: new CANNON.Vec3(1, 0, 0), angle: -Math.PI / 6} : null
        },
        {
            menuName: 'about', mass: parameters.massAbout, scale: isMobile ? 7 : 16,
            positionX: isMobile ? 0 : -1.4, positionY: 0, positionZ: isMobile ? -0.7 : 1,
            rotation: isMobile ? {axis: new CANNON.Vec3(1, 0, 0), angle: -Math.PI / 7} : null
        },
        {
            menuName: 'contact', mass: parameters.massContact, scale: isMobile ? 7 : 12,
            positionX: isMobile ? 0 : 1.5, positionY: 0, positionZ: isMobile ? 0.8 : 1.2,
            rotation: isMobile ? {axis: new CANNON.Vec3(   1, 1, 0), angle: Math.PI / 6} : null
        },
    ];

    const clock = new THREE.Clock();

    const planeShape = new CANNON.Plane();
    const yCap = isMobile ? 0.6 : 1;
    var planeYmin = new CANNON.Body({mass: 0, material: defaultContactMaterial});
    planeYmin.addShape(planeShape);
    planeYmin.quaternion.setFromAxisAngle(new CANNON.Vec3(1, 0, 0), -Math.PI / 2);
    planeYmin.position.set(0, -yCap, 0);
    cannonWorld.addBody(planeYmin);
    var planeYmax = new CANNON.Body({mass: 0, material: defaultContactMaterial});
    planeYmax.addShape(planeShape);
    planeYmax.quaternion.setFromAxisAngle(new CANNON.Vec3(1, 0, 0), Math.PI / 2);
    planeYmax.position.set(0, yCap, 0);
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

            if (['work', 'about', 'contact', 'logo1', 'logo2', 'logo3'].includes(name) && !object.constraint) {
                object.constraint = new CANNON.PointToPointConstraint(
                    body,
                    new CANNON.Vec3(0, 0, 0),
                    objects.center.body,
                    new CANNON.Vec3(object.positionX, object.positionY, object.positionZ)
                );
                cannonWorld.addConstraint(object.constraint);
            }

            if (isMobile && ['work', 'about', 'contact'].includes(name)) {
                // body.applyTorque(new CANNON.Quaternion().inverse(body.quaternion));
            } else if (['contact'].includes(name)) {
                body.applyTorque(new CANNON.Quaternion().inverse(body.quaternion));
            }
        }
    };

    let tempModel;
    const loadSequence = (sequence) => {
        const menuName = sequence[sequence.length - 1].menuName;
        if (isMobile && mobileExclude.includes(menuName)) {
            sequence.pop();
            return;
        }
        if (modelLoaded.hasOwnProperty(menuName)) {
            tempModel = modelLoaded[menuName];
        } else if (menuName.includes('eye') && modelLoaded.hasOwnProperty('eye')) {
            tempModel = modelLoaded['eye'].clone();
        } else {
            return;
        }
        const toLoad = sequence.pop();
        tempModel.scale.set(toLoad.scale, toLoad.scale, toLoad.scale);
        const {shape, offset, quaternion} = threeToCannon(tempModel, {type: ShapeType.BOX});
        const body = new CANNON.Body({
            mass: toLoad.mass,
            position: new CANNON.Vec3(-offset.x, -offset.y, -offset.z),
            material: defaultMaterial
        });
        body.addShape(shape, offset, quaternion);
        if (toLoad.rotation) {
            console.log(toLoad.rotation);
            body.quaternion.setFromAxisAngle(toLoad.rotation.axis, toLoad.rotation.angle);
        }

        cannonWorld.addBody(body);

        objects[toLoad.menuName] = {};
        objects[toLoad.menuName].mesh = tempModel;
        objects[toLoad.menuName].mesh.castShadow = true;
        objects[toLoad.menuName].mesh.receiveShadow = true;
        scene.add(tempModel);
        objects[toLoad.menuName].body = body;
        objects[toLoad.menuName].offset = offset;
        objects[toLoad.menuName].forceExpire = 0;

        if (toLoad.positionX) objects[toLoad.menuName].positionX = toLoad.positionX;
        if (toLoad.positionY) objects[toLoad.menuName].positionY = toLoad.positionY;
        if (toLoad.positionZ) objects[toLoad.menuName].positionZ = toLoad.positionZ;
        if (toLoad.floating) objects[toLoad.menuName].floating = toLoad.floating;
        if (toLoad.forces) objects[toLoad.menuName].forces = toLoad.forces;
    };

    let clicked = false;

    const draw = () => {
        const delta = clock.getDelta();

        const cannonStepTime = delta < 0.01 ? 1 / 120 : 1 / 60;
        cannonWorld.step(cannonStepTime, delta, 3);

        updatePhysics(scene, objects);
        clicked && sceneLoaded && sequence.length > 0 && loadSequence(sequence);

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