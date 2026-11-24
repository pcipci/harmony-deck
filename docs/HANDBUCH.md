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

Das **Zahnrad** (oben rechts neben den Raum-Reitern) öffnet ein kleines Fenster mit den drei Bearbeitungswegen und **Info**. Seit 0.16 trägt es auch die Hinweise: Braucht etwas Aufmerksamkeit (Hub nicht erreichbar, ein verknüpfter Player läuft anders als Harmony, eine Abweichung zwischen Soll und Ist), nimmt das Zahnrad die Farbe des schwersten Hinweises an (rot = Fehler, orange = Abweichung, blau = Hinweis), pulsiert, bis du hingesehen hast, und zeigt die Anzahl; das Fenster listet die Hinweise mit ihrer Aktion (z. B. „Harmony angleichen“) über den Einträgen. Es liegt über der Karte, nichts verschiebt sich. **Ein Fenster (0.16.2):** Zahnrad, Hilfe und Profil öffnen im selben Rahmen und immer nur eines; dasselbe Symbol schließt es, ein anderes wechselt dorthin. **Info** ist seit 0.16.1 ein eigener Bereich (kein Reiter der Einstellungen mehr): technische Angaben zu jedem Hub (IP, Firmware, MAC, …), die mit Harmony-Geräten verknüpften Netzwerkgeräte (Plattform, Adresse für Administratoren, Zustand, Fähigkeiten), die Tastenbelegung der laufenden Aktivität (direkt oder über Harmony), die Statussymbole und die Rohdaten. Befehle gehen direkt an einen erreichbaren verknüpften Player, wo er sie kann (Aus, Stumm, Play, Pause, Stop); Ein geht immer über Harmony.
- **Einstellungen**: Darstellung, Bedienung, Geräte, Aktivitäten, Netzwerksteuerung (mit dem Fire TV), Hub. Jeder Reiter beginnt mit einem Satz, wofür er da ist. Jede Option ist eine Zeile: Du kannst irgendwo auf die Zeile tippen, um sie umzuschalten.
- **Favoriten**: Tasten mit Stern markieren, pro Gerät oder pro Aktivität. Mit dem dritten Knopf **Tasten ausblenden** versteckst du Tasten, die du nie brauchst (siehe Abschnitt 6).
- **Aktionen**: eigene Tasten und Sequenzen aus Harmony-Tasten, Pausen und Home-Assistant-Entitäten, als eigener Bearbeitungsmodus.

Mit **Fertig** speicherst du, mit **Abbrechen** verwirfst du alle Änderungen dieser Sitzung. Die Einstellungen liegen in Home Assistant und gelten auf allen Geräten.

## 3. Aktivitäten und Fernbedienung

- Antippen einer Kachel startet die Aktivität. Die laufende ist hervorgehoben.
- **Ausschalten:** Die Power-Kachel (oder der Power-Knopf in der eingeklappten Kopfzeile) kurz **halten**, bis der Ring voll ist. So passiert es nicht aus Versehen.
- **Halten zum Wechseln** (Einstellungen › Bedienung): Läuft eine Aktivität, wechselt eine andere erst nach langem Drücken.
- Die Fernbedienung schickt Lautstärke, Steuerkreuz, Kanal und Wiedergabe jeweils an das Gerät, das der Hub dafür in der Aktivität vorsieht.
- **Räume (0.16):** Die Reiter zeigen den Raum (Bereich in Home Assistant) des Hubs, sonst seinen Namen; ein in den Einstellungen vergebener Name gilt vorrangig.
- **Statuszeile (0.15.5):** ein Chip pro laufendem Gerät: die Harmony-Aktivität, der Fire TV (App, Pause, Standby) und jedes verknüpfte Netzwerkgerät mit seiner Quelle („LG TV · HDMI 1“; Antippen öffnet das Gerät). Ist alles aus, gibt es keine Chips. Schloss, Profil, Hilfe, Info und der Einklapp-Pfeil sitzen rechts in der Zeile mit den Raum-Reitern.
- **Kopf einklappen** (Standard an): Sobald eine Fernbedienung offen ist, schrumpfen die Chips auf eine Textzeile („Bluray · Fire TV Netflix · LG TV HDMI 1“ oder „alles aus“). Antippen oder der Pfeil klappt wieder auf.

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

