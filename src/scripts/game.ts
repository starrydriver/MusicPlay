import { Application, Container, Sprite, Assets, Ticker } from 'pixi.js';

class BunnyGrid {
    private app: Application;
    private container: Container;
    private texture: any; // 纹理类型可以是 `PIXI.Texture`，但为了简化暂时用 `any`

    constructor() {
        this.app = new Application();
        this.container = new Container();
        this.texture = null;
    }

    // 初始化应用
    public async init(): Promise<void> {
        await this.app.init({
            background: '#1099bb', // 背景颜色
            resizeTo: window,      // 自动调整大小
        });

        // 将 Canvas 添加到页面
        document.body.appendChild(this.app.canvas);

        // 加载纹理
        this.texture = await Assets.load('https://pixijs.com/assets/bunny.png');

        // 初始化网格
        this.createGrid();

        // 启动动画
        this.startAnimation();
    }

    // 创建 5x5 网格的兔子
    private createGrid(): void {
        for (let i = 0; i < 25; i++) {
            const bunny = new Sprite(this.texture);
            bunny.x = (i % 5) * 40;
            bunny.y = Math.floor(i / 5) * 40;
            this.container.addChild(bunny);
        }

        // 将容器居中
        this.container.x = this.app.screen.width / 2;
        this.container.y = this.app.screen.height / 2;

        // 设置容器的旋转中心
        this.container.pivot.x = this.container.width / 2;
        this.container.pivot.y = this.container.height / 2;

        // 将容器添加到舞台
        this.app.stage.addChild(this.container);
    }

    // 启动动画
    private startAnimation(): void {
        this.app.ticker.add((time) => {
            // 使用 time.deltaTime 实现帧率独立动画
            this.container.rotation -= 0.01 * time.deltaTime;
        });
    }
}

// 创建 BunnyGrid 实例并初始化
(async () => {
    const bunnyGrid = new BunnyGrid();
    await bunnyGrid.init();
})();