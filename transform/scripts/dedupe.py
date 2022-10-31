import csv
import itertools
import math
import typing

DUP_MAX_DISTANCE = 0.001
NUM_ARGS = 2
USAGE_STR = 'python dedupe.py [source] [destination]'


class Point:
    """Simple structure representing a single point feature."""

    def __init__(self, feature_type: str, latitude: float, longitude: float):
        self._feature_type = feature_type
        self._latitude = latitude
        self._longitude = longitude
    
    def get_feature_type(self) -> str:
        return self._feature_type
    
    def get_latitude(self) -> float:
        return self._latitude
    
    def get_longitude(self) -> float:
        return self._longitude
    
    def get_distance(other: Point) -> float:
        latitude_diff = abs(other.get_latitude() - self.get_latitude())
        longitude_diff = abs(other.get_longitude() - self.get_longitude())
        return math.sqrt(latitude_diff ** 2 + longitude_diff ** 2)
    
    def to_dict(self) -> typing.Dict:
        return {
            'featureType': sef.get_feature_type(),
            'latitude': self.get_latitude(),
            'longitude': self.get_longitude()
        }


def transform_point(target: typing.Dict) -> Point:
    """Parse a point into """
    return Point(
        target['featureType'],
        float(target['latitude']),
        float(target['longitude'])
    )


def main():
    if len(sys.argv) != NUM_ARGS + 1:
        print(USAGE_STR)
        return

    source_loc = sys.argv[1]
    destination_loc = sys.argv[2]

    with open(source_loc) as f:
        points = [transform_point(x) for x in csv.DictReader(f)]

    already_seen = {'supermarket': [], 'fastFood': [], 'home': []}

    for point in points:
        feature_type = point.get_feature_type()
        target_list = already_seen[feature_type]
        
        get_distance = lambda x: point.get_distance(x)
        
        matching = filter(lambda x: get_distance(x) < DUP_MAX_DISTANCE, target_list)
        num_matching = sum(map(lambda x: 1, matching))
        
        if num_matching == 0:
            target_list.append(point)

    all_records = itertools.chain(*already_seen.values())
    all_records_dict = map(lambda x: x.to_dict(), all_records)

    with open(destination_loc, 'w') as f:
        writer = csv.DictWriter(f, fieldnames=['featureType', 'latitude', 'longitude'])
        writer.writeheader()
        writer.writerows(all_records_dict)


if __name__ == '__main__':
    main()