**Netzwerksteuerung (0.7, in 0.9 umbenannt):** Unter Einstellungen › **Netzwerksteuerung** verbindest du ein Harmony-Gerät mit einem Mediaplayer in Home Assistant (zum Beispiel deinen Fernseher). Die Tasten laufen weiter über den Hub; der Mediaplayer liefert zusätzlich den Zustand, einen echten Lautstärke-Wert und die Quelle. Pro Gerät siehst du, was der Mediaplayer kann und was er gerade meldet. Passen Geräteart, Modell oder ein Namenswort, erscheint ein Vorschlag (Raum und Hersteller bringen nur Punkte dazu; ein nach dem Raum benannter Player wie „Wohnzimmer“ wird nie für ein einzelnes Gerät vorgeschlagen) mit zwei kleinen Knöpfen: ✓ übernehmen, ✕ für dieses Gerät nicht mehr vorschlagen. Die passenden Mediaplayer stehen oben in der Liste. Sonst wählst du den Mediaplayer selbst. Verbundene Geräte kannst du im Schritt **Netzwerk-Befehl** nutzen (ein-/ausschalten, Lautstärke, Stumm, Quelle). Mit „Lautstärke direkt setzen statt per IR“ stellt der Schritt „Lautstärke (IR)“ den Wert am Gerät ein und zählt keine Tasten mehr. Die Lautstärke-Grenze gilt für beide.

**Soll gegen Ist (0.8):** Tut ein verbundenes Gerät nicht, was die aktuelle Aktivität braucht (nach „Aus“ noch an, an soll aber aus sein, anderer Eingang), sagt das ein Kasten unter dem Status und bietet die Korrektur an („Einschalten“, „Ausschalten“, „Auf … umschalten“). Gemeldet wird erst, wenn der Zustand 4 Sekunden gleich blieb, und geschaltet wird nur auf deinen Tipp. Unter Einstellungen › Direktgeräte legst du bei „Eingänge der Aktivitäten“ fest, welche Quelle des Mediaplayers zu welchem Harmony-Eingang gehört; ohne Auswahl rät Harmony Deck anhand der Namen und schweigt, wenn es unsicher ist. Bei eingeschalteter Sperre darf die Korrektur nur ausschalten.

**Die Geräteseite (0.12):** Im Reiter Netzwerksteuerung hat jedes verbundene Gerät ein Zahnrad (und einen Punkt: grün = der Player antwortet). Das Zahnrad öffnet die Seite des Geräts. Bei allen Playern außer dem Fire TV zeigt sie, was der Player kann, eine Zeile pro Fähigkeit mit den passenden Knöpfen: Zustand, Ein/Aus, Lautstärke (Regler, begrenzt auf die Grenze aus Einstellungen › Bedienung), Stumm und die Quellen als Knöpfe (HDMI 1, HDMI 2 …). Die Knöpfe schalten das echte Gerät (nur Administratoren) und taugen so auch zum Ausprobieren. Darunter stehen „Eingänge der Aktivitäten“ und „Lautstärke direkt setzen statt per IR“. Die Integration des Players steht im Kopf der Seite. Bei LG Netcast ist die Quellenliste in Home Assistant die Senderliste; Harmony Deck zeigt und vergleicht nur Einträge, die wie Eingänge aussehen (HDMI, AV, Component, SCART …), und ignoriert die Sender.

**Geräteseite, seit 0.12.1:** Zustand, Lautstärke, Stumm und Quelle folgen dem Player live. Ein ausgeschalteter Player meldet Home Assistant keine Quellenliste; die Knöpfe zeigen dann die zuletzt gesehene Liste ausgegraut mit dem Hinweis „Zuletzt gesehen“. Der Sensor „Fähigkeiten“ des Geräts zeigt z. B. „6 von 10“; die Attribute nennen jede Fähigkeit mit ja/nein.

