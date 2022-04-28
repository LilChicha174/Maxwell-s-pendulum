import {CanvasTexture} from "three";
import {Materials} from "./DetailsMaterials";

export default class SensorScreen{
    //СОЗДАНИЕ ТЕКСТУРЫ ДИСПЛЕЯ ДАТЧИКА
    constructor(){
        this.ctx = document.createElement('canvas').getContext('2d');
        this.ctx.canvas.width = 500;
        this.ctx.canvas.height = 200;
        this.texture = new CanvasTexture(this.ctx.canvas);
        this.setNumber(0);
        Materials.screen.map = this.texture;
    }

    //ОТОБРАЗИТЬ ДРОБНОЕ ЧИСЛО НА ДИСПЛЕЕ ДАТЧИКА В ФОРМАТЕ XX.XX
    setNumber(num) {
        this.ctx.fillStyle = '#000000';
        this.ctx.fillRect(0, 0, this.ctx.canvas.width, this.ctx.canvas.height);
        let number = num.toFixed(2).toString();
        while (number.length < 5) number = "0" + number;
        this.ctx.font = "150px Digital-7";
        this.ctx.fillStyle = '#820000';
        this.ctx.textAlign = "center";
        this.ctx.fillText(number, 250, 150);
        this.texture.needsUpdate = true;
    }
}