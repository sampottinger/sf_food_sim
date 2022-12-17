rm -r working
mkdir working
python -m luigi --module pipeline FenceTask --local-scheduler
rm viz/combined.csv
cp working/named_fenced.csv viz/combined.csv
