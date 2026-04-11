from dataclasses import dataclass
from typing import Dict, List, Optional

CARD_TYPE_MAP = {
    'speed': 0,
    'stamina': 1,
    'power': 2,
    'guts': 3,
    'wisdom': 4,
    'friend': 6,
    'group': 6
}


@dataclass
class CardEffect:
    friendship_bonus: int = 0
    training_bonus: int = 0
    mood_effect: int = 0
    speed_bonus: int = 0
    stamina_bonus: int = 0
    power_bonus: int = 0
    guts_bonus: int = 0
    wits_bonus: int = 0
    skill_point_bonus: int = 0

    initial_speed: int = 0
    initial_stamina: int = 0
    initial_power: int = 0
    initial_guts: int = 0

    initial_friendship_gauge: int = 0
    hint_frequency: int = 0
    specialty_priority: int = 0
    race_bonus: int = 0
    fan_bonus: int = 0

    failure_rate_drop: int = 0
    vital_cost_drop: int = 0

    @staticmethod
    def from_dict(d: dict) -> 'CardEffect':
        return CardEffect(
            friendship_bonus=d.get('friendship_bonus', 0),
            training_bonus=d.get('training_bonus', 0),
            mood_effect=d.get('mood_effect', 0),
            speed_bonus=d.get('speed_bonus', 0),
            stamina_bonus=d.get('stamina_bonus', 0),
            power_bonus=d.get('power_bonus', 0),
            guts_bonus=d.get('guts_bonus', 0),
            wits_bonus=d.get('wits_bonus', 0),
            skill_point_bonus=d.get('skill_point_bonus', 0),
            initial_speed=d.get('initial_speed', 0),
            initial_stamina=d.get('initial_stamina', 0),
            initial_power=d.get('initial_power', 0),
            initial_guts=d.get('initial_guts', 0),
            initial_friendship_gauge=d.get('initial_friendship_gauge', 0),
            hint_frequency=d.get('hint_frequency', 0),
            specialty_priority=d.get('specialty_priority', 0),
            race_bonus=d.get('race_bonus', 0),
            fan_bonus=d.get('fan_bonus', 0),
        )


class SupportCard:

    def __init__(self, card_data: dict, lb_level: int = 4):
        self.id = card_data.get('id', '')
        self.title = card_data.get('title', '')
        self.rarity = card_data.get('rarity', 'R')
        self.type = card_data.get('type', 'speed')
        self.card_type = CARD_TYPE_MAP.get(self.type, 0)
        self.image_url = card_data.get('image_url', '')
        self.unique_effect_id = card_data.get('unique_effect_id', None)

        effects_list = card_data.get('effects', [])
        self.effects: List[CardEffect] = []
        for i in range(5):
            if i < len(effects_list):
                self.effects.append(CardEffect.from_dict(effects_list[i]))
            else:
                self.effects.append(CardEffect())

        self.lb_level = lb_level
        self.effect = self.effects[lb_level] if lb_level < len(self.effects) else self.effects[-1]

        self.friendship_bonus = self.effect.friendship_bonus
        self.training_bonus = self.effect.training_bonus
        self.mood_effect = self.effect.mood_effect

        self.stat_bonus = [
            self.effect.speed_bonus,
            self.effect.stamina_bonus,
            self.effect.power_bonus,
            self.effect.guts_bonus,
            self.effect.wits_bonus,
            self.effect.skill_point_bonus
        ]

        self.initial_bonus = [
            self.effect.initial_speed,
            self.effect.initial_stamina,
            self.effect.initial_power,
            self.effect.initial_guts,
            0,
            0,
        ]

        self.initial_friendship_gauge = self.effect.initial_friendship_gauge
        self.hint_frequency = self.effect.hint_frequency
        self.specialty_priority = self.effect.specialty_priority
        self.race_bonus = self.effect.race_bonus
        self.fan_bonus = self.effect.fan_bonus

        self.failure_rate_drop = 0
        self.vital_cost_drop = 0

    def is_friend_card(self) -> bool:
        return self.type == 'friend'

    def is_group_card(self) -> bool:
        return self.type == 'group'

    def __repr__(self):
        return f"SupportCard({self.id}, {self.title}, {self.type}, LB{self.lb_level})"


def load_cards_from_json(filepath: str = 'data/cards.json') -> List[SupportCard]:
    import json
    with open(filepath, encoding='utf-8') as f:
        data = json.load(f)
    return [SupportCard(card) for card in data]


def find_card_by_id(cards: List[SupportCard], card_id: str) -> Optional[SupportCard]:
    for card in cards:
        if card.id == card_id:
            return card
    return None
