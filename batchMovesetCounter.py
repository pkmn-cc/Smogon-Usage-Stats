def movesetCounter(filename, cutoff, teamtype, usage):
    file = gzip.open(filename,'rb')
        raw = file.read()
        file.close()

        raw=raw.split('][')
        for i in range(len(raw)):
            if (i>0):
                raw[i]='['+raw[i]
                if (i<len(raw)-1):
                    raw[i]=raw[i]+']'

        species = keyLookup[filename[string.rfind(filename,'/')+1:]]
        for alias in aliases:
            if species in aliases[alias]:
                species = alias
                        break

        bias = []
        stalliness = []
        abilities = {}
        items = {}
        happinesses = {}
        spreads = {}
        moves = {}
        movesets = []
        weights = []
        rawCount = 0
        gxes={}

        for line in raw:
            movesets = json.loads(line)
                for moveset in movesets:
                    if teamtype:
                        if teamtype not in moveset['tags']:
                            continue
                        rawCount = rawCount+1
                        weight=weighting(1500.0,130.0,cutoff)
                        if 'rating' in moveset.keys():
                            if 'rpr' in moveset['rating'].keys() and 'rprd' in moveset['rating'].keys():
                                gxe = victoryChance(moveset['rating']['rpr'],moveset['rating']['rprd'],1500.0,130.0)
                                        gxe=int(round(100*gxe))

                                        addMe=True
                                        if moveset['trainer'] in gxes:
                                            if gxes[moveset['trainer']] > gxe:
                                                addMe = False
                                        if addMe:
                                            gxes[moveset['trainer']]=gxe

                                        if moveset['rating']['rprd'] != 0.0:
                                            weight=weighting(moveset['rating']['rpr'],moveset['rating']['rprd'],cutoff)
                                                weights.append(weight)
                        elif 'outcome' in moveset.keys():
                            if moveset['outcome'] == 'win':
                                weight=weighting(1540.16061434,122.858308077,cutoff)
                            elif moveset['outcome'] == 'loss':
                                weight=weighting(1459.83938566,122.858308077,cutoff)
                                #else it's a tie, and we use 1500
                        if moveset['ability'] not in keyLookup:
                            moveset['ability'] = 'illuminate'
                        if moveset['ability'] not in abilities:
                            abilities[moveset['ability']] = 0.0
                        abilities[moveset['ability']] = abilities[moveset['ability']] + weight

                        if moveset['item'] not in keyLookup:
                            moveset['item'] = 'nothing'
                        if moveset['item'] not in items:
                            items[moveset['item']] = 0.0
                        items[moveset['item']] = items[moveset['item']] + weight

                        if moveset['nature'] in ['serious','docile','quirky','bashful'] or moveset['nature'] not in keyLookup:
                            nature = 'hardy'

                        #round the EVs
                        for stat in moveset['evs'].keys():
                            ev=moveset['evs'][stat]
                                if species == 'shedinja' and stat == 'hp':
                                    stat = 1
                                        moveset['evs']['stat']=0
                                        continue

                                if stat == 'hp':
                                    n=-1
                                else:
                                    n=nmod[moveset['nature']][{'atk': 0, 'def': 1, 'spa': 2, 'spd': 3, 'spe': 4}[stat]]
                                x = statFormula(baseStats[keyify(species)][stat],moveset['level'],n,moveset['ivs'][stat],ev)

                                while ev > 0:
                                    if x != statFormula(baseStats[keyify(species)][stat],moveset['level'],n,moveset['ivs'][stat],ev-1):
                                        break
                                    ev = ev-1

                        moveset['evs'][stat]=ev

                        spread = keyLookup[moveset['nature']]+':'
                        for stat in ['hp','atk','def','spa','spd']:
                            spread=spread+str(moveset['evs'][stat])+'/'
                        spread=spread+str(moveset['evs']['spe'])
                        if spread not in spreads:
                            spreads[spread] = 0.0
                        spreads[spread] += weight

                        for move in moveset['moves']:
                            if move in keyLookup:
                                #I think it's valid to triple-count 'nothing' right now
                                        #if keyLookup[move]=='Nothing':
                                        #	continue
                                        if move not in moves:
                                            moves[move] = 0.0
                                        moves[move] += weight

                        happiness = moveset['happiness']
                        if happiness not in happinesses.keys():
                            happinesses[happiness]=0.0
                        happinesses[happiness]+=weight

        count = sum(abilities.values())
        gxes=list(reversed(sorted(gxes.values())))

        #teammate stats
        try:
            teammates = teammateMatrix[species]
        except KeyError:
            sys.stderr.write('No teammates data for '+filename+' ('+str(cutoff)+')\n')
                teammates={}
        for s in teammates:
            if s not in usage.keys():
                teammates[s]=0.0
            else:
                teammates[s]=teammates[s]-(count*usage[s])

        #checks and counters
        cc={}
        if species in encounterMatrix.keys():
            for s in encounterMatrix[species].keys():
                matchup = encounterMatrix[species][s]
                        #number of times species is KOed by s + number of times species switches out against s over number of times
                        #either (or both) is switched out or KOed (don't count u-turn KOs or force-outs)
                        n=sum(matchup[0:6])
                        if n>20:
                            p=float(matchup[0]+matchup[3])/n
                                d=math.sqrt(p*(1.0-p)/n)
                                #cc[s]=p-4*d #using a CRE-style calculation
                                cc[s]=[n,p,d]

        maxGXE = [0,0,0,0]
        if len(gxes) > 0:
            maxGXE = [len(gxes),gxes[0],gxes[int(math.ceil(0.01*len(gxes)))-1],gxes[int(math.ceil(0.20*len(gxes)))-1]]

        stuff = {
                'Raw count': rawCount,
                'Viability Ceiling': maxGXE,
                'Abilities': abilities,
                'Items': items,
                'Spreads': spreads,
                'Moves': moves,
                'Happiness' : happinesses,
                'Teammates': teammates,
                'Checks and Counters': cc}
