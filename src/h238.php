<?php

declare(strict_types=1);

/**
 * H238 probe fixture (own test repo): one PHP file so the PHPStan tool has
 * analysis scope, which is what makes the review setup step prepare the
 * Composer workspace for this PR head.
 */
function h238_add(int $a, int $b): int
{
    return $a + $b;
}

echo h238_add(1, 2);
