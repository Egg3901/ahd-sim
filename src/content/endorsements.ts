// ENDORSEMENT EVENTS — big names and institutions offer their blessing between
// turns. Every endorsement has a price: cash (a joint fundraising circuit costs
// money to stand up) or a policy promise (a positionShift toward the endorser).
// Authored as ordinary stochastic GameEvents so the whole existing pipeline —
// queueing, AI choice, causality log — works unchanged. Choices are side-tagged
// (each ticket courts different endorsers in the same news beat).

import type { GameEvent } from "@engine/types";

export const ENDORSEMENT_EVENTS: GameEvent[] = [
  {
    id: "endorse-labor",
    title: "The Labor Federation Weighs In",
    prompt: "The country's biggest union federation is ready to endorse — for a price. They want a public commitment on labor policy and a seat at the table.",
    subject: "both",
    trigger: { kind: "stochastic", baseWeight: 2.2 },
    gate: { minTurn: 1, maxTurn: 6 },
    oncePerGame: true,
    choices: [
      {
        id: "dem-accept", side: "dem",
        text: "Take the pledge — promise pro-labor policy and lock in the machine",
        effects: {
          blocDeltas: [{ blocId: "noncollege_white", margin: 0.035, enthusiasm: 0.04 }],
          positionShifts: { economy: -0.15, trade: -0.1 },
          momentum: 3,
        },
        resultText: "Union halls light up. The federation's phone banks are yours — and so is their policy platform.",
      },
      {
        id: "dem-decline", side: "dem",
        text: "Stay flexible — thank them and keep your economic message centrist",
        effects: { narrative: 3 },
        resultText: "Editorial boards praise your independence. The locals grumble but stay home about it.",
      },
      {
        id: "rep-counter", side: "rep",
        text: "Court the rank-and-file over the leadership's heads",
        effects: { blocDeltas: [{ blocId: "noncollege_white", margin: 0.02 }] },
        resultText: "\"The bosses endorse them. The members vote for us.\" It lands in the union parking lots.",
      },
      {
        id: "rep-ignore", side: "rep",
        text: "Shrug it off — it was never your endorsement to win",
        effects: {},
        resultText: "You wave it away and stay on message.",
      },
    ],
  },
  {
    id: "endorse-business",
    title: "The Business Roundtable's Blessing",
    prompt: "A coalition of CEOs and business groups is weighing an endorsement — and a joint fundraising blitz. They expect friendly tax language in return.",
    subject: "both",
    trigger: { kind: "stochastic", baseWeight: 2.2 },
    gate: { minTurn: 1, maxTurn: 6 },
    oncePerGame: true,
    choices: [
      {
        id: "rep-accept", side: "rep",
        text: "Embrace them — promise the tax posture and take the money",
        effects: {
          cash: 18_000_000,
          positionShifts: { taxes: 0.15 },
          blocDeltas: [{ blocId: "college_white", margin: 0.015 }],
        },
        resultText: "The checks clear within the week. So does the expectation.",
      },
      {
        id: "rep-distance", side: "rep",
        text: "Keep them at arm's length — you're running as a populist",
        effects: { blocDeltas: [{ blocId: "noncollege_white", margin: 0.02 }] },
        resultText: "\"I work for you, not the boardroom.\" The base loves it; the donors sulk.",
      },
      {
        id: "dem-accept", side: "dem",
        text: "Accept the moderates' wing of it — competence over ideology",
        effects: { cash: 10_000_000, narrative: 4, positionShifts: { taxes: 0.1 } },
        resultText: "A parade of centrist CEOs vouches for your steadiness. The left wing of your coalition notices the fine print.",
      },
      {
        id: "dem-decline", side: "dem",
        text: "Decline — you can't run on fairness with their logo on the lectern",
        effects: { blocDeltas: [{ blocId: "youth", margin: 0.02, enthusiasm: 0.03 }] },
        resultText: "Young volunteers share the clip a million times. The money goes elsewhere.",
      },
    ],
  },
  {
    id: "endorse-paper",
    title: "The Paper of Record Decides",
    prompt: "The country's most influential editorial board is finalizing its endorsement. An interview — and a little flattery of their worldview — could tip it.",
    subject: "both",
    trigger: { kind: "stochastic", baseWeight: 2 },
    gate: { minTurn: 2, maxTurn: 7 },
    oncePerGame: true,
    choices: [
      {
        id: "sit", text: "Sit for the interview and court the board",
        effects: { narrative: 8, blocDeltas: [{ blocId: "college_white", margin: 0.02 }] },
        resultText: "The endorsement runs Sunday. Suburban reading circles take note.",
      },
      {
        id: "snub", text: "Snub them — run against the media itself",
        effects: { blocDeltas: [{ blocId: "noncollege_white", margin: 0.02 }], narrative: -4, momentum: 2 },
        resultText: "\"They don't speak for you.\" The crowd roars; the columnists sharpen their knives.",
      },
    ],
  },
  {
    id: "endorse-general",
    title: "A Four-Star Endorsement",
    prompt: "A revered retired general offers to endorse you on national security — if you'll harden your line on defense.",
    subject: "both",
    trigger: { kind: "stochastic", baseWeight: 1.8 },
    gate: { minTurn: 2, maxTurn: 7 },
    oncePerGame: true,
    choices: [
      {
        id: "accept",
        text: "Accept and toughen your security posture",
        effects: {
          blocDeltas: [{ blocId: "seniors", margin: 0.03 }],
          positionShifts: { law_and_order: 0.1 },
          narrative: 4,
        },
        resultText: "Flags, medals, and a steady hand on your shoulder. Seniors approve.",
      },
      {
        id: "decline",
        text: "Pass — you won't be boxed in on defense policy",
        effects: {},
        resultText: "You keep your options open. The general endorses no one.",
      },
    ],
  },
  {
    id: "endorse-celebrity",
    title: "The Megastar Moment",
    prompt: "The biggest pop star on the planet is one DM away from endorsing you. Her fans register to vote in droves — but the backlash machine is already warming up.",
    subject: "both",
    trigger: { kind: "stochastic", baseWeight: 1.8 },
    gate: { minTurn: 2, maxTurn: 7 },
    oncePerGame: true,
    choices: [
      {
        id: "embrace",
        text: "Embrace it — rallies, playlists, the works",
        effects: {
          blocDeltas: [{ blocId: "youth", margin: 0.04, enthusiasm: 0.06 }, { blocId: "noncollege_white", margin: -0.008 }],
          momentum: 4,
        },
        resultText: "Voter-registration sites crash for an hour. Cable hosts rage into the void.",
      },
      {
        id: "lowkey",
        text: "Accept quietly — a post, not a partnership",
        effects: { blocDeltas: [{ blocId: "youth", margin: 0.02 }] },
        resultText: "One perfectly-lit photo. Ten million likes. No hostages to fortune.",
      },
    ],
  },
  {
    id: "endorse-governor",
    title: "The Swing-State Kingmaker",
    prompt: "The popular governor of a battleground state will campaign for you — in exchange for a joint infrastructure promise for their state.",
    subject: "both",
    trigger: { kind: "stochastic", baseWeight: 2 },
    gate: { minTurn: 1, maxTurn: 6 },
    oncePerGame: true,
    choices: [
      {
        id: "deal",
        text: "Make the deal — promise the projects, take the machine",
        effects: {
          cash: -5_000_000,
          blocDeltas: [{ blocId: "suburban_women", margin: 0.025 }, { blocId: "noncollege_white", margin: 0.015 }],
          momentum: 3,
        },
        resultText: "Two podiums, one battleground, and a very specific list of bridges. Their field operation is now yours.",
      },
      {
        id: "no-deal",
        text: "Decline — no state gets to hold the platform hostage",
        effects: { narrative: 2 },
        resultText: "You keep the platform national. The governor campaigns for nobody.",
      },
    ],
  },
  {
    id: "endorse-faith",
    title: "The Faith Coalition",
    prompt: "A national coalition of faith leaders offers its blessing — and its formidable Sunday turnout operation — for a firmer line on their issues.",
    subject: "both",
    trigger: { kind: "stochastic", baseWeight: 1.8 },
    gate: { minTurn: 1, maxTurn: 6 },
    oncePerGame: true,
    choices: [
      {
        id: "rep-accept", side: "rep",
        text: "Stand with them — firm up the social-issues line",
        effects: {
          blocDeltas: [{ blocId: "noncollege_white", margin: 0.025, enthusiasm: 0.04 }, { blocId: "seniors", margin: 0.02 }],
          positionShifts: { abortion: 0.1 },
        },
        resultText: "Pulpits hum. The turnout machine is real — and so is the platform plank you just signed.",
      },
      {
        id: "rep-soften", side: "rep",
        text: "Take the photo, dodge the pledge",
        effects: { blocDeltas: [{ blocId: "seniors", margin: 0.01 }] },
        resultText: "Warm handshakes, no commitments. Everyone notices.",
      },
      {
        id: "dem-progressive", side: "dem",
        text: "Court the social-justice congregations instead",
        effects: { blocDeltas: [{ blocId: "black", margin: 0.03, enthusiasm: 0.04 }] },
        resultText: "Souls to the polls. The organizing tradition is older than television — and it still works.",
      },
      {
        id: "dem-secular", side: "dem",
        text: "Keep church and campaign separate",
        effects: {},
        resultText: "A respectful pass. The coalition prays on it.",
      },
    ],
  },
  {
    id: "endorse-tech",
    title: "Silicon Money",
    prompt: "A clutch of tech billionaires dangles a nine-figure super-PAC commitment. All they want is a softer touch on regulation — publicly.",
    subject: "both",
    trigger: { kind: "stochastic", baseWeight: 1.8 },
    gate: { minTurn: 2, maxTurn: 7 },
    oncePerGame: true,
    choices: [
      {
        id: "take",
        text: "Take the money, soften the rhetoric",
        effects: { cash: 25_000_000, positionShifts: { economy: 0.1 }, narrative: -3 },
        resultText: "The ad buys triple overnight. So do the headlines about who's really funding your campaign.",
      },
      {
        id: "refuse",
        text: "Refuse it on camera",
        effects: { blocDeltas: [{ blocId: "youth", margin: 0.02 }, { blocId: "college_white", margin: 0.015 }], narrative: 4 },
        resultText: "\"This campaign is not for sale.\" It's your best-performing clip of the month.",
      },
    ],
  },
];