**Wo die Fire-TV-Einstellungen liegen (0.13):** an der Verknüpfung des Fire TV (Einstellungen › Netzwerksteuerung › Zahnrad). Bestehende Einstellungen wurden einmal dorthin verschoben; die Sperre liest die erlaubten Apps von derselben Stelle, pro Gerät.

**Lautstärkeregler (0.14):** Ist das Lautstärke-Gerät der laufenden Aktivität in Einstellungen › Netzwerksteuerung verbunden, „Lautstärke direkt setzen statt per IR“ an und kann der Player einen Pegel annehmen, zeigt die Fernbedienung einen Regler statt Lauter/Leiser (Stumm bleibt). Die Integration hält den Pegel für jeden Nutzer an der Lautstärkegrenze, auch bei aktiver Sperre. LG Netcast setzt den Pegel erst beim Loslassen. Ohne direkte Steuerung bleiben die Tasten wie bisher.

**Looks Wärmebild, Nixie, Nostromo (0.17):** Wärmebild = Wärmebildlook (Wärmefarben, kurze Namen in Segmentschrift, laufende Aktivität mit drei roten Punkten im Dreieck); Nixie = Zahlenröhren, Messing-Kippschalter mit immer sichtbarem Lämpchen; Nostromo = amberfarbener Bordcomputer (Cursor, Tippeffekt, ASCII-Haltebalken). „Fernbedienung“ und „Gerät“ sind jetzt **Dunkel** (gespeicherte Werte werden übernommen). Optionen, die ein Look nicht nutzt, werden ausgeblendet. **Skin pro Raum (0.18):** Einstellungen › Darstellung › „Skin für diesen Raum“; beim Raumwechsel blendet die Karte um.

**0.19:** Nixie-Tasten sind graphitfarben mit Chromrand; direkt gesendete Tasten (Fire TV) leuchten gedimmt, gedrückte hell; Geräte mit bekanntem Einschaltzustand bekommen einen Kippschalter. Wärmebild hat dickere Segmentschrift und zeichnet auch Kyrillisch. Verliert ein Harmony-Hub die Verbindung, werden Befehle leise wiederholt und ein Hinweis „Hub gerade nicht erreichbar, es wird weiter versucht“ angezeigt statt einer Fehlermeldung.

**0.19.1:** Weniger Hinweise „sollte aus sein, ist aber an“: In der ersten Minute nach einem Aktivitätswechsel erscheinen sie nicht (Harmony schaltet die Geräte gerade selbst aus), und ein Fire TV oder Android TV, das nur den Startbildschirm oder den Bildschirmschoner zeigt (etwa per HDMI-CEC aufgeweckt), gilt als aus. Auf der Seite eines verknüpften Netzwerkgeräts legt „Wenn es aus sein sollte“ das pro Gerät fest: *Melden* (Standard), *Nur als Hinweis* (eine schlichte Zeile im Zahnrad-Fenster, ohne Warnfarbe, Zähler und Korrektur-Knopf) oder *Nicht prüfen*. „Sollte an sein“ und falsche Eingänge werden weiter wie bisher gemeldet.

**0.20.0:** Zwei Looks wurden neu gebaut. **Glas** = dunkle Acrylplatten mit eckigen Ecken, die von hinten in der Farbe ihrer Funktion leuchten; die Einstellung *Leuchtart* wählt *Platte leuchtet*, *Schrift leuchtet* oder *Mischung* (Standard). **Knetmasse** = pralle Blasen, die man drückt (sie quetschen sich und federn zurück), Mulden für Flächen und nicht verfügbare Dinge, eine korallenrote Blase für die laufende Aktivität. Beide zeigen Geräte mit bekanntem Einschaltzustand mit einem Schalter im eigenen Stil, und die Sicherheitskarte nutzt jetzt dieselbe Look-Wahl wie die Hauptkarte (auch den Look des gezeigten Raums). Die App-Tasten des Fire TV bei Nixie sind graphitfarben mit gedimmter Bernsteinschrift. Tasten der Thermal-Tastatur, die nur ein Symbol zeigen, sind wieder sichtbar.

