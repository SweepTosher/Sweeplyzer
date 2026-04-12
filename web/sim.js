const CARD_TYPE_MAP = {
    'speed': 0,
    'stamina': 1,
    'power': 2,
    'guts': 3,
    'wisdom': 4,
    'friend': 6,
    'group': 6
};

const TRA_SPEED = 0, TRA_STAMINA = 1, TRA_POWER = 2, TRA_GUTS = 3, TRA_WISDOM = 4, TRA_REST = 5, TRA_NONE = -1;
const TRAINING_NAMES = ['Speed', 'Stamina', 'Power', 'Guts', 'Wisdom'];
const DATE_JUNIOR_END = 24, DATE_CLASSIC_END = 48, DATE_SENIOR_END = 72, DATE_SPRING_END = 60;
const SUMMER_CAMP_1_START = 36, SUMMER_CAMP_1_END = 40;
const SUMMER_CAMP_2_START = 60, SUMMER_CAMP_2_END = 64;
const TOTAL_TURN = 78;

const TRAINING_BASIC_VALUE = [
    [[11,0,2,0,0,5,-19],[12,0,2,0,0,5,-20],[13,0,2,0,0,5,-21],[14,0,3,0,0,5,-23],[15,0,4,0,0,5,-25]],
    [[0,10,0,4,0,5,-20],[0,11,0,4,0,5,-21],[0,12,0,5,0,5,-22],[0,13,0,5,0,5,-24],[0,14,0,6,0,5,-26]],
    [[0,4,10,0,0,5,-20],[0,4,11,0,0,5,-21],[0,5,12,0,0,5,-22],[0,5,13,0,0,5,-24],[0,6,14,0,0,5,-26]],
    [[2,0,2,9,0,5,-20],[2,0,2,10,0,5,-21],[2,0,2,11,0,5,-22],[3,0,2,12,0,5,-24],[4,0,3,13,0,5,-26]],
    [[2,0,0,0,8,5,5],[2,0,0,0,9,5,5],[2,0,0,0,10,5,5],[3,0,0,0,11,5,5],[4,0,0,0,12,5,5]]
];

const FAIL_RATE_BASIC = [
    [520, 524, 528, 532, 536],
    [507, 511, 515, 519, 523],
    [516, 520, 524, 528, 532],
    [532, 536, 540, 544, 548],
    [320, 321, 322, 323, 324]
];

const DEFAULT_BASE_SCORES = [0.0, 0.0, 0.0, 0.0, 0.07];

const DEFAULT_SCORE_VALUE = [
    [0.11, 0.10, 0.0025, 0.09],
    [0.11, 0.10, 0.0225, 0.09],
    [0.11, 0.10, 0.03, 0.09],
    [0.03, 0.05, 0.0375, 0.09],
    [0, 0, 0.0675, 0]
];

const DEFAULT_STAT_VALUE_MULTIPLIER = [0.01, 0.01, 0.01, 0.01, 0.01, 0.005];

const DEFAULT_NPC_SCORE_VALUE = [
    [0.05, 0.05, 0.05],
    [0.05, 0.05, 0.05],
    [0.05, 0.05, 0.05],
    [0.03, 0.05, 0.05],
    [0, 0, 0.05]
];

const DEFAULT_PAL_FRIENDSHIP_SCORES = [0.08, 0.057, 0.018];
const DEFAULT_PAL_CARD_MULTIPLIER = 0.1;
const DEFAULT_SUMMER_SCORE_THRESHOLD = 0.34;

const ENERGY_FAST_MEDIC = 80;
const ENERGY_FAST_TRIP = 80;
const ENERGY_MEDIC_GENERAL = 85;
const ENERGY_TRIP_GENERAL = 90;
const ENERGY_REST_EXTRA_DAY = 65;
const MIN_SUPPORT_GOOD_TRAINING = 3;
const DEFAULT_REST_THRESHOLD = 43;

const SUMMER_CONSERVE_DATES = [35, 36, 59, 60];
const SUMMER_CONSERVE_ENERGY = 60;

const FAVOR_LEVEL_1 = 1, FAVOR_LEVEL_2 = 2, FAVOR_LEVEL_3 = 3, FAVOR_LEVEL_4 = 4;

function getFavorLevel(bond) {
    if (bond >= 100) return FAVOR_LEVEL_4;
    if (bond >= 80) return FAVOR_LEVEL_3;
    if (bond >= 60) return FAVOR_LEVEL_2;
    return FAVOR_LEVEL_1;
}

class CareerState {
    constructor() {
        this.turn = 0;
        this.vital = 100;
        this.maxVital = 100;
        this.motivation = 3;
        this.fiveStatus = [0, 0, 0, 0, 0];
        this.fiveStatusLimit = [9999, 9999, 9999, 9999, 9999];
        this.stat_bonus_pct = [0, 0, 0, 0, 0];
        this.skillPt = 120;
        this.skillScore = 0;
        this.trainLevelCount = [0, 0, 0, 0, 0];
        this.friendship = [0, 0, 0, 0, 0, 0];
        this.uniqueEffectState = {};
        this.medic_room_available = false;
        this.medic_uses_remaining = 5;
        this.last_medic_turn = -10;
        this.debut_race_win = false;
        this.ura_races_completed = [false, false, false];
    }

    get_facility_level(trainType) {
        return Math.floor(this.trainLevelCount[trainType] / 4);
    }

    get_training_level(trainType) {
        if (this.is_summer_camp()) return 4;
        return Math.min(4, Math.floor(this.trainLevelCount[trainType] / 4));
    }

    add_training_level(trainType, n = 1) {
        this.trainLevelCount[trainType] = Math.min(16, this.trainLevelCount[trainType] + n);
    }

    add_status(idx, value) {
        if (value > 0 && idx < this.stat_bonus_pct.length) {
            value += Math.floor(value * 0.01 * this.stat_bonus_pct[idx]);
        }
        this.fiveStatus[idx] = Math.max(1, Math.min(this.fiveStatusLimit[idx], this.fiveStatus[idx] + value));
    }

