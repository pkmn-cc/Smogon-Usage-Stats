function readLog(name: string, raw: string, tier, movesets, ratings) {
	const mrayAllowed = !['ubers','battlefactory','megamons', 'gen6ubers', 'gen7ubers', 'gen7pokebankubers'].includes(tier);

  // https://github.com/Zarel/Pokemon-Showdown/commit/92a4f85e0abe9d3a9febb0e6417a7710cabdc303
  if (raw === '"log"') return;

  const log = JSON.parse(raw);
  const spacelog = !(log.log && log.log[0].startsWith('| '));
  if (log.turns === undefined) throw new Error('No turn count');

  const ts = [];
  const rating = {};

  // 0 for tie/unknown, 1 for p1 and 2 for p2 
  winner: 0|1|2 = 0;
  if (log.log) {
    // TODO: multiple scans of all log lines :S
    if (log.log.includes(`|win|${log.p1}`)) winner = 1;
    if (log.log.includes(`|win|${log.p2}`)) {
      if (winner === 1) throw new Error('Battle had two winners');
      winner = 2;
    }
  }

  if (ratings) {
    for (sideid of [1, 2]) {
      const logRating = log[`p${sideid}rating`];
      if (!logRating) continue;
      r = rating[`p${sideid}team`] = {};
      // TODO: logRating is dict?
      for (const k of ['r', 'rd', 'rpr', 'rprd']) {
        const n = Number(logRating[k]);
        if (!isNaN(n)) r[k] = n; 
      }
    }
  } else {
    // TODO
  }

  const teams = getTeamsFromLog(log, mrayAllowed)
  if (!teams) throw new Error('Unable to get teams from log');
  





}

function getTeamsFromLog(log: any, mrayAllowed?: boolean) {
  const teams = {};
  for (const team of ['p1team', 'p2team']) {
    
  }
}


function cleanTier(tier: string) {
	if (tier.endsWith('current')) tier = tier.slice(0, -7);
	if (tier.startsWith('pokebank')) tier = tier.slice(8, -4);
	if (tier.startsWith('oras')) tier.slice(4);
	if (tier === 'capbeta') return 'cap';
	if (tier === 'vgc2014beta') return 'vgc2014';
  if (tier.startsWith('xybattlespot') && tier.endsWith('beta')) tier = tier.slice(0, -4);
	if (['battlespotdoubles', 'battlespotdoublesvgc2015'].includes(tier)) return 'vgc2015';
	if (tier === 'smogondoubles') return 'doublesou';
	if (tier === 'smogondoublesubers') return 'doublesubers';
	if (tier === 'smogondoublesuu') return 'doublesuu';
  return tier;
}
