import { useState } from "react";
import { useGameStore } from "@store/gameStore";
import type { ActionType, AdMode, CampaignAction, IssueId } from "@engine/index";
import { ISSUES, ISSUE_IDS } from "@content/issues";
import { money } from "./format";
import {
  Tv,
  Megaphone,
  Handshake,
  DollarSign,
  Building2,
  Vote,
  Search,
  GraduationCap,
  ArrowLeftRight,
} from "lucide-react";

const ACTIONS: { type: ActionType; label: string; cost: string; Icon: React.ComponentType<{ size?: number | string; className?: string }> }[] = [
  { type: "advertise", label: "Advertising", cost: "$ + market", Icon: Tv },
  { type: "rally", label: "Rally / Stop", cost: "1+ days", Icon: Megaphone },
  { type: "surrogate", label: "Surrogate", cost: "$250K", Icon: Handshake },
  { type: "fundraise", label: "Fundraise", cost: "1+ days", Icon: DollarSign },
  { type: "ground_game", label: "Field Offices", cost: "$1.5M + staff", Icon: Building2 },
  { type: "gotv", label: "GOTV", cost: "$1M", Icon: Vote },
  { type: "oppo_research", label: "Oppo Research", cost: "$2M", Icon: Search },
  { type: "debate_prep", label: "Debate Prep", cost: "1+ days", Icon: GraduationCap },
  { type: "issue_pivot", label: "Issue Pivot", cost: "free", Icon: ArrowLeftRight },
];

const NEEDS_STATE: ActionType[] = ["advertise", "rally", "surrogate", "ground_game", "gotv"];
const NEEDS_DAYS: ActionType[] = ["rally", "fundraise", "debate_prep"];

