"""Logic to simplify the features retrieved from OSM.

Logic to simplify the features retrieved from OSM, merging features of the same type which appear at
the same location (with some tollerance) and putting residential features on a grid.

License: MIT
"""
import csv
import itertools
import math
import typing

import luigi  # type: ignore

ALIGN_VAL = 0.0027
DUP_MAX_DISTANCE = 0.001
NUM_ARGS = 2
USAGE_STR = 'python dedupe.py [source] [destination]'
VERBOSE = True


class Point:
    """Simple structure representing a single point feature."""

    def __init__(self, feature_type: str, latitude: float, longitude: float):
        """Create a new point.
        
        Args:
            feature_type: The name of feature type like supermarket or home.
            latitude: Floating point latitude.
            longitude: Floating point longitude.
        """
        super()
        
        self._feature_type = feature_type
        self._latitude = latitude
        self._longitude = longitude
    
    def get_feature_type(self) -> str:
        """Get the type of feature represented by this point.
        
        Returns:
            Feature type like supermarket or home.
        """
        return self._feature_type
    
    def get_latitude(self) -> float:
        """Get the latitude of this point.
        
        Returns:
            Absolute latitude in degrees.
        """
        return self._latitude
    
    def get_longitude(self) -> float:
        """Get the longitude of this point.
        
        Returns:
            Absolute longitude in degrees.
        """
        return self._longitude
    
    def get_distance(self, other: 'Point') -> float:
        """Get the distance between this point and another point.
        
        Args:
            other: The other point or point-like object to which distance should be measured.
        Returns:
            Distance in degrees as the crow flies.
        """
        latitude_diff = abs(other.get_latitude() - self.get_latitude())
        longitude_diff = abs(other.get_longitude() - self.get_longitude())
        return math.sqrt(latitude_diff ** 2 + longitude_diff ** 2)
    
    def to_dict(self) -> typing.Dict:
        """Convert this point to a dictionary representation."""
        return {
            'featureType': self.get_feature_type(),
            'latitude': self.get_latitude(),
            'longitude': self.get_longitude()
        }


def transform_point(target: typing.Dict) -> Point:
    """Parse a dictionary (like CSV row) into a Point object.
    
    Args:
        target: Input row / dictionary to read.
    Returns:
        Newly parsed point object.
    """
    return Point(
        target['featureType'],
        float(target['latitude']),
        float(target['longitude'])
    )


class DedupeTask(luigi.Task):
    """Luigi task to merge nearby features of the same type."""

    def requires(self):
        raise NotImplementedError('Use implementor.')
    
    def output(self):
        raise NotImplementedError('Use implementor.')

    def run(self):
        """Consolidate nearby similar features.
        
        Simplify the features retrieved from OSM, merging features of the same type which appear at
        the same location (with some tollerance) and putting residential features on a grid.
        """
        with self.input().open('r') as f:
            points = [transform_point(x) for x in csv.DictReader(f)]

        already_seen = {'supermarket': [], 'fastFood': [], 'home': []}

        num_points = len(points)
        num_points_done = 0
        for point in points:
            feature_type = point.get_feature_type()

            if feature_type == 'home':
                point = Point(
                    feature_type,
                    math.floor(point.get_latitude() / ALIGN_VAL) * ALIGN_VAL,
                    math.floor(point.get_longitude() / ALIGN_VAL) * ALIGN_VAL
                )

            target_list = already_seen[feature_type]
            
            get_distance = lambda x: point.get_distance(x)
            
            matching = filter(lambda x: get_distance(x) < DUP_MAX_DISTANCE, target_list)
            num_matching = sum(map(lambda x: 1, matching))
            
            if num_matching == 0:
                target_list.append(point)
            
            num_points_done += 1
            if VERBOSE and num_points_done % 1000 == 0:
                print('Completed %d of %d...' % (num_points_done, num_points))

        all_records = itertools.chain(*already_seen.values())
        all_records_dict = map(lambda x: x.to_dict(), all_records)

        with self.output().open('w') as f:
            writer = csv.DictWriter(f, fieldnames=['featureType', 'latitude', 'longitude'])
            writer.writeheader()
            writer.writerows(all_records_dict)