    add_vital(value) {
        this.vital = Math.max(0, Math.min(this.maxVital, this.vital + value));
    }

    add_motivation(value) {
        this.motivation = Math.max(1, Math.min(5, this.motivation + value));
    }

    add_skill_pt(value) {
        this.skillPt = Math.max(0, this.skillPt + value);
    }

    add_friendship(idx, value) {
        if (0 <= idx < 6) {
            this.friendship[idx] = Math.min(100, this.friendship[idx] + value);
        }
    }

    calculate_failure_rate(trainType, failRateMult = 1.0) {
        const level = this.get_training_level(trainType);
        const x0 = 0.1 * FAIL_RATE_BASIC[trainType][level];
        let f = 0.0;
        if (this.vital < x0) {
            f = (100 - this.vital) * (x0 - this.vital) / 40.0;
        }
        return Math.max(0, Math.min(99, f * failRateMult));
    }

    get_period_index() {
        if (this.turn <= DATE_JUNIOR_END) return 0;
        if (this.turn <= DATE_CLASSIC_END) return 1;
        if (this.turn <= SUMMER_CAMP_2_START) return 2;
        if (this.turn <= DATE_SENIOR_END) return 3;
        return 4;
    }

    is_summer_camp() {
        return (SUMMER_CAMP_1_START < this.turn && this.turn <= SUMMER_CAMP_1_END) ||
               (SUMMER_CAMP_2_START < this.turn && this.turn <= SUMMER_CAMP_2_END);
    }

    is_terminal() {
        return this.turn >= TOTAL_TURN;
    }

    copy() {
        const s = new CareerState();
        s.turn = this.turn;
        s.vital = this.vital;
        s.maxVital = this.maxVital;
        s.motivation = this.motivation;
        s.fiveStatus = [...this.fiveStatus];
        s.fiveStatusLimit = [...this.fiveStatusLimit];
        s.stat_bonus_pct = [...this.stat_bonus_pct];
        s.skillPt = this.skillPt;
        s.skillScore = this.skillScore;
        s.trainLevelCount = [...this.trainLevelCount];
        s.friendship = [...this.friendship];
        s.uniqueEffectState = {...this.uniqueEffectState};
        s.medic_room_available = this.medic_room_available;
        s.medic_uses_remaining = this.medic_uses_remaining;
        s.last_medic_turn = this.last_medic_turn;
        s.debut_race_win = this.debut_race_win;
        s.ura_races_completed = [...this.ura_races_completed];
        return s;
    }
}

class SupportCard {
    constructor(cardData, lbLevel = 4) {
        this.id = cardData.id || '';
        this.title = cardData.title || '';
        this.rarity = cardData.rarity || 'R';
        this.type = cardData.type || 'speed';
        this.cardType = CARD_TYPE_MAP[this.type] || 0;
        this.image_url = cardData.image_url || '';
        this.unique_effect_id = cardData.unique_effect_id || null;

        const effectsList = cardData.effects || [];
        this.effects = [];
        for (let i = 0; i < 5; i++) {
            if (i < effectsList.length) {
                const d = effectsList[i];
                this.effects.push({
                    friendship_bonus: d.friendship_bonus || 0,
                    training_bonus: d.training_bonus || 0,
                    mood_effect: d.mood_effect || 0,
                    speed_bonus: d.speed_bonus || 0,
                    stamina_bonus: d.stamina_bonus || 0,
                    power_bonus: d.power_bonus || 0,
                    guts_bonus: d.guts_bonus || 0,
                    wits_bonus: d.wits_bonus || 0,
                    skill_point_bonus: d.skill_point_bonus || 0,
                    initial_speed: d.initial_speed || 0,
                    initial_stamina: d.initial_stamina || 0,
                    initial_power: d.initial_power || 0,
                    initial_guts: d.initial_guts || 0,
                    initial_friendship_gauge: d.initial_friendship_gauge || 0,
                    hint_frequency: d.hint_frequency || 0,
                    specialty_priority: d.specialty_priority || 0,
                    race_bonus: d.race_bonus || 0,
                    fan_bonus: d.fan_bonus || 0,
                });
            } else {
                this.effects.push({});
            }
        }

        this.lb_level = lbLevel;
        const effect = this.effects[lbLevel] || this.effects[this.effects.length - 1] || {};
        
        this.friendship_bonus = effect.friendship_bonus || 0;
        this.training_bonus = effect.training_bonus || 0;
        this.mood_effect = effect.mood_effect || 0;

        this.stat_bonus = [
            effect.speed_bonus || 0,
            effect.stamina_bonus || 0,
            effect.power_bonus || 0,
            effect.guts_bonus || 0,
            effect.wits_bonus || 0,
            effect.skill_point_bonus || 0
        ];

        this.initial_bonus = [
            effect.initial_speed || 0,
            effect.initial_stamina || 0,
            effect.initial_power || 0,
            effect.initial_guts || 0,
            0,
            0
        ];

        this.initial_friendship_gauge = effect.initial_friendship_gauge || 0;
        this.hint_frequency = effect.hint_frequency || 0;
        this.specialty_priority = effect.specialty_priority || 0;
        this.race_bonus = effect.race_bonus || 0;
        this.fan_bonus = effect.fan_bonus || 0;
        this.failure_rate_drop = 0;
        this.vital_cost_drop = 0;
    }

    is_friend_card() {
        return this.type === 'friend';
    }

    is_group_card() {
        return this.type === 'group';
    }
}

class UniqueEffectCalculator {
    constructor(deckCards, uniqueEffectsData = []) {
        this.deck_cards = deckCards;
        this.active_effects = [];
        this.unique_types = 0;
        
        const uniqueTypeSet = new Set();
        for (const card of deckCards) {
            if (card.type !== 'friend' && card.type !== 'group') {
                uniqueTypeSet.add(card.type);
            }
        }
        this.unique_types = uniqueTypeSet.size;
        
        this.uniqueEffectsMap = {};
        for (const ueData of uniqueEffectsData) {
            this.uniqueEffectsMap[ueData.id] = this.parseUniqueEffect(ueData);
        }
        
        this.active_effects = [];
        for (const card of deckCards) {
            if (card.unique_effect_id && this.uniqueEffectsMap[card.unique_effect_id]) {
                this.active_effects.push(this.uniqueEffectsMap[card.unique_effect_id]);
            }
        }
    }
    
