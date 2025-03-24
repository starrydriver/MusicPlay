import {Application, Graphics, Container,Sprite, Assets ,Texture,Particle, ParticleContainer,Filter, TextureSource, type ParticleOptions} from 'pixi.js';
import { GlowFilter } from 'pixi-filters';
// 画布管理类
class CanvasManager {
    public app: Application;
    public container: Container;
    //粒子变量
    private textureLoad!:TextureSource<any>;
    public texture!: Texture;
    // 星空效果相关变量
    private starTexture: any;
    private starAmount = 1000;
    private stars: { sprite: Sprite; z: number; x: number; y: number }[] = [];
    private cameraZ = 0;
    private fov = 20;
    private baseSpeed = 0.025; // 恒定速度
    private starStretch = 5;
    private starBaseSize = 0.05;

    constructor() {
        this.app = new Application();
        this.container = new Container();
        // 粒子效果
    }
    // 初始化画布
    public async init(): Promise<void> {
        await this.app.init({
            background: '#3c3c6d', // 背景
            resizeTo: window,      // 自动调整大小
        });
        // 将 Canvas 添加到页面
        document.getElementById('musicGame')!.appendChild(this.app.canvas);
        // 将容器添加到舞台
        this.app.stage.addChild(this.container);
        this.app.stage.interactive = true;
        this.app.stage.hitArea = this.app.screen;
        // 加载粒子纹理
        this.textureLoad = await Assets.load('/images/barParticle.svg');
        this.texture = new Texture(this.textureLoad);
        // 加载星星纹理
        this.starTexture = await Assets.load('https://pixijs.com/assets/star.png');
        // 初始化星空效果
        this.initStars();
        this.startAnimation();
                // this.app.ticker.add(() => {
                //     container.update();
                //     particles.forEach(particle => {
                //         // 持续施加扩散力
                //         particle.x += Math.cos(particle.angle) * particle.speed;
                //         particle.y += Math.sin(particle.angle) * particle.speed;
                //         // 施加下落加速度
                //         particle.speed *= 0.98;      // 速度衰减（空气阻力）
                //         particle.y += particle.gravity;  // 下落速度递增
                //         particle.gravity *= 1.02;    // 重力逐渐增强
                //         if (particle.y > this.app.screen.height + 100 || particle.speed < 0.1) {
                //             // 粒子超出屏幕范围或速度小于0.1，则移除粒子
                //             container.removeParticle(particle);
                //             particles.splice(particles.indexOf(particle), 1);
                //             console.log('粒子数量：', particles.length);
                //         }
                //     });
                // });
    }
    // 初始化星星
    private initStars(): void {
        for (let i = 0; i < this.starAmount; i++) {
            const star = {
                sprite: new Sprite(this.starTexture),
                z: 0,
                x: 0,
                y: 0,
            };
            star.sprite.anchor.set(0.5, 0.7);
            this.randomizeStar(star, true);
            this.container.addChild(star.sprite);
            this.stars.push(star);
        }
    }
    // 随机化星星位置
    private randomizeStar(star: { z: number; x: number; y: number }, initial: boolean): void {
        star.z = initial ? Math.random() * 2000 : this.cameraZ + Math.random() * 1000 + 2000;

        const deg = Math.random() * Math.PI * 2;
        const distance = Math.random() * 50 + 1;

        star.x = Math.cos(deg) * distance;
        star.y = Math.sin(deg) * distance;
    }
    // 启动动画
    private startAnimation(): void {
        // 动画循环
        this.app.ticker.add((time) => {
            // 恒定速度移动
            this.cameraZ += time.deltaTime * 10 * this.baseSpeed;
            // 更新星星位置
            for (let i = 0; i < this.starAmount; i++) {
                const star = this.stars[i];
                // 如果星星超出摄像机范围，重新随机化位置
                if (star.z < this.cameraZ) this.randomizeStar(star, false);
                // 透视投影：将 3D 坐标映射到 2D 屏幕
                const z = star.z - this.cameraZ;
                star.sprite.x = star.x * (this.fov / z) * this.app.renderer.screen.width + this.app.renderer.screen.width / 2;
                star.sprite.y = star.y * (this.fov / z) * this.app.renderer.screen.width + this.app.renderer.screen.height / 2;
                // 计算星星的缩放和旋转
                const dxCenter = star.sprite.x - this.app.renderer.screen.width / 2;
                const dyCenter = star.sprite.y - this.app.renderer.screen.height / 2;
                const distanceCenter = Math.sqrt(dxCenter * dxCenter + dyCenter * dyCenter);
                const distanceScale = Math.max(0, (2000 - z) / 2000);
                // 设置星星的大小
                star.sprite.scale.x = distanceScale * this.starBaseSize;
                star.sprite.scale.y = distanceScale * this.starBaseSize
                    + (distanceScale * this.baseSpeed * this.starStretch * distanceCenter) / this.app.renderer.screen.width;
                // 设置星星的旋转（朝向屏幕中心）
                star.sprite.rotation = Math.atan2(dyCenter, dxCenter) + Math.PI / 2;
            }
        });
    }
}
//触发虚线类
class DashedLine {
	private app: Application;
	private container: Container;
	public dashedLine: Sprite;
	private canvas: HTMLCanvasElement;
	public dashedLineCanvas: CanvasRenderingContext2D;
	constructor(app: Application, container: Container) {
		this.app = app;
		this.container = container;
		this.canvas = document.createElement('canvas');
		this.canvas.width = window.innerWidth;
		this.canvas.height = window.innerHeight;
		this.dashedLineCanvas = this.canvas.getContext('2d')!;
		this.dashedLine = new Sprite();
		this.container.addChild(this.dashedLine); // 将音乐框添加到容器
		// 初始化音乐框
		this.updateDashedLine();
		// 监听窗口大小变化
		window.addEventListener('resize', () => this.updateDashedLine());
	}
	   // 更新触发线的样式
    private updateDashedLine(): void {
        const dpr = window.devicePixelRatio || 1;
        const windowWidth = window.innerWidth * dpr;
        const windowHeight = window.innerHeight * dpr;
        // 动态调整 canvas 大小
        this.canvas.width = windowWidth;
        this.canvas.height = windowHeight;
        this.canvas.style.width = `${window.innerWidth}px`;
        this.canvas.style.height = `${window.innerHeight}px`;
        this.dashedLineCanvas.scale(dpr, dpr);
        // 清空画布
        this.dashedLineCanvas.clearRect(0, 0, windowWidth, windowHeight);
        // 设置虚线样式
        this.dashedLineCanvas.setLineDash([windowWidth * 0.01, windowWidth * 0.005]); // 虚线长度为 10，间隔为 5
        this.dashedLineCanvas.lineWidth = 2; // 线条宽度
        this.dashedLineCanvas.strokeStyle = '#ffffff'; // 线条颜色
        // 绘制虚线
        this.dashedLineCanvas.beginPath();
        this.dashedLineCanvas.moveTo(0, windowHeight * 0.5); // 起点
        this.dashedLineCanvas.lineTo(windowWidth, windowHeight * 0.5); // 终点
        this.dashedLineCanvas.stroke();
        // 更新纹理
        const texture = Texture.from(this.canvas);
        this.dashedLine.texture = texture; // 更新 Sprite 的纹理
        this.dashedLine.width = window.innerWidth;
        this.dashedLine.height = window.innerHeight;
        // 创建发光滤镜
        const glowFilter = new GlowFilter({
            distance: 10, // 发光距离
            outerStrength: 2, // 外部发光强度
            innerStrength: 0, // 内部发光强度
            color: 0xf9c54e, // 发光颜色（黄色）
            quality: 0.5, // 质量
        });
        // 将滤镜应用到虚线
        this.dashedLine.filters = [glowFilter];
    }
}
// 触发线类
class TriggerLine {
    private app: Application;
    private container: Container;
    public line: Graphics; // 触发线图形
    constructor(app: Application, container: Container) {
        this.app = app;
        this.container = container;
        this.line = new Graphics();
        this.container.addChild(this.line); // 将触发线添加到容器
        // 初始化触发线
        this.updateTriggerLine();
        // 监听窗口大小变化
        window.addEventListener('resize', () => this.updateTriggerLine());
    }
       // 更新触发线的样式
    private updateTriggerLine(): void {
        const windowWidth = window.innerWidth; // 窗口宽度
        const windowHeight = window.innerHeight; // 窗口高度
        // 设置触发线的宽度为窗口宽度的 80%，高度为窗口高度的 2%
        const lineWidth = windowWidth * 0.5;
        const lineHeight = windowHeight * 0.01;
        // 设置触发线的位置为窗口底部附近
        const lineX = (windowWidth - lineWidth) / 2; // 水平居中
        const lineY = windowHeight * 0.8; // 距离窗口底部 10%
        // 清空之前的图形
        this.line.clear();
        // 重新绘制触发线
        this.line.fill(0xf9c54e); // 黄色
        this.line.roundRect(0, 0, lineWidth, lineHeight,5); // 绘制矩形
        this.line.fill();
        // 创建发光滤镜
        const glowFilter = new GlowFilter({
            distance: 10, // 发光距离
            outerStrength: 2, // 外部发光强度
            innerStrength: 0, // 内部发光强度
            color: 0xf9c54e, // 发光颜色（黄色）
            quality: 0.5, // 质量
        });
        // 将滤镜应用到触发线
        this.line.filters = [glowFilter];
        // 设置触发线的位置
        this.line.x = lineX;
        this.line.y = lineY;
    }
}
//触发区类
class TriggerArea {
	public AreaY:number;
	public triggerArray: NoteBar[];
	constructor(y:number){
		this.AreaY = y;
		this.triggerArray = [];
	}
    public init():void{
        console.log('初始化触发区');
    }
    //触发区数组
    public addTrigger(bar:NoteBar):void{
        if (bar.bar.y > this.AreaY && this.triggerArray.includes(bar) === false) {
            this.triggerArray.push(bar); // 将音符添加到数组
            //console.log('barY:', bar.bar.y+",AreaY:",this.AreaY);
            //console.log('音符注入数组');
        }
    }
}
//粒子类
class newparticle extends Particle {
    public speed: number =  2 + Math.random() * 3;
    public gravity: number = 0.5;
    public angle = Math.random() * Math.PI * 2;
    constructor(options: Texture<TextureSource<any>> | ParticleOptions) {
        super(options);
    }
    
}
// 音符类
class NoteBar {
    private app: Application;
    private container: Container;
    public bar: Graphics; // 长条图形
    private speed: number; // 下落速度
    public noteType: string; // 音符类型
    public isAdd: boolean; // 是否添加到过触发区
    private particles: newparticle[] = [];
    private particleContainer: ParticleContainer= new ParticleContainer();
    private barTexture: Texture<TextureSource<any>>;
    
