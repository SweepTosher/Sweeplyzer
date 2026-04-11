import random
from typing import List, Tuple, Dict, Optional

from .game_state import (
    CareerState, TRA_SPEED, TRA_STAMINA, TRA_POWER, TRA_GUTS, TRA_WISDOM,
    TRA_REST, DATE_JUNIOR_END, DATE_CLASSIC_END, DATE_SENIOR_END,
    DATE_SPRING_END, TOTAL_TURN, TRAINING_BASIC_VALUE, FAIL_RATE_BASIC,
    SUMMER_CONSERVE_DATES, SUMMER_CONSERVE_ENERGY,
    SUMMER_CAMP_1_START, SUMMER_CAMP_1_END, SUMMER_CAMP_2_START, SUMMER_CAMP_2_END,
    get_favor_level, FAVOR_LEVEL_1, FAVOR_LEVEL_2, FAVOR_LEVEL_3, FAVOR_LEVEL_4
)
from .card import SupportCard
from .unique_effects import UniqueEffectCalculator

DEFAULT_BASE_SCORES = (0.0, 0.0, 0.0, 0.0, 0.07)

DEFAULT_SCORE_VALUE = (
    (0.11, 0.10, 0.0025, 0.09),
    (0.11, 0.10, 0.0225, 0.09),
    (0.11, 0.10, 0.03, 0.09),
    (0.03, 0.05, 0.0375, 0.09),
    (0, 0, 0.0675, 0),
)

DEFAULT_STAT_VALUE_MULTIPLIER = (0.01, 0.01, 0.01, 0.01, 0.01, 0.005)

DEFAULT_NPC_SCORE_VALUE = (
    (0.05, 0.05, 0.05),
    (0.05, 0.05, 0.05),
    (0.05, 0.05, 0.05),
    (0.03, 0.05, 0.05),
    (0, 0, 0.05)
)

DEFAULT_PAL_FRIENDSHIP_SCORES = (0.08, 0.057, 0.018)

DEFAULT_PAL_CARD_MULTIPLIER = 0.1

DEFAULT_SUMMER_SCORE_THRESHOLD = 0.34

ENERGY_FAST_MEDIC = 80
ENERGY_FAST_TRIP = 80
ENERGY_MEDIC_GENERAL = 85
ENERGY_TRIP_GENERAL = 90
ENERGY_REST_EXTRA_DAY = 65
MIN_SUPPORT_GOOD_TRAINING = 3
DEFAULT_REST_THRESHOLD = 43

URA_RACE_WINDOWS = [
    (73, 75),
    (76, 78),
    (79, 99),
]

DEFAULT_MOTIVATION_THRESHOLD_YEAR1 = 3
DEFAULT_MOTIVATION_THRESHOLD_YEAR2 = 4
DEFAULT_MOTIVATION_THRESHOLD_YEAR3 = 4

CARD_TYPE_SPEED = 0
CARD_TYPE_STAMINA = 1
CARD_TYPE_POWER = 2
CARD_TYPE_GUTS = 3
CARD_TYPE_WISDOM = 4
CARD_TYPE_FRIEND = 6
CARD_TYPE_GROUP = 7
CARD_TYPE_NPC = 10

TRAINING_NAMES = ['Speed', 'Stamina', 'Power', 'Guts', 'Wisdom']
STAT_KEYS = ['speed', 'stamina', 'power', 'guts', 'wits', 'sp']


def distribute_cards(state: CareerState, deck_cards: List[SupportCard],
                     effect_calculator: UniqueEffectCalculator) -> Dict[int, List[int]]:
    distribution = {i: [] for i in range(5)}

    spec_bonus = effect_calculator.get_specialty_priority_bonus(state)

    for idx, card in enumerate(deck_cards):
        if card.is_friend_card() or card.is_group_card():
            train = random.randint(0, 4)
            distribution[train].append(idx)
            continue

        weights = []
        for t in range(5):
            if t == card.card_type:
                weights.append(100 + card.specialty_priority + spec_bonus)
            else:
                weights.append(100)

        total = sum(weights)
        r = random.random() * total
        cumulative = 0
        chosen = 0
        for i, w in enumerate(weights):
            cumulative += w
            if r < cumulative:
                chosen = i
                break

        distribution[chosen].append(idx)

    return distribution