    parseUniqueEffect(effectData) {
        const ue = {
            id: effectData.id || '',
            text: effectData.text || '',
            bond_threshold: 0,
            full_bond: false,
            deck_type_min: 0,
            training_effectiveness: 0,
            friendship_bonus: 0,
            mood_effect: 0,
            speed_bonus: 0,
            stamina_bonus: 0,
            power_bonus: 0,
            guts_bonus: 0,
            wits_bonus: 0,
            skill_point_bonus: 0,
            failure_rate_drop: 0,
            vital_cost_drop: 0,
            initial_friendship_gauge: 0,
            initial_speed: 0,
            initial_stamina: 0,
            initial_power: 0,
            initial_guts: 0,
            initial_wits: 0,
            specialty_priority: 0,
            hint_frequency: 0,
            race_bonus: 0,
        };
        
        const text = ue.text.toLowerCase();
        
        if (text.includes('bond gauge is full') || text.includes('full bond')) {
            ue.full_bond = true;
            ue.bond_threshold = 100;
        } else if (text.includes('bond gauge is at least 80')) {
            ue.bond_threshold = 80;
        } else if (text.includes('bond gauge is at least 60')) {
            ue.bond_threshold = 60;
        }
        
        if (text.includes('at least 4 different types')) {
            ue.deck_type_min = 4;
        } else if (text.includes('at least 5 different types')) {
            ue.deck_type_min = 5;
        }
        
        const pctMatch = text.match(/\((\d+)%\)/);
        const intMatch = text.match(/\((\d+)\)/);
        const pctVal = pctMatch ? parseInt(pctMatch[1]) : 0;
        const intVal = intMatch ? parseInt(intMatch[1]) : 0;
        
        if (text.includes('training effectiveness') || text.includes('increased training')) {
            ue.training_effectiveness += pctVal || intVal;
        }
        if (text.includes('friendship bonus')) {
            ue.friendship_bonus += intVal || pctVal;
        }
        if (text.includes('mood effect') || text.includes('amplifies the effect of mood')) {
            ue.mood_effect += pctVal || intVal;
        }
        if (text.includes('speed gain') || text.includes('gain speed')) {
            ue.speed_bonus += intVal || pctVal;
        }
        if (text.includes('stamina gain') || text.includes('gain stamina')) {
            ue.stamina_bonus += intVal || pctVal;
        }
        if (text.includes('power gain') || text.includes('gain power')) {
            ue.power_bonus += intVal || pctVal;
        }
        if (text.includes('guts gain') || text.includes('gain guts')) {
            ue.guts_bonus += intVal || pctVal;
        }
        if (text.includes('wit gain') || text.includes('gain wit')) {
            ue.wits_bonus += intVal || pctVal;
        }
        if (text.includes('skill point bonus')) {
            ue.skill_point_bonus += intVal;
        }
        if (text.includes('initial speed')) {
            ue.initial_speed += intVal;
        }
        if (text.includes('initial stamina')) {
            ue.initial_stamina += intVal;
        }
        if (text.includes('initial power')) {
            ue.initial_power += intVal;
        }
        if (text.includes('initial guts')) {
            ue.initial_guts += intVal;
        }
        if (text.includes('initial wit')) {
            ue.initial_wits += intVal;
        }
        if (text.includes('initial friendship gauge') || text.includes('initial friendship')) {
            ue.initial_friendship_gauge += intVal;
        }
        if (text.includes('decreases the probability of failure') || text.includes('failure when training')) {
            ue.failure_rate_drop += pctVal || intVal;
        }
        if (text.includes('decreases energy consumed') || text.includes('energy cost')) {
            ue.vital_cost_drop += pctVal || intVal;
        }
        if (text.includes('specialty priority')) {
            ue.specialty_priority += intVal;
        }
        if (text.includes('hint') && (text.includes('frequency') || text.includes('quantity'))) {
            ue.hint_frequency += pctVal || intVal;
        }
        if (text.includes('stat gain from races')) {
            const raceMatch = text.match(/races\s*\((\d+)%\)/);
            if (raceMatch) ue.race_bonus += parseInt(raceMatch[1]);
        }
        
        if (ue.id === 'ue_24') {
            ue.speed_bonus = 1; ue.stamina_bonus = 1;
            ue.power_bonus = 1; ue.guts_bonus = 1; ue.wits_bonus = 1;
        }
        if (['ue_32', 'ue_37', 'ue_60', 'ue_62', 'ue_64', 'ue_65', 'ue_79'].includes(ue.id)) {
            ue.training_effectiveness = 5;
        }
        if (ue.id === 'ue_39') ue.initial_friendship_gauge = 5;
        if (ue.id === 'ue_43') ue.specialty_priority = 30;
        if (ue.id === 'ue_50') ue.specialty_priority = 50;
        if (ue.id === 'ue_59') {
            ue.initial_speed = 10; ue.initial_stamina = 10;
            ue.initial_power = 10; ue.initial_guts = 10; ue.initial_wits = 10;
        }
        if (ue.id === 'ue_69') ue.training_effectiveness = 15;
        if (ue.id === 'ue_71') ue.failure_rate_drop = 20;
        if (ue.id === 'ue_73' || ue.id === 'ue_82' || ue.id === 'ue_90') ue.friendship_bonus = 10;
        if (ue.id === 'ue_83') ue.training_effectiveness = 10;
        if (ue.id === 'ue_85') ue.training_effectiveness = 20;
        if (ue.id === 'ue_90') ue.training_effectiveness = 5;
        
        return ue;
    }

