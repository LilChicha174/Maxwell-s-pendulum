import * as THREE from "three";
import {GLTFLoader} from "three/examples/jsm/loaders/GLTFLoader";
import {LineBasicMaterial, Vector3, BufferGeometry, Line, MathUtils} from "three";
import setupConfig from 'json5-loader!../build/res/setup/setupInfo.json5';
import {DetailsMaterials} from "./DetailsMaterials";
import SensorScreen from "./SensorScreen";

// import {Materials} from "./Scene";

// ДОБАВИЛ ШТАНГЕНЦИРКУЛЬ И ИЗМЕНИЛ ШАГ СЕНСОРА 

//ОПРЕДЕЛЕНИЕ УСКОРЕНИЯ СВОБОДНОГО ПАДЕНИЯ
const g = 9.81;

export default class Setup{
    //ЗАГРУЗКА ОСНОВНЫХ ЧАСТЕЙ ЛАБОРАТОРНОЙ УСТАНОВКИ
    constructor(scene, callback = ()=>{}) {
        this.scene = scene;
        //ЗАГРУЗКА ОСНОВАНИЯ ЛАБОРАТОРНОЙ УСТАНОВКИ
        this.loadModel(this.scene,'build/res/setup/base.glb', DetailsMaterials.base, (gltf)=>{
            //ФИКС ШКАЛЫ ЛИНЕЙКИ
            gltf.scene.traverse((child)=>{
                if(child.name === "rulerScale"){
                    child.rotateX(MathUtils.degToRad(180));
                }
            });
        });
        //ЗАГРУЗКА ДИСКА И КОЛЕЦ
        this.loadModel(this.scene,'build/res/setup/disk.glb', DetailsMaterials.disk, (gltf)=>{
            this.disk = gltf.scene;
            this.disk.traverse((child)=>{
                if(child.name === "ringBig"){
                    child.visible = false;
                }
            });
            this.disk.rotateY(MathUtils.degToRad(90));
            this.startPoint = (setupConfig.base.maximum - setupConfig.disk.ringSmall.outerRadius) * 100;
            this.disk.position.setY(this.startPoint);
            //ДОБАВЛЯЕМ НИТИ
            const points1 = [];
            const points2 = [];
            const material = new LineBasicMaterial({color: 0x000000, linewidth: 3});
            points1.push( new Vector3( -10, 70, 0 ) );
            points1.push( new Vector3( -10, this.disk.position.y, 0 ) );
            const geometry1 = new BufferGeometry().setFromPoints( points1 );
            this.line1 = new Line( geometry1, material );
            this.line1.geometry.dynamic = true;
            this.scene.add( this.line1 );
            points2.push( new Vector3( 10, 70, 0 ) );
            points2.push( new Vector3( 10, this.disk.position.y, 0 ) );
            const geometry2 = new BufferGeometry().setFromPoints( points2 );
            this.line2 = new Line( geometry2, material );
            this.line2.geometry.dynamic = true;
            this.scene.add( this.line2 );
            //ПРИСВАИВАЕМ КНОПКЕ ФУНКЦИЮ СМЕНЫ КОЛЬЦА
            this.changeRing = ()=>{
                this.disk.traverse((child)=>{
                    if(child.name === "ringBig"){
                        child.visible = !child.visible;
                        if(child.visible){
                            this.startPoint = (setupConfig.base.maximum - setupConfig.disk.ringBig.outerRadius) * 100;
                        }
                    }
                    if(child.name === "ringSmall"){
                        child.visible = !child.visible;
                        if(child.visible){
                            this.startPoint = (setupConfig.base.maximum - setupConfig.disk.ringSmall.outerRadius) * 100;
                        }
                    }
                });
                this.disk.position.setY(this.startPoint);
                this.renderThreads();
            }
            document.getElementById("changeRing").onclick = this.changeRing;
        });
        //ЗАГРУЗКА ДАТЧИКА
        this.loadModel(this.scene,'build/res/setup/sensor.glb', DetailsMaterials.sensor, (gltf)=>{
            this.sensor = gltf.scene;
            this.sensor.position.set(-20, 20, 0);
            this.sensor.position.y = gltf.scene.position.y;
            document.getElementById("sensorMoveUp").onclick = ()=>{
                if(this.sensor.position.y < 45) {
                    this.sensor.position.y += 0.1;
                }
            };
            document.getElementById("sensorMoveDown").onclick = ()=>{
                if(this.sensor.position.y > 15) {
                    this.sensor.position.y -= 0.1;
                }
            };
        });
        //ЗАГРУЗКА ШТАНГЕНЦИРКУЛЯ

        this.loadModel(this.scene,'build/res/setup/caliper/scene.gltf', DetailsMaterials.sensor, (gltf)=>{
            this.caliper = gltf.scene;
            this.caliper.scale.set(3, 3, 3);

            this.caliper.position.set(12, 2.5, 12);

            const baseCaliperMap = this.caliper.children[0].children[0].children[0].children[0].material.map;
            const movableFrameMap = this.caliper.children[0].children[0].children[2].children[0].material.map;

            this.caliper.children[0].children[0].children[0].children[0].material = new THREE.MeshBasicMaterial({
              map: baseCaliperMap
            });
            this.caliper.children[0].children[0].children[2].children[0].material = new THREE.MeshBasicMaterial({
              map: movableFrameMap,
              color: 0xbbbbbb
            });

            document.getElementById("rotateCaliper").onclick = ()=>{
                if(this.caliper.rotation.z === -Math.PI/2) {
                    this.caliper.rotation.z = 0;
                    this.caliper.rotation.y = 0;
                    this.caliper.position.z = 0;
                }
                else {
                    this.caliper.rotation.z = -Math.PI/2;
                    this.caliper.rotation.y = -Math.PI/2;
                    this.caliper.position.z = 0;
                }
            };
        });

        //СОЗДАНИЕ ЭКРАНА ДАТЧИКА (СЕКУНДОМЕРА)
        this.SCREEN = new SensorScreen();
        //РАСЧЁТ ОСНОВНЫХ ФИЗИЧЕСКИХ ВЕЛИЧИН ПРИ ЗАГРУЗКЕ УСТАНОВКИ
        this.calculateBasicQuantities();
        //---------------------------------------------------------
        eval(callback());
    }

