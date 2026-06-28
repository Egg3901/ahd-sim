import type { PartyId } from "@engine/system";

// Party leaders are the campaign principals (the UK analog of a presidential
// ticket). Traits 0..100 modify action effectiveness, never the vote directly.
export interface UkLeader {
  partyId: PartyId;
  name: string;
  // Campaign effectiveness traits.
  charisma: number;
  energy: number;
  competence: number;
  // Air-war reach / fundraising-equivalent (party machine strength).
  machine: number;
}

// Leaders keyed by election id → party id. Only the leaders of the parties
// playing that election need entries; others fall back to a neutral default.
export const UK_LEADERS: Record<string, Partial<Record<PartyId, UkLeader>>> = {
  "1951": {
    con: { partyId: "con", name: "Winston Churchill", charisma: 78, energy: 50, competence: 78, machine: 84 },
    lab: { partyId: "lab", name: "Clement Attlee",    charisma: 42, energy: 60, competence: 86, machine: 78 },
    ld:  { partyId: "ld",  name: "Clement Davies",    charisma: 50, energy: 50, competence: 60, machine: 30 },
  },
  "2024": {
    lab: { partyId: "lab", name: "Keir Starmer", charisma: 52, energy: 64, competence: 74, machine: 80 },
    con: { partyId: "con", name: "Rishi Sunak", charisma: 50, energy: 60, competence: 66, machine: 70 },
    ld:  { partyId: "ld", name: "Ed Davey", charisma: 58, energy: 78, competence: 60, machine: 50 },
    ref: { partyId: "ref", name: "Nigel Farage", charisma: 80, energy: 76, competence: 52, machine: 48 },
    grn: { partyId: "grn", name: "Carla Denyer & Adrian Ramsay", charisma: 56, energy: 62, competence: 58, machine: 36 },
    snp: { partyId: "snp", name: "John Swinney", charisma: 50, energy: 56, competence: 64, machine: 54 },
    pc:  { partyId: "pc", name: "Rhun ap Iorwerth", charisma: 58, energy: 60, competence: 62, machine: 40 },
  },
  "2019": {
    con: { partyId: "con", name: "Boris Johnson", charisma: 78, energy: 74, competence: 56, machine: 78 },
    lab: { partyId: "lab", name: "Jeremy Corbyn", charisma: 60, energy: 66, competence: 50, machine: 72 },
    ld:  { partyId: "ld", name: "Jo Swinson", charisma: 56, energy: 70, competence: 60, machine: 52 },
    ref: { partyId: "ref", name: "Nigel Farage", charisma: 80, energy: 78, competence: 52, machine: 46 },
    grn: { partyId: "grn", name: "Sian Berry & Jonathan Bartley", charisma: 52, energy: 60, competence: 56, machine: 32 },
    snp: { partyId: "snp", name: "Nicola Sturgeon", charisma: 74, energy: 72, competence: 76, machine: 64 },
    pc:  { partyId: "pc", name: "Adam Price", charisma: 60, energy: 62, competence: 64, machine: 40 },
  },
  "2017": {
    con: { partyId: "con", name: "Theresa May", charisma: 44, energy: 58, competence: 62, machine: 76 },
    lab: { partyId: "lab", name: "Jeremy Corbyn", charisma: 64, energy: 72, competence: 52, machine: 70 },
    ld:  { partyId: "ld", name: "Tim Farron", charisma: 52, energy: 64, competence: 56, machine: 48 },
    ref: { partyId: "ref", name: "Paul Nuttall", charisma: 40, energy: 50, competence: 44, machine: 30 },
    grn: { partyId: "grn", name: "Caroline Lucas & Jonathan Bartley", charisma: 58, energy: 60, competence: 60, machine: 32 },
    snp: { partyId: "snp", name: "Nicola Sturgeon", charisma: 74, energy: 72, competence: 76, machine: 66 },
    pc:  { partyId: "pc", name: "Leanne Wood", charisma: 60, energy: 60, competence: 60, machine: 38 },
  },
  "2015": {
    con: { partyId: "con", name: "David Cameron", charisma: 70, energy: 68, competence: 68, machine: 78 },
    lab: { partyId: "lab", name: "Ed Miliband", charisma: 48, energy: 62, competence: 58, machine: 70 },
    ld:  { partyId: "ld", name: "Nick Clegg", charisma: 64, energy: 64, competence: 60, machine: 54 },
    ref: { partyId: "ref", name: "Nigel Farage", charisma: 78, energy: 76, competence: 50, machine: 42 },
    grn: { partyId: "grn", name: "Natalie Bennett", charisma: 46, energy: 56, competence: 50, machine: 30 },
    snp: { partyId: "snp", name: "Nicola Sturgeon", charisma: 76, energy: 74, competence: 76, machine: 62 },
    pc:  { partyId: "pc", name: "Leanne Wood", charisma: 60, energy: 60, competence: 60, machine: 38 },
  },
  "2010": {
    con: { partyId: "con", name: "David Cameron", charisma: 70, energy: 70, competence: 66, machine: 76 },
    lab: { partyId: "lab", name: "Gordon Brown", charisma: 42, energy: 60, competence: 70, machine: 74 },
    ld:  { partyId: "ld", name: "Nick Clegg", charisma: 70, energy: 72, competence: 60, machine: 50 },
    ref: { partyId: "ref", name: "Nigel Farage", charisma: 76, energy: 72, competence: 48, machine: 36 },
    grn: { partyId: "grn", name: "Caroline Lucas", charisma: 58, energy: 60, competence: 62, machine: 28 },
    snp: { partyId: "snp", name: "Alex Salmond", charisma: 74, energy: 72, competence: 74, machine: 58 },
    pc:  { partyId: "pc", name: "Ieuan Wyn Jones", charisma: 52, energy: 56, competence: 60, machine: 36 },
  },
  "1997": {
    lab: { partyId: "lab", name: "Tony Blair", charisma: 82, energy: 80, competence: 74, machine: 82 },
    con: { partyId: "con", name: "John Major", charisma: 48, energy: 58, competence: 64, machine: 70 },
    ld:  { partyId: "ld", name: "Paddy Ashdown", charisma: 66, energy: 70, competence: 64, machine: 50 },
    ref: { partyId: "ref", name: "James Goldsmith", charisma: 54, energy: 56, competence: 50, machine: 40 },
    snp: { partyId: "snp", name: "Alex Salmond", charisma: 72, energy: 70, competence: 72, machine: 52 },
    pc:  { partyId: "pc", name: "Dafydd Wigley", charisma: 56, energy: 58, competence: 62, machine: 36 },
  },
};

export function leaderFor(electionId: string, partyId: PartyId, partyName: string): UkLeader {
  return (
    UK_LEADERS[electionId]?.[partyId] ?? {
      partyId,
      name: `${partyName} leader`,
      charisma: 55,
      energy: 60,
      competence: 60,
      machine: 55,
    }
  );
}