export function ActionPanel() {
  const game = useGameStore((s) => s.game)!;
  const queueAction = useGameStore((s) => s.queueAction);
  const removeQueued = useGameStore((s) => s.removeQueuedAction);
  const preview = useGameStore((s) => s.previewProjection)();
  const live = useGameStore((s) => s.liveProjection)();

  const player = game.playerCandidate;
  const res = game.resources[player];
  const states = game.states.filter((s) => s.blocs.length > 0);

  const [type, setType] = useState<ActionType>("advertise");
  const [stateId, setStateId] = useState<string>("PA");
  const [adMode, setAdMode] = useState<AdMode>("positive");
  const [issueId, setIssueId] = useState<IssueId>("economy");
  const [spendM, setSpendM] = useState<number>(8);
  const [days, setDays] = useState<number>(1);
  const [pivotPos, setPivotPos] = useState<number>(
    game.candidates[player].issuePositions.economy,
  );

  const add = () => {
    const action: CampaignAction = { type, candidate: player };
    if (NEEDS_STATE.includes(type)) action.stateId = stateId;
    if (NEEDS_DAYS.includes(type)) action.days = days;
    if (type === "advertise") {
      action.adMode = adMode;
      action.spend = spendM * 1_000_000;
      if (adMode === "issue") action.issueId = issueId;
    }
    if (type === "issue_pivot") {
      action.issueId = issueId;
      action.newPosition = pivotPos;
    }
    queueAction(action);
  };

  const evPreview = preview?.ev.biden ?? 0;
  const evLive = live?.ev.biden ?? 0;
  const evDelta = evPreview - evLive;
  const playerIsBiden = player === "biden";
  const myDelta = playerIsBiden ? evDelta : -evDelta;

  return (
    <div className="card">
      <div className="row">
        <h3 style={{ flex: 1 }}>Allocate Resources</h3>
      </div>
      <div className="row" style={{ gap: 16, marginBottom: 8 }}>
        <div className="stat" style={{ alignItems: "flex-start" }}><span className="l">Cash</span><span className="v">{money(res.cash)}</span></div>
        <div className="stat" style={{ alignItems: "flex-start" }}><span className="l">Cand. Days</span><span className="v">{res.candidateDays}/{res.maxCandidateDays}</span></div>
        <div className="stat" style={{ alignItems: "flex-start" }}><span className="l">Staff</span><span className="v">{res.staffCapacity}</span></div>
      </div>

      <div className="actiongrid">
        {ACTIONS.map((a) => (
          <button
            key={a.type}
            className={`actionbtn${type === a.type ? " sel" : ""}`}
            onClick={() => setType(a.type)}
          >
            <a.Icon size={18} />
            <span className="t">{a.label}</span>
            <span className="c">{a.cost}</span>
          </button>
        ))}
      </div>

      <div style={{ marginTop: 10 }}>
        {NEEDS_STATE.includes(type) && (
          <div className="field">
            <label>Target state</label>
            <select value={stateId} onChange={(e) => setStateId(e.target.value)}>
              {states.map((s) => (
                <option key={s.id} value={s.id}>{s.name} ({s.electoralVotes} EV{s.battleground ? " ★" : ""})</option>
              ))}
            </select>
          </div>
        )}

        {type === "advertise" && (
          <>
            <div className="field">
              <label>Ad mode</label>
              <select value={adMode} onChange={(e) => setAdMode(e.target.value as AdMode)}>
                <option value="positive">Positive (raise your appeal)</option>
                <option value="contrast">Contrast (attack the opponent)</option>
                <option value="issue">Issue (raise issue salience)</option>
              </select>
            </div>
            {adMode === "issue" && (
              <div className="field">
                <label>Issue</label>
                <select value={issueId} onChange={(e) => setIssueId(e.target.value as IssueId)}>
                  {ISSUE_IDS.map((id) => <option key={id} value={id}>{ISSUES[id].name}</option>)}
                </select>
              </div>
            )}
            <div className="field">
              <label>Spend: {money(spendM * 1_000_000)}</label>
              <input type="range" min={1} max={30} value={spendM} onChange={(e) => setSpendM(+e.target.value)} />
            </div>
          </>
        )}

        {NEEDS_DAYS.includes(type) && (
          <div className="field">
            <label>Candidate days: {days}</label>
            <input type="range" min={1} max={Math.max(1, res.maxCandidateDays)} value={days} onChange={(e) => setDays(+e.target.value)} />
          </div>
        )}

        {type === "issue_pivot" && (
          <>
            <div className="field">
              <label>Issue</label>
              <select value={issueId} onChange={(e) => { setIssueId(e.target.value as IssueId); setPivotPos(game.candidates[player].issuePositions[e.target.value as IssueId]); }}>
                {ISSUE_IDS.map((id) => <option key={id} value={id}>{ISSUES[id].name}</option>)}
              </select>
            </div>
            <div className="field">
              <label>Position: {pivotPos.toFixed(2)} (−1 left ↔ +1 right)</label>
              <input type="range" min={-1} max={1} step={0.05} value={pivotPos} onChange={(e) => setPivotPos(+e.target.value)} />
            </div>
          </>
        )}

        <button className="primary" style={{ width: "100%", marginTop: 6 }} onClick={add}>
          + Add to this week's plan
        </button>
      </div>

      <h3 style={{ marginTop: 16 }}>Planned This Week ({game.queuedActions.length})</h3>
      <div className="queue">
        {game.queuedActions.length === 0 && <p className="muted small">No actions queued. The week will pass quietly.</p>}
        {game.queuedActions.map((a, i) => (
          <div className="qitem" key={i}>
            <span>{describeAction(a)}</span>
            <span className="x" onClick={() => removeQueued(i)}>✕</span>
          </div>
        ))}
      </div>

      {preview && (
        <div className="preview">
          Projected with this plan: Biden {evPreview} EV
          {myDelta !== 0 && <strong>{` (${myDelta > 0 ? "+" : ""}${myDelta} for you)`}</strong>}
        </div>
      )}
    </div>
  );
}

function describeAction(a: CampaignAction): string {
  switch (a.type) {
    case "advertise": return `${a.adMode} ads in ${a.stateId}${a.adMode === "issue" ? ` (${a.issueId})` : ""} — ${money(a.spend ?? 0)}`;
    case "rally": return `Rally in ${a.stateId} — ${a.days}d`;
    case "surrogate": return `Surrogate to ${a.stateId}`;
    case "fundraise": return `Fundraise — ${a.days}d`;
    case "ground_game": return `Field offices in ${a.stateId}`;
    case "gotv": return `GOTV in ${a.stateId}`;
    case "oppo_research": return `Opposition research`;
    case "debate_prep": return `Debate prep — ${a.days}d`;
    case "issue_pivot": return `Pivot ${a.issueId} → ${a.newPosition?.toFixed(2)}`;
    default: return a.type;
  }
}
