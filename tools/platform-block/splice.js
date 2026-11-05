const fs=require('fs');const [,, idx, frag]=process.argv;
let html=fs.readFileSync(idx,'utf8'); const f=fs.readFileSync(frag,'utf8');
const block=`    <!-- ============ PLATFORM (built from Figma 4296:5593 with the RaccoonAI Design System; regenerate, do not hand-edit the screen) ============ -->
    <section class="section section-tint platform platform-hero" id="top" aria-labelledby="platform-title">
      <div class="pf-hero">
        <img class="pf-hero-img" src="images/hero-1600.webp" srcset="images/hero-960.webp 960w, images/hero-1600.webp 1600w, images/hero-2400.webp 2400w, images/hero-3840.webp 3840w" sizes="100vw" width="3840" height="1648" alt="" fetchpriority="high" decoding="async">
        <div class="wrap pf-hero-copy">
          <h1 id="platform-title">Платформа: вся диспетчерская на&nbsp;одном экране</h1>
          <p>Карта заданий по&nbsp;статусам, машина на&nbsp;линии с&nbsp;экипажем и&nbsp;рейсами, план и&nbsp;факт вывоза по&nbsp;площадкам и&nbsp;технике. Так выглядит рабочий экран диспетчера RaccoonAI.</p>
          <div class="hero-actions">
            <a class="btn btn-primary" href="#demo">Запросить демо</a>
            <a class="btn btn-quiet" href="#pf-viewport">Посмотреть интерфейс</a>
          </div>
        </div>
      </div>
      <figure class="pf-frame" aria-label="Экран Платформы RaccoonAI: дэшборд диспетчера с картой заданий, карточкой машины 714SH02 и статусом вывоза">
        <div class="pf-viewport" id="pf-viewport">
          <div class="pf-stage rds">
${f}
          </div>
        </div>
        <figcaption class="wrap pf-caption"><span>Интерфейс Платформы · демонстрационные данные</span><span class="pf-hint">Листайте вбок, чтобы увидеть весь экран</span></figcaption>
      </figure>
    </section>

`;
const marker='    <!-- ============ AI DISPATCHER INTRO (former hero) ============ -->';
if(html.includes('<!-- ============ PLATFORM')) { html=html.replace(/    <!-- ============ PLATFORM[\s\S]*?<\/section>\n\n/, block); }
else { if(!html.includes(marker)) throw new Error('marker missing'); html=html.replace(marker, block+marker); }
if(!html.includes('href="platform.css"'))html=html.replace('<link rel="stylesheet" href="style.css">','<link rel="stylesheet" href="style.css">\n  <link rel="stylesheet" href="platform-ds.css">\n  <link rel="stylesheet" href="platform.css">');
fs.writeFileSync(idx,html); console.log('ok', html.length);
