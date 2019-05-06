#this is a lookup table for the outcomes if poke1 and poke2 were exchanged
otherGuy = [1,0,2,4,3,5,7,6,9,8,11,10,12]

tier = str(sys.argv[1])
cutoff = 1500 #this is our default, but we can change it for '1337' stats
teamtype = None

battleCount = 0
teamCount = 0
counter = {'raw': {}, 'real': {}, 'weighted': {}}
leadCounter = {'raw': {}, 'weighted': {}}
#We're not doing these right now
#turnCounter = {}
#KOcounter = {}
#TCsquared = {} #for calculating std. dev
#KCsquared = {} #	"
encounterMatrix = {}
teammateMatrix = {}
tagCounter = {}
stallCounter = []
ratingCounter = []
weightCounter = []
WLratings = {'win':[],'loss':[]}

t=tier
if tier.endswith('suspecttest'):
    t=t[:-11]

for line in file:
    #print line
        battles = json.loads(line)

        for battle in battles:

            weight={}
                if 'turns' in battle.keys() and t not in non6v6Formats:
                    if battle['turns'] < 3 and t not in nonSinglesFormats:
                        continue
                    elif battle['turns'] < 2:
                        continue
                for player in ['p1','p2']:
                    if teamtype:
                        if teamtype not in battle[player]['tags']:
                            continue
                        team = []
                        if 'rating' in battle[player].keys():
                            if 'rpr' in battle[player]['rating'].keys() and 'rprd' in battle[player]['rating'].keys():
                                if battle[player]['rating']['rprd'] != 0.0:
                                    weight[player] = weighting(battle[player]['rating']['rpr'],battle[player]['rating']['rprd'],cutoff)
                                                ratingCounter.append(battle[player]['rating'])

                                                if 'outcome' in battle[player].keys():
                                                    WLratings[battle[player]['outcome']].append([battle[player]['rating']['rpr'],battle[player]['rating']['rprd'],weight[player]])

                        if player not in weight.keys(): #if there's a ladder error, we have no idea what the player's rating is, so treat like a new player
                            weight[player] = weighting(1500,130.0,cutoff)

                                #try using outcome
                                if 'outcome' in battle[player].keys():
                                    if battle[player]['outcome'] == 'win':
                                        weight[player] = weighting(1540.16061434,122.858308077,cutoff)
                                    elif battle[player]['outcome'] == 'loss':
                                        weight[player] = weighting(1459.83938566,122.858308077,cutoff)

                        weightCounter.append(weight[player])

                        for poke in battle[player]['team']:
                            #annoying alias shit
                                species = poke['species']
                                for alias in aliases:
                                    if species in aliases[alias]:
                                        species = alias
                                                break

                                team.append(species)

                                #if species not already in the tables, you gotta add them
                                if species not in counter['raw'].keys():
                                    counter['raw'][species]=0.0
                                        counter['real'][species]=0.0
                                        counter['weighted'][species]=0.0

                                #count usage
                                counter['raw'][species]=counter['raw'][species]+1.0
                                if poke['turnsOut'] > 0:
                                    counter['real'][species]=counter['real'][species]+1.0
                                counter['weighted'][species]=counter['weighted'][species]+weight[player]

                                if metagamefile:
                                    #count metagame stuff
                                        for tag in battle[player]['tags']:
                                            if tag not in tagCounter.keys():
                                                tagCounter[tag] = 0.0
                                                tagCounter[tag] = tagCounter[tag]+weight[player] #metagame stuff is weighted
                                        stallCounter.append([battle[player]['stalliness'],weight[player]])

                        teamCount = teamCount + 1

                        #teammate stats
                        for i in range(len(team)):
                            for j in range(i):
                                if team[i] not in teammateMatrix.keys():
                                    teammateMatrix[team[i]]={}
                                        if team[j] not in teammateMatrix.keys():
                                            teammateMatrix[team[j]]={}
                                        if team[j] not in teammateMatrix[team[i]].keys():
                                            teammateMatrix[team[i]][team[j]]=0.0
                                        teammateMatrix[team[i]][team[j]]=teammateMatrix[team[i]][team[j]]+weight[player] #teammate stats are weighted
                                        teammateMatrix[team[j]][team[i]]=teammateMatrix[team[i]][team[j]] #nice symmetric matrix

                if t not in nonSinglesFormats: #lead stats for doubles is not currently supported
                    #lead stats
                        leads=['empty','empty']
                        if len(battle['matchups'])==0:
                            #this happens if the player forfeits after six turns and no switches--rare but possible
                                for i in range(2):
                                    for poke in battle[['p1','p2'][i]]['team']:
                                        if poke['turnsOut'] > 0:
                                            leads[i] = poke['species']
                                                        break
                        else:
                            for i in range(2):
                                #it is utterly imperative that the p1 lead is first and the p2 lead second
                                        leads[i] = battle['matchups'][0][i]

                        if 'empty' in leads:
                            if len(battle['matchups']) == 0: #1v1 (or similiar) battle forfeited before started
                                continue
                            print "Something went wrong."
                                print battle

                        for i in range(2):
                            if ['p1','p2'][i] not in weight:
                                continue
                            species = leads[i]
                                #annoying alias shit
                                for alias in aliases:
                                    if species in aliases[alias]:
                                        species = alias
                                                break
                                if species not in leadCounter['raw'].keys():
                                    leadCounter['raw'][species]=0.0
                                        leadCounter['weighted'][species]=0.0

                                leadCounter['raw'][species]=leadCounter['raw'][species]+1.0
                                leadCounter['weighted'][species]=leadCounter['weighted'][species]+weight[['p1','p2'][i]]

                        #encounter Matrix
                        if not teamtype:
                            w=min(weight.values())
                                for matchup in battle['matchups']:
                                    if matchup[0] not in encounterMatrix.keys():
                                        encounterMatrix[matchup[0]]={}
                                        if matchup[1] not in encounterMatrix.keys():
                                            encounterMatrix[matchup[1]]={}
                                        if matchup[1] not in encounterMatrix[matchup[0]].keys():
                                            encounterMatrix[matchup[0]][matchup[1]]=[0 for k in range(13)]
                                                encounterMatrix[matchup[1]][matchup[0]]=[0 for k in range(13)]
                                        encounterMatrix[matchup[0]][matchup[1]][matchup[2]]=encounterMatrix[matchup[0]][matchup[1]][matchup[2]]+w #encounter Matrix is weighed
                                        encounterMatrix[matchup[1]][matchup[0]][otherGuy[matchup[2]]]=encounterMatrix[matchup[1]][matchup[0]][otherGuy[matchup[2]]]+w #by the inferior player

                battleCount = battleCount + 1
