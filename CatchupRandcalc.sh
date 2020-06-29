#!/bin/bash -e

logFolder=/home/ps/main/logs
month=$(date +'%Y-%m')
today=$(date +'%-d')

# Default to running over whatever logs we have from today, but allow for
# specifying and arbitrary range of days from this month. If you need to run
# over days which span a month or for a past month just edit this file directly
START=${1:-$today}
END=${2:-$START}

DIR="randbats/$month-$START-$END"
mkdir -p $DIR

# All the random tiers (this is an array in Bash... yes its hideous)
tiers=()

function process {
    tier=$1
    if [[ $tier == "moveset" ]]; then
        return
    fi

    echo Processing $tier

    python StatCounter.py $tier 0
    # smogon/damage-calc only cares about the 0 weighted chaos JSON files,
    # not the moveset.txt that batchMovesetCounter.py writes to stdout
    python batchMovesetCounter.py $tier 0 > /dev/null
}
export -f process

# batchLogReader.py will create the new files under Raw/ (unforuntately not
# namespaced), so we need to first iterate through and simply delete any
# preexisting output under Raw/ from past runs. This mainly only matters if
# species are removed from a format, as otherwise we'd be overwriting the
# files anyway.

for i in $logFolder/$month/*
do
    tier=$(basename $i)
    if [[ $tier != *random* ]]; then
        continue
    fi

    if [ -d $logFolder/$month/$tier ]; then
        tiers+=($tier)
        echo Removing Raw/$tier and  Raw/moveset/$tier
        rm -rf Raw/$tier  Raw/moveset/$tier
    fi
done

for d in $(seq $START $END)
do
    day=$(printf "%02d" $d)
    for tier in ${tiers[@]}
    do
        if [ -d $logFolder/$month/$tier/$month-$day ]; then
            echo Parsing $tier/$month-$day
            python batchLogReader.py $logFolder/$month/$tier/$month-$day/ $tier
        fi
    done
done

echo $(date)
parallel -j 10 process ::: ${tiers[@]}
echo $(date)
tar -cvzf $DIR.tar.gz $DIR
