"""Utilities to help query Overdrive via Luigi.

License: MIT
"""
import sys

import luigi
import requests

NUM_ARGS = 2
USAGE_STR = 'python execute_overpass.py [overpassql file] [output csv]'
OVERPASS_API_LOC = 'https://overpass-api.de/api/interpreter'


class ExecuteOverpassTask(luigi.Task):
    """Template method class which can execute an Overpass query."""

    def output(self):
        """Create a local target for get_output_loc"""
        return luigi.LocalTarget(self.get_output_loc())
    
    def run(self):
        """Read the Overpass query from a file and execute, writing the results to a file."""
        with open(self.get_query_loc()) as f:
            query_str = f.read()
        
        result = requests.get(OVERPASS_API_LOC, params={
            'data': query_str
        })

        assert result.status_code == 200

        with self.output().open('w') as f:
            f.write(result.text)
    
    def get_query_loc(self) -> str:
        """Get the path where the Overpass query can be found.
        
        Returns:
            Path to an overpassql file.
        """
        raise NotImplementedError('Use implementor.')
    
    def get_output_loc(self) -> str:
        """Indicate where the output of the query should be written.
        
        Returns:
            Output file path.
        """
        raise NotImplementedError('Use implementor.')


if __name__ == '__main__':
    main()
