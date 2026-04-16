let allCards=[], uniqueEffectsData=[], deck=[], rankPool=[], filterType='all', searchText='';
let simTurns=72, simCount=3000;
let raceSchedule={}, raceGrade='G1', raceConfident=true;
let cardRankings=null;
let cardElementMap=null;
const SUMMER=new Set([37,38,39,40,61,62,63,64]);
const NO_IMG='data:image/svg+xml,%3Csvg xmlns=%27http://www.w3.org/2000/svg%27 viewBox=%270 0 100 100%27%3E%3Crect fill=%27%23111%27 width=%27100%27 height=%27100%27/%3E%3C/svg%3E';
const bonusIds=['bonusSpd','bonusSta','bonusPow','bonusGut','bonusWis'];
let rankPendingCandidates=[];
let rankCompletedResults=[];
let rankTotalCandidates=0;

function getVal(card,l,k){return ((card.effects||[])[l]||{})[k]||0;}

function getPeriodClass(turn){
    if(turn<=24)return 'junior';
    if(turn<=48)return 'classic';
    if(turn<=60)return 'spring';
    return 'senior';
}

function renderFilters(){
    const types=['all','speed','stamina','power','guts','wisdom','friend','group'];
    document.getElementById('filters').innerHTML=types.map(t=>`<button class="filter-btn ${t===filterType?'active':''}" data-type="${t}">${t}</button>`).join('');
    document.querySelectorAll('.filter-btn').forEach(b=>b.onclick=()=>{
        filterType=b.dataset.type;
        document.querySelectorAll('.filter-btn').forEach(x=>x.classList.remove('active'));
        b.classList.add('active');
        renderCardGrid();
    });
}

function renderCards(){
    if(!allCards||allCards.length===0)return;
    let cardsHTML='';
    for(let c of allCards){
        for(let lb=4;lb>=0;lb--){
            let cardId=c.id+'_lb'+lb;
            cardsHTML+=`<div class="card" draggable="true" data-id="${cardId}" data-base-id="${c.id}" data-lb="${lb}">
                <img src="${c.image_url}" onerror="this.src='${NO_IMG}'" loading="eager">
                <div class="card-title">${c.title}</div>
                <div class="card-lb">LB${lb}</div>
                <div class="card-type">${c.type||''}</div>
                <div class="card-stats">
                    <span class="pill race">${getVal(c,lb,'race_bonus')}</span>
                    <span class="pill fan">${getVal(c,lb,'fan_bonus')}</span>
                </div>
            </div>`;
        }
    }
    document.getElementById('cardGrid').innerHTML=cardsHTML;
    cardElementMap=new Map();
    document.querySelectorAll('.card').forEach(el=>{
        cardElementMap.set(el.dataset.id,el);
    });
    window.addEventListener('dragover',e=>{
        const threshold=100;
        const y=e.clientY;
        const height=window.innerHeight;
        if(y<threshold)window.scrollBy(0,-10);
        else if(y>height-threshold)window.scrollBy(0,10);
    });
    document.querySelectorAll('.card').forEach(el=>{
        el.ondragstart=e=>{
            e.dataTransfer.setData('text/plain',el.dataset.id);
            el.style.opacity='.3';
        };
        el.ondragend=e=>{
            el.style.opacity='1';
        };
        el.onclick=()=>{
            let baseId=el.dataset.baseId,lb=+el.dataset.lb,card=allCards.find(x=>x.id===baseId);
            let deckTitles=new Set(deck.map(x=>x.card.title));
            let poolTitles=new Set(rankPool.map(x=>x.card.title));
            let inDeckIdx=deck.findIndex(x=>x.id===baseId&&x.lb===lb);
            if(inDeckIdx>=0){
                deck.splice(inDeckIdx,1);
            }else if(deckTitles.has(card.title)){
                deck=deck.filter(x=>x.card.title!==card.title);
            }else if(poolTitles.has(card.title)){
                rankPool=rankPool.filter(x=>x.card.title!==card.title);
            }else if(deck.length<6){
                deck.push({id:baseId,card,lb});
            }else{
                if(!poolTitles.has(card.title)){
                    for(let l=0;l<=4;l++)rankPool.push({id:baseId,card,lb:l});
                }
            }
            cardRankings=null;
            renderCardGrid();
            renderDeck();
            renderPool();
        };
    });
    renderCardGrid();
}

