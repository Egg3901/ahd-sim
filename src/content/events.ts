import type { GameEvent } from "@engine/types";

// ── EVENTS AS DATA (Section 7) ────────────────────────────────────────────
// Authored content, never engine code. Each choice carries per-bloc deltas
// (margin = Biden−Trump *in the answering candidate's favor*, so the engine
// flips the sign for whichever ticket is answering), salience shifts, momentum,
// cash and narrative effects, plus a short narrated outcome.
//
// margin deltas are in logit space; ~0.05 is a meaningful but not decisive move
// on a bloc. A base-pleasing answer typically helps one bloc and costs a swing
// bloc — the New Campaign Trail tension.

export const EVENTS: GameEvent[] = [
  // ───────────────────────── SCHEDULED: DEBATES ──────────────────────────
  {
    id: "debate_1",
    title: "First Presidential Debate (Cleveland)",
    prompt:
      "Ninety minutes of chaos and interruptions. The moderator presses you on the pandemic and the economy. How do you carry yourself on the biggest stage of the race?",
    subject: "both",
    trigger: { kind: "scheduled", turn: 4 },
    isDebate: true,
    oncePerGame: true,
    choices: [
      {
        id: "calm_presidential",
        text: "Stay calm and presidential; talk to the camera, not the opponent.",
        effects: {
          blocDeltas: [
            { blocId: "suburban_women", margin: 0.06, enthusiasm: 0.01 },
            { blocId: "seniors", margin: 0.05 },
            { blocId: "college_white", margin: 0.04 },
            { blocId: "noncollege_white", margin: -0.01 },
          ],
          momentum: 8,
          narrative: 10,
        },
        resultText:
          "You refuse to take the bait. The split-screen does the work; pundits call it steady and reassuring.",
      },
      {
        id: "aggressive",
        text: "Punch back hard; dominate every exchange and never yield the floor.",
        effects: {
          blocDeltas: [
            { blocId: "noncollege_white", margin: 0.05, enthusiasm: 0.02 },
            { blocId: "youth", margin: 0.02 },
            { blocId: "suburban_women", margin: -0.05 },
            { blocId: "seniors", margin: -0.03 },
          ],
          momentum: 4,
          narrative: -6,
        },
        resultText:
          "You fire up the base, but the constant crosstalk reads as a mess to viewers at home. Suburban voters wince.",
      },
      {
        id: "policy_wonk",
        text: "Go deep on policy detail and dare them to keep up.",
        requires: { trait: "policyKnowledge", min: 70 },
        effects: {
          blocDeltas: [
            { blocId: "college_white", margin: 0.06 },
            { blocId: "seniors", margin: 0.03 },
            { blocId: "youth", margin: -0.02 },
          ],
          salienceDeltas: { healthcare: 0.05, economy: 0.04 },
          momentum: 5,
          narrative: 6,
        },
        resultText:
          "You bury the stage in specifics. Wonks swoon; some viewers tune out, but you own the substance.",
      },
    ],
  },
  {
    id: "vp_debate",
    title: "Vice-Presidential Debate (Salt Lake City)",
    prompt:
      "Your running mate takes the stage opposite the other ticket's VP, behind plexiglass, before a calmer audience. What's the brief you give them?",
    subject: "both",
    trigger: { kind: "scheduled", turn: 5 },
    isDebate: true,
    oncePerGame: true,
    choices: [
      {
        id: "reassure",
        text: "Reassure the middle: competence, steadiness, a return to normal.",
        effects: {
          blocDeltas: [
            { blocId: "suburban_women", margin: 0.05 },
            { blocId: "seniors", margin: 0.03 },
            { blocId: "college_white", margin: 0.03 },
          ],
          momentum: 4,
          narrative: 6,
        },
        resultText: "A poised, disciplined performance. No knockout, no stumble. Exactly the plan.",
      },
      {
        id: "attack_record",
        text: "Prosecute the other administration's record relentlessly.",
        effects: {
          blocDeltas: [
            { blocId: "youth", margin: 0.04, enthusiasm: 0.02 },
            { blocId: "black", margin: 0.03 },
            { blocId: "seniors", margin: -0.02 },
          ],
          momentum: 3,
          narrative: 2,
        },
        resultText: "Sharp, viral clips light up social media. The base loves it; a few independents bristle.",
      },
    ],
  },
  {
    id: "debate_final",
    title: "Final Presidential Debate (Nashville)",
    prompt:
      "Muted microphones this time. A more orderly night, one last chance to reach the undecideds watching at home. Your closing strategy?",
    subject: "both",
    trigger: { kind: "scheduled", turn: 7 },
    isDebate: true,
    oncePerGame: true,
    choices: [
      {
        id: "close_unity",
        text: "Make it a referendum on character and unity; speak to the whole country.",
        effects: {
          blocDeltas: [
            { blocId: "suburban_women", margin: 0.06 },
            { blocId: "college_white", margin: 0.05 },
            { blocId: "seniors", margin: 0.04 },
            { blocId: "noncollege_white", margin: -0.02 },
          ],
          momentum: 7,
          narrative: 8,
        },
        resultText: "You close on hope and decency. The post-debate dials tick up among the persuadables.",
      },
      {
        id: "close_economy",
        text: "Hammer the economy and jobs; promise a roaring recovery.",
        effects: {
          blocDeltas: [
            { blocId: "noncollege_white", margin: 0.05 },
            { blocId: "hispanic", margin: 0.04 },
            { blocId: "college_white", margin: -0.01 },
          ],
          salienceDeltas: { economy: 0.06 },
          momentum: 5,
          narrative: 3,
        },
        resultText: "You drive the conversation back to pocketbooks, your strongest turf with working voters.",
      },
    ],
  },

  // ───────────────────────── SCHEDULED: CRISES & BEATS ───────────────────
  {
    id: "convention_bounce",
    title: "Post-Convention Afterglow",
    prompt:
      "The conventions are behind you and your numbers ticked up. The press wants to know what the next phase of the campaign looks like.",
    subject: "both",
    trigger: { kind: "scheduled", turn: 0 },
    oncePerGame: true,
    choices: [
      {
        id: "expand_map",
        text: "Go big and expand the map into reach states.",
        effects: {
          blocDeltas: [{ blocId: "hispanic", margin: 0.03 }, { blocId: "college_white", margin: 0.02 }],
          momentum: 6,
          narrative: 4,
        },
        resultText: "You announce ad buys in surprising places. Bold, and a little risky with the budget.",
      },
      {
        id: "defend_core",
        text: "Stay disciplined: bank the bounce and defend the core.",
        effects: {
          blocDeltas: [{ blocId: "seniors", margin: 0.03 }, { blocId: "suburban_women", margin: 0.02 }],
          momentum: 3,
          cash: 5_000_000,
        },
        resultText: "You keep your powder dry and your message tight. Steady as she goes.",
      },
    ],
  },
  {
    id: "covid_spike",
    title: "Autumn COVID Surge",
    prompt:
      "Cases climb across the Midwest as cold weather sets in. The pandemic is back on every front page. How do you respond?",
    subject: "both",
    trigger: { kind: "scheduled", turn: 2 },
    oncePerGame: true,
    choices: [
      {
        id: "science_plan",
        text: "Roll out a detailed national plan: testing, masks, and trusting the scientists.",
        effects: {
          blocDeltas: [
            { blocId: "seniors", margin: 0.05 },
            { blocId: "suburban_women", margin: 0.05 },
            { blocId: "college_white", margin: 0.03 },
            { blocId: "noncollege_white", margin: -0.03 },
          ],
          salienceDeltas: { covid_response: 0.1, healthcare: 0.04 },
          momentum: 5,
        },
        resultText: "You own the issue of competence. Some rural voters bristle at the mandates talk.",
      },
      {
        id: "reopen",
        text: "Emphasize reopening, livelihoods, and not living in fear.",
        effects: {
          blocDeltas: [
            { blocId: "noncollege_white", margin: 0.05 },
            { blocId: "hispanic", margin: 0.02 },
            { blocId: "seniors", margin: -0.05 },
            { blocId: "suburban_women", margin: -0.04 },
          ],
          salienceDeltas: { economy: 0.08, covid_response: 0.06 },
          momentum: 3,
        },
        resultText: "You speak to the exhausted and the out-of-work, at a cost with the most cautious voters.",
      },
    ],
  },
  {
    id: "scotus_vacancy",
    title: "A Supreme Court Vacancy",
    prompt:
      "A seat on the Supreme Court opens suddenly, weeks before the election. The fight over filling it consumes Washington. Where do you plant your flag?",
    subject: "both",
    trigger: { kind: "scheduled", turn: 3 },
    oncePerGame: true,
    choices: [
      {
        id: "fire_up_base",
        text: "Frame it as a fight for the future of the Court and rally the base.",
        effects: {
          blocDeltas: [
            { blocId: "youth", margin: 0.04, enthusiasm: 0.03 },
            { blocId: "college_white", margin: 0.03 },
            { blocId: "seniors", margin: -0.02 },
          ],
          salienceDeltas: { abortion: 0.12 },
          momentum: 4,
        },
        resultText: "Both bases catch fire. The fundraising spikes; the country polarizes further.",
        // small-dollar surge
      },
      {
        id: "healthcare_pivot",
        text: "Turn it into a referendum on healthcare and pre-existing conditions.",
        effects: {
          blocDeltas: [
            { blocId: "suburban_women", margin: 0.05 },
            { blocId: "seniors", margin: 0.04 },
            { blocId: "hispanic", margin: 0.03 },
          ],
          salienceDeltas: { healthcare: 0.1, abortion: 0.04 },
          momentum: 5,
          narrative: 4,
        },
        resultText: "You make the Court fight about people's coverage. It lands with the voters who decide elections.",
      },
    ],
  },
  {
    id: "economic_data",
    title: "Blockbuster Jobs Report",
    prompt:
      "A surprise jobs report lands, and the recovery looks stronger than forecast. Both campaigns scramble to spin it. What's your line?",
    subject: "both",
    trigger: { kind: "scheduled", turn: 6 },
    oncePerGame: true,
    choices: [
      {
        id: "credit_recovery",
        text: "Claim credit: the comeback is real and accelerating.",
        effects: {
          blocDeltas: [{ blocId: "noncollege_white", margin: 0.05 }, { blocId: "hispanic", margin: 0.04 }],
          salienceDeltas: { economy: 0.07 },
          momentum: 5,
        },
        resultText: "You ride the good news. On the economy, you sound like a winner.",
      },
      {
        id: "uneven_recovery",
        text: "Reframe: a K-shaped recovery that leaves working families behind.",
        effects: {
          blocDeltas: [
            { blocId: "black", margin: 0.04 },
            { blocId: "youth", margin: 0.03 },
            { blocId: "suburban_women", margin: 0.02 },
          ],
          salienceDeltas: { economy: 0.05, healthcare: 0.03 },
          momentum: 3,
        },
        resultText: "You complicate the rosy headline with the reality on the ground. It resonates with the struggling.",
      },
    ],
  },
  {
    id: "unrest",
    title: "Unrest in a Battleground City",
    prompt:
      "Protests and clashes erupt in a major city in a swing state after another incident. The footage is everywhere. How do you speak to the country?",
    subject: "both",
    trigger: { kind: "scheduled", turn: 1 },
    oncePerGame: true,
    choices: [
      {
        id: "reform_and_calm",
        text: "Condemn violence AND call for real police reform. Both, firmly.",
        effects: {
          blocDeltas: [
            { blocId: "black", margin: 0.04 },
            { blocId: "suburban_women", margin: 0.03 },
            { blocId: "college_white", margin: 0.02 },
            { blocId: "noncollege_white", margin: -0.02 },
          ],
          salienceDeltas: { race_policing: 0.06, law_and_order: 0.05 },
        },
        resultText: "You thread the needle: safety and justice. It's a hard balance, and mostly it holds.",
      },
      {
        id: "law_order",
        text: "Lead with law and order: back the police, restore the streets.",
        effects: {
          blocDeltas: [
            { blocId: "noncollege_white", margin: 0.05 },
            { blocId: "seniors", margin: 0.04 },
            { blocId: "black", margin: -0.05 },
            { blocId: "youth", margin: -0.04 },
          ],
          salienceDeltas: { law_and_order: 0.1 },
          momentum: 2,
        },
        resultText: "You plant the flag on order. Older and rural voters nod; you bleed support with the base.",
      },
    ],
  },

  // ───────────────────────── STOCHASTIC POOL ─────────────────────────────
  {
    id: "viral_moment",
    title: "A Moment Goes Viral",
    prompt:
      "A clip of your candidate connecting with a voter on a rope line is racking up millions of views. The campaign wants to lean in. Do you?",
    subject: "both",
    trigger: { kind: "stochastic", baseWeight: 1.0 },
    gate: { minTurn: 1 },
    choices: [
      {
        id: "amplify",
        text: "Amplify it everywhere. Cut it into an ad overnight.",
        effects: {
          blocDeltas: [{ blocId: "youth", margin: 0.03, enthusiasm: 0.02 }, { blocId: "suburban_women", margin: 0.03 }],
          momentum: 5,
          narrative: 6,
        },
        resultText: "The moment becomes the message of the week. Authentic, human, and everywhere.",
      },
      {
        id: "stay_focused",
        text: "Enjoy it, but stay on the economic message.",
        effects: {
          blocDeltas: [{ blocId: "noncollege_white", margin: 0.02 }],
          momentum: 2,
        },
        resultText: "You let it breathe organically and keep your discipline.",
      },
    ],
  },
  {
    id: "endorsement",
    title: "A Surprise Endorsement",
    prompt:
      "A respected, cross-partisan figure offers to endorse you, but they'll want a speaking role and some message alignment. Accept?",
    subject: "both",
    trigger: { kind: "stochastic", baseWeight: 0.9 },
    gate: { minTurn: 1 },
    choices: [
      {
        id: "accept",
        text: "Accept and feature them prominently.",
        effects: {
          blocDeltas: [{ blocId: "college_white", margin: 0.04 }, { blocId: "seniors", margin: 0.03 }],
          momentum: 4,
          narrative: 5,
        },
        resultText: "The endorsement gives wavering moderates permission. A clean win.",
      },
      {
        id: "decline",
        text: "Politely decline to avoid muddying your message.",
        effects: { blocDeltas: [{ blocId: "youth", margin: 0.01 }], momentum: 1 },
        resultText: "You keep the spotlight on your own ticket. No harm, no headlines.",
      },
    ],
  },
  {
    id: "fundraising_surge",
    title: "A Small-Dollar Surge",
    prompt:
      "An outrage news cycle has your online donors fired up. The team wants to push a matching-gift blitz. Green-light it?",
    subject: "both",
    trigger: { kind: "stochastic", baseWeight: 0.85 },
    choices: [
      {
        id: "blitz",
        text: "Push the blitz and ride the wave.",
        effects: { cash: 18_000_000, momentum: 2, blocDeltas: [{ blocId: "youth", enthusiasm: 0.01, margin: 0 }] },
        resultText: "The grassroots delivers. The war chest swells overnight.",
      },
      {
        id: "soft_ask",
        text: "Keep it tasteful: a soft ask, protect the brand.",
        effects: { cash: 7_000_000 },
        resultText: "A modest haul, but you avoid donor fatigue.",
      },
    ],
  },
  {
    id: "gaffe_cycle",
    title: "An Unforced Error",
    prompt:
      "Your candidate misspoke at a late event and the clip is being weaponized. The bleeding needs to stop. How do you handle it?",
    subject: "both",
    trigger: { kind: "stochastic", baseWeight: 0.8 },
    gate: { minTurn: 2 },
    choices: [
      {
        id: "own_it",
        text: "Own it with humor and move on fast.",
        effects: {
          blocDeltas: [{ blocId: "suburban_women", margin: -0.01 }],
          narrative: 2,
          momentum: -2,
        },
        resultText: "You defuse it with a self-deprecating laugh. The cycle burns out by Thursday.",
      },
      {
        id: "ignore",
        text: "Refuse to engage; starve it of oxygen.",
        effects: {
          blocDeltas: [{ blocId: "noncollege_white", margin: -0.03 }, { blocId: "seniors", margin: -0.02 }],
          narrative: -4,
          momentum: -4,
        },
        resultText: "The silence lets the opposition define it. It lingers a few days too long.",
      },
    ],
  },
  {
    id: "october_surprise",
    title: "October Surprise",
    prompt:
      "A bombshell story drops about the other ticket in the campaign's final stretch. Your team is salivating. How hard do you press it?",
    subject: "both",
    trigger: { kind: "stochastic", baseWeight: 0.7 },
    gate: { minTurn: 5 },
    oncePerGame: true,
    choices: [
      {
        id: "full_assault",
        text: "Full assault. Make it the only story for a week.",
        effects: {
          blocDeltas: [
            { blocId: "noncollege_white", margin: 0.03 },
            { blocId: "college_white", margin: 0.02 },
            { blocId: "suburban_women", margin: -0.02 },
          ],
          narrative: -3,
          momentum: 4,
        },
        resultText: "You dominate the cycle, but the pile-on turns off some voters who hate the negativity.",
      },
      {
        id: "let_press",
        text: "Let the press carry it; stay above the fray.",
        effects: {
          blocDeltas: [{ blocId: "suburban_women", margin: 0.03 }, { blocId: "college_white", margin: 0.02 }],
          narrative: 4,
          momentum: 2,
        },
        resultText: "You keep your hands clean and let the story do its own damage. Statesmanlike.",
      },
    ],
  },
  {
    id: "hot_mic",
    title: "A Hot-Mic Slip",
    prompt:
      "A staffer's candid, cynical remark about a voter bloc leaked to a reporter. It's embarrassing. What's the play?",
    subject: "both",
    trigger: { kind: "stochastic", baseWeight: 0.6 },
    gate: { minTurn: 2 },
    choices: [
      {
        id: "apologize",
        text: "Apologize directly to the bloc and visit them this week.",
        effects: {
          blocDeltas: [{ blocId: "hispanic", margin: 0.03 }],
          momentum: -1,
          narrative: 2,
        },
        resultText: "The quick, sincere apology mostly closes the wound.",
      },
      {
        id: "deny",
        text: "Dismiss it as taken out of context.",
        effects: {
          blocDeltas: [{ blocId: "hispanic", margin: -0.04 }, { blocId: "black", margin: -0.02 }],
          narrative: -3,
        },
        resultText: "The non-apology keeps the story alive and stings with the bloc in question.",
      },
    ],
  },
  {
    id: "ground_swell",
    title: "Volunteer Groundswell",
    prompt:
      "Your field offices report a flood of new volunteers. You can redirect energy into a registration push. Do it?",
    subject: "both",
    trigger: { kind: "stochastic", baseWeight: 0.75 },
    gate: { minTurn: 1 },
    choices: [
      {
        id: "register",
        text: "Launch a registration and early-vote drive.",
        effects: {
          blocDeltas: [
            { blocId: "youth", margin: 0.02, enthusiasm: 0.04 },
            { blocId: "black", margin: 0.02, enthusiasm: 0.03 },
          ],
          momentum: 2,
        },
        resultText: "Thousands of new voters hit the rolls. The enthusiasm is real and measurable.",
      },
      {
        id: "thank",
        text: "Thank them and keep them on persuasion calls.",
        effects: { blocDeltas: [{ blocId: "suburban_women", margin: 0.02 }] },
        resultText: "You point the energy at the persuadables instead. A reasonable trade.",
      },
    ],
  },
  {
    id: "attack_ad_backlash",
    title: "Attack Ad Backlash",
    prompt:
      "An outside group ran a brutal ad on your behalf that's drawing criticism for going too far. Do you disavow it?",
    subject: "both",
    trigger: { kind: "stochastic", baseWeight: 0.65 },
    gate: { minTurn: 3 },
    choices: [
      {
        id: "disavow",
        text: "Disavow it publicly.",
        effects: {
          blocDeltas: [{ blocId: "suburban_women", margin: 0.03 }, { blocId: "college_white", margin: 0.02 }],
          narrative: 3,
        },
        resultText: "Distancing yourself wins back the voters who recoil from the gutter.",
      },
      {
        id: "embrace",
        text: "Quietly let it run. It's landing.",
        effects: {
          blocDeltas: [{ blocId: "noncollege_white", margin: 0.03 }, { blocId: "suburban_women", margin: -0.03 }],
          narrative: -3,
        },
        resultText: "The ad does damage to the opponent, and a little to your own halo.",
      },
    ],
  },
  {
    id: "celebrity_rally",
    title: "A Celebrity Wants to Headline",
    prompt:
      "A megastar offers to headline a get-out-the-vote concert in a swing state. It'll draw a huge young crowd, and some risk. Book it?",
    subject: "both",
    trigger: { kind: "stochastic", baseWeight: 0.6 },
    gate: { minTurn: 4 },
    choices: [
      {
        id: "book",
        text: "Book the show and turn out the youth vote.",
        effects: {
          blocDeltas: [{ blocId: "youth", margin: 0.04, enthusiasm: 0.05 }],
          momentum: 3,
          narrative: 1,
        },
        resultText: "The concert is a sensation. Young voters flood the early-vote lines.",
      },
      {
        id: "pass",
        text: "Pass. Celebrity politics can backfire.",
        effects: { blocDeltas: [{ blocId: "noncollege_white", margin: 0.01 }] },
        resultText: "You keep the focus on kitchen-table issues. No spectacle, no risk.",
      },
    ],
  },
  {
    id: "town_hall",
    title: "Network Town Hall",
    prompt:
      "A network offers a prime-time town hall: undecided voters asking real questions, live. It's exposure and it's a tightrope. Your posture?",
    subject: "both",
    trigger: { kind: "stochastic", baseWeight: 0.7 },
    gate: { minTurn: 3 },
    choices: [
      {
        id: "empathy",
        text: "Lead with empathy and meet each voter where they are.",
        effects: {
          blocDeltas: [
            { blocId: "suburban_women", margin: 0.04 },
            { blocId: "seniors", margin: 0.03 },
            { blocId: "college_white", margin: 0.02 },
          ],
          momentum: 4,
          narrative: 5,
        },
        resultText: "The warmth comes through the screen. It's the kind of night that moves the undecided.",
      },
      {
        id: "command",
        text: "Command the facts and project total mastery of the issues.",
        requires: { trait: "policyKnowledge", min: 65 },
        effects: {
          blocDeltas: [{ blocId: "college_white", margin: 0.04 }, { blocId: "seniors", margin: 0.02 }],
          salienceDeltas: { healthcare: 0.03 },
          momentum: 3,
        },
        resultText: "You answer every question cold. Competence radiates; a few find it a touch clinical.",
      },
    ],
  },
];

