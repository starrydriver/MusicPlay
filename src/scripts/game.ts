import {Application, Graphics, Container,Sprite, Assets ,Texture,Particle, ParticleContainer,Filter, TextureSource, type ParticleOptions, BitmapText, FillGradient} from 'pixi.js';
import { GlowFilter } from 'pixi-filters';
import * as Tone from 'tone';
//读取midi文件的json接口
interface MidiNote {
    start_ticks: number;
    note: string;
    duration_ticks: number;
    velocity: number;
    midi_value: number;
    frequency_hz: number;
    channel: number;
}

type RankingEntry = {
    name: string;
    score: number;
    createdAt?: number;
};

type RankingServiceApi = {
    submitScore: (name: string, score: number) => Promise<{ success: boolean; message?: string }>;
    refresh: () => void;
    getEntries: () => RankingEntry[];
};
// class AppState{
//     private static instance:AppState;
//     //public jsonData:MidiNote;
//     public sampler:Tone.Sampler;
//     constructor(){
//         //this.jsonData = {};
//         this.sampler = new Tone.Sampler();
//     }
//     public static getInstance(): AppState {
//         if (!AppState.instance) {
//             AppState.instance = new AppState();
//         }
//         return AppState.instance;
//     }
// }
//let jsonData: any;
//let sampler: Tone.Sampler;
// 画布管理类
class CanvasManager {
    public app: Application;
    public container: Container;
    //粒子变量
    private textureLoad1!:TextureSource<any>;
    public texture1!: Texture;
    private textureLoad2!:TextureSource<any>;
    public texture2!: Texture;
    // 星空效果相关变量
    private starTexture: any;
    private starAmount = 1000;
    private stars: { sprite: Sprite; z: number; x: number; y: number }[] = [];
    private cameraZ = 0;
    private fov = 20;
    private baseSpeed = 0.025; // 恒定速度
    private starStretch = 5;
    private starBaseSize = 0.05;
    //文字渲染相关变量
    private text!: BitmapText;
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
        this.textureLoad1 = await Assets.load('/images/barParticle.svg');
        this.texture1 = new Texture(this.textureLoad1);
        this.textureLoad2 = await Assets.load('/images/dust.svg');
        this.texture2 = new Texture(this.textureLoad2);
        // 加载星星纹理
        this.starTexture = await Assets.load('https://pixijs.com/assets/star.png');
        // 初始化星空效果
        this.initStars();
        this.startAnimation();
        // 文字渲染
        this.text = new BitmapText;
        this.textRender();
        window.addEventListener('resize', () => this.textPosition());
    }
    //文字渲染
    private textRender(): void {
        const windowWidth = window.innerWidth; // 窗口宽度
        const windowHeight = window.innerHeight; // 窗口高度
        this.text = new BitmapText({
            text: ' A    S    D    J    K    L',
            style: {
                fontSize: windowWidth * 0.03,
                fill: '#ffffff',
                align: 'center',
                letterSpacing: windowWidth * 0.0075,
            }
        });
        this.text.x = windowWidth / 4;
        this.text.y = windowHeight / 1.2;
        this.container.addChild(this.text);
    }
    //文字位置
    public textPosition(): void {
        let windowWidth = window.innerWidth; // 窗口宽度
        let windowHeight = window.innerHeight; // 窗口高度
        this.text.style.fontSize = windowWidth * 0.03;
        this.text.style.letterSpacing = windowWidth * 0.0;
        this.text.x = windowWidth / 4;
        this.text.y = windowHeight / 1.2;
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
        const windowWidth = window.innerWidth;
        const windowHeight = window.innerHeight;
        // 动态调整 canvas 大小
        this.canvas.width = windowWidth;
        this.canvas.height = windowHeight;
        this.canvas.style.width = `100%`;
        this.canvas.style.height = `100%`;
        //this.dashedLineCanvas.scale(dpr, dpr);
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
	public triggerArray: {[key:string]:NoteBar[]};
	constructor(y:number){
		this.AreaY = y;
        this.triggerArray = {
            ["noteA"]:[],
            ["noteS"]:[],
            ["noteD"]:[],
            ["noteJ"]:[],
            ["noteK"]:[],
            ["noteL"]:[],
        };
	}
    public init():void{
        console.log('初始化触发区');
    }
    //触发区数组
    public addTrigger(bar:NoteBar):void{
        if (bar.bar.y > this.AreaY &&bar.noteType == "noteA" 
            && this.triggerArray["noteA"].includes(bar) === false) {
            this.triggerArray["noteA"].push(bar); // 将音符添加到数组
            //console.log('barY:', bar.bar.y+",AreaY:",this.AreaY);
            //console.log('音符注入数组');
        }
        if (bar.bar.y > this.AreaY &&bar.noteType == "noteS" && this.triggerArray["noteS"].includes(bar) === false) {
            this.triggerArray["noteS"].push(bar); // 将音符添加到数组
        }
        if (bar.bar.y > this.AreaY &&bar.noteType == "noteD" && this.triggerArray["noteD"].includes(bar) === false) {
            this.triggerArray["noteD"].push(bar); // 将音符添加到数组
        }
        if (bar.bar.y > this.AreaY &&bar.noteType == "noteJ" && this.triggerArray["noteJ"].includes(bar) === false) {
            this.triggerArray["noteJ"].push(bar); // 将音符添加到数组
        }
        if (bar.bar.y > this.AreaY &&bar.noteType == "noteK" && this.triggerArray["noteK"].includes(bar) === false) {
            this.triggerArray["noteK"].push(bar); // 将音符添加到数组
        }
        if (bar.bar.y > this.AreaY &&bar.noteType == "noteL" && this.triggerArray["noteL"].includes(bar) === false) {
            this.triggerArray["noteL"].push(bar); // 将音符添加到数组
        }
    }
}
//渐变框类
class LinearBox {
    private app: Application;
    private container: Container;
    public linearBox: Graphics[]; // 触发线图形
    constructor(app: Application, container: Container,texture:Texture<TextureSource<any>>) {
        this.app = app;
        this.container = container;
        this.linearBox = [];
        // 初始化触发线
        this.createLinearBox();
    }
    // 创建渐变框
    public createLinearBox(): void {
        const windowWidth = window.innerWidth; // 窗口宽度
        const windowHeight = window.innerHeight; // 窗口高度
        const lineWidth = (windowWidth * 0.5)/6;
        const lineHeight = windowHeight * 0.81;
        const lineX = (windowWidth - (windowWidth * 0.5)) / 2; // 水平居中
        for (let i = 0; i < 6; i++) {
            const myRect = new Graphics();
                // const linearGradient = new FillGradient({
                //     type: 'linear',
                //     colorStops: [
                //         { offset: 0, color: 'white' },
                //         { offset: 1, color: '0xf3feb0' }
                //     ],
                //     textureSpace: 'local'
                // })
                // myRect.fill(linearGradient);
                myRect.fill(0xf3f9fc);
                myRect.rect(lineX+lineWidth*i, 0, lineWidth, lineHeight);
                myRect.alpha = 0.6;
                myRect.fill();
                myRect.visible = false;
                this.linearBox.push(myRect);
                this.container.addChild(myRect);
        }
    }
}
//破碎粒子
class newparticle extends Particle {
    public speed: number =  5 + Math.random() * 3;
    public gravity: number = 5;
    public angle = Math.random() * Math.PI * 2;
    constructor(options: Texture<TextureSource<any>> | ParticleOptions) {
        super(options);
    }
    
}
//尘埃粒子
class DustManager {
    private app: Application;
    private container: Container;
    private boundsX: number;
    public isKeyPressed: boolean = false;
    constructor(app: Application, container: Container,boundsX:number) {
        this.app = app;
        this.container = container;
        this.boundsX = boundsX;
    }
    public async init():Promise<void>{
        //test
        const particles: newparticle1[] = [];
        const container = new ParticleContainer();
        const starTexture = await Assets.load('/images/dust.svg');
        const texture = new Texture(starTexture);
        let count = 0;
        this.container.addChild(container);
        this.app.ticker.add(() => {
            count++;
            if (this.isKeyPressed && count >= 10 && particles.length < 30) {
                const particle = new newparticle1({
                    texture,
                },this.boundsX);
                container.addParticle(particle);
                particles.push(particle);
                count = 0;
            }
            // 更新粒子
            particles.forEach(particle => {
                particle.update();
            });
            // 清理失效粒子（逆向遍历避免索引错位）
            for (let i = particles.length - 1; i >= 0; i--) {
                if (!particles[i].isAlive) {
                    container.removeParticle(particles[i]);
                    particles.splice(i, 1);
                }
            }
              // 可选：添加整体扰动
              container.x = Math.sin(Date.now() * 0.001) * 2;
              container.y = Math.cos(Date.now() * 0.001) * 2;
        });
    }
}
class newparticle1 extends Particle {
	// 新增生命周期相关属性
	public age: number = 0;
	public maxAge: number = 300;  // 3秒生命周期
	public isAlive: boolean = true;
	public speed: number = 0.5 + Math.random() * 0.8; // 随机速度
	public direction: number = Math.random() * Math.PI * 2; // 初始随机方向
	public drift: number = 0.02; // 方向随机漂移量
	public bounds = { x: 0, y: 0, width: (window.innerWidth * 0.5)/6, height: window.innerHeight * 0.81 }; // 绑定到 myRect 的边界
	private myAlpha!:number;
	constructor(options: Texture<TextureSource<any>> | ParticleOptions,boundsX:number) {
		super(options);
        this.bounds.x = boundsX;
		this.initialize();
	}
	  // 初始化粒子位置和大小
	  private initialize() {
		// 初始化时重置生命周期
		this.age = 0;
		this.isAlive = true;
		this.x = this.bounds.x + Math.random() * this.bounds.width;
		this.y = this.bounds.y + Math.random() * this.bounds.height;
		const scaleSize = 0.1 + Math.random() * 0.1;
		this.scaleX=scaleSize;
		this.scaleY=scaleSize;
		this.alpha = 0.5 + Math.random() * 0.8;
		this.myAlpha = this.alpha;
	  }
	  // 更新粒子运动
	  public update() {
		if (!this.isAlive)return;
        this.age += 1;
       // 生命周期结束处理
        if (this.age >= this.maxAge) {
            this.isAlive = false;
            return;
        }
        // 淡出效果
		this.alpha -= this.myAlpha/300;
		// 随机方向漂移
		this.direction += (Math.random() - 0.5) * this.drift;
		// 计算运动向量
		const dx = Math.cos(this.direction) * this.speed;
		const dy = Math.sin(this.direction) * this.speed;
		// 更新位置
		this.x += dx;
		this.y += dy;
		// 边界约束
		this.applyBoundaryConstraints();
	  }
	  // 边界限制逻辑
	  private applyBoundaryConstraints() {
		// X轴边界
		if (this.x < this.bounds.x) {
		  this.x = this.bounds.x;
		  this.direction = Math.PI - this.direction;
		} else if (this.x > this.bounds.x + this.bounds.width) {
		  this.x = this.bounds.x + this.bounds.width;
		  this.direction = Math.PI - this.direction;
		}
		// Y轴边界
		if (this.y < this.bounds.y) {
		  this.y = this.bounds.y;
		  this.direction = -this.direction;
		} else if (this.y > this.bounds.y + this.bounds.height) {
		  this.y = this.bounds.y + this.bounds.height;
		  this.direction = -this.direction;
		}
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
    private onHit: () => void;
    private particles: newparticle[] = [];
    private particleContainer: ParticleContainer= new ParticleContainer();
    private barTexture: Texture<TextureSource<any>>;
    //test------------------------
    public midi:MidiNote;
    public sampler:Tone.Sampler;

    
    constructor(app: Application, container: Container, x: number, speed: number,type:string,barTexture:Texture<TextureSource<any>>,midi:MidiNote,sampler:Tone.Sampler,onHit: () => void) {
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
        //test----------------------------
        this.midi = midi;
        this.sampler = sampler;
        this.onHit = onHit;
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
    public update(delta: number,border:number,array:NoteBar[],noteArray: {[Key:string]:NoteBar[]}): void {
        this.bar.y += this.speed * delta; // 根据速度下落
        // 如果音符超出屏幕，移除它
        if (this.bar.y > border) {
            this.container.removeChild(this.bar);
            noteArray[this.noteType].splice(noteArray[this.noteType].indexOf(this), 1); // 从数组中移除
            array.splice(array.indexOf(this), 1); // 从数组中移除
            this.bar.destroy(); // 销毁图形
            //console.log('音符消失!');
        }
        else if (this.isAdd == true) {
            this.container.removeChild(this.bar);
            this.onHit();
            this.PlayMidi(this.midi);
            array.splice(array.indexOf(this), 1); // 从数组中移除
            this.particlePlay();
            this.bar.destroy(); // 销毁图形
            //console.log('节拍触发!');
        }
    }
    public PlayMidi(midi:MidiNote):void{
        this.sampler.triggerAttackRelease(
            midi.note,                     // 音符名称（如 "C4"）
            midi.duration_ticks / 480,  // 音符持续时间
            Tone.now(),                           // 立即播放
            midi.velocity / 127            // 音量（标准化到0-1）
        );
    }
    public particlePlay():void{
        this.container.addChild(this.particleContainer);
        for (let i = 0; i < 30; i++) {
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
                particle.x += (Math.cos(particle.angle) * particle.speed)*0.8;
                particle.y += Math.sin(particle.angle) * particle.speed;
                // 施加下落加速度
                particle.speed *= 0.98;      // 速度衰减（空气阻力）
                particle.y += particle.gravity;  // 下落速度递增
                particle.gravity *= 1.02;    // 重力逐渐增强
                if (particle.y > this.app.screen.height + 100 || particle.speed < 0.1) {
                    // 粒子超出屏幕范围或速度小于0.1，则移除粒子
                    this.particleContainer.removeParticle(particle);
                    this.particles.splice(this.particles.indexOf(particle), 1);
                    //console.log('粒子数量：', this.particles.length);
                }
            });
        });
    }
}
//事件触发
class MouseTrigger {
    private keys: { [key: string]: boolean } = {};
    private noteArray: {[Key:string]:NoteBar[]};
    public linearBox: Graphics[];
    private dustManager: DustManager[];
    private noteArrayPos:number[] = [0,0,0,0,0,0];
    private isCanClearNote:boolean[] = [true,true,true,true,true,true];
    constructor(noteArray: {[Key:string]:NoteBar[]}, linearBox: Graphics[],dustManager: DustManager[]) {
        this.noteArray = noteArray;
        this.linearBox = linearBox;
        this.dustManager = dustManager;
        this.init();
    }
    // 初始化键盘事件监听
    private init(): void {
        document.addEventListener('keydown', this.handleKeyDown.bind(this));
        document.addEventListener('keyup', this.handleKeyUp.bind(this));
    }
    //test--------------
    