    get_training_effectiveness_bonus(state) {
        let total = 0;
        for (const ue of this.active_effects) {
            if (ue.training_effectiveness > 0) {
                if (ue.bond_threshold > 0) {
                    if (!this.deck_cards.some((_, i) => i < state.friendship.length && state.friendship[i] >= ue.bond_threshold)) {
                        continue;
                    }
                }
                if (ue.full_bond) {
                    if (!this.deck_cards.some((_, i) => i < state.friendship.length && state.friendship[i] >= 100)) {
                        continue;
                    }
                }
                if (ue.deck_type_min > 0 && this.unique_types < ue.deck_type_min) {
                    continue;
                }
                total += ue.training_effectiveness;
            }
        }
        return total;
    }

    get_failure_rate_drop() {
        let total = 0;
        for (const ue of this.active_effects) {
            total += ue.failure_rate_drop;
        }
        return Math.min(1.0, total / 100.0);
    }

    get_vital_cost_drop() {
        let total = 0;
        for (const ue of this.active_effects) {
            total += ue.vital_cost_drop;
        }
        return Math.min(1.0, total / 100.0);
    }

    get_specialty_priority_bonus(state) {
        let total = 0;
        for (const ue of this.active_effects) {
            if (ue.specialty_priority > 0) {
                if (ue.bond_threshold > 0) {
                    if (!this.deck_cards.some((_, i) => i < state.friendship.length && state.friendship[i] >= ue.bond_threshold)) {
                        continue;
                    }
                }
                total += ue.specialty_priority;
            }
        }
        return total;
    }

    get_initial_friendship_gauge_bonus() {
        let total = 0;
        for (const ue of this.active_effects) {
            total += ue.initial_friendship_gauge;
        }
        return total;
    }

    get_race_bonus() {
        let total = 0;
        for (const ue of this.active_effects) {
            total += ue.race_bonus;
        }
        return total;
    }

    get_mood_effect_bonus(state) {
        let total = 0;
        for (const ue of this.active_effects) {
            if (ue.mood_effect > 0) {
                if (ue.full_bond) {
                    if (this.deck_cards.some((_, i) => i < state.friendship.length && state.friendship[i] >= 100)) {
                        total += ue.mood_effect;
                    }
                } else if (ue.bond_threshold > 0) {
                    if (this.deck_cards.some((_, i) => i < state.friendship.length && state.friendship[i] >= ue.bond_threshold)) {
                        total += ue.mood_effect;
                    }
                } else {
                    total += ue.mood_effect;
                }
            }
        }
        return total;
    }

    get_stat_bonus(state) {
        const result = [0, 0, 0, 0, 0, 0];
        for (const ue of this.active_effects) {
            const bonuses = [ue.speed_bonus, ue.stamina_bonus, ue.power_bonus, ue.guts_bonus, ue.wits_bonus, ue.skill_point_bonus];
            if (!bonuses.some(b => b > 0)) continue;

            if (ue.bond_threshold > 0) {
                if (!this.deck_cards.some((_, i) => i < state.friendship.length && state.friendship[i] >= ue.bond_threshold)) {
                    continue;
                }
            }
            if (ue.full_bond) {
                if (!this.deck_cards.some((_, i) => i < state.friendship.length && state.friendship[i] >= 100)) {
                    continue;
                }
            }
            if (ue.deck_type_min > 0 && this.unique_types < ue.deck_type_min) {
                continue;
            }
            for (let i = 0; i < 6; i++) {
                result[i] += bonuses[i];
            }
        }
        return result;
    }

    get_initial_stat_bonus() {
        const result = [0, 0, 0, 0, 0];
        for (const ue of this.active_effects) {
            result[0] += ue.initial_speed || 0;
            result[1] += ue.initial_stamina || 0;
            result[2] += ue.initial_power || 0;
            result[3] += ue.initial_guts || 0;
            result[4] += ue.initial_wits || 0;
        }
        return result;
    }

    check_zero_failure_chance() {
        return false;
    }
}

function distributeCards(state, deckCards, effectCalculator) {
    const distribution = {0: [], 1: [], 2: [], 3: [], 4: []};

    const specBonus = effectCalculator.get_specialty_priority_bonus(state);

    for (let idx = 0; idx < deckCards.length; idx++) {
        const card = deckCards[idx];
        if (card.is_friend_card() || card.is_group_card()) {
            distribution[Math.floor(Math.random() * 5)].push(idx);
            continue;
        }

        const weights = [];
        for (let t = 0; t < 5; t++) {
            if (t === card.cardType) {
                weights.push(100 + card.specialty_priority + specBonus);
            } else {
                weights.push(100);
            }
        }

        const total = weights.reduce((a, b) => a + b, 0);
        let r = Math.random() * total;
        let chosen = 0;
        let cumulative = 0;
        for (let i = 0; i < weights.length; i++) {
            cumulative += weights[i];
            if (r < cumulative) {
                chosen = i;
                break;
            }
        }
        distribution[chosen].push(idx);
    }

    return distribution;
}

