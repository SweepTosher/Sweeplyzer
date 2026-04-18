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

function parseUEPart(p, ueData) {
    const t = p.toLowerCase().trim();
    const pctMatch = t.match(/\((\d+)%\)/), intMatch = t.match(/\((\d+)\)/);
    const pctVal = pctMatch ? parseInt(pctMatch[1]) : 0, intVal = intMatch ? parseInt(intMatch[1]) : 0;
    if (t.includes('training effectiveness') || t.includes('increased training') || (t.includes('effectiveness of') && t.includes('training'))) { if (pctVal > 0) ueData.training_effectiveness += pctVal; else if (intVal > 0) ueData.training_effectiveness += intVal; if (t.includes('friendship')) ueData.friendship_bonus += pctVal || intVal; return; }
    if (t.includes('friendship bonus')) { ueData.friendship_bonus += intVal || pctVal; return; }
    if (t.includes('mood effect') || t.includes('amplifies the effect of mood')) { ueData.mood_effect += pctVal || intVal; return; }
    const STAT_NAME_MAP = {speed:0, stamina:1, power:2, guts:3, wit:4};
    for (const [statName, statIdx] of Object.entries(STAT_NAME_MAP)) {
        if (t.includes(`${statName} gain`) || t.includes(`gain ${statName}`) || t.includes(`gain ${statName} bonus`)) {
            const bonus = intVal || pctVal;
            if (statIdx === 0) ueData.speed_bonus += bonus; else if (statIdx === 1) ueData.stamina_bonus += bonus; else if (statIdx === 2) ueData.power_bonus += bonus; else if (statIdx === 3) ueData.guts_bonus += bonus; else if (statIdx === 4) ueData.wits_bonus += bonus;
            return;
        }
    }
    if (t.includes('speed bonus')) { ueData.speed_bonus += intVal; return; }
    if (t.includes('stamina bonus')) { ueData.stamina_bonus += intVal; return; }
    if (t.includes('power bonus')) { ueData.power_bonus += intVal; return; }
    if (t.includes('guts bonus')) { ueData.guts_bonus += intVal; return; }
    if (t.includes('wit bonus')) { ueData.wits_bonus += intVal; return; }
    if (t.includes('all stats bonus')) { ueData.speed_bonus += intVal; ueData.stamina_bonus += intVal; ueData.power_bonus += intVal; ueData.guts_bonus += intVal; ueData.wits_bonus += intVal; return; }
    if (t.includes('skill point bonus')) { ueData.skill_point_bonus += intVal; return; }
    if (t.includes('initial speed')) { ueData.initial_speed += intVal; return; }
    if (t.includes('initial stamina')) { ueData.initial_stamina += intVal; return; }
    if (t.includes('initial power')) { ueData.initial_power += intVal; return; }
    if (t.includes('initial guts')) { ueData.initial_guts += intVal; return; }
    if (t.includes('initial wit')) { ueData.initial_wits += intVal; return; }
    if (t.includes('initial friendship gauge') || t.includes('initial friendship')) { ueData.initial_friendship_gauge += intVal; return; }
    if (t.includes('initial stat up')) { ueData.initial_speed += intVal; ueData.initial_stamina += intVal; ueData.initial_power += intVal; ueData.initial_guts += intVal; ueData.initial_wits += intVal; return; }
    if (t.includes('decreases the probability of failure') || t.includes('failure when training')) { ueData.failure_rate_drop += pctVal || intVal; return; }
    if (t.includes('decreases energy consumed') || t.includes('energy cost reduction') || t.includes('energy cost')) { ueData.vital_cost_drop += pctVal || intVal; return; }
    if (t.includes('specialty priority')) { ueData.specialty_priority += intVal; return; }
    if (t.includes('hint') && (t.includes('frequency') || t.includes('quantity'))) { ueData.hint_frequency += pctVal || intVal; return; }
    if (t.includes('skill point') && t.includes('gain')) { ueData.skill_point_bonus += intVal; return; }
    if (t.includes('stat gain from races')) { const raceMatch = t.match(/races\s*\((\d+)%\)/); if (raceMatch) ueData.race_bonus += parseInt(raceMatch[1]); return; }
    if (t.includes('frequency at which the character participates in their preferred')) { ueData.specialty_priority += pctVal || intVal || 20; return; }
    if (t.includes('frequency at which hint events occur')) { ueData.hint_frequency += pctVal || intVal; return; }
    if (t.includes('bonus bond from training')) { ueData.initial_friendship_gauge += intVal; return; }
}

