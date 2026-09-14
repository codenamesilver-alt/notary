<?php

declare(strict_types=1);

require __DIR__ . '/config.php';
require __DIR__ . '/vendor/phpmailer/src/Exception.php';
require __DIR__ . '/vendor/phpmailer/src/SMTP.php';
require __DIR__ . '/vendor/phpmailer/src/PHPMailer.php';

use PHPMailer\PHPMailer\PHPMailer;
use PHPMailer\PHPMailer\SMTP;
use PHPMailer\PHPMailer\Exception;

header('Content-Type: application/json');

function respond(bool $ok, string $message): never
{
    echo json_encode(['success' => $ok, 'message' => $message]);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    respond(false, 'Invalid request method.');
}

$name = trim($_POST['name'] ?? '');
$phone = trim($_POST['phone'] ?? '');
$email = trim($_POST['email'] ?? '');
$service = trim($_POST['service'] ?? '');
$preferred = trim($_POST['preferred_date_time'] ?? '');
$message = trim($_POST['message'] ?? '');

if ($name === '' || $phone === '' || $email === '' || $service === '') {
    respond(false, 'Please fill in your name, phone, email, and the service needed.');
}

if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
    respond(false, 'That email address does not look valid.');
}

if (SMTP_USER === 'REPLACE_WITH_YOUR_GMAIL') {
    respond(false, 'Notaryman SMTP is not configured yet. Please call (518) 430-6483.');
}

$serviceLabels = [
    'mobile-notary' => 'Mobile Notary',
    'apostille' => 'Apostille & Document Authentication',
    'loan-signing' => 'Loan Signing Services',
    'real-estate' => 'Real Estate & Title Documents',
    'wedding-officiant' => 'Wedding Officiant Notary',
    'affidavits-poa' => 'Affidavits & Power of Attorney',
    'general' => 'General / Not sure yet',
];
$service = $serviceLabels[$service] ?? ($service !== '' ? $service : 'Not specified');

$body  = "New lead via notaryman website\n";
$body .= "--------------------------------\n\n";
$body .= "Name:            $name\n";
$body .= "Phone:           $phone\n";
$body .= "Email:           $email\n";
$body .= "Service needed:  $service\n";
$body .= "Preferred date:  " . ($preferred !== '' ? $preferred : 'Not specified') . "\n";
$body .= "\nMessage:\n" . ($message !== '' ? $message : '(none)') . "\n";

$mail = new PHPMailer(true);

try {
    $mail->isSMTP();
    $mail->SMTPDebug = SMTP::DEBUG_OFF;
    $mail->Host = SMTP_HOST;
    $mail->Port = SMTP_PORT;
    $mail->SMTPAuth = true;
    $mail->Username = SMTP_USER;
    $mail->Password = SMTP_PASS;
    $mail->SMTPSecure = PHPMailer::ENCRYPTION_STARTTLS;
    $mail->Timeout = 10;

    $mail->setFrom(SMTP_USER, SMTP_FROM_NAME);
    $mail->addAddress(LEAD_EMAIL, SMTP_FROM_NAME);
    $mail->addReplyTo($email, $name);

    $mail->isHTML(false);
    $mail->Subject = 'New Lead from Website';
    $mail->Body = $body;

    $mail->send();
    respond(true, 'Request received - the notary will call you back shortly to confirm.');
} catch (Exception $e) {
    error_log('Lead mail failed: ' . $mail->ErrorInfo);
    respond(false, 'Message could not be sent right now. Please call (518) 430-6483.');
}
