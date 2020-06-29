#!/bin/bash
#This file is included solely to be used as an example. It will likely need to be heavily modified from month to month
#(or from run to run)

logFolder=/home/ps/main/logs
month="2020-06"
mkdir Raw

for d in {20..28}
do
	day=$(printf "%02d" $d)
	for i in $logFolder/$month/*
	do
		tier=$(basename $i)
		if [[ $tier == seasonal* ]] || [[ $tier == *random* ]] || [[ $tier == *petmod* ]] || [[ $tier == *superstaff* ]] || [[ $tier == *factory* ]] || [[ $tier == *challengecup* ]] || [[ $tier == *hackmonscup* ]] || [[ $tier == *digimon* ]]; then
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
./MonthlyAnalysis.sh
echo $(date)