function calculateTrainingValue(state, trainType, cardsAtTraining, deckCards, effectCalculator) {
    const level = state.get_training_level(trainType);
    const base = [...TRAINING_BASIC_VALUE[trainType][level]];

    for (const cardIdx of cardsAtTraining) {
        const card = deckCards[cardIdx];
        for (let i = 0; i < 6; i++) {
            if (base[i] > 0 && i < card.stat_bonus.length) {
                base[i] += card.stat_bonus[i];
            }
        }
    }

    const ueStatBonuses = effectCalculator.get_stat_bonus(state);
    for (let i = 0; i < 6; i++) {
        if (base[i] > 0 && i < ueStatBonuses.length) {
            base[i] += ueStatBonuses[i];
        }
    }

    let totalTraining = 0;
    let totalMotivation = 0;
    let totalFailRateDrop = 0;
    let totalVitalCostDrop = 0;

    for (const cardIdx of cardsAtTraining) {
        const card = deckCards[cardIdx];
        totalTraining += card.training_bonus || 0;
        totalMotivation += card.mood_effect || 0;
        totalFailRateDrop += card.failure_rate_drop || 0;
        totalVitalCostDrop += card.vital_cost_drop || 0;
    }

    totalTraining += effectCalculator.get_training_effectiveness_bonus(state);
    totalMotivation += effectCalculator.get_mood_effect_bonus(state);

    const ueFail = effectCalculator.get_failure_rate_drop();
    totalFailRateDrop += ueFail * 100;

    const ueVital = effectCalculator.get_vital_cost_drop();
    totalVitalCostDrop += ueVital * 100;

    totalFailRateDrop = Math.min(100, totalFailRateDrop);
    totalVitalCostDrop = Math.min(100, totalVitalCostDrop);

    const shiningIndices = [];
    for (const cardIdx of cardsAtTraining) {
        const card = deckCards[cardIdx];
        if (card.cardType === trainType && state.friendship[cardIdx] >= 80) {
            shiningIndices.push(cardIdx);
        }
    }

    const headNum = cardsAtTraining.length + 1;
    const crowdMult = 1.0 + 0.05 * headNum;
    const trainingMult = 1.0 + 0.01 * totalTraining;
    const motivationFactor = 0.1 * (state.motivation - 3) * (1 + 0.01 * totalMotivation);
    const motivationMult = 1.0 + motivationFactor;

    let friendshipMult = 1.0;
    for (const cardIdx of shiningIndices) {
        const card = deckCards[cardIdx];
        friendshipMult *= (1.0 + 0.01 * (card.friendship_bonus || 0));
    }

    const cardMultiplier = crowdMult * trainingMult * motivationMult * friendshipMult;

    const statGains = [];
    for (let i = 0; i < 6; i++) {
        const gain = Math.floor(base[i] * cardMultiplier);
        statGains.push(Math.max(0, gain));
    }

    const vitalCostMult = 1.0 - 0.01 * totalVitalCostDrop;
    const vitalChange = Math.floor(base[6] * vitalCostMult);

    const failRateMult = 1.0 - 0.01 * totalFailRateDrop;
    const failureRate = state.calculate_failure_rate(trainType, failRateMult);

    return {statGains, vitalChange, failureRate};
}

class TrainingScorer {
    constructor(deckCards, effectCalculator) {
        this.deck_cards = deckCards;
        this.effect_calculator = effectCalculator;
    }

    getWeights(date) {
        if (date <= DATE_JUNIOR_END) return DEFAULT_SCORE_VALUE[0];
        if (date <= DATE_CLASSIC_END) return DEFAULT_SCORE_VALUE[1];
        if (date <= DATE_SPRING_END) return DEFAULT_SCORE_VALUE[2];
        if (date <= DATE_SENIOR_END) return DEFAULT_SCORE_VALUE[3];
        return DEFAULT_SCORE_VALUE[4];
    }

    computeScores(state, distribution) {
        const date = state.turn;
        const energy = state.vital;
        const periodIdx = state.get_period_index();
        const w = this.getWeights(date);
        const w_lv1 = w[0], w_lv2 = w[1], w_energy_change = w[2], w_hint = w[3];
        const statMult = DEFAULT_STAT_VALUE_MULTIPLIER;
        const baseScores = [...DEFAULT_BASE_SCORES];

        let highestStatIdx = null;
        if (48 < date && date <= 72) {
            highestStatIdx = state.fiveStatus.indexOf(Math.max(...state.fiveStatus));
        }

        const supportCardMax = Math.max(...[0, 1, 2, 3, 4].map(i => (distribution[i] || []).length));

        const computedScores = [0.0, 0.0, 0.0, 0.0, 0.0];
        const trainingData = [null, null, null, null, null];

        for (let idx = 0; idx < 5; idx++) {
            const cardsAt = distribution[idx] || [];
            const {statGains, vitalChange, failRate} = calculateTrainingValue(
                state, idx, cardsAt, this.deck_cards, this.effect_calculator
            );
            trainingData[idx] = {statGains, vitalChange, failRate};

            const targetType = idx;
            let score = baseScores[idx];

            let palCount = 0;

            for (const cardIdx of cardsAt) {
                const card = this.deck_cards[cardIdx];
                const favor = getFavorLevel(state.friendship[cardIdx]);
                const ctype = card.cardType;

                if (card.is_friend_card()) {
                    palCount++;
                    const palScores = DEFAULT_PAL_FRIENDSHIP_SCORES;
                    if (favor === FAVOR_LEVEL_1) score += palScores[0];
                    else if (favor === FAVOR_LEVEL_2) score += palScores[1];
                    else if (favor >= FAVOR_LEVEL_3) score += palScores[2];
                    continue;
                }

                if (card.is_group_card()) {
                    if (favor === FAVOR_LEVEL_1) score += w_lv1;
                    else if (favor === FAVOR_LEVEL_2) score += w_lv2;
                    continue;
                }

                if (favor >= FAVOR_LEVEL_3 && ctype === targetType) continue;
                if (favor >= FAVOR_LEVEL_3 && ctype !== targetType) continue;

                if (favor === FAVOR_LEVEL_1) {
                    score += w_lv1;
                } else if (favor === FAVOR_LEVEL_2) {
                    score += w_lv2;
                }
            }

            let statScore = 0.0;
            for (let skIdx = 0; skIdx < 6; skIdx++) {
                const sv = statGains[skIdx];
                if (sv > 0) {
                    let bonusMult = 1.0;
                    if (skIdx < 5) bonusMult = 1.0 + 0.01 * state.stat_bonus_pct[skIdx];
                    statScore += sv * statMult[skIdx] * bonusMult;
                }
            }
            score += statScore;

            let energyChangeContrib = vitalChange * 0.0056;
            if (energy >= 80 && vitalChange < 0) {
                energyChangeContrib *= 0.9;
            }
            score += energyChangeContrib;

            let hintCount = 0;
            for (const cardIdx of cardsAt) {
                const card = this.deck_cards[cardIdx];
                if (card.hint_frequency > 0 && Math.random() * 100 < card.hint_frequency) {
                    hintCount++;
                }
            }
            if (hintCount > 0) {
                score += w_hint;
            }

            let palMult = 1.0;
            if (palCount > 0) {
                palMult = 1.0 + DEFAULT_PAL_CARD_MULTIPLIER;
                score *= palMult;
            }

            let failMult = 1.0;
            if (failRate >= 0) {
                failMult = Math.max(0.0, 1.0 - failRate / 50.0);
                score *= failMult;
            }

            if (idx === TRA_WISDOM) {
                if (energy > 90) {
                    score *= date > 72 ? 0.35 : 0.75;
                } else if (energy < 85) {
                    score *= 1.03;
                }
            }

            computedScores[idx] = score;
        }

        if (highestStatIdx !== null) {
            computedScores[highestStatIdx] *= 0.95;
            for (let i = 0; i < 5; i++) {
                const cardsAt = distribution[i] || [];
                const {statGains: sg} = calculateTrainingValue(
                    state, i, cardsAt, this.deck_cards, this.effect_calculator
                );
                if (highestStatIdx < 5 && sg[highestStatIdx] > 0) {
                    const bonusMult = 1.0 + 0.01 * state.stat_bonus_pct[highestStatIdx];
                    const penalty = sg[highestStatIdx] * statMult[highestStatIdx] * bonusMult * 0.05;
                    if (penalty > 0) {
                        computedScores[i] -= penalty;
                    }
                }
            }
        }

        return {computedScores, trainingData};
    }

