import re
from typing import List, Dict
from dataclasses import dataclass

STAT_NAME_MAP = {
    'speed': 0,
    'stamina': 1,
    'power': 2,
    'guts': 3,
    'wit': 4,
}


@dataclass
class UniqueEffect:
    id: str
    text: str

    bond_threshold: int = 0
    full_bond: bool = False
    deck_type_min: int = 0

    training_effectiveness: int = 0
    friendship_bonus: int = 0
    mood_effect: int = 0
    speed_bonus: int = 0
    stamina_bonus: int = 0
    power_bonus: int = 0
    guts_bonus: int = 0
    wits_bonus: int = 0
    skill_point_bonus: int = 0
    failure_rate_drop: int = 0
    vital_cost_drop: int = 0
    initial_friendship_gauge: int = 0
    initial_speed: int = 0
    initial_stamina: int = 0
    initial_power: int = 0
    initial_guts: int = 0
    initial_wits: int = 0
    specialty_priority: int = 0
    hint_frequency: int = 0
    race_bonus: int = 0


def _parse_part(text: str, effect: UniqueEffect):
    t = text.strip().lower()

    pct_match = re.search(r'\((\d+)%\)', t)
    int_match = re.search(r'\((\d+)\)', t)

    pct_val = int(pct_match.group(1)) if pct_match else 0
    int_val = int(int_match.group(1)) if int_match else 0

    if 'training effectiveness' in t or 'increased training' in t:
        if pct_val > 0:
            effect.training_effectiveness += pct_val
        elif int_val > 0:
            effect.training_effectiveness += int_val
        return

    if 'friendship bonus' in t:
        effect.friendship_bonus += int_val or pct_val
        return

    if 'mood effect' in t or 'amplifies the effect of mood' in t:
        effect.mood_effect += pct_val or int_val
        return

    for stat_name, stat_idx in STAT_NAME_MAP.items():
        if f'{stat_name} gain' in t or f'gain {stat_name} bonus' in t or f'gain {stat_name}' in t:
            bonus = int_val or pct_val
            if stat_idx == 0: effect.speed_bonus += bonus
            elif stat_idx == 1: effect.stamina_bonus += bonus
            elif stat_idx == 2: effect.power_bonus += bonus
            elif stat_idx == 3: effect.guts_bonus += bonus
            elif stat_idx == 4: effect.wits_bonus += bonus
            return

    if 'speed bonus' in t:
        effect.speed_bonus += int_val
        return
    if 'stamina bonus' in t:
        effect.stamina_bonus += int_val
        return
    if 'power bonus' in t:
        effect.power_bonus += int_val
        return
    if 'guts bonus' in t:
        effect.guts_bonus += int_val
        return
    if 'wit bonus' in t:
        effect.wits_bonus += int_val
        return
    if 'all stats bonus' in t:
        effect.speed_bonus += int_val
        effect.stamina_bonus += int_val
        effect.power_bonus += int_val
        effect.guts_bonus += int_val
        effect.wits_bonus += int_val
        return
    if 'skill point bonus' in t:
        effect.skill_point_bonus += int_val
        return

    if 'initial speed' in t:
        effect.initial_speed += int_val
        return
    if 'initial stamina' in t:
        effect.initial_stamina += int_val
        return
    if 'initial power' in t:
        effect.initial_power += int_val
        return
    if 'initial guts' in t:
        effect.initial_guts += int_val
        return
    if 'initial wit' in t:
        effect.initial_wits += int_val
        return
    if 'initial friendship gauge' in t or 'initial friendship' in t:
        effect.initial_friendship_gauge += int_val
        return
    if 'initial stat up' in t:
        effect.initial_speed += int_val
        effect.initial_stamina += int_val
        effect.initial_power += int_val
        effect.initial_guts += int_val
        effect.initial_wits += int_val
        return

    if 'decreases the probability of failure' in t or 'failure when training' in t:
        effect.failure_rate_drop += pct_val or int_val
        return

    if 'decreases energy consumed' in t or 'energy cost reduction' in t or 'energy cost' in t:
        effect.vital_cost_drop += pct_val or int_val
        return

    if 'specialty priority' in t:
        effect.specialty_priority += int_val
        return

    if 'hint' in t and ('frequency' in t or 'quantity' in t):
        effect.hint_frequency += pct_val or int_val
        return

    if 'skill point' in t and 'gain' in t:
        effect.skill_point_bonus += int_val
        return

    if 'stat gain from races' in t:
        pct_match = re.search(r'races\s*\((\d+)%\)', t)
        if pct_match:
            effect.race_bonus += int(pct_match.group(1))
        return

    if 'frequency at which the character participates in their preferred' in t:
        effect.specialty_priority += pct_val or int_val or 20
        return

    if 'frequency at which hint events occur' in t:
        effect.hint_frequency += pct_val or int_val
        return

    if 'bonus bond from training' in t:
        effect.initial_friendship_gauge += int_val
        return