def calculate_training_value(
    state: CareerState,
    train_type: int,
    cards_at_training: List[int],
    deck_cards: List[SupportCard],
    effect_calculator: UniqueEffectCalculator
) -> Tuple[List[int], int, float]:
    level = state.get_training_level(train_type)
    base = list(TRAINING_BASIC_VALUE[train_type][level])

    for card_idx in cards_at_training:
        card = deck_cards[card_idx]
        for i in range(6):
            if base[i] > 0 and i < len(card.stat_bonus):
                base[i] += card.stat_bonus[i]

    ue_stat_bonuses = effect_calculator.get_stat_bonus(state)
    for i in range(6):
        if base[i] > 0 and i < len(ue_stat_bonuses):
            base[i] += ue_stat_bonuses[i]

    total_training = 0
    total_motivation = 0
    total_fail_rate_drop = 0
    total_vital_cost_drop = 0

    for card_idx in cards_at_training:
        card = deck_cards[card_idx]
        total_training += card.training_bonus
        total_motivation += card.mood_effect
        total_fail_rate_drop += card.failure_rate_drop
        total_vital_cost_drop += card.vital_cost_drop

    total_training += effect_calculator.get_training_effectiveness_bonus(state)
    total_motivation += effect_calculator.get_mood_effect_bonus(state)

    ue_fail = effect_calculator.get_failure_rate_drop()
    total_fail_rate_drop += ue_fail * 100

    ue_vital = effect_calculator.get_vital_cost_drop()
    total_vital_cost_drop += ue_vital * 100

    total_fail_rate_drop = min(100, total_fail_rate_drop)
    total_vital_cost_drop = min(100, total_vital_cost_drop)

    shining_indices = []
    for card_idx in cards_at_training:
        card = deck_cards[card_idx]
        if card.card_type == train_type and state.friendship[card_idx] >= 80:
            shining_indices.append(card_idx)

    head_num = len(cards_at_training) + 1

    crowd_mult = 1.0 + 0.05 * head_num

    training_mult = 1.0 + 0.01 * total_training

    motivation_factor = 0.1 * (state.motivation - 3) * (1 + 0.01 * total_motivation)
    motivation_mult = 1.0 + motivation_factor

    friendship_mult = 1.0
    for card_idx in shining_indices:
        card = deck_cards[card_idx]
        friendship_mult *= (1.0 + 0.01 * card.friendship_bonus)

    card_multiplier = crowd_mult * training_mult * motivation_mult * friendship_mult

    stat_gains = []
    for i in range(6):
        gain = int(base[i] * card_multiplier)
        stat_gains.append(max(0, gain))

    vital_cost_mult = 1.0 - 0.01 * total_vital_cost_drop
    vital_change = int(base[6] * vital_cost_mult)

    fail_rate_mult = 1.0 - 0.01 * total_fail_rate_drop
    failure_rate = state.calculate_failure_rate(train_type, fail_rate_mult)

    return stat_gains, vital_change, failure_rate


