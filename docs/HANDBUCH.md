# Harmony Deck – Handbuch

[English](MANUAL.md)

Dieses Handbuch erklärt die Bedienung nach Aufgaben. Die Versionsgeschichte steht im [CHANGELOG](../CHANGELOG.md).

## 1. Installation

1. HACS → ⋮ → **Benutzerdefinierte Repositories** → `https://github.com/pcipci/harmony-deck`, Typ **Integration**. Alternativ den Ordner `custom_components/harmony_deck/` nach `/config/custom_components/` kopieren.
2. Home Assistant neu starten.
3. Einstellungen → Geräte & Dienste → **Integration hinzufügen** → **Harmony Deck**. Es gibt nichts einzustellen.

Voraussetzung ist die Integration **Logitech Harmony Hub**. Für den Fire TV zusätzlich die Integration **Android TV** (ADB) und am Fire TV „ADB-Debugging" (Einstellungen › Mein Fire TV › Entwickleroptionen).

Nach einem Update: Home Assistant neu starten und die Seite im Browser neu laden (Strg+F5, in der App: Seite nach unten ziehen).

## 2. Erste Schritte

Karte zu einem Dashboard hinzufügen:

```yaml
type: custom:harmony-deck-card
```

Jeder Hub erscheint als Reiter (Raum). Oben steht, was gerade läuft, darunter die Aktivitäten als Kacheln, darunter die Fernbedienung der laufenden Aktivität.

Über **ⓘ** öffnest du die Infos zum Hub und die drei Bearbeitungswege:
- **Einstellungen**: Darstellung, Bedienung, Symbole, Hub, Fire TV, Info. Jeder Reiter beginnt mit einem Satz, wofür er da ist. Jede Option ist eine Zeile: Du kannst irgendwo auf die Zeile tippen, um sie umzuschalten.
- **Favoriten**: Tasten mit Stern markieren, pro Gerät oder pro Aktivität. Mit dem dritten Knopf **Tasten ausblenden** versteckst du Tasten, die du nie brauchst (siehe Abschnitt 6).
- **Aktionen**: eigene Tasten und Sequenzen aus Harmony-Tasten, Pausen und Home-Assistant-Entitäten, als eigener Bearbeitungsmodus.

Mit **Fertig** speicherst du, mit **Abbrechen** verwirfst du alle Änderungen dieser Sitzung. Die Einstellungen liegen in Home Assistant und gelten auf allen Geräten.

## 3. Aktivitäten und Fernbedienung

- Antippen einer Kachel startet die Aktivität. Die laufende ist hervorgehoben.
- **Ausschalten:** Die Power-Kachel (oder der Power-Knopf in der eingeklappten Kopfzeile) kurz **halten**, bis der Ring voll ist. So passiert es nicht aus Versehen.
- **Halten zum Wechseln** (Einstellungen › Bedienung): Läuft eine Aktivität, wechselt eine andere erst nach langem Drücken.
- Die Fernbedienung schickt Lautstärke, Steuerkreuz, Kanal und Wiedergabe jeweils an das Gerät, das der Hub dafür in der Aktivität vorsieht.
- **Kopf einklappen** (Standard an): Sobald eine Fernbedienung offen ist, schrumpft der Kopf auf eine Zeile. Antippen klappt ihn wieder auf.

## 4. Geräte

Der Schieber **Aktivitäten / Geräte** wechselt in die Geräteansicht. Ein Gerät antippen öffnet seine eigene Fernbedienung mit allen Befehlen, sortiert nach Gruppen (Eingänge, Ton, Menüs, Ziffern …). Geräte sind nie gesperrt, auch nicht bei aktiver Sperre.

Gehört das Gerät zur laufenden Aktivität, steht oben „Aktiv in …". Ein Tipp darauf führt zur Fernbedienung der Aktivität zurück.

## 5. Rettungsring (Hilfe)

Startet eine Aktivität nicht richtig (Fernseher aus, falscher Eingang), öffnest du den **Rettungsring** oben. Er zeigt die Geräte der Aktivität mit Einschalt- und Eingangstaste. **Alles einschalten** schickt alles der Reihe nach. Ein Tipp auf den Gerätenamen öffnet die Fernbedienung dieses Geräts. Über **Liste anpassen** blendest du Geräte aus, die du hier nicht brauchst.

## 6. Favoriten

**ⓘ › Favoriten** → Gerät wählen → Tasten antippen (Stern). Favoriten erscheinen als eigener Block über der Fernbedienung.