def parse_unique_effect(effect_data: dict) -> UniqueEffect:
    ue = UniqueEffect(
        id=effect_data.get('id', ''),
        text=effect_data.get('text', '')
    )

    text = ue.text

    t_lower = text.lower()
    if 'bond gauge is full' in t_lower:
        ue.full_bond = True
        ue.bond_threshold = 100
    elif 'bond gauge is at least 80' in t_lower:
        ue.bond_threshold = 80
    elif 'bond gauge is at least 60' in t_lower:
        ue.bond_threshold = 60
    if 'at least 4 different types' in t_lower:
        ue.deck_type_min = 4
    elif 'at least 5 different types' in t_lower:
        ue.deck_type_min = 5

    parts = []

    if ' and ' in text and not text.strip().startswith('If'):
        and_parts = text.split(' and ')
        if len(and_parts) == 2:
            parts.append(and_parts[0].strip())
            parts.append(and_parts[1].strip())
        else:
            parts.append(text)
    else:
        splits = re.split(r'(?<=\))\s+(?=[A-Z])', text)
        if len(splits) > 1:
            parts = [s.strip() for s in splits]
        else:
            if ';' in text:
                parts = [p.strip() for p in text.split(';')]
            else:
                parts = [text]

    for part in parts:
        _parse_part(part, ue)

    if 'ue_24' in ue.id:
        ue.speed_bonus = 1
        ue.stamina_bonus = 1
        ue.power_bonus = 1
        ue.guts_bonus = 1
        ue.wits_bonus = 1

    if 'ue_32' in ue.id:
        ue.training_effectiveness = 5

    if 'ue_37' in ue.id:
        ue.training_effectiveness = 5

    if 'ue_39' in ue.id:
        ue.initial_friendship_gauge = 5

    if 'ue_43' in ue.id:
        ue.specialty_priority = 30

    if 'ue_50' in ue.id:
        ue.specialty_priority = 50

    if 'ue_59' in ue.id:
        ue.initial_speed = 10
        ue.initial_stamina = 10
        ue.initial_power = 10
        ue.initial_guts = 10
        ue.initial_wits = 10

    if 'ue_60' in ue.id:
        ue.training_effectiveness = 5

    if 'ue_62' in ue.id:
        ue.training_effectiveness = 5

    if 'ue_64' in ue.id:
        ue.training_effectiveness = 5

    if 'ue_65' in ue.id:
        ue.training_effectiveness = 5

    if 'ue_69' in ue.id:
        ue.training_effectiveness = 15

    if 'ue_71' in ue.id:
        ue.failure_rate_drop = 20

    if 'ue_73' in ue.id:
        ue.friendship_bonus = 10

    if 'ue_79' in ue.id:
        ue.training_effectiveness = 5

    if 'ue_82' in ue.id:
        ue.friendship_bonus = 10

    if 'ue_83' in ue.id:
        ue.training_effectiveness = 10

    if 'ue_85' in ue.id:
        ue.training_effectiveness = 20

    if 'ue_90' in ue.id:
        ue.friendship_bonus = 10
        ue.training_effectiveness = 5

    return ue


def load_unique_effects(filepath: str = 'data/unique_effects.json') -> Dict[str, UniqueEffect]:
    import json
    with open(filepath, encoding='utf-8') as f:
        data = json.load(f)

    effects = {}
    for item in data:
        ue = parse_unique_effect(item)
        effects[ue.id] = ue

    return effects


