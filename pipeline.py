"""Overall logic for Luigi-based data pipeline that updates the visualization data.

License: MIT
"""
import csv
import itertools
import os.path
import typing

import luigi  # type: ignore

import overpass.scripts.query
import transform.scripts.combine
import transform.scripts.dedupe
import transform.scripts.simplify


class PrepareAndCheckNamedFeaturesTask(luigi.Task):
    """Task which orchestrates the downloading and collation of features prior to deduping.
    
    Task which orchestrates the downloading and collation of features prior to deduping, checking
    that features were found for fast food, supermarkets, and residential areas.
    """

    def requires(self):
        """Require downloading and simplification of raw data.
        
        Returns:
            A CSV combine task whose dependencies require download and simplification of OSM
            features.
        """
        fast_food_task = self._make_input_tasks(
            ['fast_food_way', 'fast_food_node'],
            'fastFood'
        )
        supermarket_task = self._make_input_tasks(
            ['supermarket_way', 'supermarket_node'],
            'supermarket'
        )
        residential_task = self._make_input_tasks(
            ['residential'],
            'home'
        )

        return self._make_combine_task(
            (fast_food_task, supermarket_task, residential_task),
            'all_named_combined.csv',
            'all'
        )
    
    def output(self):
        """Output the simplified OSM features out to a CSV file.
        
        Returns:
            Local CSV file target.
        """
        return luigi.LocalTarget(os.path.join('working', 'named.csv'))
    
    def run(self):
        """Read in the combined CSV file with simplified OSM data and check for features.
        
        Read in the combined CSV file with simplified OSM data and check for correct columns and
        features before writing out to a new duplicated checked CSV file.
        """
        with self.input().open('r') as f_in:
            rows = list(csv.DictReader(f_in))

            features_found = set(map(lambda x: x['featureType'], rows))
            assert 'fastFood' in features_found
            assert 'supermarket' in features_found
            assert 'home' in features_found

            with self.output().open('w') as f_out:
                writer = csv.DictWriter(f_out, fieldnames=['latitude', 'longitude', 'featureType'])
                writer.writeheader()
                writer.writerows(rows)
    
    def _make_input_tasks(self, scripts: typing.Iterable[str],
        feature_name: str) -> luigi.Task:
        """Create tasks which query for and simplify data for a single feature.
        
        Args:
            scripts: The names of the Overpass (OSM) scripts (without extension) that should be run
                to get information about a single feature.
            feature_name: The name of the feature being retrieved.
        Returns:
            Combine task with download and simplify tasks as dependencies.
        """
        base_dir = os.path.dirname(__file__)
        query_dir = os.path.join(base_dir, 'overpass', 'queries')
        script_info = map(
            lambda x: {
                'path': os.path.join(query_dir, x + '.overpassql'),
                'output': os.path.join('working', x + '_individual_raw.csv'),
                'name': x
            },
            scripts
        )

        query_tasks = map(
            lambda x: self._make_execute_task(x['name'], x['path'], x['output']),
            script_info
        )

        raw_combined_output = feature_name + '_combined_raw.csv'
        combine_raw_task = self._make_combine_task(
            query_tasks,
            raw_combined_output,
            feature_name
        )

        return self._make_simplify_task(
            combine_raw_task,
            feature_name + '_named.csv',
            feature_name
        )
    
    def _make_execute_task(self, name: str, script_path: str, output_loc: str) -> luigi.Task:
        """Make a task which execute an Overpass (OSM) query.
        
        Args:
            name: Human friendly name of for the query.
            script_path: The path to the overpassql file to execute.
            output_loc: Where the results of the query should be written.
        Returns:
            Newly built task.
        """
        new_type = type(
            name + '_execute',
            (overpass.scripts.query.ExecuteOverpassTask,),
            {}
        )
        new_task = new_type()
        
        setattr(new_task, 'get_query_loc', lambda: script_path)
        setattr(new_task, 'get_output_loc', lambda: output_loc)
        return new_task
    
    def _make_combine_task(self, input_tasks: typing.Iterable[luigi.Task],
        output_loc: str, feature_name: str) -> luigi.Task:
        """Make a task which combines the CSV results of various input tasks.
        
        Args:
            input_tasks: Set of tasks whose CSV output should be combined into a single CSV file.
            output_loc: The location where the combined CSV file should be written.
            feature_name: The name of the feature like supermarket that this task services.
        Returns:
            Newly built task.
        """
        new_type = type(
            feature_name + '_combine',
            (transform.scripts.combine.CombineCsvTask,),
            {}
        )
        new_task = new_type()

        input_tasks_realized = list(input_tasks)
        setattr(new_task, 'get_targets', lambda: input_tasks_realized)
        setattr(new_task, 'get_output_loc', lambda: os.path.join('working', output_loc))

        return new_task
    
    def _make_simplify_task(self, input_task: luigi.Task, output_loc: str,
        feature_name: str) -> luigi.Task:
        """Make a task which simplifies and standardizes raw CSV data from OSM.

        Args:
            input_task: The task producing raw OSM CSV data via Overpass.
            output_loc: Where the simplified and standardized CSV should be written.
            feature_name: The name of the feature for which standardization is being provided.
        Returns:
            Newly built task.
        """
        new_type = type(
            feature_name + '_simplify',
            (transform.scripts.simplify.SimplifyCsvTask,),
            {}
        )
        new_task = new_type()

        setattr(new_task, 'get_input_task', lambda: input_task)
        setattr(new_task, 'get_output_loc', lambda: os.path.join('working', output_loc))
        setattr(new_task, 'get_feature_type', lambda: feature_name)
        return new_task


