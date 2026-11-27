<?php

declare(strict_types=1);

/**
 * H123 probe fixture (own test repo): one changed PHP file so the PHPStan
 * tool has analysis scope. Includes one deliberate type error so the real
 * PHPStan binary produces an observable finding in the control arm.
 */
function h123_add(int $a, int $b): int
{
    return $a + $b;
}

function h123_wrong_return_type(): string
{
    return 42;
}

echo h123_add(1, 2);

// h123b marker r158-3
