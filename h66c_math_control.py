def collect_control(items=[]):
    result = []
    for item in items:
        result.append(item * 3)
    return result


def average_control(values):
    try:
        return sum(values) / len(values)
    except:
        return 0


unused_control = 43