    //ЗАГРУЗКА МОДЕЛИ ИЗ ФАЙЛА GLTF/GLB
    loadModel (scene, url, materials, callback = ()=>{}){
        let loader = new GLTFLoader();
        loader.load( url, function ( gltf ) {
            gltf.scene.traverse((detail)=>{
                if(detail.type === "Mesh"){
                    if(detail.name in materials){
                        detail.material = materials[detail.name];
                    }
                }
            });
            scene.add( gltf.scene );
            try {
                callback(gltf);
            }
            catch (e) {
                console.error("Не удалось выполнить callback", e);
            }
            return true;
        }, undefined, function ( e ) {
            console.error("Не удалось загрузить \"" + url + "\" на сцену", e);
            return false;
        } );
    }

    //ПЕРВИЧНЫЙ РАСЧЁТ ОСНОВНЫХ ФИЗИЧЕСКИХ ВЕЛИЧИН
    calculateBasicQuantities(){
        let holeWeight = setupConfig.disk.disk.weightWithoutHoles * setupConfig.disk.disk.holes.radius**2 / setupConfig.disk.disk.radius;
        this.basicQuantities = {
            //РАСЧЁТ МАССЫ ДИСКА БЕЗ КОЛЕЦ
            weightWithoutRings: setupConfig.disk.pole.weight + setupConfig.disk.disk.weightWithoutHoles - holeWeight * 6,
            //РАСЧЁТ МОМЕНТА ИНЕРЦИИ ДИСКА БЕЗ КОЛЕЦ
            momentOfInertiaWithoutRings:
                setupConfig.disk.pole.radius**2 * setupConfig.disk.pole.weight / 2
                + setupConfig.disk.disk.radius**2 * setupConfig.disk.disk.weightWithoutHoles / 2
                - (setupConfig.disk.disk.holes.radius**2 * holeWeight / 2 + holeWeight * setupConfig.disk.disk.holes.distanceFromCenter**2) * 6
        }
    }