**Tasten ausblenden:** Im selben Editor **Tasten ausblenden** wählen und die Tasten eines Geräts antippen, die du nie brauchst (Auge). Sie verschwinden in der Geräteansicht und in den Fernbedienungen der Aktivitäten, für das aktuelle Profil. Erneutes Antippen holt sie zurück. Das ist keine Sperre: Ausgeblendete Tasten werden nur nicht angezeigt. Unter „Aktivitäten" legst du Favoriten fest, die nur in einer bestimmten Aktivität erscheinen (zum Beispiel HDMI-Eingang des Fernsehers bei „Fire TV").

## 7. Aktionen und Sequenzen

**ⓘ › Aktionen** ist ein eigener Bearbeitungsmodus (mit Fertig und Abbrechen wie bei den Einstellungen). Eine **Aktion** ist eine Taste, die Harmony Deck selbst auslöst. Sie hat einen Namen, ein Symbol und eine Liste von **Schritten**. Eine Aktion mit mehreren Schritten ist eine **Sequenz**.

Schritt-Arten:
- **Harmony-Taste:** Gerät wählen (die Geräte der Aktivität zuerst), dann eine Taste. Die Tasten stehen in den bekannten Gruppen, mit Suchfeld und einer Zeile „Zuletzt benutzt". „Wiederholen" sendet die Taste mehrfach.
- **Pause:** ein Schieberegler (fein bis 10 Sekunden, grober bis 5 Minuten) mit groß angezeigtem Wert; −0,1 / +0,1 zum Feinjustieren, auf den Wert tippen für eine genaue Eingabe.
- **Home Assistant:** Licht, Schalter, Skript, Szene, Automation, Taste, Mediaplayer, Rollladen, Klima, Lüfter oder Zahl, mit Suchfeld, Filter-Chips und den zuletzt benutzten Entitäten oben. Bei „Einschalten“ oder „Nur Werte setzen“ erscheint der Bereich **Werte** mit dem, was die Entität selbst kann: Helligkeit und Lichtfarbe (Weiß in Kelvin *oder* eine Farbe), Lautstärke, Quelle und Stumm beim Mediaplayer, Position beim Rollladen, Temperatur, Lüfterstufe, der Wert einer Zahl. Jeder Wert hat einen eigenen Schalter, gesendet wird nur, was eingeschaltet ist. Die Lautstärke von Mediaplayern ist für Aktionen begrenzt (Einstellungen › Verhalten, voreingestellt 80 %).
- **Warten bis:** wartet, bis eine Bedingung stimmt, höchstens die eingestellte Zeit (1 bis 120 Sekunden). Danach geht es weiter oder die Aktion stoppt mit einem Fehler (deine Wahl). Das ersetzt geratene Pausen: „Warten bis der Fernseher an ist, max. 20 s“, dann erst den Eingang umschalten. Stopp beendet das Warten sofort.
- **Wenn:** prüft eine Bedingung einmal. Stimmt sie, folgt der nächste Schritt. Wenn nicht, wählst du: die nächsten 1–10 Schritte überspringen, die Aktion beenden oder mit Fehler und eigener Meldung stoppen. Schritte werden nie wiederholt oder umgeordnet, eine Aktion läuft immer vorwärts.
- **Bedingungen** (bei beiden) sind überall gleich: eine Home-Assistant-Entität, ihr Zustand oder ein Attribut, ein Vergleich (ist, ist nicht, größer, kleiner, mindestens, höchstens) und ein Wert. Beispiele: „Der Fernseher *ist* an“, „der Harmony-Hub, Attribut `current_activity`, *ist* Fire TV“, „der AVR, Attribut `volume_level`, *größer als* 0,3“. Der Wert lässt sich aus dem aktuellen übernehmen. Text wird ohne Rücksicht auf Groß- und Kleinschreibung verglichen; eine fehlende Entität oder ein fehlendes Attribut zählt als „nichts“ (ist: falsch, ist nicht: wahr). Übersprungene Schritte erscheinen in der Schrittliste durchgestrichen.
- **Lautstärke (IR):** für Geräte, die Harmony per Infrarot steuert. Das Gerät meldet seine Lautstärke nicht, deshalb drückt Harmony Deck erst so oft „leiser“, bis es sicher bei 0 ist, dann so oft „lauter“ bis zum Wert; zwischendurch wird es nie laut. Pro Gerät stellt man (einmal, für alle Aktionen) die höchste Lautstärke, die Einheiten pro Tastendruck und den Abstand zwischen den Tastendrücken ein. Der Schritt zeigt, wie lange es dauert. Ein stummes Gerät bleibt je nach Gerät stumm. Stoppen wirkt nach wenigen Sekunden (gesendet wird in Zehnergruppen).

