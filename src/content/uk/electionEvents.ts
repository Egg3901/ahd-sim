import type { UkEvent } from "./events";

// Named historical event decks per UK election — the real story beats of each
// campaign. Entries with `turn` fire deterministically that week (0-based,
// once); the rest join the weekly random draw alongside the generic pool
// (uk/events.ts), also once each. `party` pins a beat to the party history
// says it hit. Keyed by election id ("2024", "1997", …).
//
// Authoring rules: appeal ±0.02–0.045, momentum ±5–12, each deck roughly
// net-neutral per party — the calibration baseline already encodes the result;
// these add texture, not a thumb on the scale. Pinned parties must actually
// contest the election (2015's UKIP rides under "ref"; no "snp" in 1951; the
// Liberals and the Alliance ride under "ld" throughout).

export const UK_ELECTION_EVENTS: Record<string, UkEvent[]> = {
  // ── 2024: the long goodbye ────────────────────────────────────────────────
  "2024": [
    { id: "2024_rain_launch", headline: "Sunak calls the election in the pouring rain, drowned out by 'Things Can Only Get Better'", role: "any", weight: 3, party: "con", turn: 0, appeal: -0.03, momentum: -8 },
    { id: "2024_farage_returns", headline: "Farage takes the Reform helm and heads for Clacton, and the right's vote splits open", role: "any", weight: 3, party: "ref", turn: 1, appeal: 0.04, momentum: 12 },
    { id: "2024_dday_exit", headline: "Sunak leaves the D-Day commemorations early for a TV interview", role: "any", weight: 3, party: "con", turn: 2, appeal: -0.04, momentum: -10 },
    { id: "2024_gambling_probe", headline: "The Gambling Commission probes Tory insiders who bet on the election date", role: "any", weight: 3, party: "con", turn: 4, appeal: -0.025, momentum: -7 },
    { id: "2024_tax_claim", headline: "Sunak's '£2,000 Labour tax rise' claim dominates the first head-to-head debate", role: "any", weight: 3, party: "con", appeal: 0.04, momentum: 8 },
    { id: "2024_supermajority", headline: "'Stop the supermajority': Cabinet ministers openly plead for an opposition", role: "any", weight: 2, party: "con", appeal: 0.035, momentum: 6 },
    { id: "2024_ref_vetting", headline: "Another Reform candidate suspended over old posts; the vetting operation creaks", role: "any", weight: 2, party: "ref", appeal: -0.03, momentum: -6 },
    { id: "2024_ming_vase", headline: "Labour's Ming-vase caution: a campaign visibly terrified of its own poll lead", role: "any", weight: 2, party: "lab", appeal: -0.02, momentum: -5 },
  ],

  // ── 2019: Get Brexit Done ─────────────────────────────────────────────────
  "2019": [
    { id: "2019_get_brexit_done", headline: "'Get Brexit Done': Johnson's three-word drumbeat sets the terms of the campaign", role: "any", weight: 3, party: "con", turn: 0, appeal: 0.04, momentum: 10 },
    { id: "2019_chief_rabbi", headline: "The Chief Rabbi's unprecedented intervention over Labour antisemitism", role: "any", weight: 3, party: "lab", turn: 1, appeal: -0.035, momentum: -8 },
    { id: "2019_neutral_brexit", headline: "Corbyn declares he'd stay neutral in his own second referendum", role: "any", weight: 3, party: "lab", turn: 3, appeal: -0.03, momentum: -7 },
    { id: "2019_fridge", headline: "Johnson retreats into a fridge to dodge a breakfast-TV ambush", role: "any", weight: 3, party: "con", turn: 5, appeal: -0.035, momentum: -8 },
    { id: "2019_nhs_dossier", headline: "Corbyn brandishes 451 unredacted pages: 'proof the NHS is on the table'", role: "any", weight: 3, party: "lab", appeal: 0.03, momentum: 8 },
    { id: "2019_neil_empty_chair", headline: "The empty chair: Johnson alone refuses the Andrew Neil interview", role: "any", weight: 2, party: "con", appeal: -0.025, momentum: -6 },
    { id: "2019_red_wall", headline: "Pollsters map the Red Wall crumbling, brick by Leave-voting brick", role: "any", weight: 3, party: "con", appeal: 0.03, momentum: 6 },
    { id: "2019_youth_register", headline: "A late surge of young voters registers, and Labour HQ dares to hope", role: "any", weight: 2, party: "lab", appeal: 0.03, momentum: 7 },
  ],

  // ── 2017: the coronation that wasn't ──────────────────────────────────────
  "2017": [
    { id: "2017_strong_stable", headline: "'Strong and stable': May's twenty-point lead looks unassailable", role: "any", weight: 3, party: "con", turn: 0, appeal: 0.035, momentum: 8 },
    { id: "2017_dementia_tax", headline: "'Nothing has changed!' The dementia-tax U-turn detonates the manifesto", role: "any", weight: 3, party: "con", turn: 1, appeal: -0.045, momentum: -12 },
    { id: "2017_corbyn_rallies", headline: "Corbyn packs seafronts and stadiums; the youthquake stirs", role: "any", weight: 3, party: "lab", turn: 2, appeal: 0.035, momentum: 10 },
    { id: "2017_security_row", headline: "Campaigns pause after the attacks; May's record on police cuts comes under fire", role: "any", weight: 3, party: "con", turn: 3, appeal: -0.025, momentum: -6 },
    { id: "2017_ira_ads", headline: "Crosby's attack ads on Corbyn's IRA past finally start to bite", role: "any", weight: 2, party: "con", appeal: 0.03, momentum: 6 },
    { id: "2017_abbott_lbc", headline: "Diane Abbott's LBC car-crash: 250,000 police officers for £300,000", role: "any", weight: 3, party: "lab", appeal: -0.035, momentum: -7 },
    { id: "2017_yougov_model", headline: "YouGov's seat model says hung parliament; everyone laughs, nervously", role: "any", weight: 3, party: "lab", appeal: 0.025, momentum: 8 },
  ],

  // ── 2015: the polls' great miss ───────────────────────────────────────────
  "2015": [
    { id: "2015_hell_yes", headline: "'Hell yes, I'm tough enough': Miliband surprises Paxman, and himself", role: "any", weight: 3, party: "lab", turn: 0, appeal: 0.03, momentum: 7 },
    { id: "2015_snp_scare", headline: "Miliband in Salmond's pocket: the SNP-coalition scare posters bite", role: "any", weight: 3, party: "lab", turn: 1, appeal: -0.035, momentum: -8 },
    { id: "2015_sturgeon_debate", headline: "Sturgeon walks off with the seven-way debate", role: "any", weight: 3, party: "snp", turn: 2, appeal: 0.03, momentum: 8 },
    { id: "2015_ed_stone", headline: "The Ed Stone: eight pledges, two tonnes of limestone, zero mercy from the press", role: "any", weight: 3, party: "lab", turn: 4, appeal: -0.03, momentum: -7 },
    { id: "2015_milifandom", headline: "Milifandom blooms: the internet decides Ed is unexpectedly cool", role: "any", weight: 2, party: "lab", appeal: 0.035, momentum: 6 },
    { id: "2015_farage_thanet", headline: "Farage's siege of Thanet South pulls the cameras, and Tory votes", role: "any", weight: 2, party: "ref", appeal: 0.03, momentum: 7 },
    { id: "2015_ukip_gaffes", headline: "Another UKIP candidate suspended; the purple vetting operation creaks", role: "any", weight: 2, party: "ref", appeal: -0.03, momentum: -6 },
    { id: "2015_ltep", headline: "'Long-term economic plan', repeated until it rings in your ears", role: "any", weight: 3, party: "con", appeal: 0.025, momentum: 5 },
  ],

  // ── 2010: Cleggmania and an open mic ──────────────────────────────────────
  "2010": [
    { id: "2010_i_agree_with_nick", headline: "'I agree with Nick': the first-ever TV debate mints Cleggmania overnight", role: "any", weight: 3, party: "ld", turn: 0, appeal: 0.045, momentum: 12 },
    { id: "2010_clegg_pileon", headline: "The press turns its guns on Clegg; the front pages get vicious", role: "any", weight: 3, party: "ld", turn: 2, appeal: -0.03, momentum: -7 },
    { id: "2010_bigotgate", headline: "'That bigoted woman': Brown's open mic meets Gillian Duffy of Rochdale", role: "any", weight: 3, party: "lab", turn: 3, appeal: -0.04, momentum: -10 },
    { id: "2010_hung_jitters", headline: "Markets shudder at the hung-parliament arithmetic; {party} wears the anxiety", role: "leader", weight: 3, turn: 4, appeal: -0.02, momentum: -5 },
    { id: "2010_citizens_uk", headline: "Brown finds his voice at last with the Citizens UK barnburner", role: "any", weight: 2, party: "lab", appeal: 0.035, momentum: 8 },
    { id: "2010_final_debate", headline: "Cameron takes the final debate on points", role: "any", weight: 3, party: "con", appeal: 0.03, momentum: 7 },
    { id: "2010_airbrushed", headline: "The airbrushed Cameron poster spawns a thousand parodies", role: "any", weight: 2, party: "con", appeal: -0.03, momentum: -6 },
    { id: "2010_expenses_backwash", headline: "{party} caught in the expenses-scandal backwash, duck houses all round", role: "any", weight: 3, appeal: -0.03, momentum: -6 },
  ],

  // ── 2005: Iraq's shadow ───────────────────────────────────────────────────
  "2005": [
    { id: "2005_iraq_shadow", headline: "Iraq shadows everything: the war Blair cannot stop answering for", role: "any", weight: 3, party: "lab", turn: 0, appeal: -0.035, momentum: -8 },
    { id: "2005_dog_whistle", headline: "'Are you thinking what we're thinking?' Crosby's dog whistle carries", role: "any", weight: 3, party: "con", turn: 1, appeal: 0.03, momentum: 7 },
    { id: "2005_kennedy_surge", headline: "Kennedy hoovers up the anti-war and tuition-fees vote", role: "any", weight: 3, party: "ld", turn: 2, appeal: 0.03, momentum: 7 },
    { id: "2005_masochism", headline: "The masochism strategy: Blair takes the studio audience's punches, with Brown at his side", role: "any", weight: 3, party: "lab", turn: 4, appeal: 0.035, momentum: 8 },
    { id: "2005_ag_leak", headline: "The Attorney General's Iraq advice leaks: 'regime change is not a legal basis'", role: "any", weight: 3, party: "lab", appeal: -0.025, momentum: -6 },
    { id: "2005_brown_economy", headline: "Eight years of growth: Brown's economy is Labour's shield", role: "any", weight: 2, party: "lab", appeal: 0.025, momentum: 5 },
    { id: "2005_whistle_curdles", headline: "The immigration-heavy pitch curdles with the very voters Howard needs", role: "any", weight: 2, party: "con", appeal: -0.03, momentum: -6 },
    { id: "2005_kennedy_numbers", headline: "A bleary Kennedy fluffs his own local-income-tax numbers at the manifesto launch", role: "any", weight: 2, party: "ld", appeal: -0.025, momentum: -5 },
  ],

  // ── 2001: the quiet landslide ─────────────────────────────────────────────
  "2001": [
    { id: "2001_foot_and_mouth", headline: "Foot-and-mouth pyres force the election back a month, a queasy start", role: "any", weight: 3, party: "lab", turn: 0, appeal: -0.02, momentum: -5 },
    { id: "2001_prescott_punch", headline: "Prescott decks an egg-thrower in Rhyl; the country, oddly, approves", role: "any", weight: 3, party: "lab", turn: 1, appeal: 0.02, momentum: 6 },
    { id: "2001_save_the_pound", headline: "'Ten days to save the pound': Hague bets what's left on Europe", role: "any", weight: 3, party: "con", turn: 2, appeal: 0.025, momentum: 5 },
    { id: "2001_apathy", headline: "Apathy stalks the campaign: turnout forecasts fall off a cliff, and {party} feels it most", role: "leader", weight: 3, turn: 4, appeal: -0.02, momentum: -6 },
    { id: "2001_storer_ambush", headline: "Sharron Storer ambushes Blair over the NHS outside a Birmingham hospital", role: "any", weight: 2, party: "lab", appeal: -0.025, momentum: -6 },
    { id: "2001_economy_record", headline: "Steady growth, low inflation: Labour's economic record goes unanswered", role: "any", weight: 3, party: "lab", appeal: 0.03, momentum: 5 },
    { id: "2001_baseball_cap", headline: "The baseball cap follows Hague everywhere, fourteen pints and all", role: "any", weight: 2, party: "con", appeal: -0.03, momentum: -7 },
  ],

  // ── 1997: things can only get better ──────────────────────────────────────
  "1997": [
    { id: "1997_sleaze", headline: "Cash-for-questions: Hamilton clings on in Tatton and 'sleaze' leads every bulletin", role: "any", weight: 3, party: "con", turn: 0, appeal: -0.04, momentum: -9 },
    { id: "1997_things_better", headline: "'Things Can Only Get Better': New Labour's launch is pure discipline", role: "any", weight: 3, party: "lab", turn: 1, appeal: 0.03, momentum: 8 },
    { id: "1997_soapbox", headline: "Major dusts off the soapbox: defiance, a megaphone, and hecklers", role: "any", weight: 3, party: "con", turn: 2, appeal: 0.03, momentum: 7 },
    { id: "1997_referendum_party", headline: "Goldsmith's Referendum Party nips at the Tory right in every marginal", role: "any", weight: 3, party: "con", turn: 4, appeal: -0.025, momentum: -6 },
    { id: "1997_parish_council", headline: "Blair likens a Scottish Parliament to a parish council; Scotland notices", role: "any", weight: 2, party: "lab", appeal: -0.03, momentum: -6 },
    { id: "1997_mandelson_grid", headline: "Mandelson's grid holds: not a single unforced error all week", role: "any", weight: 3, party: "lab", appeal: 0.02, momentum: 5 },
    { id: "1997_dont_bind_hands", headline: "'Like me or loathe me, do not bind my hands': Major's Europe plea lands", role: "any", weight: 2, party: "con", appeal: 0.025, momentum: 5 },
  ],

  // ── 1992: the shock that followed ─────────────────────────────────────────
  "1992": [
    { id: "1992_tax_bombshell", headline: "'Labour's tax bombshell': £1,250 a year, say the Tory posters", role: "any", weight: 3, party: "lab", turn: 0, appeal: -0.035, momentum: -8 },
    { id: "1992_soapbox", headline: "Major mounts the soapbox in Luton, megaphone in hand", role: "any", weight: 3, party: "con", turn: 2, appeal: 0.03, momentum: 7 },
    { id: "1992_sheffield_rally", headline: "'We're alright! We're alright!' The Sheffield rally's triumphalism grates", role: "any", weight: 3, party: "lab", turn: 4, appeal: -0.04, momentum: -9 },
    { id: "1992_essex_man", headline: "Essex man breaks late for Major; the pollsters never see it coming", role: "any", weight: 3, party: "con", turn: 5, appeal: 0.025, momentum: 8 },
    { id: "1992_jennifers_ear", headline: "The War of Jennifer's Ear turns Labour's NHS broadcast toxic", role: "any", weight: 2, party: "lab", appeal: -0.025, momentum: -6 },
    { id: "1992_its_time", headline: "'It's Time': Labour rides a steady poll lead and starts measuring curtains", role: "any", weight: 3, party: "lab", appeal: 0.045, momentum: 9 },
    { id: "1992_kinnock_ready", headline: "Kinnock finally looks prime-ministerial, say the focus groups", role: "any", weight: 2, party: "lab", appeal: 0.035, momentum: 7 },
    { id: "1992_recession_gloom", headline: "Repossessions and dole queues: the recession dogs Major's every stop", role: "any", weight: 2, party: "con", appeal: -0.03, momentum: -6 },
  ],

  // ── 1987: boom in the South, wobble on Thursday ───────────────────────────
  "1987": [
    { id: "1987_kinnock_broadcast", headline: "'Why am I the first Kinnock in a thousand generations…' The Hudson broadcast lands", role: "any", weight: 3, party: "lab", turn: 0, appeal: 0.04, momentum: 10 },
    { id: "1987_two_davids", headline: "The two Davids contradict each other live on air; the Alliance muddles", role: "any", weight: 3, party: "ld", turn: 1, appeal: -0.035, momentum: -7 },
    { id: "1987_wobbly_thursday", headline: "Wobbly Thursday: a rogue poll panics Conservative Central Office", role: "any", weight: 3, party: "con", turn: 2, appeal: -0.03, momentum: -7 },
    { id: "1987_thatcher_steadies", headline: "Thatcher steadies the ship: tax cuts, home ownership, and a booming South", role: "any", weight: 3, party: "con", turn: 3, appeal: 0.03, momentum: 7 },
    { id: "1987_defence_row", headline: "Kinnock's 'occupation' answer on defence hands the Tories a week of headlines", role: "any", weight: 3, party: "lab", appeal: -0.04, momentum: -8 },
    { id: "1987_jobless_marches", headline: "Three million unemployed: the North marches while the South shops", role: "any", weight: 2, party: "con", appeal: -0.025, momentum: -5 },
    { id: "1987_southern_boom", headline: "Loadsamoney Britain: the boom is the Tories' best canvasser", role: "any", weight: 2, party: "con", appeal: 0.025, momentum: 5 },
    { id: "1987_alliance_flicker", headline: "A crisp Alliance broadcast briefly makes the mould look breakable", role: "any", weight: 2, party: "ld", appeal: 0.025, momentum: 5 },
  ],

  // ── 1983: the landslide year ──────────────────────────────────────────────
  "1983": [
    { id: "1983_falklands_factor", headline: "The Falklands factor: Thatcher campaigns as the victor of the South Atlantic", role: "any", weight: 3, party: "con", turn: 0, appeal: 0.04, momentum: 9 },
    { id: "1983_suicide_note", headline: "'The longest suicide note in history': Kaufman's verdict on Labour's manifesto sticks", role: "any", weight: 3, party: "lab", turn: 1, appeal: -0.04, momentum: -9 },
    { id: "1983_alliance_surge", headline: "The SDP-Liberal Alliance surges, carving up the anti-Tory vote", role: "any", weight: 3, party: "ld", turn: 2, appeal: 0.035, momentum: 8 },
    { id: "1983_polaris_row", headline: "Callaghan torpedoes his own party's Polaris policy mid-campaign", role: "any", weight: 3, party: "lab", turn: 4, appeal: -0.02, momentum: -6 },
    { id: "1983_foot_oratory", headline: "Foot's platform oratory still fills the halls, whatever the polls say", role: "any", weight: 3, party: "lab", appeal: 0.04, momentum: 7 },
    { id: "1983_nhs_safe_hands", headline: "'The NHS is safe with us': Thatcher forced onto the defensive", role: "any", weight: 2, party: "con", appeal: -0.03, momentum: -6 },
    { id: "1983_pm_designate", headline: "Jenkins is 'prime minister designate'; Steel begs to differ. Who speaks for the Alliance?", role: "any", weight: 2, party: "ld", appeal: -0.025, momentum: -5 },
  ],

  // ── 1979: Labour isn't working ────────────────────────────────────────────
  "1979": [
    { id: "1979_winter_discontent", headline: "The rubbish bags and the gravediggers' strike still haunt every bulletin", role: "any", weight: 3, party: "lab", turn: 0, appeal: -0.04, momentum: -9 },
    { id: "1979_no_confidence", headline: "Brought down by one vote in the Commons, and the no-confidence hangover lingers", role: "any", weight: 3, party: "lab", turn: 1, appeal: -0.02, momentum: -5 },
    { id: "1979_labour_isnt_working", headline: "'Labour Isn't Working': Saatchi's dole queue goes up on every billboard", role: "any", weight: 3, party: "con", turn: 2, appeal: 0.035, momentum: 8 },
    { id: "1979_housewife_economics", headline: "Thatcher's grocery-basket economics: a housewife knows a squeezed budget", role: "any", weight: 3, party: "con", turn: 4, appeal: 0.02, momentum: 6 },
    { id: "1979_sunny_jim", headline: "Sunny Jim: Callaghan outpolls Thatcher on who would make the better PM", role: "any", weight: 3, party: "lab", appeal: 0.04, momentum: 8 },
    { id: "1979_union_peace", headline: "Union leaders pledge industrial peace. Months too late, sniffs Fleet Street", role: "any", weight: 2, party: "lab", appeal: 0.025, momentum: 5 },
    { id: "1979_thatcher_jitters", headline: "Wavering voters confess their doubts about the 'Thatcher experiment'", role: "any", weight: 3, party: "con", appeal: -0.035, momentum: -6 },
    { id: "1979_crisis_what_crisis", headline: "'Crisis? What crisis?' The headline he never actually said, quoted daily", role: "any", weight: 2, party: "lab", appeal: -0.02, momentum: -5 },
  ],

  // ── 1974 (October): one more heave for a majority ─────────────────────────
  "1974oct": [
    { id: "1974oct_working_majority", headline: "'Give us a working majority': Wilson asks the country to finish February's job", role: "any", weight: 3, party: "lab", turn: 0, appeal: 0.03, momentum: 7 },
    { id: "1974oct_social_contract", headline: "The Social Contract holds the line with the unions, and the pickets stay home", role: "any", weight: 3, party: "lab", turn: 1, appeal: 0.03, momentum: 7 },
    { id: "1974oct_heath_heave", headline: "Heath pleads for a government of national unity; the Tory faithful shift in their seats", role: "any", weight: 3, party: "con", turn: 2, appeal: -0.025, momentum: -6 },
    { id: "1974oct_inflation_bites", headline: "Inflation towards twenty per cent: the price of everything leads every bulletin", role: "any", weight: 3, party: "lab", turn: 4, appeal: -0.03, momentum: -6 },
    { id: "1974oct_thorpe_fades", headline: "The February Liberal surge settles back to earth as the squeeze returns", role: "any", weight: 2, party: "ld", appeal: -0.03, momentum: -6 },
    { id: "1974oct_scotland_oil", headline: "'It's Scotland's oil': the SNP rides the North Sea into a clutch of new seats", role: "any", weight: 2, party: "snp", appeal: 0.035, momentum: 8 },
    { id: "1974oct_wilson_steady", headline: "Wilson runs a low, steady, front-porch campaign, and it is enough", role: "any", weight: 2, party: "lab", appeal: 0.02, momentum: 5 },
  ],

  // ── 1974 (February): who governs Britain? ─────────────────────────────────
  "1974feb": [
    { id: "1974feb_who_governs", headline: "'Who governs Britain?' Heath calls the election on the miners and the three-day week", role: "any", weight: 3, party: "con", turn: 0, appeal: 0.025, momentum: 6 },
    { id: "1974feb_three_day_week", headline: "The three-day week: factories dark, televisions off at 10:30, and no clear villain", role: "any", weight: 3, party: "con", turn: 1, appeal: -0.03, momentum: -7 },
    { id: "1974feb_powell_defects", headline: "Enoch Powell refuses to stand and tells his followers to vote Labour over Europe", role: "any", weight: 3, party: "con", turn: 2, appeal: -0.03, momentum: -7 },
    { id: "1974feb_liberal_surge", headline: "Thorpe's Liberals surge towards a fifth of the vote; the two-party lock rattles", role: "any", weight: 3, party: "ld", turn: 3, appeal: 0.04, momentum: 10 },
    { id: "1974feb_pay_board", headline: "The Pay Board reports the miners were underpaid all along; Heath's case wobbles", role: "any", weight: 3, party: "con", turn: 4, appeal: -0.025, momentum: -6 },
    { id: "1974feb_wilson_calm", headline: "Wilson offers calm and a deal with the unions after the confrontation", role: "any", weight: 2, party: "lab", appeal: 0.025, momentum: 6 },
    { id: "1974feb_hung_maths", headline: "The arithmetic points to no overall winner; the pundits reach for the word 'hung'", role: "any", weight: 2, party: "ld", appeal: 0.02, momentum: 5 },
  ],

  // ── 1970: the poll that lied ──────────────────────────────────────────────
  "1970": [
    { id: "1970_wilson_cruising", headline: "Wilson campaigns like a man who has already won; the polls agree", role: "any", weight: 3, party: "lab", turn: 0, appeal: 0.025, momentum: 6 },
    { id: "1970_selsdon_man", headline: "'Selsdon Man': Labour paints Heath's free-market turn as a throwback to the 1930s", role: "any", weight: 3, party: "con", turn: 1, appeal: -0.025, momentum: -6 },
    { id: "1970_world_cup_out", headline: "England crash out in Leon; a flat national mood settles over the long weekend", role: "any", weight: 3, party: "lab", turn: 3, appeal: -0.025, momentum: -6 },
    { id: "1970_trade_figures", headline: "A shock set of trade figures lands three days out; the recovery story cracks", role: "any", weight: 3, party: "lab", turn: 4, appeal: -0.035, momentum: -9 },
    { id: "1970_heath_steady", headline: "Heath grinds on, unglamorous and unmoved, promising to cut prices 'at a stroke'", role: "any", weight: 2, party: "con", appeal: 0.03, momentum: 7 },
    { id: "1970_powell_shadow", headline: "Powell's shadow hangs over the Tory right and the marginals both", role: "any", weight: 2, party: "con", appeal: 0.02, momentum: 4 },
    { id: "1970_wilson_pipe", headline: "The pipe, the mac, the walkabouts: Wilson's easy style briefly looks like complacency", role: "any", weight: 2, party: "lab", appeal: -0.02, momentum: -5 },
  ],

  // ── 1966: the mandate ─────────────────────────────────────────────────────
  "1966": [
    { id: "1966_white_heat", headline: "'You know Labour government works': Wilson asks for the majority to finish the job", role: "any", weight: 3, party: "lab", turn: 0, appeal: 0.035, momentum: 8 },
    { id: "1966_heath_untested", headline: "Heath, new and untested, struggles to dent Wilson's easy command of the airwaves", role: "any", weight: 3, party: "con", turn: 1, appeal: -0.025, momentum: -6 },
    { id: "1966_pound_pressure", headline: "Sterling under pressure again: the Tories warn the good times are borrowed", role: "any", weight: 3, party: "con", turn: 3, appeal: 0.025, momentum: 5 },
    { id: "1966_good_mood", headline: "A confident, rising-living-standards mood carries the government's canvassers", role: "any", weight: 3, party: "lab", turn: 4, appeal: 0.03, momentum: 6 },
    { id: "1966_grimond_liberals", headline: "Grimond's Liberals press hard in the West Country and the Celtic fringe", role: "any", weight: 2, party: "ld", appeal: 0.025, momentum: 6 },
    { id: "1966_wilson_walkabout", headline: "Wilson works the crowds; the small-majority underdog now looks the obvious PM", role: "any", weight: 2, party: "lab", appeal: 0.02, momentum: 5 },
  ],

  // ── 1964: thirteen wasted years ───────────────────────────────────────────
  "1964": [
    { id: "1964_thirteen_years", headline: "'Thirteen wasted years': Wilson hangs every stale Tory habit around Douglas-Home's neck", role: "any", weight: 3, party: "lab", turn: 0, appeal: 0.03, momentum: 7 },
    { id: "1964_profumo_hangover", headline: "The Profumo hangover lingers; a whiff of scandal and drift clings to the government", role: "any", weight: 3, party: "con", turn: 1, appeal: -0.03, momentum: -7 },
    { id: "1964_grouse_moor", headline: "The grouse-moor image sticks: Douglas-Home admits he does his sums with matchsticks", role: "any", weight: 3, party: "con", turn: 2, appeal: -0.025, momentum: -6 },
    { id: "1964_white_heat", headline: "Wilson's 'white heat of technology' pitches Labour as the modern, classless future", role: "any", weight: 3, party: "lab", turn: 4, appeal: 0.03, momentum: 7 },
    { id: "1964_home_steadies", headline: "Douglas-Home steadies the Tory campaign on defence and the deterrent", role: "any", weight: 2, party: "con", appeal: 0.025, momentum: 5 },
    { id: "1964_grimond_liberals", headline: "Grimond's Liberals revive, siphoning soft Tory votes in the shires", role: "any", weight: 2, party: "ld", appeal: 0.025, momentum: 6 },
    { id: "1964_smethwick", headline: "The Smethwick race campaign casts an ugly shadow over the Midlands result", role: "any", weight: 2, party: "con", appeal: -0.02, momentum: -4 },
  ],

  // ── 1951: one more heave ──────────────────────────────────────────────────
  "1951": [
    { id: "1951_one_more_heave", headline: "Churchill, 76, pitches one more heave: 'set the people free'", role: "any", weight: 3, party: "con", turn: 0, appeal: 0.03, momentum: 7 },
    { id: "1951_whose_finger", headline: "'Whose finger on the trigger?' The Daily Mirror paints Churchill a warmonger", role: "any", weight: 3, party: "con", turn: 1, appeal: -0.04, momentum: -9 },
    { id: "1951_exhausted_ministers", headline: "Attlee's front bench runs on fumes: Bevin gone, Cripps gone, the rest worn thin", role: "any", weight: 3, party: "lab", turn: 2, appeal: -0.03, momentum: -7 },
    { id: "1951_rationing_fatigue", headline: "Six years on, the ration books are still out, and patience is thinner", role: "any", weight: 3, party: "lab", turn: 4, appeal: -0.025, momentum: -6 },
    { id: "1951_violet_drives", headline: "Attlee tours the country in the family car, Violet at the wheel. Modesty as message", role: "any", weight: 2, party: "lab", appeal: 0.035, momentum: 7 },
    { id: "1951_labour_record", headline: "Full employment and a brand-new NHS: Labour's record does the talking", role: "any", weight: 3, party: "lab", appeal: 0.02, momentum: 5 },
    { id: "1951_libel_writ", headline: "Churchill issues a writ over the 'warmonger' smear, and wins some sympathy", role: "any", weight: 2, party: "con", appeal: 0.02, momentum: 5 },
  ],
};
