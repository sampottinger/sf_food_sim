import csv
import functools
import typing

import luigi


class CombineCsvTask(luigi.Task):
    
    def requires(self):
        return self.get_targets()
    
    def output(self):
        return luigi.LocalTarget(self.get_output_loc())
    
    def run(self):
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
        raise NotImplementedError('Use implementor.')
    
    def get_output_loc(self) -> str:
        raise NotImplementedError('Use implementor.')