class DedupeNamedTask(transform.scripts.dedupe.DedupeTask):
    """Dedupe task that operates on the output of PrepareAndCheckNamedFeaturesTask"""

    def requires(self):
        """Require PrepareAndCheckNamedFeaturesTask"""
        return PrepareAndCheckNamedFeaturesTask()
    
    def output(self):
        """Write to a CSV file in the working directory."""
        return luigi.LocalTarget(os.path.join('working', 'named_dedupe.csv'))


class FenceTask(transform.scripts.dedupe.DedupeTask):
    """Task which removes some features outside SF included in query geo bounding box."""

    def requires(self):
        """Indicate on which task 
        
        Returns:
            Upstream dependency outputting standardized and simplified features as a CSV.
        """
        return DedupeNamedTask()
    
    def output(self):
        """Local target at which filtered standardized and simplified CSV can be written."""
        return luigi.LocalTarget(os.path.join('working', 'named_fenced.csv'))
    
    def run(self):
        """Filter for latitudes / longitudes that should be excluded from the visualization.
        
        Filter for latitudes / longitudes that should be excluded from the visualization because
        they are not part of SF but are in the query bounding box.
        """
        with self.input().open('r') as f_in:
            reader = csv.DictReader(f_in)
            parsed = map(lambda x: self._parse(x), reader)
            
            clipped_top = filter(
                lambda x: x['longitude'] < -122.37 or x['latitude'] < 37.8,
                parsed
            )
            clipped = filter(
                lambda x: x['longitude'] < -122.37 or x['latitude'] > 37.725,
                clipped_top
            )

            with self.output().open('w') as f_out:
                writer = csv.DictWriter(f_out, fieldnames=['latitude', 'longitude', 'featureType'])
                writer.writeheader()
                writer.writerows(clipped)

    def _parse(self, target: typing.Dict) -> typing.Dict:
        """Parse an input standardized and simplified record.
        
        Parse an input standardized and simplified record, outputting the same record but with
        latitude and longitude interpreted as a float.
        """
        return {
            'featureType': target['featureType'],
            'latitude': float(target['latitude']),
            'longitude': float(target['longitude'])
        }
