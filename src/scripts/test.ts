import * as Tone from 'tone';

// ✅ 将共享变量提升到外层作用域
let jsonData: any;
let sampler: Tone.Sampler;
// ✅ 初始化只执行一次
document.getElementById('myButton')?.addEventListener('click', async () => {
    await Tone.start();
    console.log('audio is ready');
    // ✅ 加载资源
    async function setup() {
        try {
            console.log('⏳ 加载资源...');
            [jsonData, sampler] = await Promise.all([
                fetch('/sheets/flan.json').then(res => res.json()),
                new Tone.Sampler({
                    urls: { C4: '/audio/C4piano.mp3' },
                    release: 1
                }).toDestination()
            ]);
            console.log('🎉 所有资源加载完成');      
            // ✅ 初始化完成后启用播放按钮
            document.getElementById('myAudio')?.removeAttribute('disabled');
        } catch (err) {
            console.error('初始化失败:', err);
        }
    }
    await setup();
});

let currentIndex = 0;
let timeoutId: NodeJS.Timeout | null = null;
document.getElementById('myAudio')?.addEventListener('click', () => {
    if (!jsonData || !sampler) return;
    
    // 如果已经在播放，则停止
    if (timeoutId) {
        clearTimeout(timeoutId);
        timeoutId = null;
        currentIndex = 0;
        console.log('播放已停止');
        return;
    }
    
    const notes = jsonData.track_1.notes;
    playNextNote();
    
    function playNextNote() {
        if (currentIndex >= notes.length) {
            timeoutId = null;
            currentIndex = 0;
            console.log('所有音符已播放完毕');
            return;
        }
        
        const currentNote = notes[currentIndex];
        sampler.triggerAttackRelease(
            currentNote.note,
            currentNote.duration_ticks / jsonData.time_division,
            Tone.now(),
            currentNote.velocity / 127
        );
        console.log('🔊 播放:', currentNote.note);
        
        // 计算到下一个音符的间隔
        let interval = 0;
        if (currentIndex < notes.length - 1) {
            const nextNote = notes[currentIndex + 1];
            interval = (nextNote.start_ticks - currentNote.start_ticks) / jsonData.time_division * 500; // 转换为毫秒
            console.log('⏱️ 到下一个音符的间隔(ms):', interval);
        }
        
        currentIndex++;
        
        if (currentIndex < notes.length) {
            timeoutId = setTimeout(playNextNote, interval);
        }
    }
});

