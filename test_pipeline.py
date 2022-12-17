"""Very basic tests to check pipeline initalization.

License: MIT
"""
import math
import unittest

import overpass.scripts.query
import pipeline
import transform.scripts.combine
import transform.scripts.dedupe
import transform.scripts.simplify


class InitTests(unittest.TestCase):

    def test_combine(self):
        self.assertIsNotNone(transform.scripts.combine.CombineCsvTask())

    def test_dedupe(self):
        self.assertIsNotNone(transform.scripts.dedupe.DedupeTask())
    
    def test_point(self):
        point_1 = transform.scripts.dedupe.Point('test', 1, 2)
        point_2 = transform.scripts.dedupe.Point('test', 3, 5)
        distance = point_1.get_distance(point_2)
        self.assertAlmostEquals(distance, math.sqrt(2**2 + 3**2))

    def test_query(self):
        self.assertIsNotNone(overpass.scripts.query.ExecuteOverpassTask())

    def test_simplify(self):
        self.assertIsNotNone(transform.scripts.simplify.SimplifyCsvTask())
    
    def test_pipeline(self):
        self.assertIsNotNone(pipeline.PrepareAndCheckNamedFeaturesTask())
        self.assertIsNotNone(pipeline.DedupeNamedTask())
        self.assertIsNotNone(pipeline.FenceTask())
    
    def test_pipeline_deps(self):
        task = pipeline.FenceTask()
        requirement = task.requires()
        self.assertIsNotNone(requirement)