function renderCardGrid(){
    let baseFiltered=allCards.filter(x=>filterType==='all'||x.type===filterType);
    if(searchText)baseFiltered=baseFiltered.filter(x=>x.title.toLowerCase().includes(searchText.toLowerCase()));
    let deckCards=deck.map(x=>x.id+'_lb'+x.lb);
    let deckSet=new Set(deckCards);
    let list=[];
    if(cardRankings){
        let sorted=[...cardRankings].sort((a,b)=>b.avgScore-a.avgScore);
        let rankMap=new Map();
        sorted.forEach((r,i)=>rankMap.set(r.baseId+'_lb'+r.lb,i));
        for(let r of sorted){
            let card=allCards.find(x=>x.id===r.baseId);
            if(!card)continue;
            if(filterType!=='all'&&card.type!==filterType)continue;
            if(searchText&&!card.title.toLowerCase().includes(searchText.toLowerCase()))continue;
            list.push({baseId:r.baseId,card,lb:r.lb,rank:rankMap.get(r.baseId+'_lb'+r.lb)});
        }
    }else{
        for(let c of baseFiltered){
            for(let lb=4;lb>=0;lb--){
                list.push({baseId:c.id,card:c,lb});
            }
        }
    }
    let deckTitles=new Set(deck.map(x=>x.card.title));
    let poolCards=new Set(rankPool.map(x=>x.id+'_lb'+x.lb));
    let selectedCards=list.filter(i=>deckSet.has(i.baseId+'_lb'+i.lb));
    let otherCards=list.filter(i=>!deckSet.has(i.baseId+'_lb'+i.lb)&&!deckTitles.has(i.card.title));
    if(!cardRankings){
        otherCards=otherCards.filter(i=>!poolCards.has(i.baseId+'_lb'+i.lb));
    }
    list=[...selectedCards,...otherCards];
    let listSet=new Set(list.map(i=>i.baseId+'_lb'+i.lb));
    let grid=document.getElementById('cardGrid');
    grid.innerHTML='';
    list.forEach(i=>{
        let el=cardElementMap.get(i.baseId+'_lb'+i.lb);
        if(el){
            let existingBadge=el.querySelector('.rank-badge');
            if(existingBadge)existingBadge.remove();
            el.classList.toggle('selected',deckSet.has(i.baseId+'_lb'+i.lb));
            el.style.display='block';
            grid.appendChild(el);
            if(cardRankings&&!deckSet.has(i.baseId+'_lb'+i.lb)){
                if(i.rank!==undefined){
                    let badge=document.createElement('div');
                    badge.className='rank-badge';
                    badge.textContent=`#${i.rank+1}`;
                    el.appendChild(badge);
                }
            }
        }
    });
    cardElementMap.forEach((el,key)=>{
        if(listSet.has(key))return;
        let elTitle=el.querySelector('.card-title')?.textContent;
        if(deckTitles.has(elTitle)){
            el.style.display='none';
        }else if(!cardRankings&&poolCards.has(key)){
            el.style.display='none';
        }
    });
}

function renderDeck(){
    document.getElementById('deckCount').textContent=deck.length;
    document.getElementById('btnSim').disabled=deck.length===0;
    if(!deck.length){document.getElementById('deckList').innerHTML='';document.getElementById('stats').innerHTML='';return;}
    document.getElementById('deckList').innerHTML=deck.map((item,idx)=>`<div class="deck-card">
        <img src="${item.card.image_url}" onerror="this.src='${NO_IMG}'">
        <div class="deck-card-info">
            <div class="deck-card-name">${item.card.title} <span style="color:var(--accent)">LB${item.lb}</span></div>
            <div class="deck-card-stats">
                <span class="race">${getVal(item.card,item.lb,'race_bonus')}</span> / 
                <span class="fan">${getVal(item.card,item.lb,'fan_bonus')}</span>
            </div>
        </div>
        <button class="btn-remove" data-key="${item.id}_lb${item.lb}">x</button>
    </div>`).join('');
    document.querySelectorAll('.btn-remove').forEach(b=>b.onclick=e=>{
        e.stopPropagation();
        let key=b.dataset.key;
        let idx=deck.findIndex(x=>x.id+'_lb'+x.lb===key);
        if(idx>=0){
            let removed=deck.splice(idx,1)[0];
            rankPool=rankPool.filter(x=>x.card.title!==removed.card.title);
        }
        cardRankings=null;
        renderCardGrid();
        renderDeck();
    });
    let tR=0,tF=0;
    deck.forEach(i=>{tR+=getVal(i.card,i.lb,'race_bonus');tF+=getVal(i.card,i.lb,'fan_bonus');});
    document.getElementById('stats').innerHTML=`<div class="stat-row"><span class="stat-label">Race Bonus</span><span class="stat-value" style="color:#f59e0b">${tR}%</span></div>
        <div class="stat-row"><span class="stat-label">Fan Bonus</span><span class="stat-value" style="color:#ec4899">${tF}%</span></div>`;
}

