<?php
declare(strict_types=1);
header('Content-Type: application/json; charset=utf-8');
require_once __DIR__ . '/../includes/db.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['error' => 'Use POST to submit an order enquiry.']);
    exit;
}
$input = json_decode(file_get_contents('php://input'), true);
$name = trim((string)($input['customer_name'] ?? ''));
$phone = trim((string)($input['customer_phone'] ?? ''));
$items = $input['items'] ?? [];

if ($name === '' || $phone === '' || !is_array($items) || count($items) < 1) {
    http_response_code(422);
    echo json_encode(['error' => 'Name, phone and at least one item are required.']);
    exit;
}
if (mb_strlen($name) > 150 || mb_strlen($phone) > 30 || count($items) > 50) {
    http_response_code(422);
    echo json_encode(['error' => 'Submitted details exceed allowed limits.']);
    exit;
}

try {
    $pdo->beginTransaction();
    $cleanItems = [];
    $total = 0.0;
    $productStmt = $pdo->prepare('SELECT id, price FROM products WHERE id = ? AND is_active = 1');
    foreach ($items as $item) {
        $productId = filter_var($item['product_id'] ?? null, FILTER_VALIDATE_INT);
        $quantity = filter_var($item['quantity'] ?? null, FILTER_VALIDATE_INT);
        if (!$productId || !$quantity || $quantity < 1 || $quantity > 100) {
            throw new InvalidArgumentException('Invalid product or quantity.');
        }
        $productStmt->execute([$productId]);
        $product = $productStmt->fetch();
        if (!$product) {
            throw new InvalidArgumentException('A selected product is no longer available.');
        }
        $unitPrice = (float)$product['price'];
        $total += $unitPrice * $quantity;
        $cleanItems[] = ['product_id' => $productId, 'quantity' => $quantity, 'unit_price' => $unitPrice];
    }
    $orderStmt = $pdo->prepare('INSERT INTO order_enquiries (customer_name, customer_phone, total_amount) VALUES (?, ?, ?)');
    $orderStmt->execute([$name, $phone, $total]);
    $orderId = (int)$pdo->lastInsertId();

    $itemStmt = $pdo->prepare('INSERT INTO order_enquiry_items (order_id, product_id, quantity, unit_price) VALUES (?, ?, ?, ?)');
    foreach ($cleanItems as $item) {
        $itemStmt->execute([$orderId, $item['product_id'], $item['quantity'], $item['unit_price']]);
    }
    $pdo->commit();
    http_response_code(201);
    echo json_encode(['message' => 'Order enquiry saved.', 'order_id' => $orderId, 'total_amount' => $total]);
} catch (InvalidArgumentException $e) {
    if ($pdo->inTransaction()) $pdo->rollBack();
    http_response_code(422);
    echo json_encode(['error' => $e->getMessage()]);
} catch (Throwable $e) {
    if ($pdo->inTransaction()) $pdo->rollBack();
    http_response_code(500);
    echo json_encode(['error' => 'Could not save order enquiry. Check server configuration.']);
}
