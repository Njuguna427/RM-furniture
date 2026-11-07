<?php
declare(strict_types=1);
header('Content-Type: application/json; charset=utf-8');
require_once __DIR__ . '/../includes/db.php';

try {
    $stmt = $pdo->query(
        'SELECT id, name, category, price, color, style, rating, tag, image_url, description
         FROM products WHERE is_active = 1 ORDER BY id DESC'
    );
    echo json_encode($stmt->fetchAll(), JSON_UNESCAPED_SLASHES);
} catch (Throwable $e) {
    http_response_code(500);
    echo json_encode(['error' => 'Could not load products.']);
}
