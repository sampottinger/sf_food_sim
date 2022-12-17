import sys

import luigi
import requests

NUM_ARGS = 2
USAGE_STR = 'python execute_overpass.py [overpassql file] [output csv]'


class ExecuteOverpassTask(luigi.Task):

    def output(self):
        return luigi.LocalTarget(self.get_output_loc())
    
    def run(self):
        with open(self.get_query_loc()) as f:
            query_str = f.read()
        
        result = requests.get('https://overpass-api.de/api/interpreter', params={
            'data': query_str
        })

        assert result.status_code == 200

        with self.output().open('w') as f:
            f.write(result.text)
    
    def get_query_loc(self) -> str:
        raise NotImplementedError('Use implementor.')
    
    def get_output_loc(self) -> str:
        raise NotImplementedError('Use implementor.')


if __name__ == '__main__':
    main()
