import csv
import itertools
import os.path
import typing

import luigi

import overpass.scripts.query
import transform.scripts.combine
import transform.scripts.simplify


class PrepareAndCheckNamedFeaturesTask(luigi.Task):

    def requires(self):
        fast_food_tasks = self._make_input_tasks(
            ['fast_food_way', 'fast_food_node'],
            'fastFood'
        )
        supermarket_tasks = self._make_input_tasks(
            ['supermarket_way', 'supermarket_node'],
            'supermarket'
        )
        residential_tasks = self._make_input_tasks(
            ['residential'],
            'home'
        )

        return self._make_combine_task(
            (fast_food_tasks, supermarket_tasks, residential_tasks),
            'all_named_combined.csv',
            'all'
        )
    
    def output(self):
        return luigi.LocalTarget(os.path.join('working', 'named.csv'))
    
    def run(self):
        with self.input().open('r') as f_in:
            reader = csv.DictReader(f)

            with self.output().open('w') as f_out:
                writer = csv.DictWriter(f, fieldnames=['latitude', 'longitude', 'featureType'])
                writer.writeheader()
                writer.writerows(reader)
    
    def _make_input_tasks(self, scripts: typing.Iterable[str],
        feature_name: str) -> typing.Iterable[luigi.Task]:
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

        raw_combined_output = os.path.join('working', feature_name + '_combined_raw.csv')
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
        new_type = type(
            feature_name + '_combine',
            (transform.scripts.combine.CombineCsvTask,),
            {}
        )
        new_task = new_type()

        input_tasks_realized = list(input_tasks)
        setattr(new_task, 'get_targets', lambda: input_tasks_realized)
        setattr(new_task, 'get_output_loc', lambda: output_loc)

        return new_task
    
    def _make_simplify_task(self, input_task: luigi.Task, output_loc: str,
        feature_name: str) -> luigi.Task:
        new_type = type(
            feature_name + '_simplify',
            (transform.scripts.simplify.SimplifyCsvTask,),
            {}
        )
        new_task = new_type()

        setattr(new_task, 'get_input_task', lambda: input_task)
        setattr(new_task, 'get_output_loc', lambda: output_loc)
        setattr(new_task, 'get_feature_type', lambda: feature_name)
        return new_task