function renderPool(){
    let poolEl=document.getElementById('rankPool');
    poolEl.ondragover=e=>{e.preventDefault();poolEl.classList.add('drag-over')};
    poolEl.ondragleave=()=>poolEl.classList.remove('drag-over');
    poolEl.ondrop=e=>{
        e.preventDefault();
        poolEl.classList.remove('drag-over');
        let key=e.dataTransfer.getData('text/plain');
        if(!key)return;
        let [baseId,lbStr]=key.split('_lb');
        let card=allCards.find(x=>x.id===baseId);
        if(!card)return;
        let deckTitles=new Set(deck.map(x=>x.card.title));
        if(deckTitles.has(card.title))return;
        for(let lb=0;lb<=4;lb++){
            if(rankPool.some(x=>x.id===baseId&&x.lb===lb))continue;
            rankPool.push({id:baseId,card,lb});
        }
        renderPool();
        renderCardGrid();
    };
    document.getElementById('btnRank').disabled=rankPool.length===0;
    document.getElementById('poolCount').textContent=rankPool.length;
    let clearRankBtn=document.getElementById('btnClearRank');
    if(clearRankBtn)clearRankBtn.style.display=cardRankings?'block':'none';
    let emptyEl=document.getElementById('poolEmpty');
    if(emptyEl)emptyEl.style.display=rankPool.length?'none':'block';
    if(!rankPool.length){
        document.getElementById('poolCards').innerHTML='';
        return;
    }
    document.getElementById('poolCards').innerHTML=rankPool.map(item=>`<div class="rank-card" draggable="true" data-key="${item.id}_lb${item.lb}">
        <img src="${item.card.image_url}" onerror="this.src='${NO_IMG}'">
        <div class="rank-card-title">${item.card.title}</div>
        <div class="rank-card-type">${item.card.type||''} LB${item.lb}</div>
        <div class="rank-card-stats">
            <span class="pill race">${getVal(item.card,item.lb,'race_bonus')}</span>
            <span class="pill fan">${getVal(item.card,item.lb,'fan_bonus')}</span>
        </div>
    </div>`).join('');
    document.querySelectorAll('.rank-card').forEach(el=>{
        el.ondragstart=e=>{
            e.dataTransfer.setData('text/plain',el.dataset.key);
            el.style.opacity='.3';
        };
        el.ondragend=e=>{
            el.style.opacity='1';
            let rect=poolEl.getBoundingClientRect();
            if(e.clientX<rect.left||e.clientX>rect.right||e.clientY<rect.top||e.clientY>rect.bottom){
                let key=el.dataset.key;
                let [id,lbStr]=key.split('_lb');
                let card=allCards.find(x=>x.id===id);
                if(card){
                    rankPool=rankPool.filter(x=>x.card.title!==card.title);
                }else{
                    let lb=parseInt(lbStr);
                    rankPool=rankPool.filter(x=>!(x.id===id&&x.lb===lb));
                }
                renderPool();
                renderCardGrid();
            }
        };
        el.onclick=e=>{
            e.stopPropagation();
            let key=el.dataset.key;
            let [id,lbStr]=key.split('_lb');
            let card=allCards.find(x=>x.id===id);
            if(card){
                rankPool=rankPool.filter(x=>x.card.title!==card.title);
            }else{
                let lb=parseInt(lbStr);
                rankPool=rankPool.filter(x=>!(x.id===id&&x.lb===lb));
            }
            renderPool();
            renderCardGrid();
        };
    });
}

function renderRankSort(){
    const exitBtn=document.getElementById('btnExitRank');
    if(cardRankings){
        if(exitBtn)exitBtn.style.display='block';
        document.querySelectorAll('.card').forEach(el=>el.style.pointerEvents='none');
    }else{
        if(exitBtn)exitBtn.style.display='none';
        document.querySelectorAll('.card').forEach(el=>el.style.pointerEvents='auto');
    }
    renderCardGrid();
}

function renderRaceGrid(){
    let html='';
    for(let t=1;t<=simTurns;t++){
        let r=raceSchedule[t];
        let period=getPeriodClass(t);
        let cls='race-cell '+period;
        if(r)cls+=' '+r.grade;
        else if(SUMMER.has(t))cls+=' summer';
        html+=`<div class="${cls}" data-turn="${t}" data-confident="${r?r.confident:'true'}">${r?r.grade:t}</div>`;
    }
    document.getElementById('raceGrid').innerHTML=html;
    document.querySelectorAll('#raceGrid > div').forEach(el=>el.onclick=()=>{
        let t=+el.dataset.turn;
        if(raceGrade==='clear')delete raceSchedule[t];
        else if(raceSchedule[t]){
            if(raceSchedule[t].grade===raceGrade){
                delete raceSchedule[t];
            }else{
                raceSchedule[t]={grade:raceGrade,confident:raceConfident};
            }
        }else{
            raceSchedule[t]={grade:raceGrade,confident:raceConfident};
        }
        renderRaceGrid();
    });
    document.getElementById('raceCount').textContent=Object.keys(raceSchedule).length;
}

