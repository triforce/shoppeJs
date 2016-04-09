<?php
// shoppeJs dataStore handling
header("Content-Type: application/json");

if ($_SERVER["REQUEST_METHOD"] === "POST") {
    $input = file_get_contents("php://input");
    if (strlen($input) > 0) {
    	file_put_contents('shoppeJsTracker', $input);
    }
} else {
	$total = file_get_contents('shoppeJsTracker');
	echo $total;
}

?>