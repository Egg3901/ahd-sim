import { useState } from "react";
import { useGameStore } from "@store/gameStore";
import { choiceAvailable } from "@engine/index";
import { EVENTS_BY_ID } from "@content/events";
import { BLOCS } from "@content/blocs";

// Shows the first pending event for the player. Two steps: pick a choice, see
// the narrated outcome (the authored resultText), then continue. Effects are
// applied on Continue so the reveal and the state change stay in sync.
export function EventModal() {
  const game = useGameStore((s) => s.game)!;
  const resolve = useGameStore((s) => s.resolvePlayerEvent);
  const [chosenId, setChosenId] = useState<string | null>(null);

  const pending = game.pendingEvents.find((p) => p.forCandidate === game.playerCandidate);
  if (!pending) return null;
  const event = EVENTS_BY_ID[pending.eventId];
  if (!event) return null;

  // Only this ticket's options — the opponent faces a different set entirely.
  const myChoices = event.choices.filter((c) => !c.side || c.side === game.playerCandidate);
  const chosen = chosenId ? myChoices.find((c) => c.id === chosenId) : null;

  const commit = () => {
    if (!chosen) return;
    resolve(event.id, chosen.id);
    setChosenId(null);
  };

  return (
    <div className="overlay">
      <div className="modal">
        <div className="head">
          <div className="tag">{event.isDebate ? "Debate Night" : "Breaking — Decision Required"}</div>
          <h2>{event.title}</h2>
        </div>
        <div className="body">
          <p className="prompt">{event.prompt}</p>

          {!chosen && myChoices.map((choice) => {
            const available = choiceAvailable(game, game.playerCandidate, choice);
            return (
              <button
                key={choice.id}
                className="choice"
                disabled={!available}
                onClick={() => setChosenId(choice.id)}
              >
                <span className="ct">{choice.text}</span>
                <span className="deltas">
                  {!available && choice.requires && (
                    <span className="chip down">needs {choice.requires.trait} ≥ {choice.requires.min}</span>
                  )}
                  {(choice.effects.blocDeltas ?? []).filter((d) => d.margin).map((d) => (
                    <span key={d.blocId} className={`chip ${(d.margin ?? 0) >= 0 ? "up" : "down"}`}>
                      {BLOCS[d.blocId].name.split(" ")[0]} {(d.margin ?? 0) >= 0 ? "▲" : "▼"}
                    </span>
                  ))}
                  {choice.effects.momentum ? <span className={`chip ${choice.effects.momentum >= 0 ? "up" : "down"}`}>momentum {choice.effects.momentum >= 0 ? "▲" : "▼"}</span> : null}
                  {choice.effects.cash ? <span className="chip up">+cash</span> : null}
                </span>
              </button>
            );
          })}

          {chosen && (
            <>
              <div className="choice" style={{ cursor: "default" }}>
                <span className="ct">{chosen.text}</span>
              </div>
              <p className="resulttext">{chosen.resultText}</p>
              <button className="primary" style={{ width: "100%" }} onClick={commit}>
                Continue →
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