function renderTimeline(result){
    const tl=result.timeline;
    const maxTurns=result.max_turns;
    const grid=document.getElementById('timelineGrid');
    const facInfo=document.getElementById('facilityInfo');
    const graphs=document.getElementById('timelineGraphs');
    if(!tl||!tl.stat_history||tl.stat_history.length===0){
        grid.innerHTML='<div style="color:var(--muted);padding:1rem">No timeline data</div>';
        return;
    }
    const statNames=['speed','stamina','power','guts','wits'];
    const statColors=['#45c2e5','#22c55e','#f59e0b','#ec4899','#8b5cf6'];
    const cardPressTimeline=tl.card_presses_timeline||[];
    const opCountsTimeline=tl.operation_counts_timeline||[];
    window._tlData={tl,cardPressTimeline,opCountsTimeline};
    const allStatData=statNames.map(s=>tl.stat_history.map(h=>h[s]||0));
    allStatData.push(tl.sp_history||[]);
    statColors.push('#06b6d4');
    statNames.push('SP');
    const labels=['Speed','Stamina','Power','Guts','Wits','SP'];
    graphs.innerHTML=
        '<div style="margin-bottom:8px"><span style="font-size:14px;font-weight:600;color:var(--accent)">Stat Growth Over Time (Ura turns ignored)</span></div>'+
        '<div style="margin-bottom:1rem"><canvas id="canvas-merged" style="width:100%;height:120px;background:rgba(0,0,0,.3);border-radius:6px;cursor:crosshair"></canvas></div>';
    setTimeout(function(){
        drawMergedStatGraph('canvas-merged',allStatData,statColors,labels,tl.stat_history,tl.sp_history||[]);
    },50);
    let html='';
    for(let t=0;t<maxTurns;t++){
        const period=getPeriodClass(t);
        html+='<div class="timeline-cell '+period+'" data-turn="'+t+'">';
        html+='<span>'+(t+1)+'</span></div>';
    }
    grid.innerHTML=html;
    document.querySelectorAll('.timeline-cell').forEach(cell=>{
        cell.onmouseenter=function(){
            document.querySelectorAll('.timeline-popup').forEach(p=>p.remove());
            const t=parseInt(this.dataset.turn);
            const d=window._tlData;
            showTimelinePopup(t,d.tl.stat_history[t],d.tl.facility_levels[t],d.tl.facility_presses[t],d.tl.sp_history?d.tl.sp_history[t]:0,d.cardPressTimeline[t],d.opCountsTimeline[t]);
        };
        cell.onmouseleave=function(){
            document.querySelectorAll('.timeline-popup').forEach(p=>p.remove());
        };
    });
    facInfo.style.display='none';
}

