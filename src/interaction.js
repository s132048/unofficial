import { isMobile } from "react-device-detect";

import * as THREE from 'three';
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader";
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';

import * as CANNON from 'cannon-es';
import CannonDebugger from 'cannon-es-debugger';

import * as dat from 'dat.gui';

import { ShapeType, threeToCannon } from "three-to-cannon";

import about from './about.glb';
import contact from './contact.glb';
import eye from './eye.glb';
import logo from './logo.glb';
import logo1 from './logo1.glb';
import logo2 from './logo2.glb';
import logo3 from './logo3.glb';
import work from './work.glb';

export const mainInteraction = () => {
    const canvas = document.querySelector('#three-canvas');
    // antialias 꼭 넣어야 하나?
    const renderer = new THREE.WebGLRenderer({canvas, alpha: true, antialias: true});
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(window.devicePixelRatio > 1 ? 2 : 1);

    // init
    const scene = new THREE.Scene();

    // 카메라
    const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.y = isMobile ? 2 : 3;
    scene.add(camera);

    // 조명
    const ambientLight = new THREE.AmbientLight('white', 1);
    scene.add(ambientLight);
    const directionalLight = new THREE.DirectionalLight('white', 1);
    directionalLight.position.y = 1000;
    directionalLight.castShadow = true;
    scene.add(directionalLight);

    // 컨트롤
    const controls = new OrbitControls(camera, renderer.domElement);

    // gui
    const gui = new dat.GUI();
    let parameters = {
        decay: 0.8,
        force: isMobile ? 10 : 80
    }
    gui.add(parameters, 'decay').min(0).max(1).step(0.01);
    gui.add(parameters, 'force').min(0).max(10000).step(1);


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
        {menuName: 'eye', asset: eye, scale: 8, floating: true, mass: 40, forces: [new CANNON.Vec3(Math.random() - 0.5,Math.random() - 0.5,Math.random() - 0.5).scale(1000)]},
        {menuName: 'eye2', asset: eye, scale: 16, floating: true, mass: 40, forces: [new CANNON.Vec3(Math.random() - 0.5,Math.random() - 0.5,Math.random() - 0.5).scale(1000)]},
        {menuName: 'eye3', asset: eye, scale: 40, floating: true, mass: 40, forces: [new CANNON.Vec3(Math.random() - 0.5,Math.random() - 0.5,Math.random() - 0.5).scale(1000)]},
        {menuName: 'floating1', asset: logo1, scale: isMobile ? 2 : 4, floating: true, mass: isMobile ? 1000: 40, forces: [new CANNON.Vec3(2,2,-3).scale(200)]},
        {menuName: 'floating2', asset: logo2, scale: isMobile ? 6 : 10, floating: true, mass: isMobile ? 1000: 40, forces: [new CANNON.Vec3(-3,4,3).scale(160)]},
        {menuName: 'floating3', asset: logo3, scale: isMobile ? 2 : 4, floating: true, mass: isMobile ? 1000: 40, forces: [new CANNON.Vec3(-4,-2,-3).scale(150)]},
        // mass 최적인가?
        {menuName: 'work', asset: work, mass: 1, scale: isMobile ? 8 : 22, positionX: isMobile ? 0.2 : 0.3, positionZ: isMobile ? -0.8 : -0.8},
        {menuName: 'about', asset: about, mass: 1, scale: isMobile ? 8 : 12, positionX: isMobile ? 0 : -1.8, positionZ: isMobile ? 0.8 : 0.6},
        {menuName: 'contact', asset: contact, mass: 1, scale: isMobile ? 7 : 11, positionX: isMobile ? -0 : 1.5, positionZ: isMobile ? 0 : 0.8},
    ];

    const clock = new THREE.Clock();

    const planeShape = new CANNON.Plane();
    const yCap = isMobile ? 0.2 : 0.8;
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

    const updatePhysics = (scene, objects) => {
        // TODO: 실린더로 바꾸기 / 모바일 값 정하기
        const xCap = isMobile ? 0.15 : 2.2;
        const rCap = 0.4;
        const zCap = 1.4;
        const decay = parameters.decay;
        for (const [name, object] of Object.entries(objects)) {
            const {body, mesh} = object;
            if (!mesh || !body) {
                continue;
            }
            mesh.position.copy(body.position);
            mesh.quaternion.copy(body.quaternion);

            let {x, y, z} = mesh.position;
            if (x + object.offset.x > xCap - y) {
                body.velocity.x = -Math.abs(body.velocity.x);
                if (object.force) object.force.x = -Math.abs(object.force.x);
            } else if (x - object.offset.x < -xCap + y) {
                body.velocity.x = Math.abs(body.velocity.x);
                if (object.force) object.force.x = Math.abs(object.force.x);
            }
            if (z + object.offset.z > zCap - y * 0.9) {
                body.velocity.z = -Math.abs(body.velocity.z);
                if (object.force) object.force.z = -Math.abs(object.force.z);
            } else if (z - object.offset.z < -zCap + y * 0.9) {
                body.velocity.z = Math.abs(body.velocity.z);
                if (object.force) object.force.z = Math.abs(object.force.z);
            }

            // floating일 때 스프링 붙이는 거 생략함
            // TODO: 힘 넣어주기
            if (object.body) {
                const randomTime = Math.random();
                if (object.floating && randomTime > 0.8 && clock.elapsedTime >= object.forceExpire) {
                    const currentTime = clock.elapsedTime + 10;
                    object.forceExpire = currentTime + 10;
                    object.force = new CANNON.Vec3(body.position.x, -body.position.y, body.position.z);
                    // object.torque = new CANNON.Vec3(body.position.x, body.position.y, body.position.z);
                }
                if (object.forceExpire && clock.elapsedTime <= object.forceExpire) {
                    let force = object.force;
                    force.normalize();
                    force = force.scale(800);
                    body.applyForce(force, new CANNON.Vec3(0, 0, 0));
                    let torque = body.angularVelocity;
                    torque.normalize();
                    torque = torque.scale(20);
                    body.applyTorque(torque);
                }
                body.velocity.x *= decay;
                body.velocity.y *= decay;
                body.velocity.z *= decay;
                body.angularVelocity.x *= decay;
                body.angularVelocity.y *= decay;
                body.angularVelocity.z *= decay;
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

            if (['work', 'about', 'contact'].includes(name) && !object.constraint) {
                object.constraint = new CANNON.PointToPointConstraint(
                    body,
                    new CANNON.Vec3(0, 0, 0),
                    objects.center.body,
                    new CANNON.Vec3(object.positionX, 0, object.positionZ)
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
            if (toLoad.menuName === 'eye') body.quaternion.set(Math.PI, 0, 0, 0);
            cannonWorld.addBody(body);

            objects[toLoad.menuName] = {};
            objects[toLoad.menuName].mesh = gltf.scene.children[0];
            scene.add(gltf.scene.children[0]);
            objects[toLoad.menuName].body = body;
            objects[toLoad.menuName].offset = offset;
            objects[toLoad.menuName].forceExpire = 0;

            if (toLoad.positionX) objects[toLoad.menuName].positionX = toLoad.positionX;
            if (toLoad.positionZ) objects[toLoad.menuName].positionZ = toLoad.positionZ;
            if (toLoad.floating) objects[toLoad.menuName].floating = toLoad.floating;
            if (toLoad.forces) objects[toLoad.menuName].forces = toLoad.forces;
        });
    };

    let prevTime = clock.elapsedTime;
    let clicked = false;

    const draw = () => {
        const delta = clock.getDelta();

        const cannonStepTime = delta < 0.01 ? 1 / 120 : 1 / 60;
        cannonWorld.step(cannonStepTime, delta, 3);

        updatePhysics(scene, objects);
        // 시퀀스 속도 정해보기
        // if (sequence.length > 0 && clock.elapsedTime - prevTime > 0.1) {
        prevTime = clock.elapsedTime;
        clicked && sequence.length > 0 && loadSequence(sequence);
        // }

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