    decideOperation(state, distribution) {
        const energy = state.vital;
        const date = state.turn;
        const medicAvailable = state.medic_room_available;

        let moodThreshold;
        if (date <= 36) moodThreshold = 3;
        else if (date <= 60) moodThreshold = 4;
        else moodThreshold = 4;

        const restThreshold = DEFAULT_REST_THRESHOLD;

        if (medicAvailable && energy <= ENERGY_FAST_MEDIC) {
            return {operation: 'medic', trainType: -1};
        }

        if (energy < ENERGY_FAST_TRIP && state.motivation < moodThreshold) {
            return {operation: 'trip', trainType: -1};
        }

        if (energy <= restThreshold) {
            return {operation: 'rest', trainType: -1};
        }

        const {computedScores: scores} = this.computeScores(state, distribution);
        let maxScore = Math.max(...scores);

        const supportCardMax = Math.max(...[0, 1, 2, 3, 4].map(i => (distribution[i] || []).length));

        if (medicAvailable && energy <= ENERGY_MEDIC_GENERAL) {
            return {operation: 'medic', trainType: -1};
        }

        if (!medicAvailable && state.motivation < moodThreshold && energy < ENERGY_TRIP_GENERAL) {
            if ((date <= 36 && !(supportCardMax >= MIN_SUPPORT_GOOD_TRAINING)) || 
                (40 < date && date <= 60) || 
                (64 < date)) {
                if (maxScore <= 0.3) {
                    return {operation: 'trip', trainType: -1};
                }
            }
        }

        if ((date === 36 || date === 60) && energy < ENERGY_REST_EXTRA_DAY) {
            return {operation: 'rest', trainType: -1};
        }

        if (SUMMER_CONSERVE_DATES.includes(date)) {
            if (maxScore < DEFAULT_SUMMER_SCORE_THRESHOLD) {
                if (energy < SUMMER_CONSERVE_ENERGY) {
                    return {operation: 'rest', trainType: -1};
                } else {
                    return {operation: 'train', trainType: TRA_WISDOM};
                }
            }
        }

        const eps = 1e-9;
        maxScore = Math.max(...scores);
        const ties = scores.map((s, i) => Math.abs(s - maxScore) < eps ? i : -1).filter(i => i >= 0);
        const chosen = ties.includes(TRA_WISDOM) ? TRA_WISDOM : Math.min(...ties);

        return {operation: 'train', trainType: chosen};
    }

    applyTraining(state, trainType, cardsAtTraining) {
        const {statGains, vitalChange, failRate} = calculateTrainingValue(
            state, trainType, cardsAtTraining, this.deck_cards, this.effect_calculator
        );

        if (this.effect_calculator.check_zero_failure_chance()) {
            failRate = 0;
        }

        if (Math.random() * 100 < failRate) {
            state.add_vital(vitalChange);
            return false;
        }

        for (let i = 0; i < 5; i++) {
            state.add_status(i, statGains[i]);
        }

        state.add_skill_pt(statGains[5]);
        state.add_vital(vitalChange);

        for (const cardIdx of cardsAtTraining) {
            const card = this.deck_cards[cardIdx];
            let bondGain = 4;
            if (card.cardType === trainType) bondGain += 3;
            state.add_friendship(cardIdx, bondGain);
        }

        state.add_training_level(trainType, 1);

        return true;
    }
}

class SimulationEngine {
    constructor(deckData, cardsData, uniqueEffectsData = [], options = {}) {
        this.numSimulations = options.numSimulations || 11;
        this.maxTurns = options.maxTurns || 78;
        this.raceSchedule = options.raceSchedule || [];
        this.statBonus = options.statBonus || [0, 0, 0, 0, 0];
        this.startingStats = options.startingStats || [88, 88, 88, 88, 88];

        this.raceTurns = {};
        for (const r of this.raceSchedule) {
            this.raceTurns[r.turn] = r.grade || 'G3';
        }

        this.deckCards = [];
        for (const item of deckData) {
            const cardId = item.card_id;
            const lb = item.lb || 4;
            for (const rawCard of cardsData) {
                if (String(rawCard.id) === String(cardId)) {
                    this.deckCards.push(new SupportCard(rawCard, lb));
                    break;
                }
            }
        }

        this.uniqueEffectsData = uniqueEffectsData;
        this.effectCalculator = new UniqueEffectCalculator(this.deckCards, this.uniqueEffectsData);

        this.initialFriendships = [];
        for (const card of this.deckCards) {
            let initial = card.initial_friendship_gauge;
            initial += this.effectCalculator.get_initial_friendship_gauge_bonus();
            this.initialFriendships.push(initial);
        }

        this.cardEventThresholds = [30, 60, 80];
    }