function showTimelinePopup(turn,stats,facLvl,facPrs,sp,cpAtTurn,opCounts){
    const existing=document.querySelector('.timeline-popup');
    if(existing)existing.remove();
    const statNames=['speed','stamina','power','guts','wits'];
    const facilityNames=['Speed','Stamina','Power','Guts','Wits'];
    const statColors=['#45c2e5','#22c55e','#f59e0b','#ec4899','#8b5cf6'];
    const op=opCounts||[0,0,0,0];
    const popup=document.createElement('div');
    popup.className='timeline-popup';
    popup.style.cssText='position:fixed;top:50%;left:50%;transform:translate(-50%,-50%);width:720px;z-index:1000;background:#1a1420;border:2px solid #45c2e5;border-radius:12px;padding:16px;box-shadow:0 8px 40px rgba(0,0,0,.6);pointer-events:none';
    let html='<div style="font-size:18px;font-weight:700;color:#45c2e5;margin-bottom:12px">Day '+(turn+1)+'</div>';
    html+='<div style="display:flex;gap:20px;margin-bottom:12px;padding:8px;background:rgba(0,0,0,.3);border-radius:6px">';
    html+='<div style="color:#22c55e;font-size:13px">Rest <span style="font-weight:700;color:#fff;font-size:14px">'+op[0].toFixed(2)+'</span></div>';
    html+='<div style="color:#ef4444;font-size:13px">Infirmary <span style="font-weight:700;color:#fff;font-size:14px">'+op[1].toFixed(2)+'</span></div>';
    html+='<div style="color:#f59e0b;font-size:13px">Trip <span style="font-weight:700;color:#fff;font-size:14px">'+op[2].toFixed(2)+'</span></div>';
    html+='<div style="color:#8b5cf6;font-size:13px">Race <span style="font-weight:700;color:#fff;font-size:14px">'+op[3].toFixed(2)+'</span></div>';
    html+='</div>';
    html+='<div style="display:flex;gap:20px">';
    html+='<div style="flex:1">';
    html+='<div style="font-size:12px;font-weight:700;color:var(--muted);margin-bottom:6px">Appearance Count</div>';
    for(let f=0;f<3;f++){
        html+='<div style="font-size:12px;font-weight:700;color:'+statColors[f]+';margin-bottom:4px">'+facilityNames[f]+'</div>';
        const cards=cpAtTurn[f].map((count,i)=>({count,name:window.simDeckCards[i]?window.simDeckCards[i].title:'C'+(i+1)})).filter(c=>c.count>0);
        if(cards.length>0){
            cards.forEach(c=>{
                html+='<div style="display:flex;justify-content:space-between;font-size:12px;padding-left:6px;white-space:nowrap"><span style="color:rgba(255,255,255,.7)">'+c.name+'</span><span style="color:'+statColors[f]+';font-weight:700;margin-left:12px">'+c.count.toFixed(2)+'</span></div>';
            });
        }
    }
    html+='</div>';
    html+='<div style="flex:1">';
    for(let f=3;f<5;f++){
        html+='<div style="font-size:12px;font-weight:700;color:'+statColors[f]+';margin-bottom:4px">'+facilityNames[f]+'</div>';
        const cards=cpAtTurn[f].map((count,i)=>({count,name:window.simDeckCards[i]?window.simDeckCards[i].title:'C'+(i+1)})).filter(c=>c.count>0);
        if(cards.length>0){
            cards.forEach(c=>{
                html+='<div style="display:flex;justify-content:space-between;font-size:12px;padding-left:6px;white-space:nowrap"><span style="color:rgba(255,255,255,.7)">'+c.name+'</span><span style="color:'+statColors[f]+';font-weight:700;margin-left:12px">'+c.count.toFixed(2)+'</span></div>';
            });
        }
    }
    html+='</div>';
    html+='<div style="flex:1">';
    html+='<div style="font-size:12px;font-weight:700;color:var(--muted);margin-bottom:6px">Facility (Lv/Clicks)</div>';
    for(let i=0;i<5;i++){
        const s=statNames[i];
        const lv=facLvl[s]!==undefined?facLvl[s].toFixed(2):'-';
        const clicks=facPrs[s]!==undefined?facPrs[s].toFixed(2):'-';
        html+='<div style="display:flex;justify-content:space-between;font-size:12px">';
        html+='<span style="color:'+statColors[i]+';font-weight:700">'+facilityNames[i]+'</span>';
        html+='<span style="color:rgba(255,255,255,.6)">'+lv+' / '+clicks+'</span>';
        html+='</div>';
    }
    html+='</div>';
    html+='</div>';
    popup.innerHTML=html;
    document.body.appendChild(popup);
}

function drawStatGraph(canvasId,data,color){
    const canvas=document.getElementById(canvasId);
    if(!canvas||data.length===0)return;
    const ctx=canvas.getContext('2d');
    const w=canvas.offsetWidth||200;
    const h=40;
    canvas.width=w;
    canvas.height=h;
    ctx.clearRect(0,0,w,h);
    if(data.length<2)return;
    const max=Math.max(...data);
    const min=Math.min(...data);
    const range=max-min||1;
    ctx.strokeStyle=color;
    ctx.lineWidth=2;
    ctx.beginPath();
    data.forEach((v,i)=>{
        const x=(i/(data.length-1))*w;
        const y=h-((v-min)/range)*(h-4)-2;
        if(i===0)ctx.moveTo(x,y);
        else ctx.lineTo(x,y);
    });
    ctx.stroke();
}

