
/* Polaris visual-first shell 2.0 · works with the original PolarisStore and slot components.
   This layer never replaces the task/schedule store or performs cloud writes. */
(function(){
  'use strict';
  var STORE=window.polarisStore;
  var hub='today', activeTab='tab-today', breathTimer=null, breathStep=0, timerToast=null;
  var EFF=[['日程','tab-schedule'],['行动','tab-actions'],['提醒','tab-reminders'],['专注','tab-focus']];
  var SOUL=[['想法','tab-ideas'],['心情','tab-mood'],['亲密','tab-intimacy'],['休息','tab-rest']];
  var DAYS=['星期日','星期一','星期二','星期三','星期四','星期五','星期六'];
  var shortDay=['日','一','二','三','四','五','六'];
  var svgNS='http://www.w3.org/2000/svg';
  function el(tag,className,textValue){var x=document.createElement(tag);if(className)x.className=className;if(textValue!==undefined)x.textContent=String(textValue);return x;}
  function byId(id){return document.getElementById(id);}
  function getState(){return (STORE&&STORE.state)||{tasks:[],schedules:[],ideas:[],moodLogs:{},pendingChanges:[],syncStatus:'idle'};}
  function today(){var d=new Date();return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0');}
  function clean(str){return String(str==null?'':str).replace(/[<>&"']/g,'').trim();}
  function eventDate(s){return String(s.date||s.startTime||'').slice(0,10);}
  function getTodayEvents(){return (getState().schedules||[]).filter(function(x){return x&&!x.markedDelete&&eventDate(x)===today();}).sort(function(a,b){return (a.startTimeStr||a.startTime||'').localeCompare(b.startTimeStr||b.startTime||'');});}
  function timeOf(s,which){
    var v=String(s[which+'TimeStr']||s[which+'Time']||'');
    var m=v.match(/(\d{1,2}):(\d{2})/);
    return m?(+m[1]*60+(+m[2])):null;
  }
  function getActions(){var s=getState();return (s.tasks||s.threeThings||[]).filter(function(x){return x&&!x.done;});}
  function btn(text,cls,onClick){var b=el('button',cls,text);b.type='button';b.addEventListener('click',onClick);return b;}
  function openTab(id){if(typeof window.switchNavTabDirect==='function')window.switchNavTabDirect(id,id==='tab-mood'?'心情':id==='tab-focus'?'专注':id==='tab-schedule'?'日程':id==='tab-ideas'?'想法':'北极星');}
  function notice(msg){var x=byId('polaris-toast');if(!x)return;x.textContent=msg;x.classList.add('visible');clearTimeout(timerToast);timerToast=setTimeout(function(){x.classList.remove('visible');},2400);}
  function heading(section,eyebrow,title,desc,img){
    var box=el('div','pol-art-title'),left=el('div');left.append(el('span','overline',eyebrow),el('h1','',title),el('p','',desc));
    box.append(left);if(img){var im=el('img');im.src=img;im.alt='';im.loading='lazy';box.append(im);}else box.append(el('span','letter','✦'));section.prepend(box);
  }
  function makeToday(main){
    var p=el('section','tab-panel-view');p.id='tab-today';
    var cover=el('div','pol-day-cover');
    cover.innerHTML='<div class="micro">POLARIS · A LIFE IN MOTION</div><div class="pol-cover-date"><div><div class="month" id="pol-cover-month"></div><div class="number" id="pol-cover-day"></div></div><img class="pol-cover-mood" src="./assets/emojis/mooda_calm.png" alt="温柔的手绘情绪表情"></div><div class="pol-cover-quote">把今天，过成<br>自己喜欢的样子。</div><div class="pol-cover-small" id="pol-cover-weekday"></div>';
    var h=el('div','pol-overview-heading','TODAY AT A GLANCE  /  今日速览');
    var cards=el('div','pol-overview-grid');
    var card1=btn('','pol-overview-tile',function(){navigate('eff','tab-schedule');});
    var card2=btn('','pol-overview-tile',function(){navigate('eff','tab-actions');});
    card1.innerHTML='<span class="tile-label">TIME / 今日安排</span><strong class="tile-number" id="pol-events-count">0</strong><span class="tile-foot" id="pol-next-event">没有日程安排</span>';
    card2.innerHTML='<span class="tile-label">ACTION / 待完成</span><strong class="tile-number" id="pol-tasks-count">0</strong><span class="tile-foot" id="pol-next-task">从最重要的一件事开始</span>';
    cards.append(card1,card2);
    var mood=btn('','pol-note-strip',function(){navigate('soul','tab-mood');});
    mood.innerHTML='<img src="./assets/emojis/mooda_happy.png" alt=""><div><strong>今天的心情，值得记录。</strong><span>用一个表情，为这一天留下印记</span></div><span class="pol-arrow">↗</span>';
    p.append(cover,h,cards,mood);
    main.prepend(p);return p;
  }
  function orbit(section){
    var card=el('div','pol-orbit-card');
    var text=el('div','pol-orbit-caption');
    text.innerHTML='<span class="micro">THE SHAPE OF TIME</span><h2>时间<br>有形状。</h2><p id="pol-orbit-desc">让每段安排都有位置</p>';
    text.append(btn('查看今日安排 ↗','pol-orbit-btn',function(){var target=byId('agenda-schedule-list');if(target)target.scrollIntoView({block:'center',behavior:'smooth'});}));
    var svg=document.createElementNS(svgNS,'svg');svg.setAttribute('class','pol-orbit-svg');svg.setAttribute('viewBox','0 0 160 160');svg.setAttribute('role','img');svg.setAttribute('aria-label','今日24小时日程分布');
    function circle(r,stroke,width){var c=document.createElementNS(svgNS,'circle');c.setAttribute('cx',80);c.setAttribute('cy',80);c.setAttribute('r',r);c.setAttribute('fill','none');c.setAttribute('stroke',stroke);c.setAttribute('stroke-width',width);return c;}
    svg.append(circle(60,'rgba(45,84,56,.1)',15));
    for(var i=0;i<24;i++){var a=i*Math.PI/12-Math.PI/2;var a1=62,a2=i%6===0?78:72;
      var line=document.createElementNS(svgNS,'line');line.setAttribute('x1',80+Math.cos(a)*a1);line.setAttribute('y1',80+Math.sin(a)*a1);line.setAttribute('x2',80+Math.cos(a)*a2);line.setAttribute('y2',80+Math.sin(a)*a2);line.setAttribute('stroke','#688773');line.setAttribute('stroke-opacity',i%6===0?.6:.22);line.setAttribute('stroke-width',i%6===0?2:1);svg.append(line);}
    var arcs=document.createElementNS(svgNS,'g');arcs.id='pol-orbit-arcs';arcs.setAttribute('transform','rotate(-90 80 80)');svg.append(arcs);
    var txt=document.createElementNS(svgNS,'text');txt.setAttribute('x',80);txt.setAttribute('y',76);txt.setAttribute('text-anchor','middle');txt.setAttribute('class','pol-orbit-label');txt.textContent='24 H';svg.append(txt);
    var num=document.createElementNS(svgNS,'text');num.setAttribute('x',80);num.setAttribute('y',99);num.setAttribute('text-anchor','middle');num.setAttribute('font-size','23');num.setAttribute('font-weight','800');num.setAttribute('fill','#244431');num.id='pol-orbit-total';num.textContent='0';svg.append(num);
    card.append(text,svg);section.insertBefore(card,section.firstElementChild.nextSibling);
  }
  function showOrbit(){
    var arcs=byId('pol-orbit-arcs');if(!arcs)return;
    arcs.textContent='';var events=getTodayEvents(),colors=['#557f61','#c58668','#8c98bf','#caad6f','#688e94'];
    var good=0;
    events.forEach(function(event,i){var a=timeOf(event,'start'),b=timeOf(event,'end');if(a===null||b===null||b<=a)return;
      good++;
      var c=document.createElementNS(svgNS,'circle');
      c.setAttribute('cx','80');c.setAttribute('cy','80');c.setAttribute('r','60');c.setAttribute('fill','none');c.setAttribute('pathLength','100');
      c.setAttribute('stroke',colors[i%colors.length]);c.setAttribute('stroke-width','12');c.setAttribute('stroke-linecap','round');
      var start=Math.min(100,Math.max(0,a/1440*100)),len=Math.min(100-start,(b-a)/1440*100);
      c.setAttribute('stroke-dasharray',len+' '+(100-len));c.setAttribute('stroke-dashoffset',-start);
      arcs.appendChild(c);
    });
    var n=byId('pol-orbit-total');if(n)n.textContent=events.length;
    var d=byId('pol-orbit-desc');if(d)d.textContent=good?events.length+' 段日程 · 环形时间分布':'今天没有可绘制的时间段';
  }
  function moodArt(section){
    var art=el('div','pol-mood-art');
    art.innerHTML='<div class="copy"><small>HOW DO YOU FEEL?</small><h2>每种心情，<br>都有形状。</h2></div><img src="./assets/emojis/mooda_calm.png" alt="平静的手绘表情">';
    art.querySelector('.copy').append(btn('挑选今日表情 ↗','pol-mood-cta',function(){if(typeof window.openEmojiModal==='function')window.openEmojiModal();else notice('请选择下方的心情日历');}));
    section.insertBefore(art,section.firstElementChild.nextSibling);
  }
  function makeIntimacy(main){
    var p=el('section','tab-panel-view');p.id='tab-intimacy';
    heading(p,'SOUL / PEOPLE','珍惜的关系','有些话，适合慢慢写。','./assets/emojis/tiny_emoji_04.png');
    var box=el('div','pol-private-card');
    var title=el('h2','','一封给重要之人的小信'),info=el('p','','只保存在本机的私密草稿，不会上传飞书。');
    var input=el('textarea');input.id='pol-intimacy-note';input.placeholder='今天有什么想对重要的人说？';input.setAttribute('aria-label','亲密关系私密草稿');
    try{input.value=localStorage.getItem('polaris_intimacy_local_draft')||'';}catch(e){}
    var save=btn('把心意暂存在这部手机','',function(){try{localStorage.setItem('polaris_intimacy_local_draft',input.value);notice('已保存本机私密草稿');}catch(e){notice('本机存储不可用，请复制文字保存');}});
    box.append(title,info,input,save);p.append(box);main.append(p);
  }
  function makeRest(main){
    var p=el('section','tab-panel-view');p.id='tab-rest';
    heading(p,'SOUL / REST','让时间慢一点','借一点月光，找回自己的节奏。','./assets/emojis/mooda_calm.png');
    var hero=el('div','pol-rest-hero');hero.id='pol-rest-hero';
    var orb=el('div','pol-yinyang');orb.setAttribute('aria-hidden','true');
    var label=el('div','pol-rest-title','4 · 7 · 8  呼吸放松');
    var b=btn('开始一轮呼吸','pol-rest-button',function(){
      if(breathTimer){clearInterval(breathTimer);breathTimer=null;hero.classList.remove('breathing');label.textContent='4 · 7 · 8  呼吸放松';b.textContent='开始一轮呼吸';return;}
      hero.classList.add('breathing');b.textContent='结束呼吸';
      var steps=[['吸气 · 4 秒',4],['停留 · 7 秒',7],['呼气 · 8 秒',8]],phase=0,left=4;
      function tick(){label.textContent=steps[phase][0]+'  ·  '+left;left--;if(left<0){phase=(phase+1)%3;left=steps[phase][1];}}
      tick();breathTimer=setInterval(tick,1000);
    });
    hero.append(orb,label,b);p.append(hero);main.append(p);
  }
  function boardArt(section){
    var art=el('div','pol-board-hero');
    art.innerHTML='<small>YOUR YEAR IN CONSTELLATIONS</small><h2>365 / <span id="pol-days-done">0</span></h2><p id="pol-year-message">每一天，都是一颗星。</p><span class="star" aria-hidden="true">✳</span>';
    section.insertBefore(art,section.firstElementChild.nextSibling);
  }
  function updateNow(){
    var d=new Date();var m=byId('pol-cover-month'),day=byId('pol-cover-day'),wd=byId('pol-cover-weekday');
    if(m)m.textContent=(d.getMonth()+1)+' 月 · '+d.getFullYear();
    if(day)day.textContent=d.getDate();
    if(wd)wd.textContent=DAYS[d.getDay()]+' · 为自己留一点呼吸';
    var events=getTodayEvents(),tasks=getActions();
    var a=byId('pol-events-count'),b=byId('pol-tasks-count');
    if(a)a.textContent=events.length;if(b)b.textContent=tasks.length;
    var e=byId('pol-next-event'),t=byId('pol-next-task');
    if(e)e.textContent=events.length?clean(events[0].text||events[0].title||'点击查看今日安排'):'今天没有排程 · 自由安排';
    if(t)t.textContent=tasks.length?clean(tasks[0].title||tasks[0].text||'继续前进'):'今天的行动已完成';
    var n=byId('pol-days-done');var first=new Date(d.getFullYear(),0,1);var count=Math.floor((Date.UTC(d.getFullYear(),d.getMonth(),d.getDate())-Date.UTC(d.getFullYear(),0,1))/86400000)+1;
    if(n)n.textContent=count;
    var z=byId('pol-year-message');if(z)z.textContent='今年第 '+count+' 天 · 把日子过成自己的星图';
    showOrbit();updateSyncSafe(getState());
  }
  function updateSyncSafe(state){
    var badge=byId('k80-sync-badge'),label=byId('sync-badge-text');if(!badge||!label)return;
    badge.classList.remove('syncing','error');
    var pending=(state.pendingChanges||[]).length;
    if(state.syncStatus==='syncing'){badge.classList.add('syncing');label.textContent='正在同步';}
    else if(state.syncStatus==='error'){badge.classList.add('error');label.textContent='连接异常';}
    else if(pending){label.textContent='待同步 '+pending;}
    else if(state.syncStatus==='synced'&&state.lastSyncTime){label.textContent='上次同步 '+state.lastSyncTime;}
    else label.textContent='离线可用';
  }
  function navMarkup(){
    var dock=el('nav');dock.id='polaris-tabbar';dock.setAttribute('aria-label','北极星主导航');
    [['today','今日','◷'],['eff','效率','⌁'],['soul','灵气','✿'],['board','看板','▦']].forEach(function(item){
      var b=btn('','pol-tab',function(){navigate(item[0]);});
      b.dataset.hub=item[0];b.setAttribute('aria-label',item[1]);b.setAttribute('aria-current','false');
      b.append(el('span','icon',item[2]),el('span','',item[1]));dock.append(b);
    });
    document.body.append(dock,el('div',''));
    var toast=el('div');toast.id='polaris-toast';toast.setAttribute('role','status');document.body.append(toast);
  }
  function buildSub(){
    var area=el('div');area.id='polaris-hub-nav';area.setAttribute('role','tablist');area.setAttribute('aria-label','中枢业务模块');
    byId('main-stage').prepend(area);return area;
  }
  function renderSub(){
    var area=byId('polaris-hub-nav');if(!area)return;
    area.textContent='';var options=hub==='eff'?EFF:hub==='soul'?SOUL:[];area.hidden=options.length===0;
    options.forEach(function(item){var b=btn(item[0],'pol-subtab',function(){navigate(hub,item[1]);});b.setAttribute('role','tab');b.setAttribute('aria-selected',item[1]===activeTab?'true':'false');area.append(b);});
  }
  function navigate(nextHub,tabId){
    hub=nextHub;activeTab=tabId||(hub==='today'?'tab-today':hub==='eff'?'tab-schedule':hub==='soul'?'tab-ideas':'tab-kanban');
    document.querySelectorAll('.tab-panel-view').forEach(function(x){x.classList.toggle('active',x.id===activeTab);});
    var title=byId('current-tab-title');if(title)title.textContent=hub==='today'?'今日':hub==='eff'?'效率':hub==='soul'?'灵气':'看板';
    document.querySelectorAll('#polaris-tabbar .pol-tab').forEach(function(b){var on=b.dataset.hub===hub;b.classList.toggle('active',on);b.setAttribute('aria-current',on?'page':'false');});
    renderSub();
    var stage=byId('main-stage');if(stage)stage.scrollTo({top:0,behavior:'instant'});
    if(breathTimer&&activeTab!=='tab-rest'){clearInterval(breathTimer);breathTimer=null;var r=byId('pol-rest-hero');if(r)r.classList.remove('breathing');}
    try{sessionStorage.setItem('polaris_active_hub',hub);}catch(e){}
  }
  function groupOf(tab){if(tab==='tab-today')return 'today';if(EFF.some(function(x){return x[1]===tab;}))return 'eff';if(SOUL.some(function(x){return x[1]===tab;}))return 'soul';return 'board';}
  function install(){
    var main=byId('main-stage');if(!main)return;
    makeToday(main);
    var schedule=byId('tab-schedule');if(schedule){heading(schedule,'EFFICIENCY / SCHEDULE','把时间，握在手里','少一点匆忙，多一点从容。');orbit(schedule);}
    var actions=byId('tab-actions');if(actions)heading(actions,'EFFICIENCY / ACTION','今天，先做一件事','重要的事，值得被认真完成。','./assets/emojis/tiny_emoji_03.png');
    var rem=byId('tab-reminders');if(rem)heading(rem,'EFFICIENCY / REMIND','不怕忘记。','所有重要的时间，都有人记得。');
    var focus=byId('tab-focus');if(focus)heading(focus,'EFFICIENCY / FOCUS','心无旁骛。','让每一分钟，都有自己的节奏。','./assets/emojis/capsule_emoji_4.png');
    var ideas=byId('tab-ideas');if(ideas){heading(ideas,'SOUL / IDEAS','把灵感，留在纸上','小小想法，也值得被珍藏。');ideas.insertBefore(el('div','pol-ideas-tape','✿  FOR ALL THE THINGS I DON’T WANT TO FORGET'),ideas.children[1]);}
    var mood=byId('tab-mood');if(mood){heading(mood,'SOUL / MOOD','心情有声。','让今天的自己，被认真看见。');moodArt(mood);}
    var board=byId('tab-kanban');if(board){heading(board,'KANBAN / LIFE MAP','每一天，都是星光。','时间留下痕迹，成长自有形状。');boardArt(board);}
    makeIntimacy(main);makeRest(main);buildSub();navMarkup();
    var oldSwitch=window.switchNavTabDirect;
    if(typeof oldSwitch==='function'){window.switchNavTabDirect=function(id,title){oldSwitch(id,title);navigate(groupOf(id),id);};}
    // The legacy status badge previously showed "已连接飞书" when idle; only actual sync results may be described.
    window.updateSyncBadge=function(s){updateSyncSafe(s||getState());};
    if(STORE&&typeof STORE.subscribe==='function')STORE.subscribe(updateNow);
    var preset='today';try{preset=sessionStorage.getItem('polaris_active_hub')||'today';}catch(e){}
    if(['eff','soul','board','today'].indexOf(preset)<0)preset='today';
    navigate(preset);updateNow();
    window.setInterval(function(){var d=byId('pol-cover-day');if(d&&+d.textContent!==new Date().getDate())updateNow();},60000);
    document.addEventListener('keydown',function(e){if(e.key==='Escape'){if(breathTimer){var x=byId('tab-rest');if(x)x.querySelector('.pol-rest-button').click();}}});
  }
  if(document.readyState==='loading')window.addEventListener('DOMContentLoaded',install);
  else install();
})();
