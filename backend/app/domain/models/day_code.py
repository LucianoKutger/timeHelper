from enum import StrEnum


class DayCode(StrEnum):
    SICK = "K"
    SICK_REMAINDER = "KR"
    VACATION = "U"
    VACATION_HALF = "UH"
    FLEX_DAY = "G"
    HOME_OFFICE = "H"
    SHORT_TIME = "KU"
    SHORT_TIME_REMAINDER = "KA"
    ON_CALL = "B"
