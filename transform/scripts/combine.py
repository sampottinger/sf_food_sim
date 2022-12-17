"""Simple utility to concatinate CSV files.

License: MIT
"""
import csv
import functools
import typing

import luigi


class CombineCsvTask(luigi.Task):
    """Luigi task combining the rows of multiple CSV files together."""
    
    def requires(self):
        """Get the tasks whose CSV output should be combined."""
        return self.get_targets()
    
    def output(self):
        """Create a local target for get_output_loc"""
        return luigi.LocalTarget(self.get_output_loc())
    
    def run(self):
        """Load all of the input CSV files and write the superset of columns and rows to a new file.
        
        Load all of the input CSV files and write the superset of columns and concatination of rows
        to a new file such that the number of rows in the output file is one plus the number of
        non-header rows found in all of the input files.
        """
        input_records = []

        for target in self.input():
            with target.open('r') as f:
                input_records.extend(csv.DictReader(f))
        
        keys = map(lambda x: set(x.keys()), input_records)
        all_keys = functools.reduce(lambda x, y: x.union(y), keys)
        all_keys_valid = list(filter(lambda x: x is not None, all_keys))

        def make_output_record(input_row: typing.Dict) -> typing.Dict:
            return dict(map(lambda key: (key, input_row.get(key, '')), all_keys_valid))
        
        output_records = map(make_output_record, input_records)
        with self.output().open('w') as f:
            writer = csv.DictWriter(f, fieldnames=sorted(all_keys_valid))
            writer.writeheader()
            writer.writerows(output_records)
    
    def get_targets(self) -> typing.Iterable[luigi.Task]:
        """Get the dependencies whose CSV outputs should be concatinated."""
        raise NotImplementedError('Use implementor.')
    
    def get_output_loc(self) -> str:
        """Get the location where the concatinated file should be written."""
        raise NotImplementedError('Use implementor.')
