def collect(items=[]):
    result = []
    for item in items:
        result.append(item * 2)
    return result


def average(values):
    try:
        return sum(values) / len(values)
    except:
        return 0


unused_probe = 42
