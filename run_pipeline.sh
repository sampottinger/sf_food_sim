rm -r working
mkdir working
python -m luigi --module pipeline DedupeNamedTask --local-scheduler
rm viz/combined.csv
cp working/named_dedupe.csv viz/combined.csv