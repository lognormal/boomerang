<?php
$version = $argv[1];
$xml = preg_replace("/^.*<Boomerang .*?>/s", "",
	preg_replace("/<\/Boomerang>.*$/s", "",
		file_get_contents("Default_Boomerang.xml")
	)
);
preg_match("!<Minified>(.*)</Minified>!s", $xml, $m);
$min=preg_replace("!\s!", "", $m[1]);
preg_match("!<Debug>(.*)</Debug>!s", $xml, $m);
$dbg=preg_replace("!\s!", "", $m[1]);

$json = array(
	"type" => "boomerang",
	"name" => "boomerang-$version",
	"attributes" => array(
		array(
			"name" => "version",
			"value" => $version
		)
	),
	"body" => array(
		"boomerang" => array(
			"minified" => $min,
			"debug" => $dbg
		)
	)
);
print json_encode($json);
?>
