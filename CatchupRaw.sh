#!/bin/bash
#This file is included solely to be used as an example. It will likely need to be heavily modified from month to month
#(or from run to run)

logFolder=/home/ps/main/logs
month="2019-12"
mkdir Raw

for d in {1..24}
do
	day=$(printf "%02d" $d)
	for i in $logFolder/$month/*
	do
		tier=$(basename $i)
		if [[ $tier == seasonal* ]] || [[ $tier == *random* ]] || [[ $tier == *metronome* ]] || [[ $tier == *superstaff* ]] || [[ $tier == *factory* ]] || [[ $tier == *challengecup* ]] || [[ $tier == *hackmonscup* ]]; then
			echo Skipping $tier/$month-$day
			continue
		fi
		if [ -d $logFolder/$month/$tier/$month-$day ]; then
			echo Processing $tier/$month-$day
			python batchLogReader.py $logFolder/$month/$tier/$month-$day/ $tier
		fi
	done
done
echo $(date)