function drawMergedStatGraph(canvasId,allStatData,colors,labels,statHistory,spHistory){
    const canvas=document.getElementById(canvasId);
    if(!canvas||allStatData.length===0||allStatData[0].length===0)return;
    const oldTip=document.getElementById('stat-graph-tooltip');
    if(oldTip)oldTip.remove();
    const tooltip=document.createElement('div');
    tooltip.id='stat-graph-tooltip';
    tooltip.style.cssText='display:none;position:fixed;background:#1a1420;border:2px solid #45c2e5;border-radius:6px;padding:.5rem;font-size:.75rem;pointer-events:none;z-index:9999;white-space:nowrap;color:#fff;box-shadow:0 4px 12px rgba(0,0,0,.5)';
    document.body.appendChild(tooltip);
    const ctx=canvas.getContext('2d');
    const w=canvas.offsetWidth||400;
    const h=120;
    canvas.width=w;
    canvas.height=h;
    ctx.clearRect(0,0,w,h);
    const numStats=allStatData.length;
    const allVals=allStatData.flat();
    const max=Math.max(...allVals);
    const min=Math.min(...allVals);
    const range=max-min||1;
    const getY=(v)=>h-((v-min)/range)*(h-10)-5;
    ctx.lineWidth=2;
    for(let i=0;i<numStats;i++){
        const data=allStatData[i];
        ctx.strokeStyle=colors[i];
        ctx.beginPath();
        data.forEach((v,j)=>{
            const x=(j/(data.length-1))*w;
            const y=getY(v);
            if(j===0)ctx.moveTo(x,y);
            else ctx.lineTo(x,y);
        });
        ctx.stroke();
    }
    const statKeys=['speed','stamina','power','guts','wits'];
    function showTooltip(e){
        const rect=canvas.getBoundingClientRect();
        const x=e.clientX-rect.left;
        const pageX=e.clientX;
        const pageY=e.clientY;
        let idx=Math.round((x/w)*(statHistory.length-1));
        idx=Math.max(0,Math.min(idx,statHistory.length-1));
        const stats=statHistory[idx];
        const sp=spHistory[idx]||0;
        let tip='<div style="font-weight:700;color:#45c2e5;margin-bottom:.25rem">Day '+(idx+1)+'</div>';
        labels.forEach((l,i)=>{
            const v=i<5?(stats[statKeys[i]]||stats[i]||0):sp;
            tip+='<div><span style="color:'+colors[i]+'">●</span> '+l+': '+(typeof v==='number'?v.toFixed(2):v)+'</div>';
        });
        tooltip.innerHTML=tip;
        tooltip.style.display='block';
        tooltip.style.left=(pageX-140)+'px';
        tooltip.style.top=(pageY-80)+'px';
    }
    function hideTooltip(){
        tooltip.style.display='none';
    }
    canvas.addEventListener('mousemove',showTooltip);
    canvas.addEventListener('mouseleave',hideTooltip);
}

function distGraph(label,d){
    let r=d.max-d.min||1;
    return `<div class="dist-graph">
        <div class="dist-label">${label}</div>
        <div class="dist-axis">
            <div class="dist-tick" style="left:0%">${d.min}</div>
            <div class="dist-tick" style="left:25%">${d.p25}</div>
            <div class="dist-tick" style="left:50%">${d.p50}</div>
            <div class="dist-tick" style="left:75%">${d.p75}</div>
            <div class="dist-tick" style="left:100%">${d.max}</div>
            <div class="dist-bar" onmousemove="hHover(this,${d.min},${d.max},event)" onmouseout="hOut(this,event)">
                <div class="dist-iqr" style="left:${((d.p25-d.min)/r*100).toFixed(1)}%;width:${((d.p75-d.p25)/r*100).toFixed(1)}%"></div>
                <div class="dist-median" style="left:${((d.p50-d.min)/r*100).toFixed(1)}%"></div>
                <div class="dist-avg-marker" style="left:${((d.mean-d.min)/r*100).toFixed(1)}%"></div>
                <div class="dist-cursor-tooltip"></div>
            </div>
        </div>
        <div class="dist-legend">
            <span class="dist-dot median"></span> Median ${d.p50}
            <span class="dist-dot iqr"></span> IQR ${d.p25}-${d.p75}
            <span class="dist-avg-val">${d.mean.toFixed(2)} avg</span>
        </div>
    </div>`;
}

function hHover(bar,min,max,e){
    let pct=Math.max(0,Math.min(100,(e.clientX-bar.getBoundingClientRect().left)/bar.offsetWidth*100));
    bar.querySelector('.dist-cursor-tooltip').textContent=(min+(pct/100)*(max-min)).toFixed(0);
    bar.querySelector('.dist-cursor-tooltip').style.left=pct+'%';
    bar.querySelector('.dist-cursor-tooltip').style.display='block';
}

function hOut(bar){bar.querySelector('.dist-cursor-tooltip').style.display='none';}

function showView(name,btn){
    document.querySelectorAll('.result-view').forEach(el=>el.style.display='none');
    document.querySelectorAll('.btn-toggle').forEach(el=>el.classList.remove('active'));
    document.getElementById('view-'+name).style.display='block';
    btn.classList.add('active');
    if(name==='details'&&window.currentSimResult){
        renderTimeline(window.currentSimResult);
    }
}

function updateBonusTotal(){
    let total=0;
    bonusIds.forEach(id=>total+=+document.getElementById(id).value||0);
    document.getElementById('bonusTotal').textContent=total+'%';
    bonusIds.forEach(id=>document.getElementById(id+'Val').textContent=(+document.getElementById(id).value||0)+'%');
}

async function init(){
    try{
        allCards=await fetch('data/cards.json').then(r=>{
            if(!r.ok)throw new Error('Failed to load cards');
            return r.json();
        });
        uniqueEffectsData=await fetch('data/unique_effects.json').then(r=>r.ok?r.json():[]).catch(()=>[]);
        if(!allCards.length)throw new Error('No cards returned');
        renderFilters();
        renderCards();
        renderDeck();
        renderPool();
    }catch(e){}
}

