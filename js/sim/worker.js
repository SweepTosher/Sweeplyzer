const CARD_TYPE_MAP = { 'speed': 0, 'stamina': 1, 'power': 2, 'guts': 3, 'wisdom': 4, 'friend': 6, 'group': 6 };
const TRA_SPEED = 0, TRA_STAMINA = 1, TRA_POWER = 2, TRA_GUTS = 3, TRA_WISDOM = 4, TRA_REST = 5, TRA_NONE = -1;
const PRACTICE_PERFECT = 1, PRACTICE_POOR = 2, SKIN_OUTBREAK = 3;
const DATE_JUNIOR_END = 23, DATE_CLASSIC_END = 47, DATE_SENIOR_END = 71, DATE_SPRING_END = 59;
const STATUS_EFFECTS = { [PRACTICE_PERFECT]: { failure_mod: -2, stat_mod: 0, mood_mod: 0 }, [PRACTICE_POOR]: { failure_mod: 2, stat_mod: -10, mood_mod: -1 }, [SKIN_OUTBREAK]: { failure_mod: 0, stat_mod: 0, mood_mod: 0 } };
const SKIN_OUTBREAK_MOOD_CHANCE = 0.50;
const MEDIC_CURE_CHANCE = 0.90;
const MEDIC_ENERGY_RECOVERY = 20;
const NEGATIVE_CONDITIONS = [PRACTICE_POOR, SKIN_OUTBREAK];
const RACE_PUNISHMENT_MOOD = [[0, 0, 0.60, 1.0], [0.15, 0.33, 0.90, 1.0]];
const RACE_PUNISHMENT_SKIN = [[0, 0, 0.15, 0.33], [0.04, 0.08, 0.25, 0.33]];
const RACE_PUNISHMENT_STATS = [[0, 0, 0, 0.40], [0, 0, 0, 0.40]];
const PRACTICE_FAIL_EVENT = { name: "Normal Get Well Soon!", top_path: { roll_threshold: 92, outcomes: [{ state: null, stat_penalty: -5, mood_penalty: -1, weight: 92 }, { state: PRACTICE_POOR, stat_penalty: -5, mood_penalty: -1, weight: 8 }] }, bottom_path: { roll_threshold: 85, outcomes: [{ state: null, stat_penalty: -10, mood_penalty: -1, weight: 30 }, { state: PRACTICE_POOR, stat_penalty: -10, mood_penalty: -1, weight: 55 }, { state: PRACTICE_PERFECT, stat_penalty: 0, mood_penalty: 0, weight: 15 }] }, get_path: function (state) { if (state.has_status(PRACTICE_POOR) || state.turn <= DATE_JUNIOR_END) return this.bottom_path; return this.top_path; } };
const OTONASHI_APPEAR_DAY = 12, OTONASHI_APPEAR_CHANCE = 0.5;
const RACE_PLACEMENT_VICTORY = 0, RACE_PLACEMENT_SOLID = 1, RACE_PLACEMENT_DEFEAT = 2;
const RACE_REWARDS = { [RACE_PLACEMENT_VICTORY]: { top: { energy: -15, g1: [10, 45], g23: [8, 35], op: [5, 30] }, bot: { energy_a: -5, energy_b: -20, g1: [10, 45], g23: [8, 35], op: [5, 30] } }, [RACE_PLACEMENT_SOLID]: { top: { energy: -20, g1: [8, 45], g23: [5, 35], op: [3, 30] }, bot: { energy_a: -10, energy_b: -30, g1: [8, 45], g23: [5, 35], op: [3, 30] } }, [RACE_PLACEMENT_DEFEAT]: { top: { energy: -25, g1: [4, 25], g23: [3, 20], op: [0, 10] }, bot: { energy_a: -15, energy_b: -35, g1: [4, 25], g23: [3, 20], op: [0, 10] } } };
const PLACEMENT_CONFIDENT = [80, 15, 5], PLACEMENT_NORMAL = [65, 25, 10];
const TOP_TRIGGER_CONFIDENT = 15, TOP_TRIGGER_NORMAL = 5;
const ELATED_COVERAGE_CONFIDENT = 0.15, ELATED_COVERAGE_NORMAL = 0.05;
const REST_THRESHOLD = 48;
const SUMMER_CAMP_1_START = 36, SUMMER_CAMP_1_END = 40, SUMMER_CAMP_2_START = 60, SUMMER_CAMP_2_END = 64;
const TOTAL_TURN = 78;
const TRAINING_BASIC_VALUE = [[[8, 0, 4, 0, 0, 2, -19], [9, 0, 4, 0, 0, 2, -20], [10, 0, 4, 0, 0, 2, -21], [11, 0, 5, 0, 0, 2, -23], [12, 0, 6, 0, 0, 2, -25]], [[0, 7, 0, 3, 0, 2, -17], [0, 8, 0, 3, 0, 2, -18], [0, 9, 0, 3, 0, 2, -19], [0, 10, 0, 4, 0, 2, -21], [0, 11, 0, 5, 0, 2, -23]], [[0, 4, 6, 0, 0, 2, -18], [0, 4, 7, 0, 0, 2, -19], [0, 4, 8, 0, 0, 2, -20], [0, 5, 9, 0, 0, 2, -22], [0, 6, 10, 0, 0, 2, -24]], [[3, 0, 3, 6, 0, 2, -20], [3, 0, 3, 7, 0, 2, -21], [3, 0, 3, 8, 0, 2, -22], [4, 0, 3, 9, 0, 2, -24], [4, 0, 4, 10, 0, 2, -26]], [[2, 0, 0, 0, 6, 3, 5], [2, 0, 0, 0, 7, 3, 5], [2, 0, 0, 0, 8, 3, 5], [3, 0, 0, 0, 9, 3, 5], [4, 0, 0, 0, 10, 3, 5]]];
const FAIL_RATE_BASIC = [[520, 524, 528, 532, 536], [507, 511, 515, 519, 523], [516, 520, 524, 528, 532], [532, 536, 540, 544, 548], [320, 321, 322, 323, 324]];
const SUMMER_CONSERVE_DATES = [34, 35, 58, 59], SUMMER_CONSERVE_ENERGY = 60;
const FAVOR_LEVEL_1 = 1, FAVOR_LEVEL_2 = 2, FAVOR_LEVEL_3 = 3, FAVOR_LEVEL_4 = 4;
const SUMMER = new Set([36, 37, 38, 39, 60, 61, 62, 63]);
function getFavorLevel(bond) { if (bond >= 100) return FAVOR_LEVEL_4; else if (bond >= 80) return FAVOR_LEVEL_3; else if (bond >= 60) return FAVOR_LEVEL_2; return FAVOR_LEVEL_1; }
function getPlacementTable(baseTable, motivation) {
    const penalty = Math.max(0, 5 - motivation);
    return [baseTable[0] - penalty, baseTable[1] - penalty, baseTable[2] + penalty * 2];
}
const DEFAULT_BASE_SCORES = [0.0, 0.0, 0.0, 0.0, 0.07];
const DEFAULT_SCORE_VALUE = [[0.11, 0.10, 0.0025, 0.09], [0.11, 0.10, 0.0225, 0.09], [0.11, 0.10, 0.03, 0.09], [0.03, 0.05, 0.03, 0.09], [0, 0, 0.0675, 0]];
const DEFAULT_STAT_VALUE_MULTIPLIER = [0.01, 0.01, 0.01, 0.01, 0.01, 0.005];
const DEFAULT_NPC_SCORE_VALUE = [[0.05, 0.05, 0.05], [0.05, 0.05, 0.05], [0.05, 0.05, 0.05], [0.03, 0.05, 0.05], [0, 0, 0.05]];
const DEFAULT_PAL_FRIENDSHIP_SCORES = [0.08, 0.057, 0.018];
const DEFAULT_PAL_CARD_MULTIPLIER = 0.1;
const DEFAULT_SUMMER_SCORE_THRESHOLD = 0.34;
const ENERGY_FAST_MEDIC = 60, ENERGY_FAST_TRIP = 60, ENERGY_MEDIC_GENERAL = 70, ENERGY_TRIP_GENERAL = 70, ENERGY_REST_EXTRA_DAY = 65;
const MIN_SUPPORT_GOOD_TRAINING = 3, DEFAULT_REST_THRESHOLD = 48;
const URA_RACE_WINDOWS = [[73, 75], [76, 78], [79, 99]];
const DEFAULT_MOTIVATION_THRESHOLD_YEAR1 = 3, DEFAULT_MOTIVATION_THRESHOLD_YEAR2 = 4, DEFAULT_MOTIVATION_THRESHOLD_YEAR3 = 4;
const CARD_TYPE_SPEED = 0, CARD_TYPE_STAMINA = 1, CARD_TYPE_POWER = 2, CARD_TYPE_GUTS = 3, CARD_TYPE_WISDOM = 4, CARD_TYPE_FRIEND = 6, CARD_TYPE_GROUP = 6, CARD_TYPE_NPC = 10;
const TRAINING_NAMES = ['Speed', 'Stamina', 'Power', 'Guts', 'Wisdom'];
const STAT_KEYS = ['speed', 'stamina', 'power', 'guts', 'wits', 'sp'];
class CareerState {
    constructor() {
        this.turn = 0; this.vital = 100; this.maxVital = 100; this.motivation = 3;
        this.fiveStatus = [0, 0, 0, 0, 0]; this.fiveStatusLimit = [9999, 9999, 9999, 9999, 9999];
        this.stat_bonus_pct = [0, 0, 0, 0, 0]; this.skillPt = 120; this.skillScore = 0;
        this.trainLevelCount = [0, 0, 0, 0, 0]; this.friendship = [0, 0, 0, 0, 0, 0];
        this.uniqueEffectState = {}; this.medic_room_available = false; this.medic_uses_remaining = 5;
        this.last_medic_turn = -10; this.debut_race_win = false; this.ura_races_completed = [false, false, false];
        this.status_effects = []; this.otonashi_bond = 0; this.otonashi_appeared = false;
        this.otonashi_facility = -1; this.consecutive_races = 0;
    }
    has_status(status_id) { return this.status_effects.includes(status_id); }
    add_status_effect(status_id) { if (!this.has_status(status_id)) this.status_effects.push(status_id); }
    remove_status_effect(status_id) { this.status_effects = this.status_effects.filter(s => s !== status_id); }
    has_negative_condition() { return this.status_effects.some(s => NEGATIVE_CONDITIONS.includes(s)); }
    remove_random_negative() { const negatives = this.status_effects.filter(s => NEGATIVE_CONDITIONS.includes(s)); if (negatives.length === 0) return; this.remove_status_effect(negatives[Math.floor(Math.random() * negatives.length)]); }
    get_status_modifier(effect_key) { let total = 0; for (const status_id of this.status_effects) { const effect = STATUS_EFFECTS[status_id]; if (effect && effect[effect_key] !== undefined) total += effect[effect_key]; } return total; }
    get_otonashi_bonus() { const b = this.otonashi_bond; if (b <= 20) return 2; if (b <= 59) return 3; if (b <= 79) return 4; if (b <= 99) return Math.random() < 0.5 ? 5 : 4; return Math.random() < 0.6 ? 5 : 4; }
    get_facility_level(train_type) { return Math.floor(this.trainLevelCount[train_type] / 4); }
    get_training_level(train_type) { if (this.is_summer_camp()) return 4; return Math.min(4, Math.floor(this.trainLevelCount[train_type] / 4)); }
    add_training_level(train_type, n = 1) { this.trainLevelCount[train_type] = Math.min(16, this.trainLevelCount[train_type] + n); }
    add_status(idx, value) { if (value > 0 && idx < this.stat_bonus_pct.length) value += Math.floor(value * 0.01 * this.stat_bonus_pct[idx]); this.fiveStatus[idx] = Math.max(1, Math.min(this.fiveStatusLimit[idx], this.fiveStatus[idx] + value)); }
    add_vital(value) { this.vital = Math.max(0, Math.min(this.maxVital, this.vital + value)); }
    add_motivation(value) { this.motivation = Math.max(1, Math.min(5, this.motivation + value)); }
    add_skill_pt(value) { this.skillPt = Math.max(0, this.skillPt + value); }
    add_friendship(idx, value) { if (0 <= idx && idx < 6) this.friendship[idx] = Math.min(100, this.friendship[idx] + value); }
    calculate_failure_rate(train_type, fail_rate_mult = 1.0) { const level = this.get_training_level(train_type); const x0 = 0.1 * FAIL_RATE_BASIC[train_type][level]; let f = 0.0; if (this.vital < x0) f = (100 - this.vital) * (x0 - this.vital) / 40.0; f += this.get_status_modifier('failure_mod'); return Math.max(0, Math.min(99, f * fail_rate_mult)); }
    get_period_index() { if (this.turn <= DATE_JUNIOR_END) return 0; else if (this.turn <= DATE_CLASSIC_END) return 1; else if (this.turn <= SUMMER_CAMP_2_START) return 2; else if (this.turn <= DATE_SENIOR_END) return 3; return 4; }
    is_summer_camp() { return SUMMER.has(this.turn); }
    is_terminal() { return this.turn >= TOTAL_TURN; }
    add_max_vital(value) { this.maxVital = Math.max(1, this.maxVital + value); this.vital = Math.min(this.maxVital, this.vital); }
    copy() { const s = new CareerState(); s.turn = this.turn; s.vital = this.vital; s.maxVital = this.maxVital; s.motivation = this.motivation; s.fiveStatus = this.fiveStatus.slice(); s.fiveStatusLimit = this.fiveStatusLimit.slice(); s.stat_bonus_pct = this.stat_bonus_pct.slice(); s.skillPt = this.skillPt; s.skillScore = this.skillScore; s.trainLevelCount = this.trainLevelCount.slice(); s.friendship = this.friendship.slice(); s.uniqueEffectState = Object.assign({}, this.uniqueEffectState); s.medic_room_available = this.medic_room_available; s.medic_uses_remaining = this.medic_uses_remaining; s.last_medic_turn = this.last_medic_turn; s.debut_race_win = this.debut_race_win; s.ura_races_completed = this.ura_races_completed.slice(); s.status_effects = [...this.status_effects]; s.otonashi_bond = this.otonashi_bond; s.otonashi_appeared = this.otonashi_appeared; s.otonashi_facility = this.otonashi_facility; s.consecutive_races = this.consecutive_races; return s; }
}
class SupportCard {
    constructor(cardData, lbLevel = 4) {
        this.id = cardData.id || ''; this.title = cardData.title || ''; this.rarity = cardData.rarity || 'R';
        this.type = cardData.type || 'speed'; this.card_type = CARD_TYPE_MAP[this.type] || 0;
        this.image_url = cardData.image_url || ''; this.unique_effect_id = cardData.unique_effect_id || null;
        const effectsList = cardData.effects || [];
        this.effects = [];
        for (let i = 0; i < 5; i++) {
            if (i < effectsList.length) {
                const d = effectsList[i];
                this.effects.push({ friendship_bonus: d.friendship_bonus || 0, training_bonus: d.training_bonus || 0, mood_effect: d.mood_effect || 0, speed_bonus: d.speed_bonus || 0, stamina_bonus: d.stamina_bonus || 0, power_bonus: d.power_bonus || 0, guts_bonus: d.guts_bonus || 0, wits_bonus: d.wits_bonus || 0, skill_point_bonus: d.skill_point_bonus || 0, initial_speed: d.initial_speed || 0, initial_stamina: d.initial_stamina || 0, initial_power: d.initial_power || 0, initial_guts: d.initial_guts || 0, initial_friendship_gauge: d.initial_friendship_gauge || 0, hint_frequency: d.hint_frequency || 0, specialty_priority: d.specialty_priority || 0, race_bonus: d.race_bonus || 0, fan_bonus: d.fan_bonus || 0 });
            } else { this.effects.push({}); }
        }
        this.lb_level = lbLevel;
        const effect = this.effects[lbLevel] || this.effects[this.effects.length - 1] || {};
        this.effect = effect;
        this.friendship_bonus = effect.friendship_bonus || 0; this.training_bonus = effect.training_bonus || 0; this.mood_effect = effect.mood_effect || 0;
        this.stat_bonus = [effect.speed_bonus || 0, effect.stamina_bonus || 0, effect.power_bonus || 0, effect.guts_bonus || 0, effect.wits_bonus || 0, effect.skill_point_bonus || 0];
        this.initial_bonus = [effect.initial_speed || 0, effect.initial_stamina || 0, effect.initial_power || 0, effect.initial_guts || 0, 0, 0];
        this.initial_friendship_gauge = effect.initial_friendship_gauge || 0;
        this.hint_frequency = effect.hint_frequency || 0; this.specialty_priority = effect.specialty_priority || 0;
        this.race_bonus = effect.race_bonus || 0; this.fan_bonus = effect.fan_bonus || 0;
        this.failure_rate_drop = 0; this.vital_cost_drop = 0;
    }
    is_friend_card() { return this.type === 'friend'; }
    is_group_card() { return this.type === 'group'; }
}
const STAT_NAME_MAP = { 'speed': 0, 'stamina': 1, 'power': 2, 'guts': 3, 'wit': 4 };
function parseUniqueEffect(effectData) {
    const ue = { id: effectData.id || '', text: effectData.text || '', bond_threshold: 0, full_bond: false, deck_type_min: 0, training_effectiveness: 0, friendship_bonus: 0, mood_effect: 0, speed_bonus: 0, stamina_bonus: 0, power_bonus: 0, guts_bonus: 0, wits_bonus: 0, skill_point_bonus: 0, failure_rate_drop: 0, vital_cost_drop: 0, initial_friendship_gauge: 0, initial_speed: 0, initial_stamina: 0, initial_power: 0, initial_guts: 0, initial_wits: 0, specialty_priority: 0, hint_frequency: 0, race_bonus: 0 };
    const t = ue.text.toLowerCase();
    if (t.includes('bond gauge is full')) { ue.full_bond = true; ue.bond_threshold = 100; } else if (t.includes('bond gauge is at least 80')) ue.bond_threshold = 80; else if (t.includes('bond gauge is at least 60')) ue.bond_threshold = 60;
    if (t.includes('at least 4 different types')) ue.deck_type_min = 4; else if (t.includes('at least 5 different types')) ue.deck_type_min = 5;
    let parts = [];
    if (t.includes(' and ') && !ue.text.trim().startsWith('If')) { const andParts = ue.text.split(' and '); parts = andParts.length === 2 ? [andParts[0].trim(), andParts[1].trim()] : [ue.text]; } else { const splits = ue.text.split(/(?<=\))\s+(?=[A-Z])/); parts = splits.length > 1 ? splits.map(s => s.trim()) : (ue.text.includes(';') ? ue.text.split(';').map(p => p.trim()) : [ue.text]); }
    for (const part of parts) _parsePart(part, ue);
    if (ue.id === 'ue_24') { ue.speed_bonus = 1; ue.stamina_bonus = 1; ue.power_bonus = 1; ue.guts_bonus = 1; ue.wits_bonus = 1; }
    if (ue.id === 'ue_32') ue.training_effectiveness = 5;
    if (ue.id === 'ue_37') ue.training_effectiveness = 5;
    if (ue.id === 'ue_39') ue.initial_friendship_gauge = 5;
    if (ue.id === 'ue_59') { ue.initial_speed = 10; ue.initial_stamina = 10; ue.initial_power = 10; ue.initial_guts = 10; ue.initial_wits = 10; }
    if (ue.id === 'ue_60') ue.training_effectiveness = 5;
    if (ue.id === 'ue_62') ue.training_effectiveness = 5;
    if (ue.id === 'ue_64') ue.training_effectiveness = 5;
    if (ue.id === 'ue_65') ue.training_effectiveness = 5;
    if (ue.id === 'ue_69') ue.training_effectiveness = 15;
    if (ue.id === 'ue_71') ue.failure_rate_drop = 20;
    if (ue.id === 'ue_73') ue.friendship_bonus = 10;
    if (ue.id === 'ue_79') ue.training_effectiveness = 5;
    if (ue.id === 'ue_82') ue.friendship_bonus = 10;
    if (ue.id === 'ue_83') ue.training_effectiveness = 10;
    if (ue.id === 'ue_85') ue.training_effectiveness = 20;
    if (ue.id === 'ue_90') { ue.friendship_bonus = 10; ue.training_effectiveness = 5; }
    return ue;
}
function _parsePart(text, ue) {
    const t = text.trim().toLowerCase();
    const pctMatch = t.match(/\((\d+)%\)/), intMatch = t.match(/\((\d+)\)/);
    const pctVal = pctMatch ? parseInt(pctMatch[1]) : 0, intVal = intMatch ? parseInt(intMatch[1]) : 0;
    if (t.includes('training effectiveness') || t.includes('increased training') || (t.includes('effectiveness of') && t.includes('training'))) { if (pctVal > 0) ue.training_effectiveness += pctVal; else if (intVal > 0) ue.training_effectiveness += intVal; if (t.includes('friendship')) ue.friendship_bonus += pctVal || intVal; return; }
    if (t.includes('friendship bonus')) { ue.friendship_bonus += intVal || pctVal; return; }
    if (t.includes('mood effect') || t.includes('amplifies the effect of mood')) { ue.mood_effect += pctVal || intVal; return; }
    for (const [statName, statIdx] of Object.entries(STAT_NAME_MAP)) {
        if (t.includes(`${statName} gain`) || t.includes(`gain ${statName} bonus`) || t.includes(`gain ${statName}`)) {
            const bonus = intVal || pctVal;
            if (statIdx === 0) ue.speed_bonus += bonus; else if (statIdx === 1) ue.stamina_bonus += bonus; else if (statIdx === 2) ue.power_bonus += bonus; else if (statIdx === 3) ue.guts_bonus += bonus; else if (statIdx === 4) ue.wits_bonus += bonus;
            return;
        }
    }
    if (t.includes('speed bonus')) { ue.speed_bonus += intVal; return; }
    if (t.includes('stamina bonus')) { ue.stamina_bonus += intVal; return; }
    if (t.includes('power bonus')) { ue.power_bonus += intVal; return; }
    if (t.includes('guts bonus')) { ue.guts_bonus += intVal; return; }
    if (t.includes('wit bonus')) { ue.wits_bonus += intVal; return; }
    if (t.includes('all stats bonus')) { ue.speed_bonus += intVal; ue.stamina_bonus += intVal; ue.power_bonus += intVal; ue.guts_bonus += intVal; ue.wits_bonus += intVal; return; }
    if (t.includes('skill point bonus')) { ue.skill_point_bonus += intVal; return; }
    if (t.includes('initial speed')) { ue.initial_speed += intVal; return; }
    if (t.includes('initial stamina')) { ue.initial_stamina += intVal; return; }
    if (t.includes('initial power')) { ue.initial_power += intVal; return; }
    if (t.includes('initial guts')) { ue.initial_guts += intVal; return; }
    if (t.includes('initial wit')) { ue.initial_wits += intVal; return; }
    if (t.includes('initial friendship gauge') || t.includes('initial friendship')) { ue.initial_friendship_gauge += intVal; return; }
    if (t.includes('initial stat up')) { ue.initial_speed += intVal; ue.initial_stamina += intVal; ue.initial_power += intVal; ue.initial_guts += intVal; ue.initial_wits += intVal; return; }
    if (t.includes('decreases the probability of failure') || t.includes('failure when training')) { ue.failure_rate_drop += pctVal || intVal; return; }
    if (t.includes('decreases energy consumed') || t.includes('energy cost reduction') || t.includes('energy cost')) { ue.vital_cost_drop += pctVal || intVal; return; }
    if (t.includes('specialty priority')) { ue.specialty_priority += intVal; return; }
    if (t.includes('hint') && (t.includes('frequency') || t.includes('quantity'))) { ue.hint_frequency += pctVal || intVal; return; }
    if (t.includes('skill point') && t.includes('gain')) { ue.skill_point_bonus += intVal; return; }
    if (t.includes('stat gain from races')) { const raceMatch = t.match(/races\s*\((\d+)%\)/); if (raceMatch) ue.race_bonus += parseInt(raceMatch[1]); return; }
    if (t.includes('frequency at which the character participates in their preferred')) { ue.specialty_priority += pctVal || intVal || 20; return; }
    if (t.includes('frequency at which hint events occur')) { ue.hint_frequency += pctVal || intVal; return; }
    if (t.includes('bonus bond from training')) { ue.initial_friendship_gauge += intVal; return; }
}
class UniqueEffectCalculator {
    constructor(deckCards, uniqueEffects) {
        this.deck_cards = deckCards; this.unique_effects = uniqueEffects; this.active_effects = [];
        for (const card of deckCards) { if (card.unique_effect_id && uniqueEffects[card.unique_effect_id]) this.active_effects.push(uniqueEffects[card.unique_effect_id]); }
        const uniqueTypesSet = new Set();
        for (const card of deckCards) { if (card.type !== 'friend' && card.type !== 'group') uniqueTypesSet.add(card.type); }
        this.unique_types = uniqueTypesSet.size;
    }
    get_stat_bonus_for_card(state, card) {
        const result = [0, 0, 0, 0, 0, 0];
        if (!card.unique_effect_id) return result;
        const ue = this.unique_effects[card.unique_effect_id];
        if (!ue) return result;
        const bonuses = [ue.speed_bonus, ue.stamina_bonus, ue.power_bonus, ue.guts_bonus, ue.wits_bonus, ue.skill_point_bonus];
        if (!bonuses.some(b => b > 0)) return result;
        if (ue.bond_threshold > 0) { const cardIdx = this.deck_cards.indexOf(card); if (cardIdx < 0 || state.friendship[cardIdx] < ue.bond_threshold) return result; }
        if (ue.full_bond) { const cardIdx = this.deck_cards.indexOf(card); if (cardIdx < 0 || state.friendship[cardIdx] < 100) return result; }
        for (let i = 0; i < 6; i++) result[i] += bonuses[i];
        return result;
    }
    get_training_effectiveness_for_card(state, card) {
        if (!card.unique_effect_id) return 0;
        const ue = this.unique_effects[card.unique_effect_id];
        if (!ue || ue.training_effectiveness <= 0) return 0;
        if (ue.bond_threshold > 0) { const cardIdx = this.deck_cards.indexOf(card); if (cardIdx < 0 || state.friendship[cardIdx] < ue.bond_threshold) return 0; }
        if (ue.full_bond) { const cardIdx = this.deck_cards.indexOf(card); if (cardIdx < 0 || state.friendship[cardIdx] < 100) return 0; }
        if (ue.deck_type_min > 0 && this.unique_types < ue.deck_type_min) return 0;
        return ue.training_effectiveness;
    }
    get_mood_effect_for_card(state, card) {
        if (!card.unique_effect_id) return 0;
        const ue = this.unique_effects[card.unique_effect_id];
        if (!ue || ue.mood_effect <= 0) return 0;
        if (ue.full_bond) { const cardIdx = this.deck_cards.indexOf(card); return cardIdx >= 0 && state.friendship[cardIdx] >= 100 ? ue.mood_effect : 0; }
        else if (ue.bond_threshold > 0) { const cardIdx = this.deck_cards.indexOf(card); return cardIdx >= 0 && state.friendship[cardIdx] >= ue.bond_threshold ? ue.mood_effect : 0; }
        return ue.mood_effect;
    }
    get_failure_rate_drop_for_card(state, card) { if (!card.unique_effect_id) return 0; const ue = this.unique_effects[card.unique_effect_id]; if (!ue) return 0; return Math.min(1.0, ue.failure_rate_drop / 100.0); }
    get_vital_cost_drop_for_card(state, card) { if (!card.unique_effect_id) return 0; const ue = this.unique_effects[card.unique_effect_id]; if (!ue) return 0; return Math.min(1.0, ue.vital_cost_drop / 100.0); }
    get_specialty_priority_bonus_for_card(state, card) { if (!card.unique_effect_id) return 0; const ue = this.unique_effects[card.unique_effect_id]; if (!ue || ue.specialty_priority <= 0) return 0; if (ue.bond_threshold > 0) { const cardIdx = this.deck_cards.indexOf(card); if (cardIdx >= 0 && state.friendship[cardIdx] < ue.bond_threshold) return 0; } return ue.specialty_priority; }
    get_friendship_bonus_for_card(state, card) {
        if (!card.unique_effect_id) return 0;
        const ue = this.unique_effects[card.unique_effect_id];
        if (!ue || ue.friendship_bonus <= 0) return 0;
        if (ue.bond_threshold > 0) { const cardIdx = this.deck_cards.indexOf(card); if (cardIdx < 0 || state.friendship[cardIdx] < ue.bond_threshold) return 0; }
        if (ue.full_bond) { const cardIdx = this.deck_cards.indexOf(card); if (cardIdx < 0 || state.friendship[cardIdx] < 100) return 0; }
        return ue.friendship_bonus;
    }
    get_hint_frequency_bonus_for_card(state, card) {
        if (!card.unique_effect_id) return 0;
        const ue = this.unique_effects[card.unique_effect_id];
        if (!ue || ue.hint_frequency <= 0) return 0;
        if (ue.bond_threshold > 0) { const cardIdx = this.deck_cards.indexOf(card); if (cardIdx >= 0 && state.friendship[cardIdx] < ue.bond_threshold) return 0; }
        return ue.hint_frequency;
    }
    get_initial_friendship_gauge_bonus() { let total = 0; for (const ue of this.active_effects) total += ue.initial_friendship_gauge; return total; }
    get_race_bonus() { let total = 0; for (const ue of this.active_effects) total += ue.race_bonus; return total; }
    get_initial_stat_bonus() { const result = [0, 0, 0, 0, 0]; for (const ue of this.active_effects) { result[0] += ue.initial_speed; result[1] += ue.initial_stamina; result[2] += ue.initial_power; result[3] += ue.initial_guts; result[4] += ue.initial_wits; } return result; }
    check_zero_failure_chance() { for (const ue of this.active_effects) { if (ue.failure_rate_drop >= 20 && ue.text.includes('20% chance')) return Math.random() < 0.20; } return false; }
}
function distributeCards(state, deckCards, effectCalculator) {
    const distribution = { 0: [], 1: [], 2: [], 3: [], 4: [] };
    const MAX_SUPPORT_CARDS_PER_FACILITY = 4;

    for (let idx = 0; idx < deckCards.length; idx++) {
        const card = deckCards[idx];
        if (card.is_friend_card() || card.is_group_card()) {
            let train = Math.floor(Math.random() * 5);
            if (distribution[train].length >= MAX_SUPPORT_CARDS_PER_FACILITY) {
                for (let f = 0; f < 5; f++) {
                    if (distribution[f].length < MAX_SUPPORT_CARDS_PER_FACILITY) { distribution[f].push(idx); break; }
                }
            } else {
                distribution[train].push(idx);
            }
            continue;
        }

        const specBonus = effectCalculator.get_specialty_priority_bonus_for_card(state, card);
        const weights = [];
        for (let t = 0; t < 5; t++) { weights.push(t === card.card_type ? 100 + card.specialty_priority + specBonus : 100); }

        const total = weights.reduce((a, b) => a + b, 0);
        let r = Math.random() * total, cumulative = 0, chosen = 0;
        for (let i = 0; i < weights.length; i++) { cumulative += weights[i]; if (r < cumulative) { chosen = i; break; } }

        if (distribution[chosen].length >= MAX_SUPPORT_CARDS_PER_FACILITY) {
            const available = [];
            const wavailable = [];
            for (let t = 0; t < 5; t++) {
                if (distribution[t].length < MAX_SUPPORT_CARDS_PER_FACILITY) {
                    available.push(t);
                    wavailable.push(weights[t]);
                }
            }
            if (available.length > 0) {
                const tot = wavailable.reduce((a, b) => a + b, 0);
                let r2 = Math.random() * tot, c2 = 0;
                for (let i = 0; i < available.length; i++) {
                    c2 += wavailable[i];
                    if (r2 < c2) { chosen = available[i]; break; }
                }
            } else {
                chosen = 0;
            }
        }

        distribution[chosen].push(idx);
    }

    const hintsByFacility = { 0: null, 1: null, 2: null, 3: null, 4: null };
    const BASE_HINT_CHANCE = 7.5;

    for (let f = 0; f < 5; f++) {
        const cardsAt = distribution[f] || [];
        const candidateCards = [];

        for (const cardIdx of cardsAt) {
            const card = deckCards[cardIdx];
            const hintBonus = effectCalculator.get_hint_frequency_bonus_for_card(state, card);
            const totalHintFreq = card.hint_frequency + hintBonus;
            const finalChance = BASE_HINT_CHANCE * (1 + totalHintFreq / 100);

            if (Math.random() * 100 < finalChance) {
                candidateCards.push(cardIdx);
            }
        }

        if (candidateCards.length > 0) {
            const winnerIdx = candidateCards[Math.floor(Math.random() * candidateCards.length)];
            hintsByFacility[f] = winnerIdx;
        }
    }

    return { distribution, hintsByFacility };
}
function calculateTrainingValue(state, trainType, cardsAtTraining, deckCards, effectCalculator) {
    const level = state.get_training_level(trainType);
    const base = [...TRAINING_BASIC_VALUE[trainType][level]];
    for (const cardIdx of cardsAtTraining) {
        const card = deckCards[cardIdx];
        for (let i = 0; i < 6; i++) { if (base[i] > 0 && i < card.stat_bonus.length) base[i] += card.stat_bonus[i]; }
        const ueStatBonus = effectCalculator.get_stat_bonus_for_card(state, card);
        for (let i = 0; i < 6; i++) { if (base[i] > 0 && i < ueStatBonus.length) base[i] += ueStatBonus[i]; }
    }
    let totalTraining = 0, totalMotivation = 0;
    let totalVitalDrop = 0;
    let failRateMult = 1.0;
    for (const cardIdx of cardsAtTraining) {
        const card = deckCards[cardIdx];
        totalTraining += card.training_bonus; totalMotivation += card.mood_effect;
        totalTraining += effectCalculator.get_training_effectiveness_for_card(state, card);
        totalMotivation += effectCalculator.get_mood_effect_for_card(state, card);
        const cardVDrop = card.vital_cost_drop + effectCalculator.get_vital_cost_drop_for_card(state, card) * 100;
        totalVitalDrop += cardVDrop;
        const cardFDrop = card.failure_rate_drop + effectCalculator.get_failure_rate_drop_for_card(state, card) * 100;
        failRateMult *= (1.0 - 0.01 * cardFDrop);
    }
    const vitalCostMult = 1.0 - (0.01 * totalVitalDrop);
    const shiningIndices = [];
    for (const cardIdx of cardsAtTraining) {
        const card = deckCards[cardIdx];
        if (card.card_type === trainType && state.friendship[cardIdx] >= 80) shiningIndices.push(cardIdx);
    }
    const headNum = Math.min(cardsAtTraining.length + 1, 5);
    const crowdMult = 1.0 + 0.05 * headNum;
    const trainingMult = 1.0 + 0.01 * totalTraining;
    const motivationFactor = 0.1 * (state.motivation - 3) * (1 + 0.01 * totalMotivation);
    const motivationMult = 1.0 + motivationFactor;
    let friendshipMult = 1.0;
    for (const cardIdx of shiningIndices) {
        const card = deckCards[cardIdx];
        const baseFb = card.friendship_bonus;
        const ueFb = effectCalculator.get_friendship_bonus_for_card(state, card);
        friendshipMult *= (1.0 + 0.01 * baseFb) * (1.0 + 0.01 * ueFb);
    }
    const cardMultiplier = crowdMult * trainingMult * motivationMult * friendshipMult;
    const statGains = [];
    for (let i = 0; i < 6; i++) { statGains.push(Math.max(0, Math.floor(base[i] * cardMultiplier))); }
    const vitalChange = base[6] < 0 ? Math.floor(base[6] * vitalCostMult) : base[6];
    const failureRate = state.calculate_failure_rate(trainType, failRateMult);
    return { statGains, vitalChange, failureRate };
}
class TrainingScorer {
    constructor(deckCards, effectCalculator, statCaps) { this.deck_cards = deckCards; this.effect_calculator = effectCalculator; this.stat_caps = statCaps || [1200, 1200, 1200, 1200, 1200]; }
    _getWeights(date) {
        if (SUMMER.has(date)) return DEFAULT_SCORE_VALUE[1]; // Use Year 2 (high priority) weights for all summer camps
        if (date <= DATE_JUNIOR_END) return DEFAULT_SCORE_VALUE[0];
        else if (date <= DATE_CLASSIC_END) return DEFAULT_SCORE_VALUE[1];
        else if (date <= DATE_SPRING_END) return DEFAULT_SCORE_VALUE[2];
        else if (date <= DATE_SENIOR_END) return DEFAULT_SCORE_VALUE[3];
        return DEFAULT_SCORE_VALUE[4];
    }
    _getNpcScores(periodIdx, favor) { if (periodIdx >= DEFAULT_NPC_SCORE_VALUE.length) periodIdx = DEFAULT_NPC_SCORE_VALUE.length - 1; const npcArr = DEFAULT_NPC_SCORE_VALUE[periodIdx]; return favor === FAVOR_LEVEL_1 ? npcArr[0] : favor === FAVOR_LEVEL_2 ? npcArr[1] : npcArr[2]; }
    computeScores(state, distribution) {
        const date = state.turn, energy = state.vital, periodIdx = state.get_period_index();
        const w = this._getWeights(date);
        const w_lv1 = w[0], w_lv2 = w[1], w_energy_change = w[2], w_hint = w[3];
        const statMult = DEFAULT_STAT_VALUE_MULTIPLIER;
        const baseScores = [...DEFAULT_BASE_SCORES];
        let highestStatIdx = null;
        if (48 < date && date <= 72) highestStatIdx = state.fiveStatus.indexOf(Math.max(...state.fiveStatus));
        const computedScores = [0.0, 0.0, 0.0, 0.0, 0.0];
        const trainingData = [null, null, null, null, null];
        for (let idx = 0; idx < 5; idx++) {
            const cardsAt = distribution[idx] || [];
            const { statGains, vitalChange, failureRate } = calculateTrainingValue(state, idx, cardsAt, this.deck_cards, this.effect_calculator);
            trainingData[idx] = { statGains, vitalChange, failureRate };
            const targetType = idx; let score = baseScores[idx];
            let lv1c = 0, lv2c = 0, lv1Total = 0.0, lv2Total = 0.0, palCount = 0;
            for (const cardIdx of cardsAt) {
                const card = this.deck_cards[cardIdx];
                const favor = getFavorLevel(state.friendship[cardIdx]), ctype = card.card_type;
                if (card.is_friend_card()) { palCount++; const palScores = DEFAULT_PAL_FRIENDSHIP_SCORES; if (favor === FAVOR_LEVEL_1) score += palScores[0]; else if (favor === FAVOR_LEVEL_2) score += palScores[1]; else if (favor >= FAVOR_LEVEL_3) score += palScores[2]; continue; }
                if (card.is_group_card()) { if (favor === FAVOR_LEVEL_1) score += w_lv1; else if (favor === FAVOR_LEVEL_2) score += w_lv2; continue; }
                if (favor >= FAVOR_LEVEL_3 && ctype === targetType) continue;
                if (favor >= FAVOR_LEVEL_3 && ctype !== targetType) continue;
                if (favor === FAVOR_LEVEL_1) { lv1c += 1; lv1Total += w_lv1; score += w_lv1; }
                else if (favor === FAVOR_LEVEL_2) { lv2c += 1; lv2Total += w_lv2; score += w_lv2; }
            }
            let statScore = 0.0;
            for (let skIdx = 0; skIdx < 6; skIdx++) {
                const sv = statGains[skIdx];
                if (sv > 0) { let bonusMult = 1.0; if (skIdx < 5) bonusMult = 1.0 + 0.01 * state.stat_bonus_pct[skIdx]; statScore += sv * statMult[skIdx] * bonusMult; }
            }
            score += statScore;
            let energyChangeContrib = vitalChange * 0.0056;
            if (energy >= 80 && vitalChange < 0) energyChangeContrib *= 0.9;
            score += energyChangeContrib;
            let hintProb = 0;
            const BASE_HINT_CHANCE = 7.5;
            for (const cardIdx of cardsAt) {
                const card = this.deck_cards[cardIdx];
                const hintBonus = this.effect_calculator.get_hint_frequency_bonus_for_card(state, card);
                const totalHintFreq = card.hint_frequency + hintBonus;
                const cardHintChance = (BASE_HINT_CHANCE * (1 + totalHintFreq / 100)) / 100;
                // Probability that at least one card has a hint: 1 - product(1 - p_i)
                hintProb = 1 - (1 - hintProb) * (1 - cardHintChance);
            }
            if (hintProb > 0) score += w_hint * hintProb;
            let palMult = 1.0;
            if (palCount > 0) { palMult = 1.0 + DEFAULT_PAL_CARD_MULTIPLIER; score *= palMult; }
            let failMult = 1.0;
            if (failureRate >= 0) { failMult = Math.max(0.0, 1.0 - failureRate / 50.0); score *= failMult; }
            if (idx === TRA_WISDOM) { if (energy > 90) { score *= date > 72 ? 0.35 : 0.75; } else if (energy < 85) { score *= 1.03; } }
            if (state.otonashi_appeared && state.otonashi_facility === idx) { score += state.get_otonashi_bonus() * 0.01; }
            const statIdx = idx < 5 ? idx : 0;
            if (statIdx < 5 && this.stat_caps && this.stat_caps[statIdx] > 0) {
                const capVal = this.stat_caps[statIdx];
                const currVal = state.fiveStatus[statIdx];
                const ratio = currVal / capVal;
                let capMult = 1.0;
                if (ratio > 0.95) capMult = 0.0;
                else if (ratio >= 0.90) capMult = 0.7;
                else if (ratio >= 0.80) capMult = 0.8;
                else if (ratio >= 0.70) capMult = 0.9;
                score *= capMult;
            }
            computedScores[idx] = score;
        }
        if (highestStatIdx !== null) {
            computedScores[highestStatIdx] *= 0.95;
            for (let i = 0; i < 5; i++) {
                const cardsAt = distribution[i] || [];
                const sg = calculateTrainingValue(state, i, cardsAt, this.deck_cards, this.effect_calculator).statGains;
                if (highestStatIdx < 5 && sg[highestStatIdx] > 0) {
                    const bonusMult = 1.0 + 0.01 * state.stat_bonus_pct[highestStatIdx];
                    const penalty = sg[highestStatIdx] * statMult[highestStatIdx] * bonusMult * 0.05;
                    if (penalty > 0) computedScores[i] -= penalty;
                }
            }
        }
        return { computedScores, trainingData };
    }
    decideOperation(state, distribution) {
        const energy = state.vital, date = state.turn, medicAvailable = state.medic_room_available;
        const isSummer = SUMMER.has(date);
        let moodThreshold;
        if (date <= 36) moodThreshold = DEFAULT_MOTIVATION_THRESHOLD_YEAR1;
        else if (date <= 60) moodThreshold = DEFAULT_MOTIVATION_THRESHOLD_YEAR2;
        else moodThreshold = DEFAULT_MOTIVATION_THRESHOLD_YEAR3;
        const restThreshold = DEFAULT_REST_THRESHOLD;

        if (energy < ENERGY_FAST_TRIP && state.motivation < moodThreshold) {
            if (medicAvailable && state.has_negative_condition()) return { operation: 'medic', trainType: TRA_NONE };
            return { operation: isSummer ? 'SUMMER_RECREATION' : 'trip', trainType: TRA_NONE };
        }
        if (energy <= restThreshold) {
            if (medicAvailable && state.has_negative_condition()) return { operation: 'medic', trainType: TRA_NONE };
            return { operation: isSummer ? 'SUMMER_RECREATION' : 'rest', trainType: TRA_NONE };
        }

        const { computedScores } = this.computeScores(state, distribution);
        let maxScore = Math.max(...computedScores);
        const supportCardMax = Math.max(...[0, 1, 2, 3, 4].map(i => (distribution[i] || []).length));

        if (medicAvailable && energy <= ENERGY_MEDIC_GENERAL && state.has_negative_condition()) return { operation: 'medic', trainType: TRA_NONE };
        if (!medicAvailable && state.motivation < moodThreshold && energy < ENERGY_TRIP_GENERAL) {
            if ((date <= 36 && !(supportCardMax >= MIN_SUPPORT_GOOD_TRAINING)) || (40 < date && date <= 60) || (64 < date)) {
                if (maxScore <= 0.3) {
                    if (medicAvailable && state.has_negative_condition()) return { operation: 'medic', trainType: TRA_NONE };
                    return { operation: isSummer ? 'SUMMER_RECREATION' : 'trip', trainType: TRA_NONE };
                }
            }
        }
        if ((date === 35 || date === 59) && energy < ENERGY_REST_EXTRA_DAY) {
            if (medicAvailable && state.has_negative_condition()) return { operation: 'medic', trainType: TRA_NONE };
            return { operation: isSummer ? 'SUMMER_RECREATION' : 'rest', trainType: TRA_NONE };
        }
        if (SUMMER_CONSERVE_DATES.includes(date)) {
            if (maxScore < DEFAULT_SUMMER_SCORE_THRESHOLD) {
                if (energy < SUMMER_CONSERVE_ENERGY) {
                    if (medicAvailable && state.has_negative_condition()) return { operation: 'medic', trainType: TRA_NONE };
                    return { operation: isSummer ? 'SUMMER_RECREATION' : 'rest', trainType: TRA_NONE };
                }
                else return { operation: 'train', trainType: TRA_WISDOM };
            }
        }
        const eps = 1e-9; maxScore = Math.max(...computedScores);
        const ties = computedScores.map((s, i) => Math.abs(s - maxScore) < eps ? i : -1).filter(i => i >= 0);
        const chosen = ties.includes(TRA_WISDOM) ? TRA_WISDOM : Math.min(...ties);
        return { operation: 'train', trainType: chosen };
    }
    applyTraining(state, trainType, cardsAtTraining) {
        const { statGains, vitalChange, failureRate } = calculateTrainingValue(state, trainType, cardsAtTraining, this.deck_cards, this.effect_calculator);
        if (this.effect_calculator.check_zero_failure_chance()) { }
        if (Math.random() * 100 < failureRate) {
            const path = PRACTICE_FAIL_EVENT.get_path(state);
            let roll = Math.random() * 100, cumulative = 0, selectedOutcome = path.outcomes[0];
            for (const outcome of path.outcomes) { cumulative += outcome.weight; if (roll < cumulative) { selectedOutcome = outcome; break; } }
            if (selectedOutcome.state === PRACTICE_POOR) { state.remove_status_effect(PRACTICE_PERFECT); state.add_status_effect(PRACTICE_POOR); }
            else if (selectedOutcome.state === PRACTICE_PERFECT) { state.remove_status_effect(PRACTICE_POOR); state.add_status_effect(PRACTICE_PERFECT); }
            if (selectedOutcome.mood_penalty !== 0) state.add_motivation(selectedOutcome.mood_penalty);
            if (selectedOutcome.stat_penalty !== 0) state.add_status(trainType, selectedOutcome.stat_penalty);
            state.add_vital(vitalChange);
            return false;
        }
        for (let i = 0; i < 5; i++) state.add_status(i, statGains[i]);
        state.add_skill_pt(statGains[5]); state.add_vital(vitalChange);
        for (const cardIdx of cardsAtTraining) { let bondGain = 7; state.add_friendship(cardIdx, bondGain); }

        if (state.hints_by_facility && state.hints_by_facility[trainType] !== null) {
            const cardIdx = state.hints_by_facility[trainType];
            state.add_friendship(cardIdx, 5);
            const totalStats = 6 + Math.floor(Math.random() * 3);
            const numStatsToDistribute = 2 + Math.floor(Math.random() * 2);
            const possibleStats = [0, 1, 2, 3, 4];
            for (let i = possibleStats.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [possibleStats[i], possibleStats[j]] = [possibleStats[j], possibleStats[i]];
            }
            const selectedStats = possibleStats.slice(0, numStatsToDistribute);
            let remaining = totalStats;
            for (let i = 0; i < selectedStats.length; i++) {
                let gain = 0;
                if (i === selectedStats.length - 1) { gain = remaining; }
                else { gain = Math.floor(Math.random() * (remaining - (selectedStats.length - 1 - i))) + 1; remaining -= gain; }
                state.add_status(selectedStats[i], gain);
            }
        }

        state.add_training_level(trainType, 1);
        return true;
    }
}
class SimulationEngine {
    constructor(deckData, cardsData, uniqueEffects, options = {}) {
        this.numSimulations = options.numSimulations || 11;
        this.maxTurns = options.maxTurns || 78;
        this.raceSchedule = options.raceSchedule || [];
        this.statBonus = options.statBonus || [0, 0, 0, 0, 0];
        this.startingStats = options.startingStats || [88, 88, 88, 88, 88];
        this.statCaps = options.statCaps || [1200, 1200, 1200, 1200, 1200];
        this.hardStatCaps = options.hardStatCaps || [1200, 1200, 1200, 1200, 1200];
        this.confident = options.confident !== undefined ? options.confident : true;
        this.raceTurns = {}; this.raceConfident = {};
        for (const r of this.raceSchedule) { this.raceTurns[r.turn] = r.grade || 'G23'; this.raceConfident[r.turn] = r.confident !== undefined ? r.confident : this.confident; }
        const extensionStart = this.maxTurns + 1;
        this.mandatoryRaces = { 13: 'OP' };
        this.mandatoryRaces[extensionStart + 1] = 'G0';
        this.mandatoryRaces[extensionStart + 3] = 'G0';
        this.mandatoryRaces[extensionStart + 5] = 'G0';
        this.deckCards = [];
        for (const item of deckData) {
            const cardId = item.card_id, lb = item.lb !== undefined ? item.lb : 4;
            for (const rawCard of cardsData) { if (String(rawCard.id) === String(cardId)) { this.deckCards.push(new SupportCard(rawCard, lb)); break; } }
        }
        this.uniqueEffectsMap = {};
        for (const ueData of uniqueEffects) { this.uniqueEffectsMap[ueData.id] = parseUniqueEffect(ueData); }
        this.effectCalculator = new UniqueEffectCalculator(this.deckCards, this.uniqueEffectsMap);
        this._calcInitialFriendships();
        this.cardEventThresholds = [30, 60, 80];
        this.eventPool = [];
        const rawEvents = options.eventData || {};
        for (const [name, evt] of Object.entries(rawEvents)) {
            if (name === 'Tutorial') continue;
            const choices = [];
            for (const [cId, stats] of Object.entries(evt.stats || {})) {
                choices.push({
                    speed: stats['Speed'] || 0,
                    stamina: stats['Stamina'] || 0,
                    power: stats['Power'] || 0,
                    guts: stats['Guts'] || 0,
                    wisdom: stats['Wisdom'] || 0,
                    hp: stats['HP'] || 0,
                    maxEnergy: stats['Max Energy'] || 0,
                    mood: stats['Mood'] || 0,
                    skillPts: stats['Skill Pts'] || 0,
                    friendship: stats['Friendship'] || 0
                });
            }
            if (choices.length > 0) this.eventPool.push({ name, choices });
        }
    }
    evaluateEventChoice(state, choice) {
        let score = 0;
        score += (choice.speed || 0) * 0.05;
        score += (choice.stamina || 0) * 0.05;
        score += (choice.power || 0) * 0.05;
        score += (choice.guts || 0) * 0.05;
        score += (choice.wisdom || 0) * 0.05;
        score += (choice.skillPts || 0) * 0.02;
        score += (choice.hp || 0) * 0.1;
        score += (choice.maxEnergy || 0) * 0.5;
        score += (choice.mood || 0) * 2.0;
        score += (choice.friendship || 0) * 0.3;
        return score;
    }
    applyEventChoice(state, choice) {
        if (choice.speed) state.add_status(0, Math.round(choice.speed));
        if (choice.stamina) state.add_status(1, Math.round(choice.stamina));
        if (choice.power) state.add_status(2, Math.round(choice.power));
        if (choice.guts) state.add_status(3, Math.round(choice.guts));
        if (choice.wisdom) state.add_status(4, Math.round(choice.wisdom));
        if (choice.hp) state.add_vital(Math.round(choice.hp));
        if (choice.maxEnergy) state.add_max_vital(Math.round(choice.maxEnergy));
        if (choice.mood) state.add_motivation(Math.round(choice.mood));
        if (choice.skillPts) state.add_skill_pt(Math.round(choice.skillPts));
        if (choice.friendship) {
            for (let i = 0; i < this.deckCards.length; i++) {
                state.add_friendship(i, Math.round(choice.friendship));
            }
        }
    }
    _calcInitialFriendships() {
        this.initialFriendships = [];
        for (const card of this.deckCards) { let initial = card.initial_friendship_gauge; initial += this.effectCalculator.get_initial_friendship_gauge_bonus(); this.initialFriendships.push(initial); }
    }
    _rollMedicRoom(state) {
        if (state.medic_uses_remaining <= 0) return false;
        if (state.turn - state.last_medic_turn < 4) return false;
        let chance; if (state.turn < 12) chance = 0.25; else if (state.turn <= 48) chance = 0.35; else if (state.turn <= 72) chance = 0.25; else chance = 0.1;
        return Math.random() < chance;
    }
    simulateSingle() {
        const state = new CareerState();
        state.vital = 100; state.maxVital = 100; state.motivation = 3; state.skillPt = 120; state.turn = 0;
        state.debut_race_win = false; state.stat_bonus_pct = [...this.statBonus];
        state.fiveStatusLimit = [...this.hardStatCaps];
        for (let i = 0; i < 5; i++) state.fiveStatus[i] = this.startingStats[i];
        for (let i = 0; i < this.deckCards.length; i++) { if (i < this.initialFriendships.length) state.friendship[i] = Math.min(100, this.initialFriendships[i]); }
        for (const card of this.deckCards) { for (let j = 0; j < 5; j++) state.add_status(j, card.initial_bonus[j]); state.add_skill_pt(card.initial_bonus[5]); }
        const ueInitial = this.effectCalculator.get_initial_stat_bonus();
        for (let i = 0; i < 5; i++) state.add_status(i, ueInitial[i]);
        const scorer = new TrainingScorer(this.deckCards, this.effectCalculator, this.statCaps);
        const cardEventsFired = Array(this.deckCards.length).fill(null).map(() => []);
        const trainingCounts = [0, 0, 0, 0, 0], operationCountsTimeline = [];
        let restCounts = 0, medicCounts = 0, tripCounts = 0, raceCounts = 0, summerCounts = 0, totalFailures = 0, eventsTriggered = 0;
        const facilityPresses = [0, 0, 0, 0, 0], facilityLevels = [1, 1, 1, 1, 1];
        const cardPressesByFacility = [Array(this.deckCards.length).fill(0), Array(this.deckCards.length).fill(0), Array(this.deckCards.length).fill(0), Array(this.deckCards.length).fill(0), Array(this.deckCards.length).fill(0)];
        const cardPressesByFacilityTimeline = [];
        const cumulativeCardAppearances = [Array(this.deckCards.length).fill(0), Array(this.deckCards.length).fill(0), Array(this.deckCards.length).fill(0), Array(this.deckCards.length).fill(0), Array(this.deckCards.length).fill(0)];
        const cumulativeCardAppearancesTimeline = [], facilityLevelsTimeline = [], trainingCountsTimeline = [], statHistory = [], spHistory = [];
        const energyHistory = [], moodHistory = [], raceInfoTimeline = [], facilityGainsTimeline = [], potentialGainsTimeline = [], cardDistributionTimeline = [], friendshipHistory = [], statusEffectsTimeline = [], operationTimeline = [], eventsTriggeredTimeline = [];
        const actualMaxTurns = this.maxTurns + 6;
        while (state.turn < actualMaxTurns) {
            statHistory.push([...state.fiveStatus]); spHistory.push(state.skillPt); facilityLevelsTimeline.push([...state.trainLevelCount]);
            energyHistory.push(state.vital); moodHistory.push(state.motivation);
            const turnFacilityGains = [null, null, null, null, null];
            let turnOp = '';
            if (state.has_status(SKIN_OUTBREAK) && Math.random() < SKIN_OUTBREAK_MOOD_CHANCE) state.add_motivation(-1);
            if (!state.otonashi_appeared && state.turn >= OTONASHI_APPEAR_DAY) { if (Math.random() < OTONASHI_APPEAR_CHANCE) { state.otonashi_appeared = true; state.otonashi_facility = Math.floor(Math.random() * 5); } }
            state.medic_room_available = this._rollMedicRoom(state);
            const { distribution, hintsByFacility } = distributeCards(state, this.deckCards, this.effectCalculator);
            state.hints_by_facility = hintsByFacility;
            for (let f = 0; f < 5; f++) { const cardsAt = distribution[f] || []; for (const ci of cardsAt) cumulativeCardAppearances[f][ci]++; }
            const potentialGains = [];
            for (let f = 0; f < 5; f++) {
                const cardsAt = distribution[f] || [];
                const { statGains, vitalChange, failureRate } = calculateTrainingValue(state, f, cardsAt, this.deckCards, this.effectCalculator);
                potentialGains.push({ statGains: [...statGains], vitalChange, failureRate });
            }
            potentialGainsTimeline.push(potentialGains);
            cardDistributionTimeline.push(distribution);
            const mandatoryRaceGrade = this.mandatoryRaces[state.turn];

            if (mandatoryRaceGrade) {
                const grade = mandatoryRaceGrade;
                const isConfident = true;
                const placementTable = getPlacementTable(PLACEMENT_CONFIDENT, state.motivation);
                const placementRoll = Math.random() * 100, placement = placementRoll < placementTable[0] ? RACE_PLACEMENT_VICTORY : placementRoll < placementTable[0] + placementTable[1] ? RACE_PLACEMENT_SOLID : RACE_PLACEMENT_DEFEAT;
                let isTop = false;
                if (placement === RACE_PLACEMENT_VICTORY && state.vital > REST_THRESHOLD) { const topChance = TOP_TRIGGER_CONFIDENT; if (Math.random() * 100 < topChance) isTop = true; }
                const rewardTable = RACE_REWARDS[placement], reward = isTop ? rewardTable.top : rewardTable.bot;
                let energyCost = isTop ? reward.energy : (Math.random() < 0.5 ? reward.energy_a : reward.energy_b);
                let statGain, spGain;
                if (grade === 'OP') { statGain = reward.op[0] * 2; spGain = reward.op[1] * 2; }
                else if (grade === 'G0') { statGain = reward.g1[0] * 2; spGain = reward.g1[1] * 2; }
                else { statGain = reward.g1[0] * 2; spGain = reward.g1[1] * 2; }
                let totalRaceBonus = this.deckCards.reduce((s, c) => s + c.race_bonus, 0); totalRaceBonus += this.effectCalculator.get_race_bonus();
                const raceMult = 1.0 + 0.01 * totalRaceBonus; statGain = Math.floor(statGain * raceMult); spGain = Math.floor(spGain * raceMult);
                for (let i = 0; i < 5; i++) state.add_status(i, statGain);
                state.add_skill_pt(spGain); state.add_vital(energyCost);
                raceCounts++;
                if (placement === RACE_PLACEMENT_VICTORY && state.otonashi_appeared) {
                    const elatedChance = ELATED_COVERAGE_CONFIDENT;
                    if (Math.random() < elatedChance) {
                        state.add_vital(-15); state.add_motivation(1);
                        let elatStatGain, elatSpGain;
                        if (grade === 'OP') { elatStatGain = reward.op[0] * 2; elatSpGain = reward.op[1] * 2; }
                        else if (grade === 'G0') { elatStatGain = reward.g1[0] * 2; elatSpGain = reward.g1[1] * 2; }
                        else { elatStatGain = reward.g1[0] * 2; elatSpGain = reward.g1[1] * 2; }
                        for (let i = 0; i < 5; i++) state.add_status(i, elatStatGain);
                        state.add_skill_pt(elatSpGain); state.otonashi_bond += 15;
                    }
                }
                state.consecutive_races++;
                const cIdx = Math.min(state.consecutive_races - 1, 3), tableIdx = state.vital >= 3 ? 0 : 1;
                if (Math.random() < RACE_PUNISHMENT_MOOD[tableIdx][cIdx]) state.add_motivation(-1);
                if (Math.random() < RACE_PUNISHMENT_SKIN[tableIdx][cIdx]) state.add_status_effect(SKIN_OUTBREAK);
                if (Math.random() < RACE_PUNISHMENT_STATS[tableIdx][cIdx]) {
                    const stats = [0, 1, 2, 3, 4];
                    for (let i = stats.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1));[stats[i], stats[j]] = [stats[j], stats[i]]; }
                    for (let i = 0; i < 3; i++) state.add_status(stats[i], -10);
                }
                raceInfoTimeline.push({ grade: mandatoryRaceGrade, placement: placement === RACE_PLACEMENT_VICTORY ? 'Victory' : placement === RACE_PLACEMENT_SOLID ? 'Solid' : 'Defeat', isTop, energyCost, statGain, spGain });
                turnOp = 'race_' + mandatoryRaceGrade;
            } else if (state.turn in this.raceTurns) {
                const preRaceEnergy = state.vital, grade = this.raceTurns[state.turn], isConfident = this.raceConfident[state.turn];
                const baseTable = isConfident ? PLACEMENT_CONFIDENT : PLACEMENT_NORMAL;
                const placementTable = getPlacementTable(baseTable, state.motivation);
                const placementRoll = Math.random() * 100, placement = placementRoll < placementTable[0] ? RACE_PLACEMENT_VICTORY : placementRoll < placementTable[0] + placementTable[1] ? RACE_PLACEMENT_SOLID : RACE_PLACEMENT_DEFEAT;
                let isTop = false;
                if (placement === RACE_PLACEMENT_VICTORY && state.vital > REST_THRESHOLD) { const topChance = isConfident ? TOP_TRIGGER_CONFIDENT : TOP_TRIGGER_NORMAL; if (Math.random() * 100 < topChance) isTop = true; }
                const rewardTable = RACE_REWARDS[placement], reward = isTop ? rewardTable.top : rewardTable.bot;
                let energyCost = isTop ? reward.energy : (Math.random() < 0.5 ? reward.energy_a : reward.energy_b);
                let statGain, spGain;
                if (grade === 'G1') { statGain = reward.g1[0]; spGain = reward.g1[1]; }
                else if (grade === 'G23') { statGain = reward.g23[0]; spGain = reward.g23[1]; }
                else { statGain = reward.op[0]; spGain = reward.op[1]; }
                let totalRaceBonus = this.deckCards.reduce((s, c) => s + c.race_bonus, 0); totalRaceBonus += this.effectCalculator.get_race_bonus();
                const raceMult = 1.0 + 0.01 * totalRaceBonus; statGain = Math.floor(statGain * raceMult); spGain = Math.floor(spGain * raceMult);
                for (let i = 0; i < 5; i++) state.add_status(i, statGain);
                state.add_skill_pt(spGain); state.add_vital(energyCost);
                raceCounts++;
                if (placement === RACE_PLACEMENT_VICTORY && state.otonashi_appeared) {
                    const elatedChance = isConfident ? ELATED_COVERAGE_CONFIDENT : ELATED_COVERAGE_NORMAL;
                    if (Math.random() < elatedChance) {
                        state.add_vital(-15); state.add_motivation(1);
                        let elatStatGain, elatSpGain;
                        if (grade === 'G1') { elatStatGain = RACE_REWARDS[RACE_PLACEMENT_SOLID].top.g1[0]; elatSpGain = RACE_REWARDS[RACE_PLACEMENT_SOLID].top.g1[1]; }
                        else if (grade === 'G23') { elatStatGain = RACE_REWARDS[RACE_PLACEMENT_SOLID].top.g23[0]; elatSpGain = RACE_REWARDS[RACE_PLACEMENT_SOLID].top.g23[1]; }
                        else { elatStatGain = RACE_REWARDS[RACE_PLACEMENT_SOLID].top.op[0]; elatSpGain = RACE_REWARDS[RACE_PLACEMENT_SOLID].top.op[1]; }
                        for (let i = 0; i < 5; i++) state.add_status(i, elatStatGain);
                        state.add_skill_pt(elatSpGain); state.otonashi_bond += 15;
                    }
                }
                state.consecutive_races++;
                const cIdx = Math.min(state.consecutive_races - 1, 3), tableIdx = preRaceEnergy >= 3 ? 0 : 1;
                if (Math.random() < RACE_PUNISHMENT_MOOD[tableIdx][cIdx]) state.add_motivation(-1);
                if (Math.random() < RACE_PUNISHMENT_SKIN[tableIdx][cIdx]) state.add_status_effect(SKIN_OUTBREAK);
                if (Math.random() < RACE_PUNISHMENT_STATS[tableIdx][cIdx]) {
                    const stats = [0, 1, 2, 3, 4];
                    for (let i = stats.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1));[stats[i], stats[j]] = [stats[j], stats[i]]; }
                    for (let i = 0; i < 3; i++) state.add_status(stats[i], -10);
                }
                raceInfoTimeline.push({ grade: grade, placement: placement === RACE_PLACEMENT_VICTORY ? 'Victory' : placement === RACE_PLACEMENT_SOLID ? 'Solid' : 'Defeat', isTop, energyCost, statGain, spGain });
                turnOp = 'race_' + grade;
            } else {
                const { operation, trainType } = scorer.decideOperation(state, distribution);
                turnOp = operation;
                if (operation === 'medic') {
                    state.add_vital(MEDIC_ENERGY_RECOVERY); state.medic_uses_remaining -= 1; state.last_medic_turn = state.turn; medicCounts++;
                    if (state.has_negative_condition() && Math.random() < MEDIC_CURE_CHANCE) state.remove_random_negative();
                    state.consecutive_races = 0;
                }
                else if (operation === 'trip') { state.add_vital(30); state.add_motivation(1); tripCounts++; state.consecutive_races = 0; }
                else if (operation === 'rest') { state.add_vital(50); restCounts++; state.consecutive_races = 0; }
                else if (operation === 'SUMMER_RECREATION') {
                    state.add_vital(40);
                    state.add_motivation(1);
                    if (Math.random() < 0.5 && state.has_negative_condition()) state.remove_random_negative();
                    summerCounts++;
                    state.consecutive_races = 0;
                }
                else if (operation === 'train') {
                    state.consecutive_races = 0;
                    const tIdx = parseInt(trainType);
                    const cardsAt = distribution[tIdx] || []; trainingCounts[tIdx]++;
                    for (const ci of cardsAt) cardPressesByFacility[tIdx][ci]++;
                    const potential = calculateTrainingValue(state, tIdx, cardsAt, this.deckCards, this.effectCalculator);
                    const beforeStats = [...state.fiveStatus];
                    const beforeSP = state.skillPt;
                    const success = scorer.applyTraining(state, tIdx, cardsAt);
                    const actualStatGains = [];
                    for (let i = 0; i < 5; i++) actualStatGains.push(state.fiveStatus[i] - beforeStats[i]);
                    const actualSPGain = state.skillPt - beforeSP;
                    const actualGainsArray = [...actualStatGains, actualSPGain];
                    turnFacilityGains[tIdx] = {
                        statGains: actualGainsArray,
                        vitalChange: potential.vitalChange,
                        succeeded: success,
                        failureRate: potential.failureRate
                    };
                    facilityLevels[tIdx] = state.get_facility_level(tIdx); facilityPresses[tIdx]++;
                }
                cardPressesByFacilityTimeline.push(cardPressesByFacility.map(f => [...f]));
            }
            facilityGainsTimeline.push(turnFacilityGains);
            operationTimeline.push(turnOp);
            friendshipHistory.push([...state.friendship]);
            statusEffectsTimeline.push([...state.status_effects]);
            if (state.turn < 72 && this.eventPool.length > 0 && Math.random() < 0.50) {
                const evt = this.eventPool[Math.floor(Math.random() * this.eventPool.length)];
                let bestChoice = evt.choices[0];
                let bestScore = -Infinity;
                for (const choice of evt.choices) {
                    const score = this.evaluateEventChoice(state, choice);
                    if (score > bestScore) {
                        bestScore = score;
                        bestChoice = choice;
                    }
                }
                this.applyEventChoice(state, bestChoice);
                eventsTriggered++;
                eventsTriggeredTimeline.push(evt.name);
            } else {
                eventsTriggeredTimeline.push(null);
            }

            trainingCountsTimeline.push([...trainingCounts]); operationCountsTimeline.push([restCounts, medicCounts, tripCounts, raceCounts, summerCounts]);
            cumulativeCardAppearancesTimeline.push(cumulativeCardAppearances.map(f => [...f]));
            state.turn++;
        }
        for (let i = 0; i < 5; i++) state.add_status(i, 10); state.add_skill_pt(40); raceCounts++;
        for (let i = 0; i < 5; i++) state.add_status(i, 10); state.add_skill_pt(60); raceCounts++;
        for (let i = 0; i < 5; i++) state.add_status(i, 10); state.add_skill_pt(80); raceCounts++;
        for (let i = 0; i < 5; i++) state.add_status(i, 45); state.add_skill_pt(20);
        if (state.otonashi_bond >= 80) for (let i = 0; i < 5; i++) state.add_status(i, 3);
        if (state.otonashi_bond >= 100) for (let i = 0; i < 5; i++) state.add_status(i, 2);
        return { finalStats: [...state.fiveStatus], skillPoints: state.skillPt, turnsCompleted: state.turn, trainingCounts, restCounts, medicCounts, tripCounts, raceCounts, summerCounts, totalFailures, eventsTriggered, statHistory, spHistory, energyHistory, moodHistory, facilityPresses, facilityLevels, facilityLevelsTimeline, trainingCountsTimeline, operationCountsTimeline, cardPressesByFacility, cardPressesByFacilityTimeline, cumulativeCardAppearancesTimeline, raceInfoTimeline, facilityGainsTimeline, potentialGainsTimeline, cardDistributionTimeline, friendshipHistory, statusEffectsTimeline, operationTimeline, eventsTriggeredTimeline };
    }
    runSimulationsChunk(offset, count) {
        const results = [];
        for (let i = 0; i < count; i++) results.push(this.simulateSingle());
        return { offset, count, runs: results };
    }
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = { SimulationEngine };
}

if (typeof self !== 'undefined') {
    let workerEngine = null;
    let workerCardId = null;
    let workerCardLb = null;

    self.onmessage = function (e) {
        const { type, data } = e.data;
        if (type === 'init') {
            workerEngine = new SimulationEngine(data.deckData, data.cardsData, data.uniqueEffectsData, data.options);
            workerCardId = data.cardId || null;
            workerCardLb = data.cardLb || null;
            self.postMessage({ type: 'ready' });
        } else if (type === 'run') {
            if (data.deckData) {
                workerEngine = new SimulationEngine(data.deckData, data.cardsData, data.uniqueEffectsData, data.options);
                workerCardId = data.cardId || null;
                workerCardLb = data.cardLb || null;
            }
            const result = workerEngine.runSimulationsChunk(data.offset || 0, data.count || 0);
            result.card_id = workerCardId;
            result.card_lb = workerCardLb;
            self.postMessage({ type: 'result', data: result });
        }
    };
}
