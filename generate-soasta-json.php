<?php
$filename = $argv[1];
$file = file_get_contents($filename);

preg_match("!<Boomerang.*</Boomerang>!s", $file, $m);
$xml = $m[0];

preg_match('!<Attribute name="Version">\s*<Value>(\d+\.\d+\.\d+)</Value>!', $file, $m);
$version = $m[1];

$json = array(
	"type" => "boomerang",
	"name" => "boomerang-$version",
	"attributes" => array(
		array(
			"name" => "version",
			"value" => $version
		)
	),
	"body" => $xml
);
print json_encode($json);
?>
