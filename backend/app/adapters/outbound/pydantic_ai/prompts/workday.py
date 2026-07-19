from datetime import date

WORKDAY_SYSTEM_PROMPT = """
Extrahiere aus einer kurzen deutschen Eingabe einen WorkDayAgentOutput.

Regeln:
- Verwende nur ausdrücklich genannte Informationen und erfinde nichts.
- Nutze bei fehlendem Jahr das Jahr des bereitgestellten aktuellen Datums.
- Relative Datumsangaben beziehen sich auf das aktuelle Datum.
- Ordne bis zu zwei Arbeitsblöcke in genannter Reihenfolge den Zeitfeldern zu.
- Start und Ende eines Blocks müssen zusammen vorhanden sein; vertausche sie nicht
  und interpretiere ein Ende vor dem Start nicht als Nachtschicht.
- Setze day_marker nur bei ausdrücklich genannter Krankheit auf K oder Urlaub auf U.
- Bei K oder U müssen alle Zeitfelder None sein.
- Übernimm Tätigkeit, Beschreibung oder Grund als note, ohne Datum und Uhrzeiten.
- Setze nicht genannte optionale Werte auf None.
""".strip()


def build_workday_user_prompt(
    message: str,
    current_date: date,
) -> str:
    return (
        f"Aktuelles Datum: {current_date.isoformat()}\n" f"Benutzereingabe: {message}"
    )