Im Editor ist jeder Schritt eine Zeile: antippen öffnet ihn, die Pfeile rechts verschieben ihn. Unten im geöffneten Schritt stehen „Diesen Schritt testen" und „Schritt löschen"; „Ablauf testen" führt den ganzen Entwurf aus. Jeder Schritt kann eine eigene Beschriftung bekommen. Die **Favoriten der Aktion** (Tasten beliebiger Geräte) wählt man am Ende des Formulars. Eine Aktion mit einem Schritt, etwa „Kerzen umschalten", funktioniert wie die Tasten aus 0.4.

**Wo eine Aktion erscheint** (pro Aktion einstellbar):
- Unter der Fernbedienung im Block „Aktionen", in allen Aktivitäten oder nur in einer („Sichtbar bei").
- Mit „Als Kachel in der Aktivitätenliste zeigen" zusätzlich als Kachel neben den Aktivitäten des Hubs.

**Während sie läuft:** Die Taste zeigt „3/7" und einen Fortschrittsbalken, die Kachel zusätzlich den Schritt („3/7 · Pause 3 s"). Ein Tipp, solange etwas läuft, startet nichts und erklärt nur. Die laufende Taste **halten** bricht ab. Die Sequenz endet zwischen zwei Schritten, eine schon gesendete Taste lässt sich nicht zurücknehmen. Pro Hub läuft immer nur eine Aktion. Scheitert ein Schritt, wird die Taste rot, und der Tooltip nennt den Grund.

**Schrittliste:** Der kleine Pfeil an einer Sequenz (oder ein Tipp, während sie läuft; eine gescheiterte öffnet sich von selbst) zeigt ihre Schritte unter den Tasten: erledigt ✓, aktuell ●, offen ○, mit **Stoppen**, solange sie läuft. Wenn nichts läuft, lässt sich jeder Schritt einzeln senden, die Sequenz ab dort fortsetzen, ein gescheiterter Schritt wiederholen oder überspringen. Darunter stehen die Geräte, zu denen die Tasten gehören, mit Ein- und Eingangstasten; der Gerätename führt zu seiner Fernbedienung. Die Favoriten der Aktion erscheinen darunter, nach Gerät gruppiert.

Die Integration führt die Schritte aus, deshalb läuft eine Sequenz auch bei geschlossener Seite zu Ende. Für Automationen gibt es die Dienste `harmony_deck.run_action` (Hub, Name oder Id der Aktion) und `harmony_deck.stop_action`, dazu pro Hub den Sensor **Sequenz** (bereit, läuft, fertig, abgebrochen, Fehler, mit Schritt und Fortschritt als Attribute). Jeder angemeldete Benutzer darf eine gespeicherte Aktion starten, einen ungespeicherten Entwurf testen nur Administratoren.

**Netzwerksteuerung (0.7, in 0.9 umbenannt):** Unter Einstellungen › **Netzwerksteuerung** verbindest du ein Harmony-Gerät mit einem Mediaplayer in Home Assistant (zum Beispiel deinen Fernseher). Die Tasten laufen weiter über den Hub; der Mediaplayer liefert zusätzlich den Zustand, einen echten Lautstärke-Wert und die Quelle. Pro Gerät siehst du, was der Mediaplayer kann und was er gerade meldet. Passen Raum, Art, Hersteller/Modell oder Name eindeutig, erscheint ein Vorschlag mit „Übernehmen“ (zwei Fernseher in zwei Räumen werden an ihren Räumen unterschieden), und die passenden Mediaplayer stehen oben in der Liste. Sonst wählst du den Mediaplayer selbst. Verbundene Geräte kannst du im Schritt **Netzwerk-Befehl** nutzen (ein-/ausschalten, Lautstärke, Stumm, Quelle). Mit „Lautstärke direkt setzen statt per IR“ stellt der Schritt „Lautstärke (IR)“ den Wert am Gerät ein und zählt keine Tasten mehr. Die Lautstärke-Grenze gilt für beide.