function getCardStats(card, lb) {
    if (!card) return null;
    const base = card.effects ? (card.effects[lb] || card.effects[card.effects.length - 1] || {}) : {};
    const ueId = card.unique_effect_id;
    const ue = ueId ? (uniqueEffectsData.find(u => u.id === ueId) || {}) : {};
    
    let bondThreshold = 0, bondText = '';
    if (ue && ue.text) {
        const t = ue.text.toLowerCase();
        if (t.includes('bond gauge is full')) { bondThreshold = 100; bondText = 'Full'; }
        else if (t.includes('bond gauge is at least 80')) { bondThreshold = 80; bondText = '80+'; }
        else if (t.includes('bond gauge is at least 60')) { bondThreshold = 60; bondText = '60+'; }
    }
    
    let ueData = { training_effectiveness: 0, mood_effect: 0, failure_rate_drop: 0, vital_cost_drop: 0,
        speed_bonus: 0, stamina_bonus: 0, power_bonus: 0, guts_bonus: 0, wits_bonus: 0, skill_point_bonus: 0,
        initial_speed: 0, initial_stamina: 0, initial_power: 0, initial_guts: 0, initial_wits: 0, friendship_bonus: 0,
        specialty_priority: 0, hint_frequency: 0, race_bonus: 0 };
    
    if (ue && ue.text) {
        const raw = ue.text;
        let parts = [];
        if (raw.includes(' and ') && !raw.trim().startsWith('If')) {
            const andParts = raw.split(' and ');
            parts = andParts.length === 2 ? [andParts[0].trim(), andParts[1].trim()] : [raw];
        } else {
            const splits = raw.split(/(?<=\))\s+(?=[A-Z])/);
            parts = splits.length > 1 ? splits.map(s => s.trim()) : (raw.includes(';') ? raw.split(';').map(p => p.trim()) : [raw]);
        }
        for (const part of parts) parseUEPart(part, ueData);
    }
    
    if (ueId === 'ue_24') { ueData.speed_bonus = 1; ueData.stamina_bonus = 1; ueData.power_bonus = 1; ueData.guts_bonus = 1; ueData.wits_bonus = 1; }
    if (ueId === 'ue_32') ueData.training_effectiveness = 5;
    if (ueId === 'ue_37') ueData.training_effectiveness = 5;
    if (ueId === 'ue_39') ueData.initial_friendship_gauge = 5;
    if (ueId === 'ue_59') { ueData.initial_speed = 10; ueData.initial_stamina = 10; ueData.initial_power = 10; ueData.initial_guts = 10; ueData.initial_wits = 10; }
    if (ueId === 'ue_60') ueData.training_effectiveness = 5;
    if (ueId === 'ue_62') ueData.training_effectiveness = 5;
    if (ueId === 'ue_64') ueData.training_effectiveness = 5;
    if (ueId === 'ue_65') ueData.training_effectiveness = 5;
    if (ueId === 'ue_69') ueData.training_effectiveness = 15;
    if (ueId === 'ue_71') ueData.failure_rate_drop = 20;
    if (ueId === 'ue_73') ueData.friendship_bonus = 10;
    if (ueId === 'ue_79') ueData.training_effectiveness = 5;
    if (ueId === 'ue_82') ueData.friendship_bonus = 10;
    if (ueId === 'ue_83') ueData.training_effectiveness = 10;
    if (ueId === 'ue_85') ueData.training_effectiveness = 20;
    if (ueId === 'ue_90') { ueData.friendship_bonus = 10; ueData.training_effectiveness = 5; }
    
    const baseStats = {
        speed_bonus: base.speed_bonus || 0,
        stamina_bonus: base.stamina_bonus || 0,
        power_bonus: base.power_bonus || 0,
        guts_bonus: base.guts_bonus || 0,
        wits_bonus: base.wits_bonus || 0,
        skill_point_bonus: base.skill_point_bonus || 0,
        training_effectiveness: base.training_bonus || 0,
        mood_effect: base.mood_effect || 0,
        failure_rate_drop: base.failure_rate_drop || 0,
        vital_cost_drop: base.vital_cost_drop || 0,
        race_bonus: base.race_bonus || 0,
        fan_bonus: base.fan_bonus || 0,
        friendship_bonus: base.friendship_bonus || 0,
        initial_friendship_gauge: base.initial_friendship_gauge || 0,
        hint_frequency: base.hint_frequency || 0,
        initial_speed: base.initial_speed || 0,
        initial_stamina: base.initial_stamina || 0,
        initial_power: base.initial_power || 0,
        initial_guts: base.initial_guts || 0,
        initial_wits: base.initial_wits || 0,
        specialty_priority: base.specialty_priority || 0
    };
    
    const ueStats = {
        speed_bonus: ueData.speed_bonus || 0,
        stamina_bonus: ueData.stamina_bonus || 0,
        power_bonus: ueData.power_bonus || 0,
        guts_bonus: ueData.guts_bonus || 0,
        wits_bonus: ueData.wits_bonus || 0,
        skill_point_bonus: ueData.skill_point_bonus || 0,
        training_effectiveness: ueData.training_effectiveness || 0,
        mood_effect: ueData.mood_effect || 0,
        failure_rate_drop: ueData.failure_rate_drop || 0,
        vital_cost_drop: ueData.vital_cost_drop || 0,
        race_bonus: 0,
        fan_bonus: 0,
        friendship_bonus: ueData.friendship_bonus ? (100 + (base.friendship_bonus || 0)) * (100 + ueData.friendship_bonus) / 100 - 100 - (base.friendship_bonus || 0) : 0,
        initial_friendship_gauge: ueData.initial_friendship_gauge || 0,
        hint_frequency: ueData.hint_frequency || 0,
        initial_speed: ueData.initial_speed || 0,
        initial_stamina: ueData.initial_stamina || 0,
        initial_power: ueData.initial_power || 0,
        initial_guts: ueData.initial_guts || 0,
        initial_wits: ueData.initial_wits || 0,
        specialty_priority: ueData.specialty_priority || 0
    };
    
    const combinedStats = {
        speed_bonus: baseStats.speed_bonus + ueStats.speed_bonus,
        stamina_bonus: baseStats.stamina_bonus + ueStats.stamina_bonus,
        power_bonus: baseStats.power_bonus + ueStats.power_bonus,
        guts_bonus: baseStats.guts_bonus + ueStats.guts_bonus,
        wits_bonus: baseStats.wits_bonus + ueStats.wits_bonus,
        skill_point_bonus: baseStats.skill_point_bonus + ueStats.skill_point_bonus,
        training_effectiveness: baseStats.training_effectiveness + ueStats.training_effectiveness,
        mood_effect: baseStats.mood_effect + ueStats.mood_effect,
        failure_rate_drop: baseStats.failure_rate_drop + ueStats.failure_rate_drop,
        vital_cost_drop: baseStats.vital_cost_drop + ueStats.vital_cost_drop,
        race_bonus: baseStats.race_bonus,
        fan_bonus: baseStats.fan_bonus,
        friendship_bonus: baseStats.friendship_bonus + ueStats.friendship_bonus,
        initial_friendship_gauge: baseStats.initial_friendship_gauge + ueStats.initial_friendship_gauge,
        hint_frequency: baseStats.hint_frequency + ueStats.hint_frequency,
        initial_speed: baseStats.initial_speed + ueStats.initial_speed,
        initial_stamina: baseStats.initial_stamina + ueStats.initial_stamina,
        initial_power: baseStats.initial_power + ueStats.initial_power,
        initial_guts: baseStats.initial_guts + ueStats.initial_guts,
        initial_wits: baseStats.initial_wits + ueStats.initial_wits,
        specialty_priority: baseStats.specialty_priority + ueStats.specialty_priority
    };
    
    return { baseStats, ueStats, combinedStats, bondThreshold, bondText };
}

