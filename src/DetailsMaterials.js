import {MeshStandardMaterial} from "three";
import {MeshBasicMaterial} from "three";
import {DoubleSide} from "three";
import LinearScale from "./LinearScale";

//МАТЕРИАЛЫ, ИСПОЛЬЗУЕМЫЕ В УСТАНОВКЕ
//Подробнее на https://threejsfundamentals.org/threejs/lessons/ru/threejs-materials.html
//или https://threejs.org/docs/
export const Materials = {
    metal: new MeshStandardMaterial({
        color: 0xffffff,
        metalness: 1,
        roughness: 0.15
    }),
    roughMetal: new MeshStandardMaterial({
        color: 0xa1a1a1,
        metalness: 1,
        roughness: 0.35
    }),
    screen: new MeshBasicMaterial({
        side: DoubleSide
    }),
    scale: new MeshBasicMaterial({
        side: DoubleSide,
        map: new LinearScale().getTexture()
    })
};

//СООТВЕТСТВИЕ ДЕТАЛЕЙ И МАТЕРИАЛОВ
export const DetailsMaterials = {
    base: {
        pole1: Materials.metal,
        pole2: Materials.metal,
        pole3: Materials.metal,
        magnet: Materials.roughMetal,
        magnetHolder1: Materials.metal,
        magnetHolder2: Materials.metal,
        pin: Materials.roughMetal,
        gear_1: Materials.roughMetal,
        clamp1: Materials.roughMetal,
        clamp2: Materials.roughMetal,
        rulerScale: Materials.scale
    },
    disk: {
        disk: Materials.roughMetal,
        bar: Materials.metal
    },
    sensor: {
        knob: Materials.roughMetal,
        stick: Materials.metal,
        base: Materials.metal,
        screen_1: Materials.screen
    }
}