    rollMedicRoom(state) {
        if (state.medic_uses_remaining <= 0) return false;
        if (state.turn - state.last_medic_turn < 4) return false;

        let chance;
        if (state.turn < 12) chance = 0.25;
        else if (state.turn <= 48) chance = 0.35;
        else if (state.turn <= 72) chance = 0.25;
        else chance = 0.1;
        return Math.random() < chance;
    }

    simulateSingle() {
        const state = new CareerState();
        state.vital = 100;
        state.maxVital = 100;
        state.motivation = 3;
        state.skillPt = 120;
        state.turn = 0;
        state.debut_race_win = false;

        state.stat_bonus_pct = [...this.statBonus];

        for (let i = 0; i < 5; i++) {
            state.fiveStatus[i] = this.startingStats[i];
        }

        for (let i = 0; i < this.deckCards.length; i++) {
            if (i < this.initialFriendships.length) {
                state.friendship[i] = Math.min(100, this.initialFriendships[i]);
            }
        }

        for (const card of this.deckCards) {
            for (let j = 0; j < 5; j++) {
                state.add_status(j, card.initial_bonus[j]);
            }
            state.add_skill_pt(card.initial_bonus[5]);
        }

        const ueInitial = this.effectCalculator.get_initial_stat_bonus();
        for (let i = 0; i < 5; i++) {
            state.add_status(i, ueInitial[i]);
        }

        const scorer = new TrainingScorer(this.deckCards, this.effectCalculator);

        const cardEventsFired = Array(this.deckCards.length).fill(null).map(() => []);

        const trainingCounts = [0, 0, 0, 0, 0];
        let restCounts = 0;
        let medicCounts = 0;
        let tripCounts = 0;
        let raceCounts = 0;
        let totalFailures = 0;
        let eventsTriggered = 0;

        const RACE_GRADES = {
            'G1': {stat_bonus: 5, sp_bonus: 50},
            'G2': {stat_bonus: 3, sp_bonus: 45},
            'G3': {stat_bonus: 2, sp_bonus: 40},
        };

        while (state.turn < this.maxTurns) {
            state.medic_room_available = this.rollMedicRoom(state);

            const distribution = distributeCards(state, this.deckCards, this.effectCalculator);

            if (state.turn in this.raceTurns) {
                const grade = this.raceTurns[state.turn];
                const gradeData = RACE_GRADES[grade] || RACE_GRADES['G3'];

                let totalSaihou = 0;
                for (const card of this.deckCards) {
                    totalSaihou += card.race_bonus;
                }
                totalSaihou += this.effectCalculator.get_race_bonus();

                const raceMult = 1.0 + 0.01 * totalSaihou;
                const statGain = Math.floor(raceMult * gradeData.stat_bonus);
                const spGain = Math.floor(raceMult * gradeData.sp_bonus);

                for (let i = 0; i < 5; i++) {
                    state.add_status(i, statGain + 1);
                }
                state.add_skill_pt(spGain);
                state.add_vital(-20);

                if (Math.random() < 0.10) {
                    state.add_motivation(1);
                }
                raceCounts++;
            } else {
                const {operation, trainType} = scorer.decideOperation(state, distribution);

                if (operation === 'medic') {
                    state.add_vital(30);
                    state.medic_uses_remaining--;
                    state.last_medic_turn = state.turn;
                    medicCounts++;
                } else if (operation === 'trip') {
                    state.add_vital(30);
                    state.add_motivation(1);
                    tripCounts++;
                } else if (operation === 'rest') {
                    state.add_vital(50);
                    restCounts++;
                } else if (operation === 'train') {
                    const cardsAt = distribution[trainType] || [];
                    trainingCounts[trainType]++;
                    const success = scorer.applyTraining(state, trainType, cardsAt);
                    if (!success) {
                        totalFailures++;
                    }
                }
            }

            for (let i = 0; i < this.deckCards.length; i++) {
                for (const threshold of this.cardEventThresholds) {
                    if (!cardEventsFired[i].includes(threshold) && state.friendship[i] >= threshold) {
                        cardEventsFired[i].push(threshold);
                        eventsTriggered++;
                        const card = this.deckCards[i];
                        if (card.cardType < 5) {
                            state.add_status(card.cardType, 10 + Math.floor(Math.random() * 6));
                        }
                        state.add_skill_pt(10 + Math.floor(Math.random() * 11));
                        if (Math.random() < 0.5) state.add_vital(10);
                        state.add_friendship(i, 5);
                    }
                }
            }

            if (state.turn < 72) {
                if (Math.random() < 0.35) {
                    eventsTriggered++;
                    const cardIdx = this.deckCards.length - 1;
                    if (cardIdx >= 0) {
                        const card = Math.floor(Math.random() * (cardIdx + 1));
                        const stat = Math.floor(Math.random() * 5);
                        state.add_status(stat, 20);
                        state.add_skill_pt(20);
                        state.add_friendship(card, 5);
                        if (Math.random() < 0.5) state.add_vital(10);
                        if (Math.random() < 0.4 * (1.0 - state.turn / TOTAL_TURN)) state.add_motivation(1);
                    }
                }
                if (Math.random() < 0.10) {
                    for (let i = 0; i < 5; i++) state.add_status(i, 3);
                }
                if (Math.random() < 0.10) state.add_vital(5);
                if (Math.random() < 0.02) state.add_vital(30);
                if (Math.random() < 0.02) state.add_motivation(1);
                if (state.turn >= 12 && Math.random() < 0.04) state.add_motivation(-1);
            }

            if (state.turn === 11) {
                for (let i = 0; i < 5; i++) state.add_status(i, 3);
                state.add_skill_pt(45);
                state.debut_race_win = true;
            }
            if (state.turn === 23) {
                if (state.maxVital - state.vital >= 20) state.add_vital(20);
                else for (let i = 0; i < 5; i++) state.add_status(i, 5);
            }
            if (state.turn === 47) {
                if (state.maxVital - state.vital >= 30) state.add_vital(30);
                else for (let i = 0; i < 5; i++) state.add_status(i, 8);
            }
            if (state.turn === 48) {
                const rd = Math.random() * 100;
                if (rd < 16) {
                    state.add_vital(30);
                    for (let i = 0; i < 5; i++) state.add_status(i, 10);
                    state.add_motivation(2);
                } else if (rd < 43) {
                    state.add_vital(20);
                    for (let i = 0; i < 5; i++) state.add_status(i, 5);
                    state.add_motivation(1);
                } else {
                    state.add_vital(20);
                }
            }

            state.turn++;
        }

        for (let i = 0; i < 5; i++) state.add_status(i, 10);
        state.add_skill_pt(40);
        raceCounts++;
        for (let i = 0; i < 5; i++) state.add_status(i, 10);
        state.add_skill_pt(60);
        raceCounts++;
        for (let i = 0; i < 5; i++) state.add_status(i, 10);
        state.add_skill_pt(80);
        raceCounts++;
        for (let i = 0; i < 5; i++) state.add_status(i, 45);
        state.add_skill_pt(20);

        return {
            finalStats: [...state.fiveStatus],
            skillPoints: state.skillPt,
            turnsCompleted: state.turn,
            trainingCounts,
            restCounts,
            medicCounts,
            tripCounts,
            raceCounts,
            totalFailures,
            eventsTriggered,
        };
    }

