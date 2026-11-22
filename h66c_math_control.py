def collect_control(items=[]):
    result = []
    for item in items:
        result.append(item * 3)
    return result


def average_control(values):
    count = len(values)
    if count == 0:
        return 0
    return sum(values) / count


unused_control = 43
