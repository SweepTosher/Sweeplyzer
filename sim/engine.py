import random
from typing import List, Dict
from dataclasses import dataclass

from .game_state import (
    CareerState, TOTAL_TURN,
    SUMMER_CAMP_1_START, SUMMER_CAMP_1_END,
    SUMMER_CAMP_2_START, SUMMER_CAMP_2_END
)
from .card import SupportCard, load_cards_from_json, find_card_by_id
from .unique_effects import load_unique_effects, UniqueEffectCalculator
from .training import TrainingScorer, distribute_cards, DEFAULT_REST_THRESHOLD


@dataclass
class SimulationResult:
    final_stats: List[int]
    skill_points: int
    turns_completed: int
    training_counts: List[int]
    rest_counts: int
    medic_counts: int
    trip_counts: int
    race_counts: int
    total_failures: int
    events_triggered: int


class SimulationEngine:

    RACE_GRADES = {
        'G1': {'stat_bonus': 5, 'sp_bonus': 50},
        'G2': {'stat_bonus': 3, 'sp_bonus': 45},
        'G3': {'stat_bonus': 2, 'sp_bonus': 40},
    }

    def __init__(self, deck_data: List[dict], num_simulations: int = 11, max_turns: int = 78,
                 race_schedule: List[Dict] = None,
                 stat_bonus: List[int] = None,
                 starting_stats: List[int] = None,
                 card_filepath: str = 'data/cards.json',
                 unique_effects_filepath: str = 'data/unique_effects.json'):
        self.num_simulations = num_simulations
        self.max_turns = max_turns
        self.race_schedule = race_schedule or []
        self.stat_bonus = stat_bonus or [0, 0, 0, 0, 0]
        self.starting_stats = starting_stats or [88, 88, 88, 88, 88]

        self.race_turns = {r['turn']: r.get('grade', 'G3') for r in self.race_schedule}

        import json
        with open(card_filepath, encoding='utf-8') as f:
            raw_cards_data = json.load(f)

        self.unique_effects = load_unique_effects(unique_effects_filepath)

        self.deck_cards: List[SupportCard] = []
        for item in deck_data:
            card_id = item.get('card_id', '')
            lb = item.get('lb', 4)
            for raw_card in raw_cards_data:
                if str(raw_card.get('id', '')) == str(card_id):
                    deck_card = SupportCard(raw_card, lb_level=lb)
                    self.deck_cards.append(deck_card)
                    break

        self.effect_calculator = UniqueEffectCalculator(self.deck_cards, self.unique_effects)

        self._calc_initial_friendships()

        self.card_event_thresholds = [30, 60, 80]

    def _calc_initial_friendships(self):
        self.initial_friendships = []
        for card in self.deck_cards:
            initial = card.initial_friendship_gauge
            initial += self.effect_calculator.get_initial_friendship_gauge_bonus()
            self.initial_friendships.append(initial)

    def _roll_medic_room(self, state: CareerState) -> bool:
        if state.medic_uses_remaining <= 0:
            return False

        if state.turn - state.last_medic_turn < 4:
            return False

        if state.turn < 12:
            chance = 0.25
        elif state.turn <= 48:
            chance = 0.35
        elif state.turn <= 72:
            chance = 0.25
        else:
            chance = 0.1
        return random.random() < chance

    def simulate_single(self) -> SimulationResult:
        state = CareerState()
        state.vital = 100
        state.maxVital = 100
        state.motivation = 3
        state.skillPt = 120
        state.turn = 0
        state.debut_race_win = False

        state.stat_bonus_pct = self.stat_bonus.copy()

        for i in range(5):
            state.fiveStatus[i] = self.starting_stats[i]

        for i in range(len(self.deck_cards)):
            if i < len(self.initial_friendships):
                state.friendship[i] = min(100, self.initial_friendships[i])

        for card in self.deck_cards:
            for j in range(5):
                state.add_status(j, card.initial_bonus[j])
            state.add_skill_pt(card.initial_bonus[5])

        ue_initial = self.effect_calculator.get_initial_stat_bonus()
        for i in range(5):
            state.add_status(i, ue_initial[i])

        ue_fail = self.effect_calculator.get_failure_rate_drop()
        ue_vital = self.effect_calculator.get_vital_cost_drop()
        for card in self.deck_cards:
            card.failure_rate_drop += int(ue_fail * 100)
            card.vital_cost_drop += int(ue_vital * 100)
        for card in self.deck_cards:
            card.failure_rate_drop = min(100, card.failure_rate_drop)
            card.vital_cost_drop = min(100, card.vital_cost_drop)

        scorer = TrainingScorer(self.deck_cards, self.effect_calculator)

        card_events_fired = [[] for _ in range(len(self.deck_cards))]

        training_counts = [0, 0, 0, 0, 0]
        rest_counts = 0
        medic_counts = 0
        trip_counts = 0
        race_counts = 0
        total_failures = 0
        events_triggered = 0

        while state.turn < self.max_turns:

            state.medic_room_available = self._roll_medic_room(state)

            distribution = distribute_cards(state, self.deck_cards, self.effect_calculator)

            if state.turn in self.race_turns:
                grade = self.race_turns[state.turn]
                grade_data = self.RACE_GRADES.get(grade, self.RACE_GRADES['G3'])

                total_saihou = sum(card.race_bonus for card in self.deck_cards)
                total_saihou += self.effect_calculator.get_race_bonus()

                race_mult = 1.0 + 0.01 * total_saihou
                stat_gain = int(race_mult * grade_data['stat_bonus'])
                sp_gain = int(race_mult * grade_data['sp_bonus'])

                for i in range(5):
                    state.add_status(i, stat_gain + 1)
                state.add_skill_pt(sp_gain)

                state.add_vital(-20)

                if random.random() < 0.10:
                    state.add_motivation(1)

                race_counts += 1

            else:

                operation, train_type = scorer.decide_operation(state, distribution)

                if operation == 'medic':
                    state.add_vital(30)
                    state.medic_uses_remaining -= 1
                    state.last_medic_turn = state.turn
                    medic_counts += 1

                elif operation == 'trip':
                    state.add_vital(30)
                    state.add_motivation(1)
                    trip_counts += 1

                elif operation == 'rest':
                    state.add_vital(50)
                    rest_counts += 1

                elif operation == 'train':
                    cards_at = distribution.get(train_type, [])
                    training_counts[train_type] += 1
                    success = scorer.apply_training(state, train_type, cards_at)
                    if not success:
                        total_failures += 1

            for i in range(len(self.deck_cards)):
                for threshold in self.card_event_thresholds:
                    if threshold not in card_events_fired[i] and state.friendship[i] >= threshold:
                        card_events_fired[i].append(threshold)
                        events_triggered += 1
                        card = self.deck_cards[i]
                        if card.card_type < 5:
                            state.add_status(card.card_type, random.randint(10, 15))
                        state.add_skill_pt(random.randint(10, 20))
                        if random.random() < 0.5:
                            state.add_vital(10)
                        state.add_friendship(i, 5)

            if state.turn < 72:
                if random.random() < 0.35:
                    events_triggered += 1
                    card = random.randint(0, min(5, len(self.deck_cards) - 1))
                    stat = random.randint(0, 4)
                    state.add_status(stat, 20)
                    state.add_skill_pt(20)
                    state.add_friendship(card, 5)
                    if random.random() < 0.5:
                        state.add_vital(10)
                    if random.random() < 0.4 * (1.0 - state.turn / TOTAL_TURN):
                        state.add_motivation(1)

                if random.random() < 0.10:
                    for i in range(5):
                        state.add_status(i, 3)

                if random.random() < 0.10:
                    state.add_vital(5)

                if random.random() < 0.02:
                    state.add_vital(30)

                if random.random() < 0.02:
                    state.add_motivation(1)

                if state.turn >= 12 and random.random() < 0.04:
                    state.add_motivation(-1)

            if state.turn == 11:
                for i in range(5):
                    state.add_status(i, 3)
                state.add_skill_pt(45)
                state.debut_race_win = True

            if state.turn == 23:
                if state.maxVital - state.vital >= 20:
                    state.add_vital(20)
                else:
                    for i in range(5):
                        state.add_status(i, 5)

            if state.turn == 47:
                if state.maxVital - state.vital >= 30:
                    state.add_vital(30)
                else:
                    for i in range(5):
                        state.add_status(i, 8)

            if state.turn == 48:
                rd = random.random() * 100
                if rd < 16:
                    state.add_vital(30)
                    for i in range(5): state.add_status(i, 10)
                    state.add_motivation(2)
                elif rd < 43:
                    state.add_vital(20)
                    for i in range(5): state.add_status(i, 5)
                    state.add_motivation(1)
                else:
                    state.add_vital(20)

            state.turn += 1

        for i in range(5):
            state.add_status(i, 10)
        state.add_skill_pt(40)
        race_counts += 1

        for i in range(5):
            state.add_status(i, 10)
        state.add_skill_pt(60)
        race_counts += 1

        for i in range(5):
            state.add_status(i, 10)
        state.add_skill_pt(80)
        race_counts += 1

        for i in range(5):
            state.add_status(i, 45)
        state.add_skill_pt(20)

        return SimulationResult(
            final_stats=state.fiveStatus.copy(),
            skill_points=state.skillPt,
            turns_completed=state.turn,
            training_counts=training_counts,
            rest_counts=rest_counts,
            medic_counts=medic_counts,
            trip_counts=trip_counts,
            race_counts=race_counts,
            total_failures=total_failures,
            events_triggered=events_triggered,
        )

    def run_simulations(self) -> Dict:
        results: List[SimulationResult] = []

        for i in range(self.num_simulations):
            results.append(self.simulate_single())

        n = len(results)
        all_stats = [[r.final_stats[i] for r in results] for i in range(5)]
        all_sp = [r.skill_points for r in results]

        avg_stats = {
            'speed': sum(all_stats[0]) / n,
            'stamina': sum(all_stats[1]) / n,
            'power': sum(all_stats[2]) / n,
            'guts': sum(all_stats[3]) / n,
            'wisdom': sum(all_stats[4]) / n,
        }

        def calc_dist(arr):
            arr.sort()
            mean = sum(arr) / n
            variance = sum((x - mean) ** 2 for x in arr) / n
            return {
                'min': arr[0],
                'max': arr[-1],
                'mean': mean,
                'std': variance ** 0.5,
                'p25': arr[int(n * 0.25)],
                'p50': arr[int(n * 0.50)],
                'p75': arr[int(n * 0.75)],
            }

        dist_stats = {
            'speed': calc_dist(all_stats[0]),
            'stamina': calc_dist(all_stats[1]),
            'power': calc_dist(all_stats[2]),
            'guts': calc_dist(all_stats[3]),
            'wisdom': calc_dist(all_stats[4]),
            'sp': calc_dist(all_sp),
        }

        peak_idx = 0
        peak_total = -1
        for i, r in enumerate(results):
            total = r.final_stats[0] + r.final_stats[1] + r.final_stats[2] + r.final_stats[3] + r.final_stats[4] + r.skill_points / 2
            if total > peak_total:
                peak_total = total
                peak_idx = i
        peak_run = {
            'speed': results[peak_idx].final_stats[0],
            'stamina': results[peak_idx].final_stats[1],
            'power': results[peak_idx].final_stats[2],
            'guts': results[peak_idx].final_stats[3],
            'wisdom': results[peak_idx].final_stats[4],
            'sp': results[peak_idx].skill_points,
            'total': peak_total,
            'run_index': peak_idx + 1,
        }

        avg_skill_points = sum(all_sp) / n

        avg_training_counts = [
            sum(r.training_counts[i] for r in results) / n
            for i in range(5)
        ]

        avg_rest = sum(r.rest_counts for r in results) / n
        avg_medic = sum(r.medic_counts for r in results) / n
        avg_trip = sum(r.trip_counts for r in results) / n
        avg_race = sum(r.race_counts for r in results) / n
        avg_failures = sum(r.total_failures for r in results) / n

        total_training = sum(avg_training_counts)
        total_non_training = avg_rest + avg_medic + avg_trip + avg_race

        return {
            'num_simulations': self.num_simulations,
            'max_turns': self.max_turns,
            'avg_stats': avg_stats,
            'dist_stats': dist_stats,
            'peak_run': peak_run,
            'avg_skill_points': avg_skill_points,
            'avg_training_counts': avg_training_counts,
            'avg_rest': avg_rest,
            'avg_medic': avg_medic,
            'avg_trip': avg_trip,
            'avg_race': avg_race,
            'avg_failures': avg_failures,
            'total_training_turns': total_training,
            'total_non_training_turns': total_non_training,
            'total_events_triggered': sum(r.events_triggered for r in results),
            'deck_size': len(self.deck_cards),
        }


def run_simulation(deck_data: List[dict], num_simulations: int = 11,
                   max_turns: int = 72, race_schedule: List[Dict] = None,
                   stat_bonus: List[int] = None, starting_stats: List[int] = None) -> Dict:
    num_simulations = min(1111, max(1, num_simulations))
    max_turns = min(78, max(20, max_turns))

    engine = SimulationEngine(deck_data, num_simulations, max_turns,
                              race_schedule=race_schedule,
                              stat_bonus=stat_bonus,
                              starting_stats=starting_stats)
    return engine.run_simulations()
