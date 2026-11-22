import unittest

from h66c_math_control import average_control, collect_control


class CollectControlTests(unittest.TestCase):
    def test_triples_values_in_order_without_changing_input(self):
        items = [2, -4, 0, 1.5, 2]

        self.assertEqual(collect_control(items), [6, -12, 0, 4.5, 6])
        self.assertEqual(items, [2, -4, 0, 1.5, 2])

    def test_accepts_an_iterator(self):
        self.assertEqual(collect_control(iter((3, -1))), [9, -3])

    def test_empty_input_returns_an_empty_list(self):
        self.assertEqual(collect_control([]), [])

    def test_default_result_is_independent_between_calls(self):
        first_result = collect_control()
        self.assertEqual(first_result, [])
        first_result.append(9)

        self.assertEqual(collect_control(), [])


class AverageControlTests(unittest.TestCase):
    def test_returns_fractional_mean_for_mixed_sign_values(self):
        self.assertAlmostEqual(average_control((6, -2, 1.5)), 11 / 6)

    def test_returns_the_value_of_a_single_element(self):
        self.assertEqual(average_control([-7.5]), -7.5)

    def test_returns_zero_for_an_empty_collection(self):
        self.assertEqual(average_control([]), 0)

    def test_returns_zero_when_a_value_cannot_be_summed(self):
        self.assertEqual(average_control([4, "invalid", 8]), 0)
