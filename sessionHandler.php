<?php
// shoppeJs session handling
header("Content-Type: application/json");

$error = array();
$error['error'] = true;

if ($_SERVER["REQUEST_METHOD"] === "POST") {
       $data = json_decode(file_get_contents('php://input'), true);
       if (isset($data['init'])) {
               if ($data['init'] == TRUE) {
                       if (!isset($_SESSION["shoppejs"])) {
                               # Client requested a new session
                               session_start();
                               $_SESSION["shoppejs"] = "0";
                       } else {
                               # Session exists so destroy it
                               session_destroy();
                       }
                       exit;
               }
               session_destroy();
               error_log("Invalid init data");
               echo(json_encode($error));
               exit;
       }

       if (isset($_SESSION["shoppejs"])) {
               if (strlen($data['data']) > 20) {
                       error_log("Data too large from client " . $id);
                       exit;
               }
               if (isset($_SESSION["shoppejs"])) {
                       # Session exists for this client so update the value
                       $_SESSION["shoppejs"] = $data['data'];
               } else {
                       session_destroy();
                       $error_msg = "Request to save data failed - Session not found";
                       error_log($error_msg);
                       echo(json_encode($error));
                       exit;
               }
       }
} elseif ($_SERVER["REQUEST_METHOD"] === "GET") {
       if (isset($_GET['cancel']) && $_GET['cancel'] === "true" && isset($_SESSION["shoppejs"])) {
               session_destroy();
               exit;
       }
       # If session exists
       if (isset($_SESSION["shoppejs"])) {
               echo(json_encode($_SESSION["shoppejs"]));
       }
}
?>