function getCombinedCardStats(card, lb) {
    const data = getCardStats(card, lb);
    return data ? data.combinedStats : null;
}

let cardTooltipContainer = null;
function showCardTooltip(e, card, lb) {
    const data = getCardStats(card, lb);
    if (!data) return;
    const { baseStats, ueStats, combinedStats, bondThreshold, bondText } = data;
    const hasBondThreshold = bondThreshold > 0;
    const hasUeBonus = Object.values(ueStats).some(v => v !== 0);
    
    if (!cardTooltipContainer) {
        cardTooltipContainer = document.createElement('div');
        cardTooltipContainer.id = 'card-tooltip-wrapper';
        cardTooltipContainer.style.cssText = 'position:fixed;z-index:9999;display:flex;gap:0;pointer-events:none';
        document.body.appendChild(cardTooltipContainer);
    }
    
    const fmt = (v) => v === 0 ? '-' : (Number.isInteger(v) ? v : v.toFixed(2));
    const buildTooltipContent = (title, stats, titleColor) => {
        let html = `<div style="font-weight:700;color:${titleColor};margin-bottom:8px;border-bottom:1px solid rgba(255,255,255,.1);padding-bottom:6px">${title}</div>`;
        const singleRow = (label, val, color) => val === 0 ? '' : `<div style="display:flex;justify-content:space-between;gap:12px;"><span style="color:${color}">${label}</span><span style="font-weight:600">${fmt(val)}</span></div>`;
        
        html += '<div style="display:flex;flex-direction:column;gap:4px">';
        html += singleRow('Speed', stats.speed_bonus, '#45c2e5');
        html += singleRow('Stamina', stats.stamina_bonus, '#22c55e');
        html += singleRow('Power', stats.power_bonus, '#f59e0b');
        html += singleRow('Guts', stats.guts_bonus, '#ec4899');
        html += singleRow('Wits', stats.wits_bonus, '#8b5cf6');
        html += singleRow('Skill Points', stats.skill_point_bonus, '#06b6d4');
        html += '</div>';
        
        if (stats.training_effectiveness || stats.mood_effect || stats.failure_rate_drop || stats.vital_cost_drop || stats.friendship_bonus) {
            html += `<div style="border-top:1px solid rgba(255,255,255,.1);margin-top:8px;padding-top:6px;display:flex;flex-direction:column;gap:4px">`;
            html += singleRow('Training Eff', stats.training_effectiveness, '#10b981');
            html += singleRow('Mood', stats.mood_effect, '#f472b6');
            html += singleRow('Fail Drop', stats.failure_rate_drop, '#ef4444');
            html += singleRow('Energy Red', stats.vital_cost_drop, '#fbbf24');
            html += singleRow('Friendship', stats.friendship_bonus, '#a78bfa');
            html += '</div>';
        }
        
        if (stats.race_bonus || stats.fan_bonus || stats.initial_friendship_gauge || stats.hint_frequency || stats.specialty_priority) {
            html += `<div style="border-top:1px solid rgba(255,255,255,.1);margin-top:8px;padding-top:6px;display:flex;flex-direction:column;gap:4px">`;
            html += singleRow('Race Bonus', stats.race_bonus, '#f59e0b');
            html += singleRow('Fan Bonus', stats.fan_bonus, '#ec4899');
            html += singleRow('Init Friend', stats.initial_friendship_gauge, '#8b5cf6');
            html += singleRow('Hint Freq', stats.hint_frequency, '#06b6d4');
            html += singleRow('Spec Priority', stats.specialty_priority, '#f59e0b');
            html += '</div>';
        }
        
        if (stats.initial_speed || stats.initial_stamina || stats.initial_power || stats.initial_guts || stats.initial_wits) {
            html += `<div style="border-top:1px solid rgba(255,255,255,.1);margin-top:8px;padding-top:6px;display:flex;flex-direction:column;gap:4px">`;
            html += singleRow('Init Speed', stats.initial_speed, '#45c2e5');
            html += singleRow('Init Stamina', stats.initial_stamina, '#22c55e');
            html += singleRow('Init Power', stats.initial_power, '#f59e0b');
            html += singleRow('Init Guts', stats.initial_guts, '#ec4899');
            html += singleRow('Init Wits', stats.initial_wits, '#8b5cf6');
            html += '</div>';
        }
        
        return html;
    };
    
    cardTooltipContainer.innerHTML = '';
    
    if (hasBondThreshold && hasUeBonus) {
        const box1 = document.createElement('div');
        box1.style.cssText = 'background:#1a1420;border:2px solid #45c2e5;border-radius:8px;padding:14px;font-size:13px;color:#fff;min-width:320px;box-shadow:0 4px 20px rgba(0,0,0,.5)';
        box1.innerHTML = buildTooltipContent(`${card.title} LB${lb} [PRE]`, baseStats, '#45c2e5');
        
        const box2 = document.createElement('div');
        box2.style.cssText = 'background:#1a1420;border:2px solid #4ade80;border-radius:8px;padding:14px;font-size:13px;color:#fff;min-width:320px;box-shadow:0 4px 20px rgba(0,0,0,.5)';
        box2.innerHTML = buildTooltipContent(`${card.title} LB${lb} [POST ${bondText}]`, combinedStats, '#4ade80');
        
        cardTooltipContainer.appendChild(box1);
        cardTooltipContainer.appendChild(box2);
        cardTooltipContainer.style.display = 'flex';
        
        const rect = e.target.getBoundingClientRect();
        const containerWidth = 320 * 2;
        let left = rect.right + 10;
        let top = rect.top;
        if (left + containerWidth > window.innerWidth) left = Math.max(5, rect.left - containerWidth - 10);
        if (top + 400 > window.innerHeight) top = window.innerHeight - 400 - 10;
        if (top < 0) top = 5;
        
        cardTooltipContainer.style.left = left + 'px';
        cardTooltipContainer.style.top = top + 'px';
    } else {
        const box = document.createElement('div');
        box.style.cssText = 'background:#1a1420;border:2px solid #45c2e5;border-radius:8px;padding:14px;font-size:13px;color:#fff;min-width:340px;box-shadow:0 4px 20px rgba(0,0,0,.5)';
        box.innerHTML = buildTooltipContent(`${card.title} LB${lb}`, combinedStats, '#45c2e5');
        cardTooltipContainer.appendChild(box);
        cardTooltipContainer.style.display = 'block';
        
        const rect = e.target.getBoundingClientRect();
        let left = rect.right + 10;
        let top = rect.top;
        if (left + 340 > window.innerWidth) left = rect.left - 350;
        if (top + 400 > window.innerHeight) top = window.innerHeight - 400 - 10;
        if (top < 0) top = 5;
        if (left < 0) left = 5;
        
        cardTooltipContainer.style.left = left + 'px';
        cardTooltipContainer.style.top = top + 'px';
    }
}