    //РАСЧЁТ ФИЗИЧЕСКИХ ВЕЛИЧИН ПЕРЕД НАЧАЛОМ ЭКМПЕРИМЕНТА
    calculatePhysicalQuantities(){
        //СУММИРОВАНИЕ МОМЕНТА ИНЕРЦИИ И МАССЫ ДИСКА И ТЕКУЩЕГО КОЛЬЦА
        this.physicalQuantities = {
            m: this.basicQuantities.weightWithoutRings,
            I: this.basicQuantities.momentOfInertiaWithoutRings
        }
        this.disk.traverse((child)=>{
            if(child.name === "ringSmall"){
                if(child.visible){
                    this.physicalQuantities.I += setupConfig.disk.ringSmall.weight * (setupConfig.disk.ringSmall.innerRadius**2 + setupConfig.disk.ringSmall.outerRadius**2) / 2;
                    this.physicalQuantities.m += setupConfig.disk.ringSmall.weight;
                }
            }
            if(child.name === "ringBig"){
                if(child.visible){
                    this.physicalQuantities.I += setupConfig.disk.ringBig.weight * (setupConfig.disk.ringBig.innerRadius**2 + setupConfig.disk.ringBig.outerRadius**2) / 2;
                    this.physicalQuantities.m += setupConfig.disk.ringBig.weight;
                }
            }
        });
        //ЛИНЕЙНОЕ УСКОРЕНИЕ
        this.physicalQuantities.a = this.physicalQuantities.m * g * setupConfig.disk.pole.radius**2 / (this.physicalQuantities.m * setupConfig.disk.pole.radius**2 + this.physicalQuantities.I);
        //УГЛОВОЕ УСКОРЕНИЕ
        this.physicalQuantities.e = this.physicalQuantities.a / setupConfig.disk.pole.radius;
        //АМПЛИТУДА
        this.physicalQuantities.A = (45 - (setupConfig.base.maximum * 100 - this.startPoint))/100
        //ПОЛОВИНА ПЕРИОДА
        this.physicalQuantities.halfT = Math.sqrt(2 * this.physicalQuantities.A / this.physicalQuantities.a);
        //НАЧАЛЬНЫЙ УГОЛ
        //расчитывается таким образом, чтобы в нижней точке угол был равен 0
        //для того, чтобы, при изменении направления в верхней точке, не сбивалась анимация
        this.physicalQuantities.startAngle = this.physicalQuantities.A / setupConfig.disk.pole.radius;
        //ВРЕМЯ НА КОТОРОМ СЕКУНДОМЕР ДОЛЖЕН ОСТАНОВИТЬСЯ
        this.physicalQuantities.time = Math.sqrt(2 * (this.startPoint - this.sensor.position.y)/100 / this.physicalQuantities.a);
    }

    //СМЕНА КОЛЬЦА
    //определение функции находится в конструкторе класса
    changeRing(){}

    //ОТРИСОВКА НИТЕЙ ДЛЯ ТЕКУЩЕГО ПОЛОЖЕНИЯ ДИСКА
    renderThreads(){
        this.line1.geometry.attributes.position.setY( 1, this.disk.position.y );
        this.line1.geometry.attributes.position.needsUpdate = true;
        this.line2.geometry.attributes.position.setY( 1, this.disk.position.y );
        this.line2.geometry.attributes.position.needsUpdate = true;
    }
}