let searchTimeout=null;
document.getElementById('search').oninput=e=>{
    clearTimeout(searchTimeout);
    searchTimeout=setTimeout(()=>{searchText=e.target.value;renderCardGrid();},150);
};
document.getElementById('turnsSlider').oninput=e=>{simTurns=+e.target.value;document.getElementById('turnsValue').textContent=simTurns;renderRaceGrid();};
document.getElementById('simsSlider').oninput=e=>{simCount=+e.target.value;document.getElementById('simsValue').textContent=simCount;};

document.getElementById('btnClearPool').onclick=()=>{rankPool=[];renderPool();renderCardGrid();};
document.getElementById('btnClearRank').onclick=()=>{rankPool=[];cardRankings=null;renderPool();renderCardGrid();renderRankSort();};

document.querySelectorAll('.race-grade-btn').forEach(b=>b.onclick=()=>{
    raceGrade=b.dataset.grade;
    document.querySelectorAll('.race-grade-btn').forEach(x=>x.classList.remove('active'));
    b.classList.add('active');
});
document.getElementById('confidentToggle').onchange=e=>{
    raceConfident=e.target.checked;
    renderRaceGrid();
};
renderRaceGrid();

bonusIds.forEach(id=>document.getElementById(id).oninput=updateBonusTotal);
updateBonusTotal();

document.getElementById('btnSim').onclick=async function(){
    if(deck.length===0)return;
    this.disabled=true;
    this.textContent='Simulating...';
    document.getElementById('results').innerHTML=`<div class="results"><h3>Simulation Progress</h3><div class="progress-container"><div class="progress-bar"><div class="progress-fill" id="pf"></div></div><div class="progress-text" id="pt">Starting...</div></div></div>`;
    try{
        window.simDeckCards=deck.map(c=>({title:c.card.title,id:c.card.id}));
        let deckData=deck.map(i=>({card_id:i.id,lb:i.lb}));
        let raceList=Object.entries(raceSchedule).map(([t,g])=>({turn:+t,grade:g.grade,confident:g.confident}));
        let statBonus=bonusIds.map(id=>+document.getElementById(id).value||0);
        let startStats=['startSpd','startSta','startPow','startGut','startWis'].map(id=>+document.getElementById(id).value||88);
        await runSimPool({
            deckData,
            cardsData:allCards,
            uniqueEffectsData,
            options:{
                numSimulations:simCount,
                maxTurns:simTurns,
                raceSchedule:raceList,
                statBonus,
                startingStats:startStats,
                confident:document.getElementById('confidentToggle').checked
            },
            workerPath:'js/sim/worker.js',
            onProgress:function(completed,total,workerCount){
                let pct=(completed/total*100).toFixed(0);
                document.getElementById('pt').textContent=completed+' / '+total+' sims ('+workerCount+' workers)';
                document.getElementById('pf').style.width=pct+'%';
            },
            onComplete:function(combined){
                window.currentSimResult=combined;
                let s=combined.avg_stats,d=combined.dist_stats,p=combined.peak_run;
                document.getElementById('results').innerHTML=`<div class="results">
                    <div class="view-toggle" style="margin-bottom:1rem">
                        <button class="btn-toggle active" onclick="showView('default',this)">Average</button>
                        <button class="btn-toggle" onclick="showView('details',this)">Details</button>
                        <button class="btn-toggle" onclick="showView('peak',this)">Peak</button>
                    </div>
                    <div id="view-default" class="result-view">
                        <h3>Simulation Results (${combined.num_simulations} runs, ${combined.max_turns} days)</h3>
                        <div class="result-row"><span class="result-label">Speed</span><span class="result-value">${s.speed.toFixed(1)}</span></div>
                        <div class="result-row"><span class="result-label">Stamina</span><span class="result-value">${s.stamina.toFixed(1)}</span></div>
                        <div class="result-row"><span class="result-label">Power</span><span class="result-value">${s.power.toFixed(1)}</span></div>
                        <div class="result-row"><span class="result-label">Guts</span><span class="result-value">${s.guts.toFixed(1)}</span></div>
                        <div class="result-row"><span class="result-label">Wit</span><span class="result-value">${s.wisdom.toFixed(1)}</span></div>
                        <div class="result-row"><span class="result-label">SP</span><span class="result-value">${combined.avg_skill_points.toFixed(1)}</span></div>
                    </div>
                    <div id="view-details" class="result-view" style="display:none">
                        <h3>Distribution (${combined.num_simulations} runs)</h3>
                        ${distGraph('Speed',d.speed)}${distGraph('Stamina',d.stamina)}${distGraph('Power',d.power)}${distGraph('Guts',d.guts)}${distGraph('Wit',d.wisdom)}${distGraph('SP',d.sp)}
                        <h3 style="margin-top:1rem">Timeline</h3>
                        <div class="timeline-grid" id="timelineGrid"></div>
                        <div class="facility-info" id="facilityInfo"></div>
                        <div id="timelineGraphs"></div>
                    </div>
                    <div id="view-peak" class="result-view" style="display:none">
                        <h3>Peak Run (#${p.run_index})</h3>
                        <div class="result-row"><span class="result-label">Speed</span><span class="result-value">${p.speed}</span></div>
                        <div class="result-row"><span class="result-label">Stamina</span><span class="result-value">${p.stamina}</span></div>
                        <div class="result-row"><span class="result-label">Power</span><span class="result-value">${p.power}</span></div>
                        <div class="result-row"><span class="result-label">Guts</span><span class="result-value">${p.guts}</span></div>
                        <div class="result-row"><span class="result-label">Wit</span><span class="result-value">${p.wisdom}</span></div>
                        <div class="result-row"><span class="result-label">SP</span><span class="result-value">${p.sp}</span></div>
                    </div>
                </div>`;
                document.getElementById('btnSim').disabled=false;
                document.getElementById('btnSim').textContent='Run Simulation';
            }
        });
    }catch(e){document.getElementById('results').innerHTML=`<div style="color:#ef4444;padding:1rem">Error: ${e}</div>`;this.disabled=false;this.textContent='Run Simulation';}
};