    constructor(app: Application, container: Container, x: number, speed: number,type:string,barTexture:Texture<TextureSource<any>>) {
        this.app = app;
        this.container = container;
        this.speed = speed;
        this.noteType = type;
        this.isAdd = false;
        // 创建长条图形
        this.bar = new Graphics();
        // 将长条添加到容器
        this.container.addChild(this.bar);
        // 初始化长条
        this.updateSize(x);
        window.addEventListener('resize', () => this.updateSize(x));
        //粒子
        this.barTexture = barTexture;
    }
    //更新样式
    public updateSize(x: number): void {
        const windowWidth = window.innerWidth; // 窗口宽度
        const windowHeight = window.innerHeight; // 窗口高度
        const barWidth = windowWidth * 0.08;
        const barHeight = windowHeight * 0.02;
        this.bar.fill(0x83e368); // 绿色
        this.bar.roundRect(0, 0, barWidth, barHeight,10);
        this.bar.fill();
        // 创建发光滤镜
        const glowFilter = new GlowFilter({
            distance: 20, // 发光距离
            outerStrength: 2, // 外部发光强度
            innerStrength: 1, // 内部发光强度
            color: 0xcff9b1, // 发光颜色（绿色）
            quality: 0.5, // 质量
        });
        // 将滤镜应用到触发线
        this.bar.filters = [glowFilter];
        this.bar.x = x; // 设置初始 x 位置
        this.bar.y = -200; // 从屏幕顶部开始
    }
    // 更新音符位置
    public update(delta: number,border:number,array:NoteBar[]): void {
        this.bar.y += this.speed * delta; // 根据速度下落
        // 如果音符超出屏幕，移除它
        if (this.bar.y > border) {
            this.container.removeChild(this.bar);
            array.splice(array.indexOf(this), 1); // 从数组中移除
            this.bar.destroy(); // 销毁图形
            console.log('音符消失!');
        }
        else if (this.isAdd == true) {
            this.container.removeChild(this.bar);
            array.splice(array.indexOf(this), 1); // 从数组中移除
            this.particlePlay();
            this.bar.destroy(); // 销毁图形
            console.log('节拍触发!');
        }
    }
    public particlePlay():void{
        this.container.addChild(this.particleContainer);
        for (let i = 0; i < 50; i++) {
            const particle = new newparticle({
                texture: this.barTexture,
                x: this.bar.x,
                y: this.bar.y,
                tint: 0xf3f9fc,
                scaleX: 0.1,
                scaleY: 0.1,
                alpha: 0.95,
            });
            this.particleContainer.addParticle(particle);
            this.particles.push(particle);
        }
        this.app.ticker.add(() => {
            this.particleContainer.update();
            this.particles.forEach(particle => {
                // 持续施加扩散力
                particle.x += Math.cos(particle.angle) * particle.speed;
                particle.y += Math.sin(particle.angle) * particle.speed;
                // 施加下落加速度
                particle.speed *= 0.98;      // 速度衰减（空气阻力）
                particle.y += particle.gravity;  // 下落速度递增
                particle.gravity *= 1.02;    // 重力逐渐增强
                if (particle.y > this.app.screen.height + 100 || particle.speed < 0.1) {
                    // 粒子超出屏幕范围或速度小于0.1，则移除粒子
                    this.particleContainer.removeParticle(particle);
                    this.particles.splice(this.particles.indexOf(particle), 1);
                    console.log('粒子数量：', this.particles.length);
                }
            });
        });
    }
}
//鼠标触发
class MouseTrigger {
    private keys: { [key: string]: boolean } = {};
    private noteArray: NoteBar[];
    constructor(noteArray: NoteBar[]) {
        this.noteArray = noteArray;
        this.init();
    }
    // 初始化键盘事件监听
    private init(): void {
        document.addEventListener('keydown', this.handleKeyDown.bind(this));
        document.addEventListener('keyup', this.handleKeyUp.bind(this));
    }
    // 处理键盘按下事件
    private handleKeyDown(event: KeyboardEvent): void {
        this.keys[event.key] = true;
        this.checkKeys();
    }
    // 处理键盘松开事件
    private handleKeyUp(event: KeyboardEvent): void {
        this.keys[event.key] = false;
    }
    // 检查按键状态并触发事件
    private checkKeys(): void {
        if (this.keys['a']) {
            this.noteArray.forEach((note)=> {
                if (note.noteType == 'noteA') {
                    note.isAdd = true;
                    console.log('触发音符A');
                }
            });
        }
        if (this.keys['s']) {
            this.noteArray.forEach((note)=> {
                if (note.noteType == 'noteS') {
                    note.isAdd = true;
                    console.log('触发音符S');
                }
            });
        }
        if (this.keys['d']) {
            this.noteArray.forEach((note)=> {
                if (note.noteType == 'noteD') {
                    note.isAdd = true;
                    console.log('触发音符D');
                }
            });
        }
        if (this.keys['j']) {
            this.noteArray.forEach((note)=> {
                if (note.noteType == 'noteJ') {
                    note.isAdd = true;
                    console.log('触发音符J');
                }
            });
        }
        if (this.keys['k']) {
            this.noteArray.forEach((note)=> {
                if (note.noteType == 'noteK') {
                    note.isAdd = true;
                    console.log('触发音符K');
                }
            });
        }
        if (this.keys['l']) {
            this.noteArray.forEach((note)=> {
                if (note.noteType == 'noteL') {
                    note.isAdd = true;
                    console.log('触发音符L');
                }
            });
        }
        if (this.keys['Enter']) {
            console.log('按下 Enter');
        }
        if (this.keys['Escape']) {
            console.log('按下 Escape');
        }
    }
}
class MusicGame {
    private barX: { [key: string]: number };
    private canvasManager: CanvasManager;
    private notes: NoteBar[]; // 存储所有音符
    private myDashedLine: DashedLine; // 虚线
    private myTriggerArea: TriggerArea; // 触发区
    private myline: TriggerLine; // 触发线
    private mouseTrigger: MouseTrigger; // 鼠标触发
    private noteSpawnInterval: number; // 音符生成间隔（毫秒）

