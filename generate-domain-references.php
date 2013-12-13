<?php
$filename = $argv[1];
$version = $argv[2];
$file = file_get_contents($filename);

$data = json_decode($file, true);

$references = $data["references"];

$boomerang_reference = array(
	"name" => "boomerang-$version",
	"type" => "boomerang",
	"internalID" => "rsdbref"
);

$set = false;
foreach($references as &$reference) {
	if($reference["type"] === "boomerang") {
		$set = true;
		$reference = $boomerang_reference;
	}
}

if(!$set) {
	$references[] = $boomerang_reference;
}

print json_encode(array("references" => $references));
?>
