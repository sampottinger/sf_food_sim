rm -r working
mkdir working
python -m luigi --module pipeline PrepareAndCheckNamedFeaturesTask --local-scheduler