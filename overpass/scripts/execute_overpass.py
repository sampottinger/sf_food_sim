import sys

import requests

NUM_ARGS = 2
USAGE_STR = 'python execute_overpass.py [overpassql file] [output csv]'


def main():
    if len(sys.argv) != NUM_ARGS + 1:
        print(USAGE_STR)
        return
    
    query_loc = sys.argv[1]
    output_loc = sys.argv[2]

    with open(query_loc) as f:
        query_str = f.read()
    
    result = requests.get('https://overpass-api.de/api/interpreter', params={
        'data': query_str
    })

    assert result.status_code == 200

    with open(output_loc, 'w') as f:
        f.write(result.text)
