<?php
// Booking form handler. Emails a submitted booking request to the
// inbox below. Two response modes: JSON when the request asks for it
// (js/main.js does), otherwise a plain HTML confirmation page so the
// form still works with JavaScript disabled.
//
// Requires PHP hosting with a working mail() — a Cloudflare static
// deploy will serve this file as text instead of running it.

declare(strict_types=1);

const BOOKING_INBOX = 'bookings@reebimms.co.uk';

// Nobody types a name, number, postcode and picks a service this fast.
const MIN_FILL_MILLISECONDS = 3000;

const MESSAGE_SENT = 'Thank you — your details are with us. We will confirm your day and time the same day, on the number you gave.';
const MESSAGE_INCOMPLETE = 'Please fill in your name, mobile number, postcode, and the type of clean you would like.';
const MESSAGE_BAD_EMAIL = 'That email address does not look right. Please check it, or leave the field empty.';
const MESSAGE_FAILED = "Sorry, we couldn't send that just now. Please call 07709 876567, or use WhatsApp or SMS beside the form, and we'll book you in.";

/** Trimmed, newline-free field value — header injection guard. */
function field(string $name): string
{
    $value = $_POST[$name] ?? '';
    if (!is_string($value)) {
        return '';
    }
    return trim(str_replace(["\r", "\n"], ' ', $value));
}

function respond(bool $ok, string $message): never
{
    $wantsJson = str_contains($_SERVER['HTTP_ACCEPT'] ?? '', 'application/json');

    if ($wantsJson) {
        header('Content-Type: application/json; charset=utf-8');
        echo json_encode(['ok' => $ok, 'message' => $message]);
        exit;
    }

    $heading = $ok ? 'Booking request sent' : 'Booking request not sent';
    header('Content-Type: text/html; charset=utf-8');
    echo '<!doctype html><html lang="en-GB"><head><meta charset="utf-8">'
        . '<meta name="viewport" content="width=device-width, initial-scale=1">'
        . '<title>' . $heading . ' — ReeBimms</title>'
        . '<link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&amp;family=Michroma&amp;display=swap" rel="stylesheet">'
        . '<link rel="stylesheet" href="/css/main.css"></head><body>'
        . '<main class="section"><div class="legal">'
        . '<h1 class="legal__heading">' . $heading . '</h1>'
        . '<p>' . htmlspecialchars($message, ENT_QUOTES) . '</p>'
        . '<p><a class="text-link" href="/">Back to the site</a></p>'
        . '</div></main></body></html>';
    exit;
}

if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'POST') {
    http_response_code(405);
    respond(false, MESSAGE_FAILED);
}

// Spam trap: the matching input is off-screen, so only a bot fills it.
// Reported as success so the bot has nothing to tune against.
if (field('website') !== '') {
    respond(true, MESSAGE_SENT);
}

// Second trap, for bots that run JavaScript and so fill the form far
// faster than a person: how long the form was open, measured and sent by
// js/main.js. Elapsed time rather than a start timestamp, so a visitor
// whose device clock is wrong is never caught out. Empty when JS is off
// — allowed, because a real visitor without JS must still be able to
// book. Silent, like the honeypot above.
$elapsed = field('elapsed-ms');
if (ctype_digit($elapsed) && (int) $elapsed < MIN_FILL_MILLISECONDS) {
    respond(true, MESSAGE_SENT);
}

$name = field('full-name');
$mobile = field('mobile-number');
$postcode = field('postcode');
$email = field('email');
$service = field('service');

if ($name === '' || $mobile === '' || $postcode === '' || $service === '') {
    http_response_code(422);
    respond(false, MESSAGE_INCOMPLETE);
}

if ($email !== '' && !filter_var($email, FILTER_VALIDATE_EMAIL)) {
    http_response_code(422);
    respond(false, MESSAGE_BAD_EMAIL);
}

$body = implode("\n", [
    'New booking request from reebimms.co.uk',
    '',
    'Name:      ' . $name,
    'Mobile:    ' . $mobile,
    'Postcode:  ' . $postcode,
    'Email:     ' . ($email !== '' ? $email : 'not given'),
    'Service:   ' . $service,
    '',
    'Received:  ' . date('D j M Y, H:i'),
]);

$headers = [
    'From: ReeBimms website <' . BOOKING_INBOX . '>',
    'Content-Type: text/plain; charset=utf-8',
];
if ($email !== '') {
    $headers[] = 'Reply-To: ' . $email;
}

$sent = mail(
    BOOKING_INBOX,
    'Booking request: ' . $service . ' — ' . $name,
    $body,
    implode("\r\n", $headers)
);

if (!$sent) {
    http_response_code(502);
    respond(false, MESSAGE_FAILED);
}

respond(true, MESSAGE_SENT);