**Looks Terminal und Röhrenradio (0.15):** Einstellungen › Darstellung › Look. Terminal: grüner Leuchtschirm mit Störungen, Aktivitäten als Listenzeilen (die laufende invertiert), eckige Tasten. Röhrenradio: Holz und Messing, die laufende Aktivität als Glaslampe, ein magisches Auge, das der Lautstärke folgt, Kippschalter. Die Effekte liegen nur über der Karte; bei „Bewegung reduzieren“ im System stoppen die Animationen. **0.15.2:** Im Röhrenradio ist jede Kachel eine Kontrolllampe (leuchtet = läuft oder gewählt), Schalter sind echte Kippschalter, der Umschalter Aktivitäten/Geräte eine Wippe; im Terminal ist „aktiv“ überall ein gefüllter grüner Block. **0.16.0:** Terminal: Halten zum Ausschalten füllt die Kachel von Schwarz nach Grün und schrumpft sie zur Linie; Geräte der laufenden Aktivität flackern schwach; Auswahllisten im Stil des Schirms. Röhrenradio: Ein/Aus eines Geräts ist ein versenkbarer Messingknopf mit Lampe dahinter (Zustand vom verknüpften Player bekannt) oder die zwei kurzen Tasten I und O (Zustand unbekannt), in einer Zeile mit Toggle; Tasten mit Zustand sind dunkles Glas hinter einem Gitter mit orange leuchtender Schrift; Lampen flackern leicht; das magische Auge ist bernsteinfarben; die Skala zeigt den Raum und die laufende Aktivität (Nadel und Name); Listen, Zahnrad und Fenster im Radio-Look. Terminal und Röhrenradio stehen in der Look-Liste gleich nach Homebase. **0.15.5:** Terminal ist durchgehend grün (Ein/Aus-Tasten, die Aus-Kachel mit „OFF“, Fire-TV-App-Tasten und -Symbole ohne Markenfarben), die Symbole neben den Raum-Reitern haben keinen Rahmen, der senkrechte Lautstärkeregler ist eine LED-Pegelanzeige. Röhrenradio: Der Ein/Aus-Schalter hat ein Kontrolllämpchen statt Text (grün = an, rot = aus), die senkrechte Lautstärke ist eine Schiene mit Skala, Stumm ist ein runder Messingknopf in der Lautstärke-Wippe (eingedrückt = stumm, wenn der verknüpfte Player es meldet), Tasten mit Zustand sind eingedrückt, solange sie aktiv sind, andere gehen beim Antippen kurz runter. In allen Looks sitzt Stumm in der Lautstärke-Wippe, und beide Wippen sind gleich hoch. **0.15.4:** Halte-Effekte passen zum Look (Terminal: grüne Blöcke über die Kachel; Röhrenradio: die Lampe glüht hoch); beim Verknüpfen des Fire TV bleiben seine Einstellungen erhalten; Einstellungen öffnen auf dem ersten Reiter. **0.15.3:** Die Fähigkeiten eines Netzwerkgeräts gibt es auch als je einen Sensor (Ja/Nein, standardmäßig deaktiviert, auf der Geräteseite aktivierbar). Bei einer neuen Fire-TV-Einrichtung ist „ADB direkt“ voreingestellt. **Lautstärkeregler in der Geräteansicht (0.15):** Ein Gerät mit „Lautstärke direkt setzen“ zeigt den Regler auch dort, an die Lautstärkegrenze gebunden, auch bei aktiver Sperre.

