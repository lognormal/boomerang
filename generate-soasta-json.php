<?php
$version = $argv[1];
preg_match("!<Boomerang.*</Boomerang>!s", file_get_contents("Default_Boomerang.xml"), $m);

$xml = $m[0];

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
