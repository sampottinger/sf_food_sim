import csv
import typing

import luigi

OUTPUT_FIELDS = ['latitude', 'longitude', 'featureType']


class SimplifyCsvTask(luigi.Task):
    
    def requires(self):
        return self.get_input_task()
    
    def output(self):
        return luigi.LocalTarget(self.get_output_loc())
    
    def run(self):
        with self.input().open('r') as f:
            input_records = list(csv.DictReader(f))
        
        assert len(input_records) > 0
        keys = input_records[0].keys()

        transformed = map(lambda x: self._transform_record(x), input_records)
        transformed_valid = filter(
            lambda x: x['latitude'] != '' and x['longitude'] != '',
            transformed
        )

        with self.output().open('w') as f:
            writer = csv.DictWriter(f, fieldnames=OUTPUT_FIELDS)
            writer.writeheader()
            writer.writerows(transformed_valid)
    
    def get_input_task(self) -> luigi.Task:
        raise NotImplementedError('Use implementor.')
    
    def get_output_loc(self) -> str:
        raise NotImplementedError('Use implementor.')
    
    def get_feature_type(self) -> str:
        raise NotImplementedError('Use implementor.')
        
    def _transform_record(self, target: typing.Dict) -> typing.Dict:
        return {
            'latitude': target['@lat'],
            'longitude': target['@lon'],
            'featureType': self.get_feature_type()
        }
            
