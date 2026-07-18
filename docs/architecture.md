# Architektur

PostgreSQL in Supabase ist die fachlich führende Quelle. Die mobile App sendet natürliche Texte an das FastAPI-Backend. PydanticAI erzeugt ausschließlich typisierte Commands. Erst anschließend führen deterministische Application Services Validierung, Persistenz, Excel-Erzeugung und optionale E-Mail-Operationen aus.

## Schichten

1. `api`: HTTP, JWT-Kontext, Request/Response-Schemas
2. `agents`: Sprachinterpretation und strukturierte Command-Ausgabe
3. `domain`: fachliche Modelle und Regeln ohne Plattformabhängigkeiten
4. `services`: Use Cases und Transaktionsgrenzen
5. `repositories`: Ports und Supabase-Adapter
6. `infrastructure`: Clients für Supabase, OpenAI, Storage und Mail

Excel wird nicht bei Tagesänderungen geschrieben. Der Monatsabschluss erzeugt aus Datenbank plus unveränderlicher Vorlage eine neue Jahresrevision und einen unveränderlichen Monatsreport.
