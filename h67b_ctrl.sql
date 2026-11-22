WITH h67b_unused_cte AS (
    SELECT 1 AS a
)
SELECT t.x
FROM h67b_t1 AS t, h67b_t2 AS u
WHERE t.x = 1