function hideCardTooltip() {
    if (cardTooltipContainer) cardTooltipContainer.style.display = 'none';
}

let cardTooltipEl = null;
function showCardTooltipEl(e, card, lb) {
    if (!cardTooltipEl) {
        cardTooltipEl = document.createElement('div');
        cardTooltipEl.id = 'card-tooltip';
        cardTooltipEl.style.cssText = 'position:fixed;z-index:9999;background:#1a1420;border:2px solid #45c2e5;border-radius:8px;padding:14px;font-size:13px;color:#fff;pointer-events:none;box-shadow:0 4px 20px rgba(0,0,0,.5);max-width:340px';
        document.body.appendChild(cardTooltipEl);
    }
    const stats = getCombinedCardStats(card, lb);
    if (!stats) return;
    
    let html = `<div style="font-weight:700;color:#45c2e5;margin-bottom:8px;border-bottom:1px solid rgba(255,255,255,.1);padding-bottom:6px">${card.title} LB${lb}</div>`;
    html += '<div style="display:grid;grid-template-columns:1fr 1fr;gap:6px 16px">';
    
    const statRow = (label, value, color) => {
        if (value === 0) return '';
        const formatted = Number.isInteger(value) ? value : value.toFixed(2);
        return `<div style="display:flex;justify-content:space-between;gap:12px"><span style="color:${color}">${label}</span><span style="font-weight:600">${value > 0 ? '+' : ''}${formatted}</span></div>`;
    };
    
    html += statRow('Speed', stats.speed_bonus, '#45c2e5');
    html += statRow('Stamina', stats.stamina_bonus, '#22c55e');
    html += statRow('Power', stats.power_bonus, '#f59e0b');
    html += statRow('Guts', stats.guts_bonus, '#ec4899');
    html += statRow('Wits', stats.wits_bonus, '#8b5cf6');
    html += statRow('SP', stats.skill_point_bonus, '#06b6d4');
    html += '</div>';
    
    if (stats.training_effectiveness || stats.mood_effect || stats.failure_rate_drop || stats.vital_cost_drop || stats.friendship_bonus) {
        html += '<div style="margin-top:8px;border-top:1px solid rgba(255,255,255,.1);padding-top:6px">';
        html += statRow('Training Eff', stats.training_effectiveness, '#10b981');
        html += statRow('Mood', stats.mood_effect, '#f472b6');
        html += statRow('Fail Rate Drop', stats.failure_rate_drop, '#ef4444');
        html += statRow('Energy Cost Red', stats.vital_cost_drop, '#fbbf24');
        html += statRow('Friendship Bonus', stats.friendship_bonus, '#a78bfa');
        html += '</div>';
    }
    
    if (stats.race_bonus || stats.fan_bonus || stats.initial_friendship_gauge || stats.hint_frequency) {
        html += '<div style="margin-top:8px;border-top:1px solid rgba(255,255,255,.1);padding-top:6px">';
        html += statRow('Race Bonus', stats.race_bonus, '#f59e0b');
        html += statRow('Fan Bonus', stats.fan_bonus, '#ec4899');
        html += statRow('Initial Friend', stats.initial_friendship_gauge, '#8b5cf6');
        html += statRow('Hint Freq', stats.hint_frequency, '#06b6d4');
        html += '</div>';
    }
    
    if (stats.initial_speed || stats.initial_stamina || stats.initial_power || stats.initial_guts || stats.initial_wits) {
        html += '<div style="margin-top:8px;border-top:1px solid rgba(255,255,255,.1);padding-top:6px">';
        html += statRow('Init Spd', stats.initial_speed, '#45c2e5');
        html += statRow('Init Sta', stats.initial_stamina, '#22c55e');
        html += statRow('Init Pow', stats.initial_power, '#f59e0b');
        html += statRow('Init Gut', stats.initial_guts, '#ec4899');
        html += statRow('Init Wis', stats.initial_wits, '#8b5cf6');
        html += '</div>';
    }
    
    cardTooltipEl.innerHTML = html;
    cardTooltipEl.style.display = 'block';
    
    const rect = e.target.getBoundingClientRect();
    let left = rect.right + 10;
    let top = rect.top;
    if (left + 340 > window.innerWidth) left = rect.left - 350;
    if (top + cardTooltipEl.offsetHeight > window.innerHeight) top = window.innerHeight - cardTooltipEl.offsetHeight - 10;
    cardTooltipEl.style.left = left + 'px';
    cardTooltipEl.style.top = top + 'px';
}

