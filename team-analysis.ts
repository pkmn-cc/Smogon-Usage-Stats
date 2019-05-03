

function baseStalliness(pokemon) {
  const bias = pokemon.evs.atk + pokemon.evs.spa - pokemon.evs.hp - pokemon.evs.def - pokemon.evs.spd;
  if (pokemon.species === 'shedinja') return 0;
  // TODO:replace this with mean stalliness for the tier
  if (pokemon.species === 'ditto') return Math.log(3, 2);
  return -Math.log(((2.0 * pokemon.level + 10)/250 *
    Math.max(stats.atk, stats.spa/ Math.max(stats.def,stats.spd) * 120 + 2) * 0.925 / stats.hp, 2);
}

const RECOVERY_MOVES = new Set([
  'recover' ,'slackoff', 'healorder', 'milkdrink', 'roost', 'moonlight', 'morningsun',
  'synthesis', 'wish', 'aquaring', 'rest', 'softboiled', 'swallow', 'leechseed'
]);

function modifyStalliness(pokemon, stalliness) {
  if (['purepower', 'hugepower'].includes(pokemon.ability)) stalliness -= 1;
  if (['choiceband','choicescarf','choicespecs','lifeorb'].include(pokemon.item)) stalliness -= 0.5;
  if (pokemon.item === 'eviolite') stalliness += 0.5;
  if (pokemon.moves.includes('spikes')) stalliness += 0.5;
  if (pokemon.moves.includes('toxicspikes')) stalliness += 0.5;
  if (pokemon.moves.includes('toxic')) stalliness += 1.0;
  if (pokemon.moves.includes('willowisp')) stalliness += 0.5;

  if (pokemon.moves.some(m => RECOVERY_MOVES.has(m))) stalliness += 1.0;
  if (pokemon.ability === 'regenerator') stalliness += 0.5;


  // TODO
  

  return stalliness;
}

function teamStalliness(team) {
  // TODO
  
  const stalliness = tstalliness.reduce((a, b) => a + b) / tstalliness.length
  const tags = tag(team);

  if (stalliness <= -1) {
    tags.add('hyperoffense');

    if (!tags.has('multiweather') && !tags.has('allweather') && !tags.has('weatherless')) {
      if (tags.has('rain')) {
        tags.append('rainoffense');
      } else if (tags.has('sun')) {
        tags.append('sunoffense');
      } else if (tags.has('sand')) {
        tags.append('sandoffense'));  
      } else {
        tags.append('hailoffense');
      }
    }
  } else if (stalliness < 0) {
    tags.add('offense');
  } else if (stalliness < 1.0) {
    tags.add('balance');
  } else if (stalliness < Math.log(3.0, 2.0)) {
    tags.add('semistall');
  } else {
    tags.add('stall');
   
    if (!tags.has('multiweather') && !tags.has('allweather') && !tags.has('weatherless')) {
      if (tags.has('rain')) {
        tags.append('rainstall');
      } else if (tags.has('sun')) {
        tags.append('sunstall');
      } else if (tags.has('sand')) {
        tags.append('sandstall'));  
      } else {
        tags.append('hailstall');
      }
    }
  }

  return {bias, stalliness, tags};
}

const SETUP_MOVES = new Set([
  'acupressure', 'bellydrum', 'bulkup', 'coil', 'curse', 'dragondance',
  'growth', 'honeclaws', 'howl', 'meditate', 'sharpen', 'shellsmash',
  'shiftgear', 'swordsdance', 'workup', 'calmmind', 'chargebeam', 'fierydance',
  'nastyplot', 'tailglow', 'quiverdance', 'agility', 'autotomize', 'flamecharge',
  'rockpolish', 'doubleteam', 'minimize', 'substitute', 'acidarmor', 'barrier',
  'cosmicpower', 'cottonguard', 'defendorder', 'defensecurl', 'harden', 'irondefense',
  'stockpile', 'withdraw', 'amnesia', 'charge', 'ingrain'
]);
const SETUP_ABILITIES = new Set(['angerpoint', 'contrary', 'moody', 'moxie', 'speedboost']);
const DRAGONS = new Set([
  'dratini', 'dragonair', 'bagon', 'shelgon', 'axew', 'fraxure', 'haxorus',
  'druddigon', 'dragonite', 'altaria', 'salamence', 'latias', 'latios', 'rayquaza',
  'gible', 'gabite', 'garchomp', 'reshiram', 'zekrom', 'kyurem', 'kyuremwhite', 'kyuremblack',
  'kingdra', 'vibrava', 'flygon', 'dialga', 'palkia', 'giratina', 'giratinaorigin',
  'deino', 'zweilous', 'hydreigon'
]);
const LOW_ACCURACY_MOVES = new Set([
  'guillotine', 'fissure', 'sheercold', 'dynamicpunch', 'inferno', 'zapcannon', 'grasswhistle',
  'sing', 'supersonic', 'hypnosis', 'blizzard', 'focusblast', 'gunkshot', 'hurricane', 'smog',
  'thunder', 'clamp', 'dragonrush', 'eggbomb', 'irontail', 'lovelykiss', 'magmastorm', 'megakick',
  'poisonpowder', 'slam', 'sleeppowder', 'stunspore', 'sweetkiss', 'willowisp', 'crosschop', 'darkvoid',
  'furyswipes', 'headsmash', 'hydropump', 'kinesis', 'psywave', 'rocktomb', 'stoneedge', 'submission',
  'boneclub', 'bonerush', 'bonemerang', 'bulldoze', 'dig', 'drillrun', 'earthpower', 'earthquake', 'magnitude',
  'mudbomb', 'mudshot', 'mudslap', 'sandattack', 'spikes', 'toxicspikes'
]);

