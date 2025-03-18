import { Application, Graphics, Container, Ticker } from 'pixi.js';
// 画布管理类
class CanvasManager {
    public app: Application;
    public container: Container;

    constructor() {
        this.app = new Application();
        this.container = new Container();
    }
    // 初始化画布
    public async init(): Promise<void> {
        await this.app.init({
            background: '#1099bb', // 蓝色背景
            resizeTo: window,      // 自动调整大小
        });
        // 将 Canvas 添加到页面
        document.body.appendChild(this.app.canvas);
        // 将容器添加到舞台
        this.app.stage.addChild(this.container);
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
       // 更新触发线的大小和位置
       private updateTriggerLine(): void {
        const windowWidth = window.innerWidth; // 窗口宽度
        const windowHeight = window.innerHeight; // 窗口高度
        // 设置触发线的宽度为窗口宽度的 80%，高度为窗口高度的 2%
        const lineWidth = windowWidth * 0.8;
        const lineHeight = windowHeight * 0.02;
        // 设置触发线的位置为窗口底部附近
        const lineX = (windowWidth - lineWidth) / 2; // 水平居中
        const lineY = windowHeight * 0.9; // 距离窗口底部 10%
        // 清空之前的图形
        this.line.clear();
        // 重新绘制触发线
        this.line.fill(0xFFFF00); // 黄色
        this.line.rect(0, 0, lineWidth, lineHeight); // 绘制矩形
        this.line.fill();
        // 设置触发线的位置
        this.line.x = lineX;
        this.line.y = lineY;
    }
}

// 音符类
class NoteBar {
    private app: Application;
    private container: Container;
    public bar: Graphics; // 长条图形
    private speed: number; // 下落速度

    constructor(app: Application, container: Container, x: number, speed: number) {
        this.app = app;
        this.container = container;
        this.speed = speed;
        // 创建长条图形
        this.bar = new Graphics();
        this.bar.fill(0x00FF00); // 绿色
        this.bar.rect(0, 0, 50, 200); // 宽度 50，高度 200
        this.bar.fill();
        this.bar.x = x; // 设置初始 x 位置
        this.bar.y = -200; // 从屏幕顶部开始
        // 将长条添加到容器
        this.container.addChild(this.bar);
    }

    // 更新音符位置
    public update(delta: number): void {
        this.bar.y += this.speed * delta; // 根据速度下落
        // 如果音符超出屏幕，移除它
        if (this.bar.y > this.app.screen.height) {
            this.container.removeChild(this.bar);
            this.bar.destroy(); // 销毁图形
        }
    }
}

class MusicGame {
    private canvasManager: CanvasManager;
    private notes: NoteBar[]; // 存储所有音符
    private myline: TriggerLine; // 触发线
    private noteSpawnInterval: number; // 音符生成间隔（毫秒）

    constructor() {
        this.canvasManager = new CanvasManager();
        this.notes = [];
        this.myline = new TriggerLine(this.canvasManager.app, this.canvasManager.container);
        this.noteSpawnInterval = 1000; // 每 1 秒生成一个音符
    }

    // 初始化应用
    public async init(): Promise<void> {
        await this.canvasManager.init();
        // 创建触发线
        this.canvasManager.container.addChild(this.myline.line);
        // 启动动画循环
        this.startAnimation();
        // 启动音符生成器
        this.startNoteSpawner();
    }

    // 创建音符
    private createNoteBar(x: number, speed: number): void {
        const noteBar = new NoteBar(this.canvasManager.app, this.canvasManager.container, x, speed);
        this.notes.push(noteBar);
    }
    // 启动动画循环
    private startAnimation(): void {
        this.canvasManager.app.ticker.add((time) => {
            // 更新所有音符的位置
            this.notes.forEach((note) => note.update(time.deltaTime));
            // 移除已经销毁的音符
            this.notes = this.notes.filter((note) => note.bar.parent !== null);
        });
    }
    // 启动音符生成器
    private startNoteSpawner(): void {
        setInterval(() => {
            const x = this.getRandomX(); // 随机 x 位置
            const speed = this.getRandomSpeed(); // 随机速度
            this.createNoteBar(x, speed); // 创建音符
        }, this.noteSpawnInterval);
    }

    // 获取随机 x 位置
    private getRandomX(): number {
        const minX = 50; // 最小 x 位置
        const maxX = this.canvasManager.app.screen.width - 50; // 最大 x 位置
        return Math.floor(Math.random() * (maxX - minX)) + minX;
    }

    // 获取随机速度
    private getRandomSpeed(): number {
        const minSpeed = 2; // 最小速度
        const maxSpeed = 5; // 最大速度
        return Math.random() * (maxSpeed - minSpeed) + minSpeed;
    }
}

// 创建 MusicGame 实例并初始化
(async () => {
    const musicGame = new MusicGame();
    await musicGame.init();
})();