// ── Event pools by mode ────────────────────────────────────────────────────
// The existing EVENTS array is the 2020 mix: its scheduled entries are that
// year's real beats (debates, COVID surge, SCOTUS vacancy, …), its stochastic
// entries are year-agnostic campaign moments. We partition it accordingly and
// add per-scenario historical decks + generic debates for the plausible mode.
import { GENERIC_DEBATES, HIST_2020, HIST_2016, HIST_2024, HIST_2000, HIST_2012, HIST_2008, HIST_2004, HIST_1996, HIST_1992, HIST_1988, HIST_1984, HIST_1980 } from "./historicalEvents";
import { ENDORSEMENT_EVENTS } from "./endorsements";

// Year-agnostic random pool, drawn in both modes. Endorsement offers (see
// content/endorsements.ts) ride the same stochastic deck.
export const GENERIC_EVENTS: GameEvent[] = [
  ...EVENTS.filter((e) => e.trigger.kind === "stochastic"),
  ...ENDORSEMENT_EVENTS,
];

export { GENERIC_DEBATES };

// Scripted real beats per scenario (used in "historical" mode).
export const HISTORICAL_EVENTS: Record<string, GameEvent[]> = {
  "2020": HIST_2020, // rebuilt asymmetric deck (the old EVENTS scheduled beats are retired)
  "2016": HIST_2016,
  "2024": HIST_2024,
  "2012": HIST_2012,
  "2008": HIST_2008,
  "2004": HIST_2004,
  "2000": HIST_2000,
  "1996": HIST_1996,
  "1992": HIST_1992,
  "1988": HIST_1988,
  "1984": HIST_1984,
  "1980": HIST_1980,
};

export const EVENTS_BY_ID: Record<string, GameEvent> = Object.fromEntries(
  [...EVENTS, ...ENDORSEMENT_EVENTS, ...GENERIC_DEBATES, ...HIST_2020, ...HIST_2016, ...HIST_2024, ...HIST_2012, ...HIST_2008, ...HIST_2004, ...HIST_2000, ...HIST_1996, ...HIST_1992, ...HIST_1988, ...HIST_1984, ...HIST_1980].map((e) => [e.id, e]),
);
