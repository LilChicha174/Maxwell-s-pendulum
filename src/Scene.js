import * as THREE from "three";
// import {OrbitControls} from "three/examples/jsm/controls/OrbitControls";
import {Materials} from "./DetailsMaterials";

export default class Scene {
    constructor(callback = ()=>{}) {
        this.scene = new THREE.Scene();
        this.camera = new THREE.PerspectiveCamera(75, window.innerWidth/window.innerHeight, 0.1, 1000);

        //УСТАНОВКА РЕНДЕРА
        this.renderer = new THREE.WebGLRenderer();
        document.body.appendChild(this.renderer.domElement);

        //ИЗМЕНЕНИЕ ПОЗИЦИИ КАМЕРЫ
        this.camera.position.z = 75;
        this.camera.position.y = 25;

        //ДОБАВЛЕНИЕ ВОЗМОЖНОСТИ УПРАВЛЯТЬ КАМЕРОЙ
        // this.controls = new OrbitControls( this.camera, this.renderer.domElement );
        // this.controls.target = new THREE.Vector3(0,35,0);

        callback(this);
    }

    //ДОБАВЛЕНИЕ СВЕТА НА СЦЕНУ
    addLight(helper = false){
        //ДОБАВЛЯЕМ СВЕТ
        const directionalLight = new THREE.DirectionalLight( 0xffffff, 0.5 );
        this.scene.add( directionalLight );
        this.pointl = new THREE.PointLight(0xffffff, 1.5, 40);
        this.pointl.position.set(7,40,25);
        this.scene.add(this.pointl);
        //-------------------сетка, показывающая расположение точечного источника света-----------------
        this.lightHelper = new THREE.PointLightHelper(this.pointl);
        this.scene.add(this.lightHelper);
        //----------------------------------------------------------------------------------------------
    }
    //ИЗМЕНЕНИЕ ФОНА СЦЕНЫ
    setBackground(URL){
        let textureLoader = new THREE.TextureLoader();
        let background = textureLoader.load(URL, ()=>{
                const rt = new THREE.WebGLCubeRenderTarget(background.image.height);
                rt.fromEquirectangularTexture(this.renderer, background);
                this.scene.background = rt;
                for(let material in Materials){
                    if(Materials[material].metalness) {
                        Materials[material].envMap = rt.texture;
                    }
                }
            }
        );
    }
    //ИЗМЕНЕНИЕ РАЗМЕРА ОКНА РЕНДЕРА (используется при изменении размера окна браузера)
    resizeRenderer(){
        let canvas = this.renderer.domElement;
        let pixelRatio = window.devicePixelRatio;
        let width  = canvas.clientWidth  * pixelRatio | 0;
        let height = canvas.clientHeight * pixelRatio | 0;
        if (canvas.width !== width || canvas.height !== height) {
            this.renderer.setSize(width, height, false);
            const canvas = this.renderer.domElement;
            this.camera.aspect = canvas.clientWidth / canvas.clientHeight;
            this.camera.updateProjectionMatrix();
        }
    }

}