**Fähigkeiten und „Neu einlesen“ (0.15.1):** Die Geräteseite listet alle Fähigkeiten („7 von 10“, gemerkte als „zuletzt gesehen“). Ein ausgeschalteter Player meldet Home Assistant wenig; Fähigkeiten und Eingänge, die bei eingeschaltetem Gerät gesehen wurden, werden gemerkt (auch über Neustarts). **Neu einlesen** (Administratoren) vergisst sie und liest jetzt: Gerät einschalten, Seite öffnen, Knopf drücken. Der Sensor „Fähigkeiten“ hat im Dialog ein Attribut pro Fähigkeit (Ja/Nein).

**Erkannte Plattform und Sensoren (0.10):** Der Reiter Netzwerksteuerung zeigt unter jedem verbundenen Mediaplayer, was erkannt wurde („Erkannt: LG Netcast“) und was man darüber wissen sollte. In Home Assistant zeigen die Sensoren **Netzwerksteuerung** (alle verbundenen Geräte mit Plattform, Fähigkeiten und Zustand in den Attributen) und **Abweichungen** (einer pro Hub, Anzahl der Abweichungen mit der Liste in den Attributen) dasselbe ohne die Karte. Du kannst sie für Automationen und Benachrichtigungen nutzen.

**Lautstärke und Soundbar (0.9):** Die Lautstärke-Tasten der Karte gehen immer dorthin, wohin der Hub sie in der aktuellen Aktivität schickt (zum Beispiel an die Soundbar). Das ändert die Verbindung des Fernsehers nicht. Ein Netzwerk-Befehl für den Fernseher wirkt nur auf den Fernseher. Schickt eine Aktivität die Lautstärke über ein anderes Gerät, sagt das ein Hinweis unter der Lautstärke-Einstellung im Schritt und im Reiter.

**Vorschläge (0.11):** Ein Player wird nur mit echtem Anhaltspunkt vorgeschlagen: gleicher Raum wie der Hub, gleiches Modell, gleiche Geräteart oder ein gemeinsames Namenswort, das nicht der Hersteller ist. Der Hersteller allein reicht nie, und ein Player, der weder schalten noch eine Quelle wählen kann, wird nicht vorgeschlagen. Reine Abspielziele (AirPlay, DLNA-Renderer, Musikserver wie Music Assistant) stehen gar nicht in der Liste. „Vorschläge anzeigen“ oben im Reiter schaltet sie für alle Hubs ab; „Nicht mehr vorschlagen“ neben einem Vorschlag schaltet sie für dieses Gerät ab („Wieder vorschlagen“ nimmt das zurück).

**In Home Assistant (0.11):** Jedes verbundene Gerät bekommt ein eigenes Gerät „Name (Netzwerk)“, neben den „(ADB)“-Geräten der Fire TVs, mit den Diagnose-Sensoren **Plattform** (zum Beispiel `lg_netcast`, Eigenheiten als Attribut), **Fähigkeiten** (in Worten, Codes als Attribut) und **Zustand** (an/aus; Lautstärke, Stumm und Quelle als Attribute). Es entsteht beim Verbinden und verschwindet beim Trennen. Jede gespeicherte Aktion ist eine **Taste** am Gerät des Hubs: Drücken startet die Aktion wie ein Tipp in der Karte; läuft auf dem Hub schon eine andere Aktion, wird das Drücken mit einer Meldung abgelehnt. Die Tasten folgen den Aktionen (neue Aktion = neue Taste, gelöschte Aktion = Taste weg, Umbenennen behält die Entität).

Aktionen aus 0.4 werden von selbst zu einem Schritt. Aktionen gelten für alle Profile.

## 8. Fire TV

Seit 0.12 ist der Fire TV ein Gerät der **Netzwerksteuerung** wie jedes andere: Den `media_player` (Android-TV-Integration) neben dem Harmony-Gerät wählen, dann das Zahnrad antippen. Das Zahnrad öffnet die **Seite des Fire TV** (der frühere Reiter „Fire TV“); **Zurück** führt zur Liste. Ein vor 0.12 eingerichteter Fire TV wird einmal automatisch verbunden und behält alle Einstellungen.