    // 处理键盘按下事件
    private handleKeyDown(event: KeyboardEvent): void {
        this.keys[event.key] = true;
        this.checkKeysDown();
    }
    // 处理键盘松开事件
    private handleKeyUp(event: KeyboardEvent): void {
        this.checkKeysUp();
    }
    // 检查按键状态并触发事件
    private checkKeysDown(): void {
    if (this.keys['a']) {
        this.linearBox[0].visible = true;
        this.dustManager[0].isKeyPressed = true;
        this.noteArray["noteA"].forEach((note,index)=> {
            if (note.noteType == 'noteA'&& index == this.noteArrayPos[0]&& this.isCanClearNote[0]) {
                note.isAdd = true;
                this.noteArray["noteA"].splice(index, 1);
                this.isCanClearNote[0] = false;
                console.log('触发音符A'+index);
            }
        });
    }
    if (this.keys['s']) {
        this.linearBox[1].visible = true;
        this.dustManager[1].isKeyPressed = true;
        this.noteArray["noteS"].forEach((note,index)=> {
            if (note.noteType == 'noteS'&& index == this.noteArrayPos[1]&& this.isCanClearNote[1]) {
                note.isAdd = true;
                this.noteArray["noteS"].splice(index, 1);
                    this.isCanClearNote[1] = false;
                    console.log('触发音符S'+index);
                }
            });
        }
        if (this.keys['d']) {
            this.linearBox[2].visible = true;
            this.dustManager[2].isKeyPressed = true;
            this.noteArray["noteD"].forEach((note,index)=> {
                if (note.noteType == 'noteD'&& index == this.noteArrayPos[2]&& this.isCanClearNote[2]) {
                    note.isAdd = true;
                    this.noteArray["noteD"].splice(index, 1);
                    this.isCanClearNote[2] = false;
                    console.log('触发音符D'+index);
                }
            });
        }
        if (this.keys['j']) {
            this.linearBox[3].visible = true;
            this.dustManager[3].isKeyPressed = true;
            this.noteArray["noteJ"].forEach((note,index)=> {
                if (note.noteType == 'noteJ'&& index == this.noteArrayPos[3]&& this.isCanClearNote[3]) {
                    note.isAdd = true;
                    this.noteArray["noteJ"].splice(index, 1);
                    this.isCanClearNote[3] = false;
                    console.log('触发音符J'+index);
                }
            });
        }
        if (this.keys['k']) {
            this.linearBox[4].visible = true;
            this.dustManager[4].isKeyPressed = true;
            this.noteArray["noteK"].forEach((note,index)=> {   
                if (note.noteType == 'noteK'&& index == this.noteArrayPos[4]&& this.isCanClearNote[4]) {
                    note.isAdd = true;
                    this.noteArray["noteK"].splice(index, 1);
                    this.isCanClearNote[4] = false;
                    console.log('触发音符K'+index);
                }
            });
        }
        if (this.keys['l']) {
            this.linearBox[5].visible = true;
            this.dustManager[5].isKeyPressed = true;
            this.noteArray["noteL"].forEach((note,index)=> {
                if (note.noteType == 'noteL'&& index == this.noteArrayPos[5]&& this.isCanClearNote[5]) {
                    note.isAdd = true;
                    this.noteArray["noteL"].splice(index, 1);
                    this.isCanClearNote[5] = false;
                    console.log('触发音符L'+index);
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
    private checkKeysUp(): void {
    if (this.keys['a']) {
        this.linearBox[0].visible = false;
        this.dustManager[0].isKeyPressed = false;
        this.isCanClearNote[0] = true;
        this.keys['a'] = false;
    }
    if (this.keys['s']) {
        this.linearBox[1].visible = false;
        this.dustManager[1].isKeyPressed = false;
        this.isCanClearNote[1] = true;
        this.keys['s'] = false;
    }
    if (this.keys['d']) {
        this.linearBox[2].visible = false;
        this.dustManager[2].isKeyPressed = false;
        this.isCanClearNote[2] = true;
        this.keys['d'] = false;
    }
    if (this.keys['j']) {
        this.linearBox[3].visible = false;
        this.dustManager[3].isKeyPressed = false;
        this.isCanClearNote[3] = true;
        this.keys['j'] = false;
    }
    if (this.keys['k']) {
        this.linearBox[4].visible = false;
        this.dustManager[4].isKeyPressed = false;
        this.isCanClearNote[4] = true;
        this.keys['k'] = false;
    }
    if (this.keys['l']) {
        this.linearBox[5].visible = false;
        this.dustManager[5].isKeyPressed = false;
        this.isCanClearNote[5] = true;
        this.keys['l'] = false;
    }
}

}
class MusicGame {
    //定义类变量
    private notes: NoteBar[]; // 存储所有音符
    private myDashedLine: DashedLine; // 虚线
    private myLinearBox: LinearBox; // 渐变框
    private myTriggerArea: TriggerArea; // 触发区
    private myline: TriggerLine; // 触发线
    private mouseTrigger: MouseTrigger; // 鼠标触发
    private myDustManager: DustManager[]=[]; // 尘埃管理器
    private myAudioManager: AudioManager; // 音频管理器
    private isAudioReady = false;
    private score = 0;
    private isGameRunning = false;
    private pendingAutoFinish = false;
    private uploadedThisRound = false;
    private startButton!: HTMLButtonElement | null;
    private endButton!: HTMLButtonElement | null;
    private scoreValue!: HTMLElement | null;
    private resultModal!: HTMLElement | null;
    private resultScore!: HTMLElement | null;
    private playerName!: HTMLInputElement | null;
    private uploadButton!: HTMLButtonElement | null;
    private restartButton!: HTMLButtonElement | null;
    private uploadHint!: HTMLElement | null;
    private leaderboardList!: HTMLElement | null;
    //其他变量
    private noteSpawnInterval: number; // 音符生成间隔（毫秒）
    private barX: { [key: string]: number };
    private canvasManager: CanvasManager;

    constructor() {
        this.canvasManager = new CanvasManager();
        this.notes = [];
        this.myDashedLine = new DashedLine(this.canvasManager.app, this.canvasManager.container);
        this.myLinearBox = new LinearBox(this.canvasManager.app, this.canvasManager.container,this.canvasManager.texture2);
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
        const dustX = (window.innerWidth - (window.innerWidth * 0.5)) / 2;
        const dustWidth = (window.innerWidth * 0.5)/6;
        for (let i = 0; i < 6; i++) {
            const dustManager = new DustManager(this.canvasManager.app, this.canvasManager.container,dustX+dustWidth*i);
            this.myDustManager.push(dustManager);
        }
        this.mouseTrigger = new MouseTrigger(this.myTriggerArea.triggerArray, this.myLinearBox.linearBox,this.myDustManager);
        this.myAudioManager = new AudioManager();
        this.noteSpawnInterval = 1000; // 每 1 秒生成一个音符
    }

    private updateScoreUI(): void {
        if (this.scoreValue) {
            this.scoreValue.textContent = String(this.score);
        }
    }

    private renderLeaderboard(): void {
        if (!this.leaderboardList) {
            return;
        }

        const entries = window.RankingService?.getEntries().slice(0, 5) ?? [];
        this.leaderboardList.innerHTML = entries.length
            ? entries.map((entry, index) => `<li><span>${index + 1}. ${entry.name}</span><strong>${entry.score}</strong></li>`).join('')
            : '<li><span>暂无记录</span><strong>-</strong></li>';
    }

    private openResultModal(): void {
        if (!this.resultModal || !this.resultScore || !this.uploadHint || !this.uploadButton) {
            return;
        }

        this.resultScore.textContent = String(this.score);
        this.uploadHint.textContent = '';
        this.uploadButton.disabled = this.uploadedThisRound;
        this.uploadButton.textContent = this.uploadedThisRound ? '已上传' : '上传排行榜';
        this.renderLeaderboard();
        this.resultModal.classList.add('open');
        this.resultModal.setAttribute('aria-hidden', 'false');
    }

    private closeResultModal(): void {
        if (!this.resultModal) {
            return;
        }

        this.resultModal.classList.remove('open');
        this.resultModal.setAttribute('aria-hidden', 'true');
    }

    private stopTimers(): void {
        if (this.myAudioManager.timeoutId) {
            clearTimeout(this.myAudioManager.timeoutId);
            this.myAudioManager.timeoutId = null;
        }
    }

    private finishGame(): void {
        if (!this.isGameRunning && !this.pendingAutoFinish) {
            return;
        }

        this.isGameRunning = false;
        this.pendingAutoFinish = false;
        this.stopTimers();
        this.canvasManager.app.ticker.stop();
        if (this.startButton) {
            this.startButton.textContent = '开始游戏';
        }
        this.openResultModal();
    }

    private async startGame(): Promise<void> {
        if (this.isGameRunning) {
            return;
        }

        if (!this.isAudioReady) {
            await this.myAudioManager.init();
            this.isAudioReady = true;
        }

        this.canvasManager.app.ticker.start();
        this.closeResultModal();
        this.uploadedThisRound = false;
        this.score = 0;
        this.updateScoreUI();
        this.isGameRunning = true;
        this.pendingAutoFinish = false;
        this.myAudioManager.currentIndex = 0;
        this.stopTimers();
        if (this.startButton) {
            this.startButton.textContent = '开始游戏';
        }

        const notes = this.myAudioManager.jsonData.track_1.notes;
        const playNextNote = () => {
            if (!this.isGameRunning) {
                return;
            }

            if (this.myAudioManager.currentIndex >= this.myAudioManager.midiNotes.length) {
                this.myAudioManager.timeoutId = null;
                this.myAudioManager.currentIndex = 0;
                this.pendingAutoFinish = true;
                if (this.notes.length === 0) {
                    this.finishGame();
                }
                return;
            }

            const currentNote = notes[this.myAudioManager.currentIndex];
            const [type, x] = this.GetX(currentNote.note);
            const speed = this.getRandomSpeed();
            this.createNoteBar(x, type, speed, currentNote);

            let interval = 0;
            if (this.myAudioManager.currentIndex < notes.length - 1) {
                const nextNote = notes[this.myAudioManager.currentIndex + 1];
                interval = (nextNote.start_ticks - currentNote.start_ticks) / this.myAudioManager.jsonData.time_division * 1000;
            }

            this.myAudioManager.currentIndex++;
            if (this.myAudioManager.currentIndex < notes.length) {
                this.myAudioManager.timeoutId = setTimeout(playNextNote, interval);
            } else {
                this.myAudioManager.timeoutId = null;
                this.myAudioManager.currentIndex = 0;
                this.pendingAutoFinish = true;
                if (this.notes.length === 0) {
                    this.finishGame();
                }
            }
        };

        playNextNote();
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
        // 启动尘埃生成器
        for (let i = 0; i < 6; i++) {
            this.myDustManager[i].init();
        }
        this.startButton = document.getElementById('myButton') as HTMLButtonElement | null;
        this.endButton = document.getElementById('endButton') as HTMLButtonElement | null;
        this.scoreValue = document.getElementById('scoreValue');
        this.resultModal = document.getElementById('resultModal');
        this.resultScore = document.getElementById('resultScore');
        this.playerName = document.getElementById('playerName') as HTMLInputElement | null;
        this.uploadButton = document.getElementById('uploadScore') as HTMLButtonElement | null;
        this.restartButton = document.getElementById('restartGame') as HTMLButtonElement | null;
        this.uploadHint = document.getElementById('uploadHint');
        this.leaderboardList = document.getElementById('leaderboardList');

        if (!this.startButton || !this.endButton || !this.scoreValue || !this.resultModal || !this.resultScore || !this.playerName || !this.uploadButton || !this.restartButton || !this.uploadHint || !this.leaderboardList) {
            return;
        }

        const uploadButton = this.uploadButton;
        const uploadHint = this.uploadHint;
        const playerName = this.playerName;
        const resultModal = this.resultModal;

        this.updateScoreUI();
        this.renderLeaderboard();

        this.startButton.addEventListener('click', () => {
            void this.startGame();
        });

        this.endButton.addEventListener('click', () => {
            this.finishGame();
        });

        this.uploadButton.addEventListener('click', async () => {
            if (this.uploadedThisRound) {
                uploadHint.textContent = '本局已经上传过一次了。';
                return;
            }

            const rankingService = window.RankingService;
            if (!rankingService) {
                uploadHint.textContent = '排行榜服务未加载。';
                return;
            }

            const name = playerName.value.trim() || '匿名玩家';
            const result = await rankingService.submitScore(name, this.score);

            if (!result.success) {
                uploadHint.textContent = result.message ?? '上传失败';
                return;
            }

            this.uploadedThisRound = true;
            uploadButton.disabled = true;
            uploadButton.textContent = '已上传';
            uploadHint.textContent = '已上传到排行榜。';
            rankingService.refresh();
            this.renderLeaderboard();
        });

        this.restartButton.addEventListener('click', () => {
            window.location.reload();
        });
    }
    //test--------------------------------------------------------------------
    // public playNextNote(): void {
        

    // }
    private GetX(note: string): [string, number] {
        const barX = this.barX; // 音符 x 位置
        // 定义音符首字母到键的映射关系
        const noteToKeyMap: {[key: string]: string} = {
            'A': 'noteA',
            'B': 'noteS',
            'C': 'noteD',
            'D': 'noteJ',
            'E': 'noteK',
            'F': 'noteL'
        };
        // 获取音符的首字母（例如 "C4" -> "C"）
        const firstChar = note.charAt(0).toUpperCase();
        let key: string;
        if (noteToKeyMap[firstChar]) {
            // 如果首字母在映射表中，使用对应的键
            key = noteToKeyMap[firstChar];
        } else {
            // 对于G或其他字母，随机选择一个键
            const keys = Object.keys(barX);
            const randomIndex = Math.floor(Math.random() * keys.length);
            key = keys[randomIndex];
        }   
        // 返回键名和对应的x位置
        return [key, barX[key]];
    }
    //test--------------------------------------------------------------------
    // 创建音符
    private createNoteBar(x: number, type: string, speed: number,midi:MidiNote): void {
        const noteBar = new NoteBar(this.canvasManager.app, this.canvasManager.container, x, speed,type,this.canvasManager.texture1,midi,this.myAudioManager.sampler,() => {
            this.score += 1;
            this.updateScoreUI();
        });
        this.notes.push(noteBar);
    }
    // 启动动画循环
    private startAnimation(): void {
        this.canvasManager.app.ticker.add((time) => {
            // 更新所有音符的位置
            this.notes.forEach((note) => note.update(time.deltaTime,this.myline.line.y,this.notes,this.myTriggerArea.triggerArray));
            // 更新触发区
            this.notes.forEach((note) => {
                this.myTriggerArea.addTrigger(note);
            });
            // 移除已经销毁的音符
            this.notes = this.notes.filter((note) => note.bar.parent !== null);
            if (this.pendingAutoFinish && this.notes.length === 0) {
                this.finishGame();
            }
        });
    }
    // 获取随机速度
    private getRandomSpeed(): number {
        return window.innerHeight * 0.005; // 随机速度
    }
}  
class AudioManager {
    public currentIndex = 0;
    public timeoutId: NodeJS.Timeout | null = null;
    public midiNotes!: MidiNote[];
    public jsonData!: any;
    public sampler!: Tone.Sampler;
    constructor() {
    }
    //初始化
    public async init(): Promise<void> {
        await this.audioSetUp();
        this.midiNotes = this.jsonData.track_1.notes;
    }
    // 加载音频资源
    private async audioSetUp(): Promise<void> {
        await Tone.start();
        try {
            console.log('加载资源...');
            [this.jsonData, this.sampler] = await Promise.all([
                fetch('/sheets/touhou2.json').then(res => res.json()),
                new Tone.Sampler({
                    urls: { C4: '/audio/C4piano.mp3' },
                    release: 1
                }).toDestination()
            ]);
            console.log('所有资源加载完成');      
        } catch (err) {
            console.error('初始化失败:', err);
        }
    }
    public playNote(): boolean {
        // 检查资源是否加载完成
        if (!this.jsonData || !this.sampler) {
            return false;
        }
        // 如果已经在播放，则停止
        if (this.timeoutId) {
            clearTimeout(this.timeoutId);
            this.timeoutId = null;
            this.currentIndex = 0;
            console.log('播放已停止');
            return false;
        }
        return true;
    }
}
// 创建 MusicGame 实例并初始化
(async () => {
    const musicGame = new MusicGame();
    await musicGame.init();
})();