class TrainingScorer:

    def __init__(self, deck_cards: List[SupportCard], effect_calculator: UniqueEffectCalculator):
        self.deck_cards = deck_cards
        self.effect_calculator = effect_calculator

    def _get_weights(self, date: int) -> Tuple[float, float, float, float]:
        if date <= DATE_JUNIOR_END:
            return DEFAULT_SCORE_VALUE[0]
        elif date <= DATE_CLASSIC_END:
            return DEFAULT_SCORE_VALUE[1]
        elif date <= DATE_SPRING_END:
            return DEFAULT_SCORE_VALUE[2]
        elif date <= DATE_SENIOR_END:
            return DEFAULT_SCORE_VALUE[3]
        else:
            return DEFAULT_SCORE_VALUE[4]

    def _get_npc_scores(self, period_idx: int, favor: int) -> float:
        if period_idx >= len(DEFAULT_NPC_SCORE_VALUE):
            period_idx = len(DEFAULT_NPC_SCORE_VALUE) - 1
        npc_arr = DEFAULT_NPC_SCORE_VALUE[period_idx]
        if favor == FAVOR_LEVEL_1:
            return npc_arr[0]
        elif favor == FAVOR_LEVEL_2:
            return npc_arr[1]
        else:
            return npc_arr[2]

    def compute_scores(self, state: CareerState,
                       distribution: Dict[int, List[int]]) -> Tuple[List[float], list]:
        date = state.turn
        energy = state.vital
        period_idx = state.get_period_index()
        w_lv1, w_lv2, w_energy_change, w_hint = self._get_weights(date)
        stat_mult = DEFAULT_STAT_VALUE_MULTIPLIER
        base_scores = list(DEFAULT_BASE_SCORES)

        highest_stat_idx = None
        if 48 < date <= 72:
            highest_stat_idx = max(range(5), key=lambda i: state.fiveStatus[i])

        support_card_max = max(
            len(distribution.get(i, [])) for i in range(5)
        )

        computed_scores: List[float] = [0.0, 0.0, 0.0, 0.0, 0.0]
        training_data: List[Optional[Tuple]] = [None, None, None, None, None]

        for idx in range(5):
            cards_at = distribution.get(idx, [])
            stat_gains, vital_change, fail_rate = calculate_training_value(
                state, idx, cards_at, self.deck_cards, self.effect_calculator
            )
            training_data[idx] = (stat_gains, vital_change, fail_rate)

            target_type = idx

            score = base_scores[idx]

            lv1c = 0
            lv2c = 0
            lv1_total = 0.0
            lv2_total = 0.0
            npc = 0
            npc_total_contrib = 0.0
            pal_count = 0

            for card_idx in cards_at:
                card = self.deck_cards[card_idx]
                favor = get_favor_level(state.friendship[card_idx])
                ctype = card.card_type

                if card.is_friend_card():
                    pal_count += 1
                    pal_scores = DEFAULT_PAL_FRIENDSHIP_SCORES
                    if favor == FAVOR_LEVEL_1:
                        score += pal_scores[0]
                    elif favor == FAVOR_LEVEL_2:
                        score += pal_scores[1]
                    elif favor >= FAVOR_LEVEL_3:
                        score += pal_scores[2]
                    continue

                if card.is_group_card():
                    if favor == FAVOR_LEVEL_1:
                        score += w_lv1
                    elif favor == FAVOR_LEVEL_2:
                        score += w_lv2
                    continue

                if favor >= FAVOR_LEVEL_3 and ctype == target_type:
                    continue

                if favor >= FAVOR_LEVEL_3 and ctype != target_type:
                    continue

                if favor == FAVOR_LEVEL_1:
                    lv1c += 1
                    lv1_add = w_lv1
                    lv1_total += lv1_add
                    score += lv1_add
                elif favor == FAVOR_LEVEL_2:
                    lv2c += 1
                    lv2_add = w_lv2
                    lv2_total += lv2_add
                    score += lv2_add

            stat_score = 0.0
            for sk_idx in range(6):
                sv = stat_gains[sk_idx]
                if sv > 0:
                    bonus_mult = 1.0
                    if sk_idx < 5:
                        bonus_mult = 1.0 + 0.01 * state.stat_bonus_pct[sk_idx]
                    contrib = sv * stat_mult[sk_idx] * bonus_mult
                    stat_score += contrib

            score += stat_score

            energy_change_contrib = vital_change * 0.0056

            if energy >= 80 and vital_change < 0:
                energy_change_contrib *= 0.9
            score += energy_change_contrib

            hint_count = 0
            for card_idx in cards_at:
                card = self.deck_cards[card_idx]
                if card.hint_frequency > 0 and random.random() * 100 < card.hint_frequency:
                    hint_count += 1
            if hint_count > 0:
                hint_bonus = w_hint
                score += hint_bonus

            pal_mult = 1.0
            if pal_count > 0:
                pal_mult = 1.0 + DEFAULT_PAL_CARD_MULTIPLIER
                score *= pal_mult

            fail_mult = 1.0
            if fail_rate >= 0:
                fail_mult = max(0.0, 1.0 - fail_rate / 50.0)
                score *= fail_mult

            if idx == TRA_WISDOM:
                if energy > 90:
                    if date > 72:
                        score *= 0.35
                    else:
                        score *= 0.75
                elif energy < 85:
                    score *= 1.03

            computed_scores[idx] = score

        if highest_stat_idx is not None:
            computed_scores[highest_stat_idx] *= 0.95
            for i in range(5):
                cards_at = distribution.get(i, [])
                sg, _, _ = calculate_training_value(
                    state, i, cards_at, self.deck_cards, self.effect_calculator
                )
                if highest_stat_idx < 5 and sg[highest_stat_idx] > 0:
                    bonus_mult = 1.0 + 0.01 * state.stat_bonus_pct[highest_stat_idx]
                    penalty = sg[highest_stat_idx] * stat_mult[highest_stat_idx] * bonus_mult * 0.05
                    if penalty > 0:
                        computed_scores[i] -= penalty

        return computed_scores, training_data

    def decide_operation(self, state: CareerState,
                        distribution: Dict[int, List[int]]
                        ) -> Tuple[str, int]:
        energy = state.vital
        date = state.turn
        medic_available = state.medic_room_available

        if date <= 36:
            mood_threshold = DEFAULT_MOTIVATION_THRESHOLD_YEAR1
        elif date <= 60:
            mood_threshold = DEFAULT_MOTIVATION_THRESHOLD_YEAR2
        else:
            mood_threshold = DEFAULT_MOTIVATION_THRESHOLD_YEAR3

        rest_threshold = DEFAULT_REST_THRESHOLD

        if medic_available and energy <= ENERGY_FAST_MEDIC:
            return 'medic', -1

        if energy < ENERGY_FAST_TRIP and state.motivation < mood_threshold:
            return 'trip', -1

        if energy <= rest_threshold:
            return 'rest', -1

        scores, training_data = self.compute_scores(state, distribution)
        max_score = max(scores) if scores else 0.0

        support_card_max = max(
            len(distribution.get(i, [])) for i in range(5)
        )

        if medic_available and energy <= ENERGY_MEDIC_GENERAL:
            return 'medic', -1

        if not medic_available and state.motivation < mood_threshold and energy < ENERGY_TRIP_GENERAL:
            if (date <= 36 and not support_card_max >= MIN_SUPPORT_GOOD_TRAINING) or \
               (40 < date <= 60) or \
               (64 < date):
                if max_score <= 0.3:
                    return 'trip', -1

        if date in (36, 60) and energy < ENERGY_REST_EXTRA_DAY:
            return 'rest', -1

        if date in SUMMER_CONSERVE_DATES:
            if max_score < DEFAULT_SUMMER_SCORE_THRESHOLD:
                if energy < SUMMER_CONSERVE_ENERGY:
                    return 'rest', -1
                else:
                    return 'train', TRA_WISDOM

        eps = 1e-9
        max_score = max(scores)
        ties = [i for i, s in enumerate(scores) if abs(s - max_score) < eps]
        chosen = TRA_WISDOM if TRA_WISDOM in ties else min(ties)

        return 'train', chosen

    def apply_training(self, state: CareerState, train_type: int,
                       cards_at_training: List[int]) -> bool:
        stat_gains, vital_change, fail_rate = calculate_training_value(
            state, train_type, cards_at_training, self.deck_cards, self.effect_calculator
        )

        if self.effect_calculator.check_zero_failure_chance():
            fail_rate = 0

        if random.random() * 100 < fail_rate:
            state.add_vital(vital_change)
            return False

        for i in range(5):
            state.add_status(i, stat_gains[i])

        state.add_skill_pt(stat_gains[5])

        state.add_vital(vital_change)

        for card_idx in cards_at_training:
            card = self.deck_cards[card_idx]
            bond_gain = 4
            if card.card_type == train_type:
                bond_gain += 3
            state.add_friendship(card_idx, bond_gain)

        state.add_training_level(train_type, 1)

        return True
