import * as THREE from 'three';
import * as Stats from "stats.js";
import Setup from "./Setup";
import Scene from "./Scene";

import {OrbitControls} from "./noDisablingEventsOrbitControls";

// ОПИСАЛ ЛОГИКУ ПЕРЕМЕЩЕНИЯ ШТАНГЕНЦИРКУЛЯ И УБРАЛ ЗАПРЕТ СОБЫТИЙ МЫШИ

//ВИДЖЕТ FPS
const STATS = new Stats();
STATS.showPanel(0);
document.body.appendChild(STATS.dom);

//СОЗДАНИЕ СЦЕНЫ
const SCENE = new Scene((scene)=>{
    scene.addLight(true);
    scene.setBackground('build/res/textures/laboratory.png');
});

//ЗАГРУЖАЕМ УСТАНОВКУ
const SETUP = new Setup(SCENE.scene)

//ИЗМЕРЕНИЕ
let measureStarted = false;
const measureTime = new THREE.Clock(false);

let timeStopped;
//РАСЧЁТ ТЕКУЩЕЙ ПОЗИЦИИ И УГЛА ПОВОРОТА ДИСКА
function measure(){
    if(measureStarted){
        let halfT = SETUP.physicalQuantities.halfT;
        let A = SETUP.physicalQuantities.A;
        let a = SETUP.physicalQuantities.a;
        let startAngle = SETUP.physicalQuantities.startAngle;
        let e = SETUP.physicalQuantities.e;
        let time = SETUP.physicalQuantities.time;
        let t = measureTime.getElapsedTime();
        let tT = (t / halfT | 0) % 2 ? halfT - (t - halfT * (t / halfT | 0)) : t - halfT * (t / halfT | 0);

        //КОЭФФИЦИЕНТ ЗАТУХАНИЯ
        let k = t - halfT > 0 ? Math.cos((t - halfT)/50) : 1;
        //---------------------
        //ПОЗИЦИЯ ДИСКА
        SETUP.disk.position.y = 15 + (A*100 - (a * tT**2 / 2 * 100)) * k;

        let rotationDirection;
        switch ((t / halfT | 0) % 4) {
            case 0:
            case 3:
                rotationDirection = true;
                break;
            case 1:
            case 2:
                rotationDirection = false;
                break;
        }
        SETUP.disk.rotation.z = (rotationDirection ? startAngle + e * tT**2 / 2 : startAngle - e * tT**2 / 2) * k;
        //ОБНОВЛЕНИЕ НИТЕЙ
        SETUP.renderThreads();
        //---------------
        //ВЫВОД ВРЕМЕНИ НА ЭКРАН
        if(!timeStopped) {
            if(t < time) {
                SETUP.SCREEN.setNumber(t);
            }else{
                SETUP.SCREEN.setNumber(time);
                timeStopped = true;
            }
        }
    }
}

let stopper;
//НАЧАЛО ЭКСПЕРИМЕНТА
function measureStart(){
    //ИЗМЕНЕНИЕ СОСТОЯНИЙ КНОПОК
    document.getElementById("changeRing").disabled = true;
    document.getElementById("sensorMoveUp").disabled = true;
    document.getElementById("sensorMoveDown").disabled = true;
    document.getElementById("measureControl").onclick = measureStop;
    document.getElementById("measureControl").textContent = "Закончить измерение";
    //РАСЧЁТ ФИЗИЧЕСКИХ ВЕЛИЧИН МАЯТНИКА (момент инерции и вес)
    SETUP.calculatePhysicalQuantities();
    //---------------------------------------------------------
    timeStopped = false;
    measureStarted = true;
    //ЗАПУСК СЕКУНДОМЕРА
    measureTime.start();
    //ОСТАНОВКА МАЯТНИКА ПОСЛЕ 3.5 ПЕРИОДОВ
    stopper = setTimeout(()=>{measureStop();}, SETUP.physicalQuantities.halfT*7000);
}

//НАЗНАЧЕНИЕ ФУНКЦИИ НАЧАЛА ЭКСПЕРИМЕНТА НА КНОПКУ
document.getElementById("measureControl").onclick = measureStart;

//ОСТАНОВКА МАЯТНИКА И ВОЗВРАЩЕНИЕ К ИСХОДНОМУ СОСТОЯНИЮ
function measureStop(){
    clearTimeout(stopper);
    measureTime.stop();
    measureStarted = false;
    SETUP.disk.position.y = SETUP.startPoint;
    SETUP.renderThreads();
    document.getElementById("changeRing").disabled = false;
    document.getElementById("sensorMoveUp").disabled = false;
    document.getElementById("sensorMoveDown").disabled = false;
    document.getElementById("measureControl").onclick = measureStart;
    document.getElementById("measureControl").textContent = "Начать измерение";
}

let controls;

function initControls() {
    controls = new OrbitControls(SCENE.camera, SCENE.renderer.domElement);
    controls.target = new THREE.Vector3(0,35,0);
    controls.enableDamping = true;
    controls.enableZoom = true;
    controls.autoRotate = false;
    controls.minDistance = 0;
    controls.maxDistance = 2500;
    controls.enablePan = true;
}
initControls();