**Soll gegen Ist (0.8):** Tut ein verbundenes Gerät nicht, was die aktuelle Aktivität braucht (nach „Aus“ noch an, an soll aber aus sein, anderer Eingang), sagt das ein Kasten unter dem Status und bietet die Korrektur an („Einschalten“, „Ausschalten“, „Auf … umschalten“). Gemeldet wird erst, wenn der Zustand 4 Sekunden gleich blieb, und geschaltet wird nur auf deinen Tipp. Unter Einstellungen › Direktgeräte legst du bei „Eingänge der Aktivitäten“ fest, welche Quelle des Mediaplayers zu welchem Harmony-Eingang gehört; ohne Auswahl rät Harmony Deck anhand der Namen und schweigt, wenn es unsicher ist. Bei eingeschalteter Sperre darf die Korrektur nur ausschalten.

**Erkannte Plattform und Sensoren (0.10):** Der Reiter Netzwerksteuerung zeigt unter jedem verbundenen Mediaplayer, was erkannt wurde („Erkannt: LG Netcast“) und was man darüber wissen sollte. In Home Assistant zeigen die Sensoren **Netzwerksteuerung** (alle verbundenen Geräte mit Plattform, Fähigkeiten und Zustand in den Attributen) und **Abweichungen** (einer pro Hub, Anzahl der Abweichungen mit der Liste in den Attributen) dasselbe ohne die Karte. Du kannst sie für Automationen und Benachrichtigungen nutzen.

**Lautstärke und Soundbar (0.9):** Die Lautstärke-Tasten der Karte gehen immer dorthin, wohin der Hub sie in der aktuellen Aktivität schickt (zum Beispiel an die Soundbar). Das ändert die Verbindung des Fernsehers nicht. Ein Netzwerk-Befehl für den Fernseher wirkt nur auf den Fernseher. Schickt eine Aktivität die Lautstärke über ein anderes Gerät, sagt das ein Hinweis unter der Lautstärke-Einstellung im Schritt und im Reiter.

Aktionen aus 0.4 werden von selbst zu einem Schritt. Aktionen gelten für alle Profile.

## 8. Fire TV

Einstellungen › **Fire TV**:
1. Entität wählen (der `media_player` der Android-TV-Integration) und das Harmony-Gerät, zu dem er gehört.
2. **Verbindung testen**. Ist der Fire TV nicht erreichbar, steht darunter, was zu prüfen ist.
3. **Installierte Apps lesen** holt die Apps vom Gerät. Auswählen, welche Apps als Tasten erscheinen, Farbtasten belegen, eigene Apps mit Paketnamen ergänzen. Den Paketnamen einer App zeigt ein langer Druck (oder Darüberfahren) auf ihren Namen. Eine falsche Paketzuordnung entfernst du mit dem kleinen Ketten-Knopf neben der App.
4. Optional: **Modell** (zum Beispiel Cube), **Lautstärke ohne Aktivität über den IR-Sender** (nur Cube), **Auch in Aktivitäten anzeigen** und **Aktivität sperren, wenn nicht erreichbar** (beides Schalter).

Der Fire TV hat eine eigene Statuszeile mit Wiedergabe/Pause und Standby, auch wenn Harmony nichts davon weiß.

Getestet ist das mit einem Fire TV Cube (3. Generation). Andere Modelle können abweichen.

## 9. Verknüpfungen