Auf der Seite:
1. Entität und Harmony-Gerät (wie bisher).
2. **Verbindung testen**. Ist der Fire TV nicht erreichbar, steht darunter, was zu prüfen ist.
3. **Installierte Apps lesen** holt die Apps vom Gerät. Auswählen, welche Apps als Tasten erscheinen, Farbtasten belegen, eigene Apps mit Paketnamen ergänzen. Den Paketnamen einer App zeigt ein langer Druck (oder Darüberfahren) auf ihren Namen. Eine falsche Paketzuordnung entfernst du mit dem kleinen Ketten-Knopf neben der App.
4. Optional: **Modell** (zum Beispiel Cube), **Lautstärke ohne Aktivität über den IR-Sender** (nur Cube), **Auch in Aktivitäten anzeigen** und **Aktivität sperren, wenn nicht erreichbar** (beides Schalter).

Der Fire TV hat eine eigene Statuszeile mit Wiedergabe/Pause und Standby, auch wenn Harmony nichts davon weiß.

In Home Assistant ist ein verbundener Fire TV **ein** Gerät „Name (Netzwerk)“: Dort sitzt sein Sensor „ADB erreichbar“ zusammen mit Plattform, Fähigkeiten und Zustand (vor 0.12 gab es zwei Geräte, „(ADB)“ und „(Netzwerk)“).

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
5. **Erlaubte Apps (Gerät, das Apps meldet):** Seit 0.12 fragt die Sperre nach der Fähigkeit „liest die laufende App“ statt nach „Fire TV“; heute meldet sie nur der Fire TV, und der Abschnitt heißt nach dem Gerät.  Der Startbildschirm ist standardmäßig erlaubt; ohne ihn lassen sich keine anderen Apps erlauben. Neu installierte Apps sind gesperrt. Apps, die einmal liefen, erscheinen automatisch in der Liste.
6. **Mit ausschalten:** Geräte, die beim Eingriff am Fire TV zusätzlich ausgehen (zum Beispiel Fernseher und Verstärker).
7. **Eingriffe:** die letzten 100 Eingriffe, mit **Erlauben** direkt aus der Liste.
8. **Debug: Paketnamen** (nur Administratoren): echter Paketname der laufenden App und aller Pakete, zum Kopieren.

Die Sperre ist eine Hilfe im Haushalt, kein Sicherheitsprodukt.

## 12. Entitäten

Pro Hub: Sperre, Sperr-Modus, Freigabedauer, Freigeben, Sperre wirksam (mit erlaubten Aktivitäten als Attribut), Sequenz (Zustand und Fortschritt der Aktionen), Freigegeben bis, Letzter Eingriff, Eingriffe heute, Eingriff (Ereignis: wird bei jedem Eingriff der Sperre mit `what` ausgelöst, damit eine Automation dich benachrichtigen kann), Hub-Konfiguration lesbar, Aktivitäten und Geräte (die Namen als kurze Liste, „Bluray, Games und 4 weitere“; Anzahl und vollständige Liste als Attribute), Aktionen (dasselbe für die gespeicherten Aktionen, mit ID, Schritten und Taste pro Aktion), Abweichungen und eine Taste pro Aktion. Pro verbundenem Netzwerkgerät: ein Gerät „Name (Netzwerk)“ mit Plattform, Fähigkeiten und Zustand. Pro Fire TV: ADB erreichbar. Dazu Diagnose-Entitäten und Reparaturhinweise. Alle sind für Automationen nutzbar.

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

### 0.20.1
Glas: neue Einstellung *Hintergrund* (Schwarz, Schwarz mit Textur, Aluminium, Platine). Die Platten sind halbtransparent und werden von einem Lämpchen dahinter angeleuchtet. Ruhe, gehört zur laufenden Aktivität (schwaches Violett) und gewählt (helles Violett, weiße Schrift mit Halo) gelten gleich für Aktivitäten, Geräte und Tabs. Tasten leuchten nach dem Loslassen aus. Die Lautstärke sind zehn Lämpchen hinter dem Glas. Knetmasse: kein Punkt mehr auf Gerätekacheln, Raum-Tab nicht mehr abgeschnitten, Einstellungen und Fenster sind Mulden und Blasen.