const coordsCaliper = new THREE.Vector2();
const raycasterCaliper = new THREE.Raycaster();
let selectObject = null;
let movingCaliper = false;
let intersectsCaliper = [];
let deltaCoordsCaliperX;
let deltaCoordsCaliperY;
let oldCoordsX;
let newCoordsX;
let oldCoordsY;
let newCoordsY;

const isScreen = /Android|webOS|iPhone|iPad|iPod|BlackBerry|BB|PlayBook|IEMobile|Windows Phone|Kindle|Silk|Opera Mini/i.test(navigator.userAgent);


function moveCaliper(event) {
  if (isScreen && event.touches !== undefined) {
    coordsCaliper.x = (event.touches[0].clientX / window.innerWidth) * 2 - 1;
    coordsCaliper.y = - (event.touches[0].clientY / window.innerHeight) * 2 + 1;
  }
  else {
    coordsCaliper.x = (event.clientX / window.innerWidth) * 2 - 1;
    coordsCaliper.y = - (event.clientY / window.innerHeight) * 2 + 1;
  }

  raycasterCaliper.setFromCamera( coordsCaliper, SCENE.camera );

  if (SCENE.scene !== undefined && SCENE.scene.children.length > 8) {
    intersectsCaliper = raycasterCaliper.intersectObjects( SCENE.scene.children, true );


    if (intersectsCaliper !== undefined && intersectsCaliper[0] !== undefined && (event.which === 1 || isScreen)
    && intersectsCaliper[0].object === SCENE.scene.children[8].children[0].children[0].children[0].children[0]
    && movingCaliper === false) {
      controls.saveState();
      controls.enabled = false;
      controls.update();
      movingCaliper = true;
      if (isScreen && event.touches !== undefined) {
        oldCoordsX = event.touches[0].clientX;
        oldCoordsY = event.touches[0].clientY;
      }
      else {
        oldCoordsX = event.clientX;
        oldCoordsY = event.clientY;
      }
      selectObject = intersectsCaliper[0].object;
    }
    if (selectObject === SCENE.scene.children[8].children[0].children[0].children[0].children[0]) {

      if (isScreen && event.touches !== undefined) {
        newCoordsX = event.touches[0].clientX;
        newCoordsY = event.touches[0].clientY;
      }
      else {
        newCoordsX = event.clientX;
        newCoordsY = event.clientY;
      }
      deltaCoordsCaliperX = (oldCoordsX - newCoordsX) / 7;
      deltaCoordsCaliperY = (oldCoordsY - newCoordsY) / 7;
      SCENE.scene.children[8].position.x -= deltaCoordsCaliperX;
      SCENE.scene.children[8].position.y += deltaCoordsCaliperY;
      oldCoordsX = newCoordsX;
      oldCoordsY = newCoordsY;
    }

    if (intersectsCaliper !== undefined && intersectsCaliper[0] !== undefined && (event.which === 1 || isScreen)
      && intersectsCaliper[0].object === SCENE.scene.children[8].children[0].children[0].children[2].children[0]
      && movingCaliper === false) {
      controls.saveState();
      controls.enabled = false;
      controls.update();
      movingCaliper = true;
      if (isScreen && event.touches !== undefined) {
        oldCoordsY = event.touches[0].clientY;
      }
      else {
        oldCoordsY = event.clientY;
      }
      selectObject = intersectsCaliper[0].object;
    }
    if (selectObject === SCENE.scene.children[8].children[0].children[0].children[2].children[0] && SCENE.scene.children[8].children[0].children[0].children[2].children[0].position.x <= 7.35 && SCENE.scene.children[8].children[0].children[0].children[2].children[0].position.x >= 0) {
      if (isScreen && event.touches !== undefined) {
        newCoordsY = event.touches[0].clientY;
      }
      else {
        newCoordsY = event.clientY;
      }
      deltaCoordsCaliperY = (oldCoordsY - newCoordsY) / 18;
      SCENE.scene.children[8].children[0].children[0].children[2].children[0].position.x -= deltaCoordsCaliperY;
      if (SCENE.scene.children[8].children[0].children[0].children[2].children[0].position.x > 7.35) {
        SCENE.scene.children[8].children[0].children[0].children[2].children[0].position.x = 7.35;
      }
      if (SCENE.scene.children[8].children[0].children[0].children[2].children[0].position.x <= 0) {
        SCENE.scene.children[8].children[0].children[0].children[2].children[0].position.x = 0;
      }
      oldCoordsY = newCoordsY;
    }
  }
}

function eventStopCaliper(event) {
  if (movingCaliper === true) {
    movingCaliper = false;
    controls.reset();
    controls.enabled = true;
    controls.update();
    selectObject = null;
  }
}

window.addEventListener("mousemove", moveCaliper);
window.addEventListener("touchstart", moveCaliper);
window.addEventListener("touchmove", moveCaliper);
window.addEventListener("mouseup", eventStopCaliper);
window.addEventListener("touchend", eventStopCaliper);

//ОТРИСОВКА СЦЕНЫ
function animate() {
    SCENE.resizeRenderer();
    requestAnimationFrame(animate);
    controls.update();
    STATS.begin();
    measure();
    SCENE.renderer.render(SCENE.scene, SCENE.camera);
    STATS.end();
}
animate();
