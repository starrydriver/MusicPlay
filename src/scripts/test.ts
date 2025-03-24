import { Application, Particle, ParticleContainer, Texture, Graphics,Assets, Loader, TextureSource, type ParticleOptions, Sprite} from 'pixi.js';
class newparticle extends Particle {
	public speed: number =  2 + Math.random() * 3;
	public gravity: number = 0.5;
	public angle = Math.random() * Math.PI * 2;
	constructor(options: Texture<TextureSource<any>> | ParticleOptions) {
		super(options);
	}
}
(async () => {
	const app = new Application();
	await app.init({ 
		background: '#1e396c', 
    	resizeTo: window,
    	antialias: true
	});
	const myButton = document.getElementById('myButton');
	let isStart: boolean = false;
	document.getElementById('musicGame')?.appendChild(app.canvas);
	const myRect = new Graphics();
	myRect.fill(0xf3f9fc);
	myRect.rect(400, 300, 100, 20);
	myRect.fill();
	app.stage.addChild(myRect);
	const particles: newparticle[] = [];
	const container = new ParticleContainer();
	const starTexture = await Assets.load('/images/star.svg');
	const texture = new Texture(starTexture);
	// 添加100个粒子
	app.stage.addChild(container);
	myButton?.addEventListener('click', () => {
		for (let i = 0; i < 100; i++) {
			const particle = new newparticle(
			{
				texture,
				x: 450,
				y: 300,
				tint: 0xf3f9fc,
				scaleX: 0.1,
				scaleY: 0.1,
				alpha: 0.8,
			});
			container.addParticle(particle);
			particles.push(particle);
		}
	});
  	app.ticker.add(() => {
		container.update();
		particles.forEach(particle => {
			// 持续施加扩散力
			particle.x += Math.cos(particle.angle) * particle.speed;
			particle.y += Math.sin(particle.angle) * particle.speed;
			// 施加下落加速度
			particle.speed *= 0.98;      // 速度衰减（空气阻力）
			particle.y += particle.gravity;  // 下落速度递增
			particle.gravity *= 1.02;    // 重力逐渐增强
			if (particle.y > app.screen.height + 100 || particle.speed < 0.1) {
				// 粒子超出屏幕范围或速度小于0.1，则移除粒子
				container.removeParticle(particle);
				particles.splice(particles.indexOf(particle), 1);
				console.log('粒子数量：', particles.length);
			}
		});
	});
})();
