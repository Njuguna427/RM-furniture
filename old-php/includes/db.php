<?php
declare(strict_types=1);

/*
 * DEVELOPMENT CONFIGURATION ONLY.
 * For deployment, move credentials into environment variables and never commit secrets.
 */
$host = '127.0.0.1';
$db   = 'richy_furniture';
$user = 'root';
$pass = ''; // Set your local MySQL password if you have one.

$dsn = "mysql:host={$host};dbname={$db};charset=utf8mb4";
$options = [
    PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
    PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
    PDO::ATTR_EMULATE_PREPARES => false,
];

try {
    $pdo = new PDO($dsn, $user, $pass, $options);
} catch (PDOException $e) {
    http_response_code(500);
    header('Content-Type: application/json; charset=utf-8');
    echo json_encode(['error' => 'Database connection failed. Check includes/db.php settings.']);
    exit;
}
