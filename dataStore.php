<?php
// shoppeJs dataStore handling
header("Content-Type: application/json");

$error = array();
$error['error'] = true;

if ($_SERVER["REQUEST_METHOD"] === "POST") {
	$data = json_decode(file_get_contents('php://input'), true);
	$id = $data['id'] . "_" . $_SERVER["REMOTE_ADDR"];
	if (strlen($data['data']) > 20) {
		error_log("Data too large from client " . $id);
		exit;
	}
	if (file_exists($id)) {
		file_put_contents($id, $data['data']);
	} else {
		error_log("Request to save data failed - File not found");
		echo(json_encode($error));
		exit;
	}
} else {
	$id = $_GET['id'];
	$id = $id . "_" . $_SERVER["REMOTE_ADDR"];

    if (isset($_GET['cancel']) && $_GET['cancel'] === "true") {
		unlink($id);
		exit;
	}
	if (file_exists($id)) {
		$valueData = array();
		$valueData['data'] = file_get_contents($id);
		echo(json_encode($valueData));
	} else {
		if (sizeof(glob('*_' . $_SERVER["REMOTE_ADDR"])) > 5) {
			error_log("User already has " . sizeof(glob('*_' . $_SERVER["REMOTE_ADDR"])) . " sessions active");
			echo(json_encode($error));
			exit;
		} else {
			file_put_contents($id, "0");
		}
	}
}
?>