function hideCardTooltipEl() {
    if (cardTooltipEl) cardTooltipEl.style.display = 'none';
}

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
        el.addEventListener('mouseenter', e => {
            const baseId = el.dataset.baseId;
            const lb = parseInt(el.dataset.lb);
            const card = allCards.find(x => x.id === baseId);
            if (card) showCardTooltip(e, card, lb);
        });
        el.addEventListener('mouseleave', hideCardTooltip);
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
    document.getElementById('deckList').innerHTML=deck.map((item,idx)=>`<div class="deck-card" data-base-id="${item.id}" data-lb="${item.lb}">
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
    document.querySelectorAll('.deck-card').forEach(el => {
        el.addEventListener('mouseenter', e => {
            const baseId = el.dataset.baseId;
            const lb = parseInt(el.dataset.lb);
            const card = allCards.find(x => x.id === baseId);
            if (card) showCardTooltip(e, card, lb);
        });
        el.addEventListener('mouseleave', hideCardTooltip);
    });
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
    document.getElementById('poolCards').innerHTML=rankPool.map(item=>`<div class="rank-card" draggable="true" data-key="${item.id}_lb${item.lb}" data-base-id="${item.id}" data-lb="${item.lb}">
        <img src="${item.card.image_url}" onerror="this.src='${NO_IMG}'">
        <div class="rank-card-title">${item.card.title}</div>
        <div class="rank-card-type">${item.card.type||''} LB${item.lb}</div>
        <div class="rank-card-stats">
            <span class="pill race">${getVal(item.card,item.lb,'race_bonus')}</span>
            <span class="pill fan">${getVal(item.card,item.lb,'fan_bonus')}</span>
        </div>
    </div>`).join('');
    document.querySelectorAll('.rank-card').forEach(el=>{
        el.addEventListener('mouseenter', e => {
            const baseId = el.dataset.baseId;
            const lb = parseInt(el.dataset.lb);
            const card = allCards.find(x => x.id === baseId);
            if (card) showCardTooltip(e, card, lb);
        });
        el.addEventListener('mouseleave', hideCardTooltip);
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
        let statCaps=['capSpd','capSta','capPow','capGut','capWis'].map(id=>+document.getElementById(id).value||1200);
        let hardStatCaps=[1200,1200,1200,1200,1200];
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
                statCaps,
                hardStatCaps,
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
        let statCaps=['capSpd','capSta','capPow','capGut','capWis'].map(id=>+document.getElementById(id).value||1200);
        let hardStatCaps=[1200,1200,1200,1200,1200];
        let candidates=rankPool.map(i=>({card_id:i.id,lb:i.lb}));
        let deckIds=new Set(deckData.map(x=>x.card_id));
        candidates=candidates.filter(c=>!deckIds.has(c.card_id));
        rankTotalCandidates=candidates.length;
        document.getElementById('results').innerHTML=`<div class="results"><h3>Ranking ${rankTotalCandidates} Cards...</h3><div class="progress-container"><div class="progress-bar"><div class="progress-fill" id="pf" style="width:0%"></div></div><div class="progress-text" id="pt">Starting ${rankTotalCandidates} workers...</div></div></div>`;
        let rankCandidates=candidates.map(c=>{
            let testDeck=[...deckData,c];
            return{
                deckData:testDeck,
                options:{numSimulations:simCount,maxTurns:simTurns,raceSchedule:raceList,statBonus,startingStats:startStats,statCaps,hardStatCaps,confident:document.getElementById('confidentToggle').checked},
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
                try {
                    let results = rankCompletedResults;
                    results.sort((a,b)=>b.avg_total-a.avg_total);
                    let rankedResults=results.map(r=>{
                        let c=allCards.find(x=>x.id===r.cardId);
                        let avg=r.avg_stats;
                        return{baseId:r.cardId,lb:r.cardLb,card:c,avgScore:r.avg_total,avg,avgSp:r.avg_skill_points};
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
                } finally {
                    document.getElementById('btnRank').disabled=false;
                    document.getElementById('btnRank').textContent='Rank Pool';
                }
            }
        });
    }catch(e){document.getElementById('results').innerHTML=`<div style="color:#ef4444;padding:1rem">Error: ${e}</div>`;this.disabled=false;this.textContent='Rank Pool';}
};

const scrollTopBtn=Object.assign(document.createElement('button'),{innerHTML:'&#x25B2;',title:'Scroll to top',style:'position:fixed;bottom:80px;right:16px;width:44px;height:44px;border-radius:50%;background:var(--accent,#45c2e5);color:#000;border:none;font-size:20px;cursor:pointer;z-index:9999;display:none;box-shadow:0 4px 12px rgba(0,0,0,.3);opacity:0.8',onclick:()=>window.scrollTo({top:0,behavior:'smooth'})});
const scrollBottomBtn=Object.assign(document.createElement('button'),{innerHTML:'&#x25BC;',title:'Scroll to bottom',style:'position:fixed;bottom:16px;right:16px;width:44px;height:44px;border-radius:50%;background:var(--accent,#45c2e5);color:#000;border:none;font-size:20px;cursor:pointer;z-index:9999;display:none;box-shadow:0 4px 12px rgba(0,0,0,.3);opacity:0.8',onclick:()=>window.scrollTo({top:document.body.scrollHeight,behavior:'smooth'})});
document.body.append(scrollTopBtn,scrollBottomBtn);
let scrollTimeout;
window.addEventListener('scroll',function(){
    scrollTopBtn.style.display=window.scrollY>300?'block':'none';
    scrollBottomBtn.style.display=window.innerHeight+window.scrollY<document.body.scrollHeight-100?'block':'none';
    clearTimeout(scrollTimeout);
    scrollTimeout=setTimeout(()=>{scrollTopBtn.style.display='none';scrollBottomBtn.style.display='none';},3000);
},{passive:true});

init();