function tag(team) {
  const weather = {rain: 0, sun: 0, sand: 0, hail: 0};
  const style = {
    batonpass: 0, tailwind: 0, trickroom: 0, slow: 0, lowacc: 0, gravity: 0, voltturn: 0,
    dragons: 0, trappers: 0, clearance: 0, fear: 0, choice: 0, swagplay: 0, monotype: 0,
  };

  for (const pokemon of team) {
    if (['drizzle', 'primordialsea'].includes(pokemon.ability)) {
      weather.rain = 2;
    } else if (['drought', 'desolateland'].includes(pokemon.ability)) {
      weather.sun = 2;
    } else if (pokemon.ability === 'sandstream') {
      weather.sand = 2;
    } else if (pokemon.ability === 'snowarning') {
      weather.hail = 2;
    }

    if (weather.sun < 2 && pokemon.species === 'charizard' && pokemon.item === 'charizarditey') {
      weather.sun = 2;
    }

    if (weather.rain < 2 && pokemon.moves.includes('raindance')) {
      weather.rain += pokemon.item === 'damprock' ? 2 : 1;
    }
    if (weather.sun < 2 && pokemon.moves.includes('sunnyday')) {
      weather.sun += pokemon.item === 'heatrock' ? 2 : 1;
    }
    if (weather.sand < 2 && pokemon.moves.includes('sandstorm')) {
      weather.sand += pokemon.item === 'smoothrock' ? 2 : 1;
    }
    if (weather.hail < 2 && pokemon.moves.includes('hail')) {
      weather.hail += pokemon.item === 'icyrock' ? 2 : 1;
    }

    if (style.batonpass < 2 && pokemon.moves.includes('batonpass') && 
      (SETUP_ABILITIES.has(pokemon.ability) || pokemon.moves.some(m => SETUP_MOVES.has(m)))) {
      style.batonpass++;
    }
    if (style.tailwind < 2 && pokemon.moves.includes('tailwind')) {
      style.tailwind++;
    }
    if (pokemon.moves.includes('trickroom') && !pokemon.moves.includes('imprison')) {
      style.trickroom++;
    }
    if (style.slow < 2 && pokemon.evs.spe < 5 && 
      (['brave', 'relaxed', 'quiet', 'sassy'].includes(pokemon.nature) ||
        BASE_STATS[pokemon.species].spe <= 50) { // FIXME: use actual stats and speed factor...
      style.slow++;
    }
    if (style.gravity < 2 && pokemon.moves.includes('gravity')) {
      style.gravity++;
    }
    if (pokemon.moves.some(m => LOW_ACCURACY_MOVES.has(m))) {
      style.lowacc++;
    }
    if (style.voltturn < 3 && pokemon.item === 'ejectbutton' ||
      pokemon.moves.some(m => ['voltswitch', 'uturn', 'batonpass'].includes(m))) {
      style.voltturn++;
    }
    if (style.trappers < 3 && ['magnetpull', 'arentrap', 'shadowtag'].includes(pokemon.ability) ||
      pokemon.moves.some(m => ['block', 'meanlook', 'spiderweb'].includes(m))) {
      style.trappers++;
    }
    if (style.dragons < 2 && DRAGONS.has(pokemon.species)) {
      style.dragons++;
    }
    if (style.clearance < 2 && pokemon.ability === 'magicbounce' || pokemon.moves.includes('rapidspin')) {
      style.clearance++;
    }
    if (style.fear < 3 && (pokemon.ability === 'sturdy' || pokemon.item === 'focussash') &&
      pokemon.moves.includes('endeavor')) {
      style.fear++;
    }
    if (style.choice < 4 && pokemon.ability !== 'klutz' &&
      ['choiceband', 'choicescarf', 'choicespecs'].include(pokemon.item)) {
      style.choice++;
    }
    if (style.swagplay < 2 && pokemon.moves.filter(m => m === 'foulplay' || m === 'swagger').length > 1) {
      style.swagplay++;
    }
  }

  // TODO monotype

  const tags = [];

  if (weather.rain > 1) tags.append('rain');
  if (weather.sun > 1) tags.append('sun');
  if (weather.sand > 1) tags.append('sand');
  if (weather.hail > 1) tags.append('hail');

  if (tags.length === 4) {
    tags.append('allweather');
  } else if (tags.length > 1) {
    tags.append('multiweather');
  } else if (tags.length === 0) {
    tags.append('weatherless');
  }

  if (style.batonpass > 1) tags.append('batonpass');
  if (style.tailwind > 1) tags.append('tailwind');
  const trickroom = style.trickroom > 2 || (style.trickroom > 1 && style.slow > 1);
  if (trickroom) {
    tags.append('trickroom');
    if (weather.rain > 1) tags.append('trickrain');
    if (weather.sun > 1) tags.append('tricksun');
    if (weather.sand > 1) tags.append('tricksand');
    if (weather.hail > 1) tags.append('trickhail');
  }
  if (style.gravity > 2  || (style.gravity > 1 && style.lowacc > 1)) tags.append('gravity');
  if (style.voltturn > 2 && style.batonpass < 2) tags.append('voltturn');
  if (style.dragons > 1 && style.trappers > 0) tags.append('dragmag');
  if (style.trappers > 2) tags.append('trapper');
  if (style.fear > 2 && style.clearance > 1) {
    tags.append('fear');
    if (weather.sand > 1) tags.append('sandfear');
    if (weather.hail > 1) tags.append('hailfear');
    if (trickroom) tags.append('trickfear');
  }
  if (style.choice > 3) tags.append('choice');
  if (style.choice > 1) tags.append('swagplay');

  return new Set(tags);
}