    constructor() {
        this.canvasManager = new CanvasManager();
        this.notes = [];
        this.myDashedLine = new DashedLine(this.canvasManager.app, this.canvasManager.container);
        this.myTriggerArea = new TriggerArea(this.myDashedLine.dashedLineCanvas.canvas.height * 0.5);
        this.myline = new TriggerLine(this.canvasManager.app, this.canvasManager.container);
        const originX = this.myline.line.x+window.innerWidth*0.005;
        const intervalX = window.innerWidth*0.082;
        this.barX= {
            'noteA': originX,
            'noteS': originX + intervalX,
            'noteD': originX + intervalX * 2,
            'noteJ': originX + intervalX * 3,
            'noteK': originX + intervalX * 4,
            'noteL': originX + intervalX * 5,
        };
        this.mouseTrigger = new MouseTrigger(this.myTriggerArea.triggerArray);
        this.noteSpawnInterval = 1000; // 每 1 秒生成一个音符
    }

    // 初始化应用
    public async init(): Promise<void> {
        await this.canvasManager.init();
        // 创建虚线
        this.canvasManager.container.addChild(this.myDashedLine.dashedLine);
        // 创建触发区
        this.myTriggerArea.init();
        // 创建触发线
        this.canvasManager.container.addChild(this.myline.line);
        // 启动动画循环
        this.startAnimation();
        // 启动音符生成器
        this.startNoteSpawner();
    }