class UniqueEffectCalculator:

    def __init__(self, deck_cards, unique_effects: Dict[str, UniqueEffect]):
        self.deck_cards = deck_cards
        self.unique_effects = unique_effects

        self.active_effects: List[UniqueEffect] = []
        for card in deck_cards:
            if card.unique_effect_id and card.unique_effect_id in unique_effects:
                self.active_effects.append(unique_effects[card.unique_effect_id])

        self.unique_types = len(set(c.type for c in deck_cards if c.type not in ('friend', 'group')))

    def get_training_effectiveness_bonus(self, state) -> int:
        total = 0
        for ue in self.active_effects:
            if ue.training_effectiveness > 0:
                if ue.bond_threshold > 0:
                    if not any(state.friendship[i] >= ue.bond_threshold for i in range(len(self.deck_cards))):
                        continue
                if ue.full_bond:
                    if not any(state.friendship[i] >= 100 for i in range(len(self.deck_cards))):
                        continue
                if ue.deck_type_min > 0 and self.unique_types < ue.deck_type_min:
                    continue
                total += ue.training_effectiveness
        return total

    def get_failure_rate_drop(self) -> float:
        total = 0
        for ue in self.active_effects:
            total += ue.failure_rate_drop
        return min(1.0, total / 100.0)

    def get_vital_cost_drop(self) -> float:
        total = 0
        for ue in self.active_effects:
            total += ue.vital_cost_drop
        return min(1.0, total / 100.0)

    def get_specialty_priority_bonus(self, state) -> int:
        total = 0
        for ue in self.active_effects:
            if ue.specialty_priority > 0:
                if ue.bond_threshold > 0:
                    if not any(state.friendship[i] >= ue.bond_threshold for i in range(len(self.deck_cards))):
                        continue
                total += ue.specialty_priority
        return total

    def get_initial_friendship_gauge_bonus(self) -> int:
        total = 0
        for ue in self.active_effects:
            total += ue.initial_friendship_gauge
        return total

    def get_race_bonus(self) -> int:
        total = 0
        for ue in self.active_effects:
            total += ue.race_bonus
        return total

    def get_mood_effect_bonus(self, state) -> int:
        total = 0
        for ue in self.active_effects:
            if ue.mood_effect > 0:
                if ue.full_bond:
                    if any(state.friendship[i] >= 100 for i in range(len(self.deck_cards))):
                        total += ue.mood_effect
                elif ue.bond_threshold > 0:
                    if any(state.friendship[i] >= ue.bond_threshold for i in range(len(self.deck_cards))):
                        total += ue.mood_effect
                else:
                    total += ue.mood_effect
        return total

    def get_stat_bonus(self, state) -> List[int]:
        result = [0, 0, 0, 0, 0, 0]
        for ue in self.active_effects:
            bonuses = [ue.speed_bonus, ue.stamina_bonus, ue.power_bonus,
                      ue.guts_bonus, ue.wits_bonus, ue.skill_point_bonus]
            if not any(b > 0 for b in bonuses):
                continue

            if ue.bond_threshold > 0:
                if not any(state.friendship[i] >= ue.bond_threshold for i in range(len(self.deck_cards))):
                    continue
            if ue.full_bond:
                if not any(state.friendship[i] >= 100 for i in range(len(self.deck_cards))):
                    continue
            if ue.deck_type_min > 0 and self.unique_types < ue.deck_type_min:
                continue
            for i in range(6):
                result[i] += bonuses[i]
        return result

    def get_initial_stat_bonus(self) -> List[int]:
        result = [0, 0, 0, 0, 0]
        for ue in self.active_effects:
            result[0] += ue.initial_speed
            result[1] += ue.initial_stamina
            result[2] += ue.initial_power
            result[3] += ue.initial_guts
            result[4] += ue.initial_wits
        return result

    def check_zero_failure_chance(self) -> bool:
        for ue in self.active_effects:
            if ue.failure_rate_drop >= 20 and '20% chance' in ue.text:
                import random
                return random.random() < 0.20
        return False
