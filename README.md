# LUE — Password Strength Analyzer

A small, dependency-free password strength analyzer and password generator built with HTML, CSS, and JavaScript.

## Run it

Open `index.html` in a recent browser. Secure password generation uses the browser's Web Crypto API. If your browser restricts that API for local files, serve this folder from `localhost` or HTTPS.

## What it does

- Evaluates password length, character variety, repeated runs, common passwords, and simple sequences as you type.
- Shows a strength score and checklist.
- Generates three random 20-character alternatives using Web Crypto and lets you copy one.
- Runs entirely in your browser. The entered password is not stored, sent to a server, or checked against breach databases.

The score is an educational heuristic, not a cryptographic guarantee. For accounts, use a unique password generated and stored by a trusted password manager.
