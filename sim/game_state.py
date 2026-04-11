from dataclasses import dataclass, field
from typing import List
import random

TRA_SPEED, TRA_STAMINA, TRA_POWER, TRA_GUTS, TRA_WISDOM, TRA_REST, TRA_NONE = 0, 1, 2, 3, 4, 5, -1
TRAINING_NAMES = ['Speed', 'Stamina', 'Power', 'Guts', 'Wisdom']
DATE_JUNIOR_END, DATE_CLASSIC_END, DATE_SENIOR_END, DATE_SPRING_END = 24, 48, 72, 60
SUMMER_CAMP_1_START, SUMMER_CAMP_1_END = 36, 40
SUMMER_CAMP_2_START, SUMMER_CAMP_2_END = 60, 64
TOTAL_TURN = 78

TRAINING_BASIC_VALUE = [
    [[11,0,2,0,0,5,-19],[12,0,2,0,0,5,-20],[13,0,2,0,0,5,-21],[14,0,3,0,0,5,-23],[15,0,4,0,0,5,-25]],
    [[0,10,0,4,0,5,-20],[0,11,0,4,0,5,-21],[0,12,0,5,0,5,-22],[0,13,0,5,0,5,-24],[0,14,0,6,0,5,-26]],
    [[0,4,10,0,0,5,-20],[0,4,11,0,0,5,-21],[0,5,12,0,0,5,-22],[0,5,13,0,0,5,-24],[0,6,14,0,0,5,-26]],
    [[2,0,2,9,0,5,-20],[2,0,2,10,0,5,-21],[2,0,2,11,0,5,-22],[3,0,2,12,0,5,-24],[4,0,3,13,0,5,-26]],
    [[2,0,0,0,8,5,5],[2,0,0,0,9,5,5],[2,0,0,0,10,5,5],[3,0,0,0,11,5,5],[4,0,0,0,12,5,5]]
]

FAIL_RATE_BASIC = [
    [520, 524, 528, 532, 536],
    [507, 511, 515, 519, 523],
    [516, 520, 524, 528, 532],
    [532, 536, 540, 544, 548],
    [320, 321, 322, 323, 324]
]

SUMMER_CONSERVE_DATES = (35, 36, 59, 60)
SUMMER_CONSERVE_ENERGY = 60

FAVOR_LEVEL_1, FAVOR_LEVEL_2, FAVOR_LEVEL_3, FAVOR_LEVEL_4 = 1, 2, 3, 4

def get_favor_level(bond: int) -> int:
    if bond >= 100: return FAVOR_LEVEL_4
    elif bond >= 80: return FAVOR_LEVEL_3
    elif bond >= 60: return FAVOR_LEVEL_2
    return FAVOR_LEVEL_1

@dataclass
class CareerState:
    turn: int = 0
    vital: int = 100
    maxVital: int = 100
    motivation: int = 3
    fiveStatus: List[int] = field(default_factory=lambda: [0, 0, 0, 0, 0])
    fiveStatusLimit: List[int] = field(default_factory=lambda: [9999, 9999, 9999, 9999, 9999])
    stat_bonus_pct: List[int] = field(default_factory=lambda: [0, 0, 0, 0, 0])
    skillPt: int = 120
    skillScore: int = 0
    trainLevelCount: List[int] = field(default_factory=lambda: [0, 0, 0, 0, 0])
    friendship: List[int] = field(default_factory=lambda: [0, 0, 0, 0, 0, 0])
    uniqueEffectState: dict = field(default_factory=dict)
    medic_room_available: bool = False
    medic_uses_remaining: int = 5
    last_medic_turn: int = -10
    debut_race_win: bool = False
    ura_races_completed: List[bool] = field(default_factory=lambda: [False, False, False])

    def get_facility_level(self, train_type: int) -> int:
        return self.trainLevelCount[train_type] // 4

    def get_training_level(self, train_type: int) -> int:
        if self.is_summer_camp(): return 4
        return min(4, self.trainLevelCount[train_type] // 4)

    def add_training_level(self, train_type: int, n: int = 1):
        self.trainLevelCount[train_type] = min(16, self.trainLevelCount[train_type] + n)

    def add_status(self, idx: int, value: int):
        if value > 0 and idx < len(self.stat_bonus_pct):
            value += int(value * 0.01 * self.stat_bonus_pct[idx])
        self.fiveStatus[idx] = max(1, min(self.fiveStatusLimit[idx], self.fiveStatus[idx] + value))

    def add_vital(self, value: int):
        self.vital = max(0, min(self.maxVital, self.vital + value))

    def add_motivation(self, value: int):
        self.motivation = max(1, min(5, self.motivation + value))

    def add_skill_pt(self, value: int):
        self.skillPt = max(0, self.skillPt + value)

    def add_friendship(self, idx: int, value: int):
        if 0 <= idx < 6:
            self.friendship[idx] = min(100, self.friendship[idx] + value)

    def calculate_failure_rate(self, train_type: int, fail_rate_mult: float = 1.0) -> float:
        level = self.get_training_level(train_type)
        x0 = 0.1 * FAIL_RATE_BASIC[train_type][level]
        f = 0.0
        if self.vital < x0:
            f = (100 - self.vital) * (x0 - self.vital) / 40.0
        return max(0, min(99, f * fail_rate_mult))

    def get_period_index(self) -> int:
        if self.turn <= DATE_JUNIOR_END: return 0
        elif self.turn <= DATE_CLASSIC_END: return 1
        elif self.turn <= SUMMER_CAMP_2_START: return 2
        elif self.turn <= DATE_SENIOR_END: return 3
        return 4

    def is_summer_camp(self) -> bool:
        return (SUMMER_CAMP_1_START < self.turn <= SUMMER_CAMP_1_END or
                SUMMER_CAMP_2_START < self.turn <= SUMMER_CAMP_2_END)

    def is_terminal(self) -> bool:
        return self.turn >= TOTAL_TURN

    def copy(self) -> 'CareerState':
        return CareerState(
            turn=self.turn, vital=self.vital, maxVital=self.maxVital, motivation=self.motivation,
            fiveStatus=self.fiveStatus.copy(), fiveStatusLimit=self.fiveStatusLimit.copy(),
            stat_bonus_pct=self.stat_bonus_pct.copy(), skillPt=self.skillPt, skillScore=self.skillScore,
            trainLevelCount=self.trainLevelCount.copy(), friendship=self.friendship.copy(),
            uniqueEffectState=self.uniqueEffectState.copy(), medic_room_available=self.medic_room_available,
            medic_uses_remaining=self.medic_uses_remaining, last_medic_turn=self.last_medic_turn,
            debut_race_win=self.debut_race_win, ura_races_completed=self.ura_races_completed.copy()
        )
