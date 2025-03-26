import { Application, Particle, ParticleContainer, Texture, Graphics,Assets, Loader, TextureSource, type ParticleOptions, Sprite, Ticker, FillGradient} from 'pixi.js';
class newparticle extends Particle {
	// 新增生命周期相关属性
	public age: number = 0;
	public maxAge: number = 300;  // 3秒生命周期
	public isAlive: boolean = true;
	public speed: number = 0.5 + Math.random() * 0.8; // 随机速度
	public direction: number = Math.random() * Math.PI * 2; // 初始随机方向
	public drift: number = 0.02; // 方向随机漂移量
	public bounds = { x: 400, y: 0, width: 300, height: 600 }; // 绑定到 myRect 的边界
	private myAlpha!:number;
	constructor(options: Texture<TextureSource<any>> | ParticleOptions) {
		super(options);
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
		// 随机透明度波动
		// this.alpha += (Math.random() - 0.5) * 0.01;
		// this.alpha = Math.min(Math.max(this.alpha, 0.3), 0.9);
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
(async () => {
	const app = new Application();
	await app.init({ 
		background: '#149FCD', 
    	resizeTo: window,
    	antialias: true
	});
	document.getElementById('musicGame')?.appendChild(app.canvas);
	const myRect = new Graphics();
	const linearGradient = new FillGradient({
		type: 'linear',
		colorStops: [
			{ offset: 0, color: 'white' },
			{ offset: 1, color: '0xf3feb0' }
		],
		textureSpace: 'local'
	})
	myRect.fill(linearGradient);
	myRect.rect(400, 0, 300, 600);
	myRect.alpha = 0.2;
	myRect.fill();
	myRect.visible = false; // Start hidden
	app.stage.addChild(myRect);
	const particles: newparticle[] = [];
	const container = new ParticleContainer();
	const starTexture = await Assets.load('/images/dust.svg');
	const texture = new Texture(starTexture);
	let count = 0;
	let isKeyPressed = false; // Track if 'A' key is pressed
	app.stage.addChild(container);
	// Keyboard event listeners
    window.addEventListener('keydown', (e) => {
        if (e.key.toLowerCase() === 'a') {
            isKeyPressed = true;
            myRect.visible = true;
        }
    });

    window.addEventListener('keyup', (e) => {
        if (e.key.toLowerCase() === 'a') {
            isKeyPressed = false;
            myRect.visible = false;
        }
    });

  	app.ticker.add(() => {
		count++;
		// Only generate new particles when key is pressed
        if (isKeyPressed && count >= 10 && particles.length < 30) {
            const particle = new newparticle({
                texture,
            });
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
})();
// class newparticle extends Particle {
// 	public speed: number =  2 + Math.random() * 3;
// 	public gravity: number = 0.5;
// 	public angle = Math.random() * Math.PI * 2;
// 	constructor(options: Texture<TextureSource<any>> | ParticleOptions) {
// 		super(options);
// 	}
// }
// (async () => {
// 	const app = new Application();
// 	await app.init({ 
// 		background: '#1e396c', 
//     	resizeTo: window,
//     	antialias: true
// 	});
// 	const myButton = document.getElementById('myButton');
// 	let isStart: boolean = false;
// 	document.getElementById('musicGame')?.appendChild(app.canvas);
// 	const myRect = new Graphics();
// 	myRect.fill(0xf3f9fc);
// 	myRect.rect(400, 300, 100, 20);
// 	myRect.fill();
// 	app.stage.addChild(myRect);
// 	const particles: newparticle[] = [];
// 	const container = new ParticleContainer();
// 	const starTexture = await Assets.load('/images/star.svg');
// 	const texture = new Texture(starTexture);
// 	// 添加100个粒子
// 	app.stage.addChild(container);
// 	myButton?.addEventListener('click', () => {
// 		for (let i = 0; i < 100; i++) {
// 			const particle = new newparticle(
// 			{
// 				texture,
// 				x: 450,
// 				y: 300,
// 				tint: 0xf3f9fc,
// 				scaleX: 0.1,
// 				scaleY: 0.1,
// 				alpha: 0.8,
// 			});
// 			container.addParticle(particle);
// 			particles.push(particle);
// 		}
// 	});
//   	app.ticker.add(() => {
// 		container.update();
// 		particles.forEach(particle => {
// 			// 持续施加扩散力
// 			particle.x += Math.cos(particle.angle) * particle.speed;
// 			particle.y += Math.sin(particle.angle) * particle.speed;
// 			// 施加下落加速度
// 			particle.speed *= 0.98;      // 速度衰减（空气阻力）
// 			particle.y += particle.gravity;  // 下落速度递增
// 			particle.gravity *= 1.02;    // 重力逐渐增强
// 			if (particle.y > app.screen.height + 100 || particle.speed < 0.1) {
// 				// 粒子超出屏幕范围或速度小于0.1，则移除粒子
// 				container.removeParticle(particle);
// 				particles.splice(particles.indexOf(particle), 1);
// 				console.log('粒子数量：', particles.length);
// 			}
// 		});
// 	});
// })();
