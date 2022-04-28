import * as THREE from "three";

// ДОБАВИЛ МИЛЛИМЕТРЫ АЛЕКСАНДР МАЛЬКОВ

export default class LinearScale{
    //ОТРИСОВКА ШКАЛЫ ЛИНЕЙКИ
    constructor() {
        this.ctx = document.createElement('canvas').getContext('2d');
        this.ctx.canvas.width = 160;
        this.ctx.canvas.height = 2320;

        this.ctx.fillStyle = '#edb41a';
        this.ctx.fillRect(0, 0, this.ctx.canvas.width, this.ctx.canvas.height);

        this.ctx.fillStyle = '#000';

        for(let i = 157; i < 2160; i += 200){
            this.ctx.fillRect(160-95, i, 95, 6);
        }

        for(let i = 158; i < 2160; i += 40){
            this.ctx.fillRect(160-70, i, 70, 4);
        }

        for(let i = 158; i < 2160; i += 4){
            this.ctx.fillRect(160-35, i, 35, 0.7);
        }

        this.ctx.font = "40px Open Sans";
        for(let i = 175; i < 1900; i += 200){
            this.ctx.fillText( ""+(54-(i-15)/40), 10, i);
        }
        this.ctx.fillText("5", 34, 1960+15);
        this.ctx.fillText("0", 34, 2160+15);

        this.texture = new THREE.CanvasTexture(this.ctx.canvas);
    }

    getTexture(){
        return this.texture;
    }
}