### 0.20.2
Glas: Leuchtart B lässt die Schrift in der Funktionsfarbe leuchten, größerer Halo, ruhigere Lautstärke-Lampen, helle Überschriften in Lila, Umschalter Aktivitäten/Geräte als zwei Platten, deckende Fenster, neue Einstellung *Farbe pro Aktivität* (Standard aus).

### 0.21.0
Profilfenster: nur ein Profil gleichzeitig, die ganze Zeile des gewählten Profils leuchtet im Auswahlstil des Skins (keine Häkchen mehr). Clay und Glas haben jetzt richtige Hauptbuttons und undurchsichtige Hilfefenster, Thermal eine dunkle Bearbeiten-Kopfzeile. Die Sicherheitskarte wurde in allen eigenen Skins geprüft.

### 0.23.0
Kiesel ist ein eigener Look (Sand-Fenster, acht Steinformen, bemalte Räume und Buttons, Badges als Wassertropfen; unter Einstellungen > Look gibt es für alle Looks *Hintergrund füllt die Ansicht*): graue Flusssteine mit unregelmäßigen Formen auf karibischem Grund, sandfarbene Abdrücke und Wasser in der Sandrille der Lautstärke. Neue Einstellung *Bemalungsfehler* (Sauber / Leicht / Deutlich) sowie *Bemalt* (Aus / A eine Farbe / B Regenbogen / C bemalte Bilder, Standard A) und *Hintergrund* (Karibik, Aquamarin, Lagune, dunkles Blaugrün) erscheinen unter Einstellungen > Look, wenn Kiesel gewählt ist. Beim Halten von „Alles aus“ gibt es keinen Ring mehr, die Taste wird Stufe für Stufe rot. Beim Halten einer Aktivitäts-Kachel färbt sich die ganze Kachel statt von unten gefüllt zu werden. Im Infobereich sind Netzwerkgeräte wie die Hubs zugeklappte Zeilen und der Bereich hat nur noch den Knopf Schließen.

### 0.23.4
Wärmebild zeichnet Aktives als einen weichen Wärmefleck (heißer Kern, gelb, grün, türkis am Rand), der beim Drücken aufglüht und abkühlt; Nicht verfügbares ist kaltblau, Gesperrtes violett, und die drei Wärmepunkte eines gewählten Geräts fliegen ein. Hinweis-Blasen folgen dem Look. Glass: Fire-TV-Tasten sind getöntes Glas, von hinten beleuchtet, nicht verfügbare haben einen Glasriss. Schmale Handys zeigen neben den Werkzeugen nur den aktiven Raum. Die Geräteseite hat keine Kopfzeile mehr (Gerät noch einmal tippen = abwählen). Einstellungszeilen passen sich der Kartenbreite an. Neue Einstellung *Schieber-Schrittweite* (Einstellungen > Bedienung) für Fernseher, die nur Lautstärke-Stufen kennen, z. B. LG Netcast: der Schieber sendet die fehlenden Stufen nacheinander.

### 0.22.0
Neue Einstellung *Anfragen an Hubs und Netzwerkgeräte im Log mitschreiben* (Einstellungen > Hub, standardmäßig aus): schreibt Befehle und Zustandswechsel von Hubs und verknüpften Geräten ins Home-Assistant-Log (Logger custom_components.harmony_deck.traffic). Das Fire-TV-Abzeichen ist in allen eigenen Skins nur noch ein leuchtendes Symbol. Clay und Glas haben richtige Fire-TV-App-Tasten, Clay eine Lautstärke-Blase. Die Home-Assistant-Warnungen zu veralteten Aufrufen sind behoben.
