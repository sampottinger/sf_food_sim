"""Logic to standardize and simplify OSM raw CSV data.

License: MIT
"""
import csv
import typing

import luigi  # type: ignore

OUTPUT_FIELDS = ['latitude', 'longitude', 'featureType']


class SimplifyCsvTask(luigi.Task):
    """Simplify a raw output CSV from Overpass."""
    
    def requires(self):
        """Get a task whose raw OSM CSV Overpass data should be standardized / simplified."""
        return self.get_input_task()
    
    def output(self):
        """Create a local target for get_output_loc"""
        return luigi.LocalTarget(self.get_output_loc())
    
    def run(self):
        """Filter invalid points and standardize column names.
        
        Filter invalid points and standardize column names, reading from a raw CSV output from
        Overpass and writing to a new CSV file.
        """
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
        """Get a task whose raw OSM CSV Overpass data should be standardized / simplified.
        
        Returns:
            Task outputting OSM CSV data.
        """
        raise NotImplementedError('Use implementor.')
    
    def get_output_loc(self) -> str:
        """Get the path to where the vile should be written.
        
        Returns:
            Local path.
        """
        raise NotImplementedError('Use implementor.')
    
    def get_feature_type(self) -> str:
        """Get the name of the feature that is being standardized.
        
        Returns:
            Name like supermarket or fastFood.
        """
        raise NotImplementedError('Use implementor.')
        
    def _transform_record(self, target: typing.Dict) -> typing.Dict:
        """Convert a record, filtering down to just latitude and longitude information.

        Returns:
            Standardized and simplified record.
        """
        return {
            'latitude': target['@lat'],
            'longitude': target['@lon'],
            'featureType': self.get_feature_type()
        }
            
