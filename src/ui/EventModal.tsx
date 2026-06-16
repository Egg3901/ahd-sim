import { useGameStore } from "@store/gameStore";
import { choiceAvailable } from "@engine/index";
import { EVENTS_BY_ID } from "@content/events";
import { BLOCS } from "@content/blocs";

// Shows the first pending event for the player and resolves the chosen option.
export function EventModal() {
  const game = useGameStore((s) => s.game)!;
  const resolve = useGameStore((s) => s.resolvePlayerEvent);

  const pending = game.pendingEvents.find((p) => p.forCandidate === game.playerCandidate);
  if (!pending) return null;
  const event = EVENTS_BY_ID[pending.eventId];
  if (!event) return null;

  return (
    <div className="overlay">
      <div className="modal">
        <div className="head">
          <div className="tag">{event.isDebate ? "Debate Night" : "Breaking — Decision Required"}</div>
          <h2>{event.title}</h2>
        </div>
        <div className="body">
          <p className="prompt">{event.prompt}</p>
          {event.choices.map((choice) => {
            const available = choiceAvailable(game, game.playerCandidate, choice);
            return (
              <button
                key={choice.id}
                className="choice"
                disabled={!available}
                onClick={() => resolve(event.id, choice.id)}
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
        </div>
      </div>
    </div>
  );
}