document.getElementById('btnRank').onclick=async function(){
    if(rankPool.length===0)return;
    this.disabled=true;
    this.textContent='Ranking...';
    try{
        let deckData=deck.map(i=>({card_id:i.id,lb:i.lb}));
        let raceList=Object.entries(raceSchedule).map(([t,g])=>({turn:+t,grade:g.grade,confident:g.confident}));
        let statBonus=bonusIds.map(id=>+document.getElementById(id).value||0);
        let startStats=['startSpd','startSta','startPow','startGut','startWis'].map(id=>+document.getElementById(id).value||88);
        let candidates=rankPool.map(i=>({card_id:i.id,lb:i.lb}));
        let deckIds=new Set(deckData.map(x=>x.card_id));
        candidates=candidates.filter(c=>!deckIds.has(c.card_id));
        rankTotalCandidates=candidates.length;
        document.getElementById('results').innerHTML=`<div class="results"><h3>Ranking ${rankTotalCandidates} Cards...</h3><div class="progress-container"><div class="progress-bar"><div class="progress-fill" id="pf" style="width:0%"></div></div><div class="progress-text" id="pt">Starting ${rankTotalCandidates} workers...</div></div></div>`;
        let rankCandidates=candidates.map(c=>{
            let testDeck=[...deckData,c];
            return{
                deckData:testDeck,
                options:{numSimulations:simCount,maxTurns:simTurns,raceSchedule:raceList,statBonus,startingStats:startStats,confident:document.getElementById('confidentToggle').checked},
                cardId:c.card_id,
                cardLb:c.lb
            };
        });
        rankCompletedResults=[];
        await runRankPool({
            candidates:rankCandidates,
            cardsData:allCards,
            uniqueEffectsData,
            workerPath:'js/sim/worker.js',
            onCardDone:function(result,completed,total){
                rankCompletedResults.push(result);
                let pct=(completed/total*100).toFixed(1);
                document.getElementById('pf').style.width=pct+'%';
                document.getElementById('pt').textContent=completed+' / '+total+' cards ranked';
            },
            onAllDone:function(){
                let results = rankCompletedResults;
                results.sort((a,b)=>b.avg_total-a.avg_total);
                let rankedResults=results.map(r=>{
                    let c=allCards.find(x=>x.id===r.card_id);
                    let avg=r.avg_stats;
                    let avgScore=avg.speed+avg.stamina+avg.power+avg.guts+avg.wisdom+r.avg_skill_points/2;
                    return{baseId:r.card_id,lb:r.card_lb,card:c,avgScore,avg,avgSp:r.avg_skill_points};
                });
                rankedResults.sort((a,b)=>b.avgScore-a.avgScore);
                cardRankings=rankedResults;
                renderRankSort();
                document.getElementById('results').innerHTML=`<div class="results">
                    <h3>Card Ranking</h3>
                    ${rankedResults.slice(0,10).map((r,i)=>`<div class="result-row">
                        <span class="result-label" style="font-weight:700">${i+1}. ${r.card.title} LB${r.lb}</span>
                        <span class="result-value">${r.avgScore.toFixed(1)}</span>
                    </div>`).join('')}
                </div>`;
                document.getElementById('btnRank').disabled=false;
                document.getElementById('btnRank').textContent='Rank Pool';
            }
        });
    }catch(e){document.getElementById('results').innerHTML=`<div style="color:#ef4444;padding:1rem">Error: ${e}</div>`;this.disabled=false;this.textContent='Rank Pool';}
};

init();