    runSimulations() {
        const results = [];
        for (let i = 0; i < this.numSimulations; i++) {
            results.push(this.simulateSingle());
        }

        const n = results.length;
        const allStats = [];
        let allSP = [];
        for (let i = 0; i < 5; i++) {
            allStats.push(results.map(r => r.finalStats[i]));
        }
        allSP = results.map(r => r.skillPoints);

        const avgStats = {
            speed: allStats[0].reduce((a, b) => a + b, 0) / n,
            stamina: allStats[1].reduce((a, b) => a + b, 0) / n,
            power: allStats[2].reduce((a, b) => a + b, 0) / n,
            guts: allStats[3].reduce((a, b) => a + b, 0) / n,
            wisdom: allStats[4].reduce((a, b) => a + b, 0) / n,
        };

        function calcDist(arr) {
            arr.sort((a, b) => a - b);
            const mean = arr.reduce((a, b) => a + b, 0) / n;
            const variance = arr.reduce((sum, x) => sum + (x - mean) ** 2, 0) / n;
            return {
                min: arr[0],
                max: arr[n - 1],
                mean: mean,
                std: Math.sqrt(variance),
                p25: arr[Math.floor(n * 0.25)],
                p50: arr[Math.floor(n * 0.50)],
                p75: arr[Math.floor(n * 0.75)],
            };
        }

        const distStats = {
            speed: calcDist([...allStats[0]]),
            stamina: calcDist([...allStats[1]]),
            power: calcDist([...allStats[2]]),
            guts: calcDist([...allStats[3]]),
            wisdom: calcDist([...allStats[4]]),
            sp: calcDist([...allSP]),
        };

        let peakIdx = 0;
        let peakTotal = -1;
        for (let i = 0; i < results.length; i++) {
            const total = results[i].finalStats[0] + results[i].finalStats[1] + results[i].finalStats[2] + 
                        results[i].finalStats[3] + results[i].finalStats[4] + results[i].skillPoints / 2;
            if (total > peakTotal) {
                peakTotal = total;
                peakIdx = i;
            }
        }

        const peakRun = {
            speed: results[peakIdx].finalStats[0],
            stamina: results[peakIdx].finalStats[1],
            power: results[peakIdx].finalStats[2],
            guts: results[peakIdx].finalStats[3],
            wisdom: results[peakIdx].finalStats[4],
            sp: results[peakIdx].skillPoints,
            total: peakTotal,
            run_index: peakIdx + 1,
        };

        const avgSP = allSP.reduce((a, b) => a + b, 0) / n;

        const avgTrainingCounts = [
            results.map(r => r.trainingCounts[0]).reduce((a, b) => a + b, 0) / n,
            results.map(r => r.trainingCounts[1]).reduce((a, b) => a + b, 0) / n,
            results.map(r => r.trainingCounts[2]).reduce((a, b) => a + b, 0) / n,
            results.map(r => r.trainingCounts[3]).reduce((a, b) => a + b, 0) / n,
            results.map(r => r.trainingCounts[4]).reduce((a, b) => a + b, 0) / n,
        ];

        const avgRest = results.map(r => r.restCounts).reduce((a, b) => a + b, 0) / n;
        const avgMedic = results.map(r => r.medicCounts).reduce((a, b) => a + b, 0) / n;
        const avgTrip = results.map(r => r.tripCounts).reduce((a, b) => a + b, 0) / n;
        const avgRace = results.map(r => r.raceCounts).reduce((a, b) => a + b, 0) / n;
        const avgFailures = results.map(r => r.totalFailures).reduce((a, b) => a + b, 0) / n;

        const totalTraining = avgTrainingCounts.reduce((a, b) => a + b, 0);
        const totalNonTraining = avgRest + avgMedic + avgTrip + avgRace;

        return {
            num_simulations: this.numSimulations,
            max_turns: this.maxTurns,
            avg_stats: avgStats,
            dist_stats: distStats,
            peak_run: peakRun,
            avg_skill_points: avgSP,
            avg_training_counts: avgTrainingCounts,
            avg_rest: avgRest,
            avg_medic: avgMedic,
            avg_trip: avgTrip,
            avg_race: avgRace,
            avg_failures: avgFailures,
            total_training_turns: totalTraining,
            total_non_training_turns: totalNonTraining,
            total_events_triggered: results.map(r => r.eventsTriggered).reduce((a, b) => a + b, 0),
            deck_size: this.deckCards.length,
        };
    }
}

if (typeof self !== 'undefined') {
    self.SimulationEngine = SimulationEngine;
    self.SupportCard = SupportCard;
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = { SimulationEngine, SupportCard, CareerState, UniqueEffectCalculator, TrainingScorer };
}