Einstellungen › **Aktivitäten** › Verknüpfung: Eine Aktivität mit einer anderen Entität verbinden (zum Beispiel Fire TV mit der Fire-TV-Aktivität). Die Karte zeigt dann einen Hinweis, wenn beide nicht zusammenpassen („Fire TV läuft, Harmony steht auf Blu-ray"), mit einem Knopf zum Angleichen. Zusätzlich lassen sich während der Aktivität andere Aktivitäten oder Tastengruppen sperren.

## 10. Aussehen und Profile

- Einstellungen › **Darstellung**: Look (11 Stück), Kachelstil, Anordnung, Stil der laufenden Aktivität, Tastenform, Beschriftung, Aufleuchten, farbige Symbole.
- Einstellungen › **Bedienung**: Vibration, Wechsel nur durch Halten, Tastatursteuerung, Kopf einklappen, zur laufenden Aktivität springen, Gerätenamen in der Hilfe.
- **Symbole** für Geräte und Aktivitäten unter den Reitern „Geräte" und „Aktivitäten".
- **Profile** (Profil-Knopf in der Statuszeile): verschiedene Einstellungen für verschiedene Personen oder Tablets. Profile lassen sich Benutzern zuordnen oder per Kartenoption `profile` fest wählen.

## 11. Sperre (Sicherheitskarte)

```yaml
type: custom:harmony-deck-security
```

Am besten auf eine Dashboard-Seite, die nur Erwachsene sehen. Nur Administratoren können ändern.

1. **Modus:** Aus, Immer oder Zeitplan. Beim Zeitplan sind die Fenster **Sperrzeiten** (zum Beispiel täglich 20:00 bis 07:00).
2. **Sperre jetzt prüfen:** zeigt, was die Sperre in diesem Moment ausschalten würde, ohne etwas zu tun.
3. **Freigeben:** pausiert die Sperre für die gewählte Dauer.
4. **Erlaubte Aktivitäten:** angehakt = darf laufen. Nicht erlaubte Aktivitäten zeigen in der Hauptkarte ein Schloss und lassen sich nicht starten. Werden sie anders gestartet (Original-Fernbedienung), schaltet die Integration sie nach 3 Sekunden aus.
5. **Erlaubte Apps (Fire TV):** Der Startbildschirm ist standardmäßig erlaubt; ohne ihn lassen sich keine anderen Apps erlauben. Neu installierte Apps sind gesperrt. Apps, die einmal liefen, erscheinen automatisch in der Liste.
6. **Mit ausschalten:** Geräte, die beim Eingriff am Fire TV zusätzlich ausgehen (zum Beispiel Fernseher und Verstärker).
7. **Eingriffe:** die letzten 100 Eingriffe, mit **Erlauben** direkt aus der Liste.
8. **Debug: Paketnamen** (nur Administratoren): echter Paketname der laufenden App und aller Pakete, zum Kopieren.

Die Sperre ist eine Hilfe im Haushalt, kein Sicherheitsprodukt.

## 12. Entitäten

Pro Hub: Sperre, Sperr-Modus, Freigabedauer, Freigeben, Sperre wirksam (mit erlaubten Aktivitäten als Attribut), Sequenz (Zustand und Fortschritt der Aktionen), Freigegeben bis, Letzter Eingriff, Eingriffe heute, Eingriff (Ereignis: wird bei jedem Eingriff der Sperre mit `what` ausgelöst, damit eine Automation dich benachrichtigen kann), Hub-Konfiguration lesbar, Aktivitäten, Geräte. Pro Fire TV: ADB erreichbar. Dazu Diagnose-Entitäten und Reparaturhinweise. Alle sind für Automationen nutzbar.

## 13. Fehlerbehebung

| Problem | Lösung |
|---|---|
| Karte zeigt „Keine Harmony-Hubs gefunden" | Integration „Logitech Harmony Hub" einrichten, Home Assistant neu starten |
| Karte veraltet nach Update | Strg+F5 bzw. App-Cache leeren |
| Reparaturhinweis „Fire TV nicht erreichbar" bleibt | Er erscheint nach etwa 6 Minuten ohne ADB und verschwindet, sobald der Fire TV wieder antwortet |
| Fire TV „nicht erreichbar" | Fire TV an und im Netz, ADB-Debugging an, Android-TV-Integration neu laden, dann „Verbindung testen" |
| Aktivität startet, aber Bild/Ton fehlt | Rettungsring öffnen, Geräte einschalten oder Eingang wählen |
| App bleibt in der Sperrliste gedimmt | „Installierte Apps lesen"; Paketnamen im Abschnitt Debug prüfen |
| Diagnose für einen Fehlerbericht | Einstellungen › Geräte & Dienste › Harmony Deck › ⋮ › Diagnose herunterladen |

## 14. Symbole

| Symbol | Bedeutung |
|---|---|
| Raumsymbol leuchtet | In diesem Raum läuft eine Harmony-Aktivität |
| Pulsierender Punkt | Aktivität startet |
| Kleiner Fernseher am Raumsymbol | Fire TV an (mit Play: spielt ab) |
| Durchgestrichener Fernseher | Fire TV nicht erreichbar |
| Kettenglied | Verknüpfte Entität passt nicht zu Harmony |
| Schloss auf Kachel oder Taste | gesperrt (Sperre oder Verknüpfung) |
| Rotes Schloss in der Statuszeile | Sperre wirksam |
| Offenes Schloss mit Uhrzeit | freigegeben bis zu dieser Zeit |