    // 创建音符
    private createNoteBar(x: number, type: string, speed: number): void {
        const noteBar = new NoteBar(this.canvasManager.app, this.canvasManager.container, x, speed,type,this.canvasManager.texture);
        this.notes.push(noteBar);
    }
    // 启动动画循环
    private startAnimation(): void {
        this.canvasManager.app.ticker.add((time) => {
            // 更新所有音符的位置
            this.notes.forEach((note) => note.update(time.deltaTime,this.myline.line.y,this.notes));
            // 更新触发区
            this.notes.forEach((note) => {
                this.myTriggerArea.addTrigger(note);
            });
            // 移除已经销毁的音符
            this.notes = this.notes.filter((note) => note.bar.parent !== null);
        });
    }
    // 启动音符生成器
    private startNoteSpawner(): void {
        setInterval(() => {
            const [type, x] = this.getRandomX(); // 随机 x 位置
            const speed = this.getRandomSpeed(); // 随机速度
            this.createNoteBar(x, type, speed); // 创建音符
        }, this.noteSpawnInterval);
    }

    // 获取随机 x 位置
    private getRandomX(): [string, number] {
		const barX = this.barX; // 音符 x 位置
        // 获取所有键的数组
        const keys = Object.keys(barX);
        // 生成基于键数量的随机索引
        const randomIndex = Math.floor(Math.random() * keys.length);
        // 通过随机键名获取对应值
        return [keys[randomIndex], barX[keys[randomIndex]]];
	}
    // 获取随机速度
    private getRandomSpeed(): number {
        return window.innerHeight * 0.005; // 随机速度
    }
}

// 创建 MusicGame 实例并初始化
(async () => {
    const musicGame = new MusicGame();
    await musicGame.init();
})();